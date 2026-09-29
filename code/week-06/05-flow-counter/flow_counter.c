/*
 * CEN429 - Week 6 - Demo 5: Control-flow counter (control-flow integrity)
 *
 * A single "if (safe) ..." check is EASY to bypass: an attacker patches the matching conditional
 * jump (je -> jmp) and skips the check (the kind of patch Demo 1 explained). Defense (catalog
 * K17): tie the security checks to a control-flow COUNTER / TOKEN. The critical operation can only
 * produce the right result if EVERY checkpoint was passed IN ORDER.
 *
 * Here we build this with a DATA DEPENDENCY: each checkpoint advances a key chain one step
 * (acc = HMAC(acc, "stage-i")). The critical operation OPENS a secret with AES-GCM, using a key
 * derived from this chain. If checkpoints are skipped or run out of order, the chain comes out
 * different, the key is wrong, and GCM decryption is REJECTED -> the attacker never gets the real
 * result, only a decoy. A "jump over it" patch is therefore useless.
 *
 * Fully portable and safe: only an in-memory computation; no file/system access.
 */
#include "cen429_demo.h"
#include "cen429_crypto.h"
#include <stdio.h>
#include <string.h>

#define STAGE_COUNT 3

/* Control-flow state: the key chain (acc) + a count + a bitmask of which stages ran. */
typedef struct {
    unsigned char acc[32];
    int count;
    unsigned int visited_mask;     /* one bit per stage; checks the stages ran in order */
} flow_t;

static void flow_start(flow_t *f)
{
    static const unsigned char seed[32] = "CEN429-flow-counter-seed-v1---";
    memcpy(f->acc, seed, 32);
    f->count = 0;
    f->visited_mask = 0;
}

/* Checkpoint i: performs the security check AND advances the chain. */
static void checkpoint(flow_t *f, int i, const char *name)
{
    char label[32];
    snprintf(label, sizeof(label), "stage-%d", i);
    unsigned char next[32];
    crypto_hmac_sha256(f->acc, 32, label, strlen(label), next);
    memcpy(f->acc, next, 32);
    f->count++;
    f->visited_mask |= (1u << i);
    printf("   [passed] checkpoint %d (%s)\n", i, name);
}

/* Critical operation: opens the secret with a key derived from the chain. */
static int critical_operation(flow_t *f, const unsigned char *packet, size_t packet_size,
                        unsigned char *out, size_t out_size)
{
    /* Extra check: are count and visited_mask the expected value? (K17 double/overlapping counter) */
    unsigned int expected_mask = (1u << STAGE_COUNT) - 1;   /* 0b111 */
    if (f->count != STAGE_COUNT || f->visited_mask != expected_mask)
        printf("   (warning: count=%d visited_mask=0x%X expected=%d/0x%X)\n",
               f->count, f->visited_mask, STAGE_COUNT, expected_mask);

    /* The key comes from the chain; the chain must be CORRECT for the right result. */
    unsigned char nonce[12];
    memcpy(nonce, packet, 12);
    unsigned char tag[16];
    memcpy(tag, packet + packet_size - 16, 16);
    size_t ct_size = packet_size - 12 - 16;
    if (ct_size > out_size)
        return 0;
    return crypto_gcm_decrypt(f->acc, nonce, 12, NULL, 0,
                          packet + 12, ct_size, tag, out);
}

int main(int argc, char **argv)
{
    demo_prepare();
    const char *mode = (argc > 1) ? argv[1] : "normal";
    printf("Control-flow counter - mode: %s\n", mode);
    printf("--------------------------------------------------------------\n");

    /* SETUP: run the correct chain once and seal the secret with that key, "baking it into the
       product". (In reality this step happens at build/release time.) */
    const char *secret = "PAYMENT-APPROVAL-TOKEN-4242";
    flow_t setup;
    flow_start(&setup);
    for (int i = 0; i < STAGE_COUNT; i++)
        checkpoint(&setup, i, "setup");
    unsigned char packet[12 + 64 + 16];
    crypto_random(packet, 12);
    unsigned char tag[16];
    crypto_gcm_encrypt(setup.acc, packet, 12, NULL, 0,
                       (const unsigned char *)secret, strlen(secret), packet + 12, tag);
    memcpy(packet + 12 + strlen(secret), tag, 16);
    size_t packet_size = 12 + strlen(secret) + 16;
    printf("   (secret sealed with the correct chain key: %zu-byte packet)\n\n", packet_size);

    /* RUN: run the checkpoints according to the mode, then the critical operation. */
    flow_t f;
    flow_start(&f);
    if (strcmp(mode, "normal") == 0) {
        printf("Normal flow: every checkpoint runs IN ORDER\n");
        checkpoint(&f, 0, "integrity (Demo 1)");
        checkpoint(&f, 1, "anti-debug (Demo 2)");
        checkpoint(&f, 2, "environment (Demo 3)");
    } else if (strcmp(mode, "skip") == 0) {
        printf("Attack: the attacker SKIPS every check and jumps straight to the critical operation\n");
        printf("   [SKIPPED] no checkpoint ran\n");
    } else if (strcmp(mode, "partial") == 0) {
        printf("Attack: only the first check runs (partial skip)\n");
        checkpoint(&f, 0, "integrity");
    } else if (strcmp(mode, "reorder") == 0) {
        printf("Attack: the checks run in the WRONG ORDER\n");
        checkpoint(&f, 2, "environment");
        checkpoint(&f, 0, "integrity");
        checkpoint(&f, 1, "anti-debug");
    }

    unsigned char out[64] = {0};
    printf("\nRunning the critical operation (payment approval)...\n");
    int ok = critical_operation(&f, packet, packet_size, out, sizeof(out));
    if (ok) {
        printf("RESULT: PAYMENT APPROVED -> \"%s\"\n", out);
        printf("(chain correct: every check was passed in order)\n");
    } else {
        unsigned char decoy[8];
        crypto_random(decoy, 8);
        printf("RESULT: PAYMENT DENIED (wrong chain key).\n");
        printf("The critical operation could NOT produce the real result; a decoy result is returned: %02x%02x...\n",
               decoy[0], decoy[1]);
        printf("(checks skipped/reordered -> a single 'jmp' patch is useless)\n");
    }
    return ok ? 0 : 3;
}
