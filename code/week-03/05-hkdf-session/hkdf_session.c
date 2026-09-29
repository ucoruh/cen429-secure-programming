/*
 * CEN429 - Week 3 - Demo 5: session keys with HKDF and forward secrecy
 *
 * A single long-lived "master secret" is usually not used directly. HKDF
 * (RFC 5869) derives a SEPARATE key for each purpose/session from it. HKDF
 * has two stages:
 *   - Extract: master secret + salt -> a uniform intermediate key (PRK)
 *   - Expand : PRK + an "info" label -> a key of the requested length
 * A different "info" label gives a different key. Knowing one derived key
 * does not reveal another (one-wayness).
 *
 * This program shows two things:
 *   1) From the same master secret, different "info" labels give
 *      DIFFERENT session keys.
 *   2) A FORWARD SECRECY chain: K0 = master secret;
 *      Ki = HKDF(Ki-1). Every session uses Ki, then Ki-1 is WIPED.
 *      Even if an attacker gets today's Kn, the one-way chain means K1..
 *      Kn-1 (and those sessions' data) cannot be recomputed backwards.
 *
 * HKDF is built portably on top of HMAC in the shared header (RFC 5869).
 */
#include "cen429_demo.h"
#include "cen429_crypto.h"
#include <stdio.h>
#include <string.h>

#define KEY_LEN 32

static void print_hex(const char *label, const unsigned char *b, int len)
{
    printf("%s", label);
    for (int i = 0; i < len; i++)
        printf("%02x", b[i]);
    printf("\n");
}

int main(void)
{
    demo_prepare();
    unsigned char master_secret[32];
    memset(master_secret, 0x5a, sizeof(master_secret));   /* fixed demo master secret */
    unsigned char salt[16];
    memset(salt, 0x00, sizeof(salt));

    printf("Separate keys per purpose, from one master secret:\n");
    printf("==============================================================\n");
    unsigned char k_cipher[KEY_LEN], k_mac[KEY_LEN];
    crypto_hkdf_sha256(master_secret, 32, salt, 16,
        (const unsigned char *)"cen429 encryption key v1", 24,
        k_cipher, KEY_LEN);
    crypto_hkdf_sha256(master_secret, 32, salt, 16,
        (const unsigned char *)"cen429 MAC key v1", 17,
        k_mac, KEY_LEN);
    print_hex("  info='...encryption...' -> ", k_cipher, KEY_LEN);
    print_hex("  info='...MAC...'        -> ", k_mac, KEY_LEN);
    printf("  ^ Same secret, different info -> different key. A key derived\n");
    printf("    for one purpose is never reused for another.\n");

    printf("==============================================================\n");
    printf("FORWARD SECRECY chain: Ki = HKDF(Ki-1), Ki-1 is wiped\n");
    unsigned char k[KEY_LEN];
    memcpy(k, master_secret, KEY_LEN);          /* K0 = master secret */
    for (int i = 1; i <= 4; i++) {
        unsigned char next[KEY_LEN];
        crypto_hkdf_sha256(k, KEY_LEN, salt, 16,
            (const unsigned char *)"chain advance", 13, next,
            KEY_LEN);
        /* Securely wipe the old key, then advance. */
        crypto_wipe(k, KEY_LEN);
        memcpy(k, next, KEY_LEN);
        crypto_wipe(next, KEY_LEN);
        char label[32];
        snprintf(label, sizeof(label), "  K%d (session %d) = ", i, i);
        print_hex(label, k, 8);                       /* the first 8 bytes are enough */
    }
    printf("  ^ We now only have K4. Because the chain is ONE-WAY, K3, K2, K1\n");
    printf("    cannot be recomputed backwards from K4: earlier sessions stay\n");
    printf("    safe even if today's key leaks.\n");
    crypto_wipe(k, KEY_LEN);
    return 0;
}
