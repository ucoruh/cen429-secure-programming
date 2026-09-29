/*
 * CEN429 - Week 6 - Demo 8: RASP engine - detection + RESPONSE + device/version binding
 *
 * This is the week's CAPSTONE demo; it combines the earlier pieces under one "self-protection
 * engine":
 *
 *   DETECTION       : a set of checks runs (integrity - Demo 1, anti-debug - Demo 2, environment -
 *                     Demo 3, hook - Demo 4, root - Demo 7).
 *   DEVICE/VERSION BINDING : the valuable secret is sealed with AES-GCM, using a key derived with
 *                     HKDF from a device fingerprint + version (catalog L1/L2). On a different
 *                     device the key comes out different -> the secret CANNOT be opened.
 *   RESPONSE POLICY : a graded state machine (catalog K15/K16), not a single "block or allow":
 *
 *       NORMAL  (0 failed checks, device matches)  -> the secret opens normally.
 *       WARN    (1 failed check)                    -> the secret still opens, but the event is
 *                                                       logged and monitoring is tightened. The
 *                                                       lesson: an isolated, weak signal alone is
 *                                                       not worth degrading a paying user's
 *                                                       experience over (false-positive risk).
 *       DEGRADE (2 failed checks)                    -> the secret is WIPED; the engine keeps
 *                                                       running but only a REDACTED/limited result
 *                                                       is returned (a middle ground: neither full
 *                                                       trust nor a hard stop).
 *       LOCK    (3+ failed checks, OR the device/version binding does not hold at all)
 *                                                     -> the secret is wiped, the tamper flag is
 *                                                       raised and the event is (in-memory) logged,
 *                                                       and a DECOY result is returned instead of
 *                                                       crashing - an attacker cannot easily tell
 *                                                       the real result from the decoy, so nothing
 *                                                       leaks.
 *
 * Scenarios (mode): normal | warn | degrade | lock | other-device
 * Fully portable and safe: in-memory only; no file/system/network access.
 */
#include "cen429_demo.h"
#include "cen429_crypto.h"
#include <stdio.h>
#include <string.h>

static const char *VERSION_STRING = "version=1.0.0";

typedef enum { RASP_NORMAL, RASP_WARN, RASP_DEGRADE, RASP_LOCK } rasp_state_t;

static const char *state_name(rasp_state_t s)
{
    switch (s) {
    case RASP_NORMAL:  return "NORMAL";
    case RASP_WARN:    return "WARN";
    case RASP_DEGRADE: return "DEGRADE";
    default:           return "LOCK";
    }
}

/* Pure decision step, independently testable: turns (failed check count, device mismatch) into a
 * response state. A device/version mismatch always escalates straight to LOCK, regardless of how
 * many of the other checks passed -- it is a strong signal (cloning/replay), not a soft one. */
static rasp_state_t decide_response(int failed_checks, int device_mismatch)
{
    if (device_mismatch)
        return RASP_LOCK;
    if (failed_checks <= 0)
        return RASP_NORMAL;
    if (failed_checks == 1)
        return RASP_WARN;
    if (failed_checks == 2)
        return RASP_DEGRADE;
    return RASP_LOCK;
}

static void device_fingerprint(int other, char *out, size_t n)
{
    /* Synthetic device fingerprint (in reality: a hash of manufacturer+model+device id). */
    snprintf(out, n, "device=SIM-MODEL-A;serial=%s;maker=DEMO",
             other ? "SN-9999" : "SN-0001");
}

static void data_key(const char *fp, unsigned char key[32])
{
    crypto_hkdf_sha256((const unsigned char *)fp, strlen(fp),
                       (const unsigned char *)VERSION_STRING, strlen(VERSION_STRING),
                       (const unsigned char *)"rasp-data-key", 13, key, 32);
}

/* How many of the named checks fail, for each demo mode. A real engine would call the actual
 * Demo 1/2/3/4/7 checks here; this teaching version selects a failure count directly so every
 * response-policy branch (NORMAL/WARN/DEGRADE/LOCK) can be demonstrated on command. */
static int run_checks(const char *mode)
{
    struct { const char *name; int passed; } checks[] = {
        { "integrity (Demo 1)",     1 },
        { "anti-debug (Demo 2)",    1 },
        { "environment (Demo 3)",   1 },
        { "hook/preload (Demo 4)",  1 },
        { "root/privilege (Demo 7)", 1 },
    };
    int n = (int)(sizeof(checks) / sizeof(checks[0]));
    int to_fail = 0;
    if (strcmp(mode, "warn") == 0)
        to_fail = 1;
    else if (strcmp(mode, "degrade") == 0)
        to_fail = 2;
    else if (strcmp(mode, "lock") == 0)
        to_fail = 3;
    for (int i = 0; i < to_fail && i < n; i++)
        checks[i].passed = 0;

    int failed = 0;
    for (int i = 0; i < n; i++) {
        printf("   [%s] %s\n", checks[i].passed ? "PASSED" : "FAILED", checks[i].name);
        if (!checks[i].passed)
            failed++;
    }
    return failed;
}

int main(int argc, char **argv)
{
    demo_prepare();
    const char *mode = (argc > 1) ? argv[1] : "normal";
    printf("RASP engine - mode: %s\n", mode);
    printf("==============================================================\n");

    /* --- SETUP (build time): the secret is sealed with the REAL device's key. --- */
    const char *secret = "PAYMENT-KEY-7C4A";
    char real_fp[128];
    device_fingerprint(0, real_fp, sizeof(real_fp));
    unsigned char setup_key[32];
    data_key(real_fp, setup_key);
    unsigned char packet[12 + 64 + 16];
    crypto_random(packet, 12);
    unsigned char tag[16];
    crypto_gcm_encrypt(setup_key, packet, 12, NULL, 0,
                       (const unsigned char *)secret, strlen(secret), packet + 12, tag);
    memcpy(packet + 12 + strlen(secret), tag, 16);
    size_t packet_size = 12 + strlen(secret) + 16;
    crypto_wipe(setup_key, sizeof(setup_key));   /* the build-time key is not kept around */

    /* --- RUN --- */
    printf("1) Detection checks:\n");
    int failed = run_checks(mode);

    printf("2) Device/version binding:\n");
    int other = (strcmp(mode, "other-device") == 0);
    char fp[128];
    device_fingerprint(other, fp, sizeof(fp));
    printf("   fingerprint: %s ; %s\n", fp, VERSION_STRING);
    unsigned char key[32];
    data_key(fp, key);

    unsigned char plaintext[64];
    memset(plaintext, 0, sizeof(plaintext));
    size_t ct_size = packet_size - 12 - 16;
    int opened = crypto_gcm_decrypt(key, packet, 12, NULL, 0,
                                packet + 12, ct_size, packet + 12 + ct_size, plaintext);
    crypto_wipe(key, sizeof(key));

    int device_mismatch = !opened;
    rasp_state_t state = decide_response(failed, device_mismatch);

    printf("--------------------------------------------------------------\n");
    printf("3) Response policy decision: %d failed check(s), device %s -> state %s\n",
           failed, device_mismatch ? "MISMATCH" : "matches", state_name(state));

    switch (state) {
    case RASP_NORMAL:
        printf("RESULT: NORMAL. The secret opened and is in use -> \"%s\"\n", plaintext);
        crypto_wipe(plaintext, sizeof(plaintext));   /* wiped right after use */
        printf("(the secret was safely wiped from memory after use)\n");
        return 0;
    case RASP_WARN:
        printf("RESULT: WARN. One weak signal is not worth degrading service over.\n");
        printf("The secret still opened -> \"%s\"\n", plaintext);
        crypto_wipe(plaintext, sizeof(plaintext));
        printf("   Policy: event logged, monitoring tightened, no functionality lost.\n");
        return 0;
    case RASP_DEGRADE: {
        printf("RESULT: DEGRADE. Multiple signals -> full trust withdrawn.\n");
        crypto_wipe(plaintext, sizeof(plaintext));   /* (a) the full secret is wiped, never printed */
        printf("   Policy: secret wiped; a REDACTED result is returned, the full\n");
        printf("   operation is refused, but the application keeps running.\n");
        printf("RESULT-VALUE: %.4s**** (redacted)\n", secret);
        return 2;
    }
    default: {   /* RASP_LOCK */
        const char *reason = device_mismatch ? "device/version binding failed (cloned?)"
                                              : "detection checks failed (tamper)";
        printf("RESULT: LOCK -> %s\n", reason);
        crypto_wipe(plaintext, sizeof(plaintext));    /* (a) the secret is wiped */
        unsigned char decoy[16];
        crypto_random(decoy, sizeof(decoy));           /* (c) a decoy result */
        printf("   Policy: secret wiped, tamper flag raised, event logged.\n");
        printf("   A DECOY result was returned instead of crashing: %02x%02x%02x%02x...\n",
               decoy[0], decoy[1], decoy[2], decoy[3]);
        printf("   (an attacker cannot easily tell the real result from the decoy; no data leaks)\n");
        return 3;
    }
    }
}
