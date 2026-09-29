/*
 * CEN429 - Week 3 - Demo 2: the danger of reusing a nonce (IV)
 *
 * AES-GCM provides confidentiality through a "counter mode" (CTR) stream: a
 * keystream is generated from the key and the nonce and XORed with the
 * plaintext:  C = P XOR AA(key, nonce)
 *
 * If the SAME key + SAME nonce encrypts two DIFFERENT messages, both
 * messages use the SAME keystream. Then:
 *     C1 XOR C2 = (P1 XOR AA) XOR (P2 XOR AA) = P1 XOR P2
 * The keystream cancels out; an attacker recovers the XOR of the two
 * plaintexts. If the attacker knows one message, the other is fully
 * recovered. (In GCM, reusing a nonce also completely breaks authentication.)
 *
 * The program first encrypts with the SAME nonce, then with DIFFERENT
 * nonces, and compares the XOR of the ciphertexts with the XOR of the
 * plaintexts.
 *
 * IMPORTANT: this is an ATTACK demonstration; a nonce must NEVER be reused.
 */
#include "cen429_demo.h"
#include "cen429_crypto.h"
#include <stdio.h>
#include <string.h>

#define NONCE_LEN 12

static void xor_bytes(const unsigned char *a, const unsigned char *b,
                      unsigned char *out, int len)
{
    for (int i = 0; i < len; i++)
        out[i] = (unsigned char)(a[i] ^ b[i]);
}

static void print_hex(const char *label, const unsigned char *b, int len)
{
    printf("%s", label);
    for (int i = 0; i < len; i++)
        printf("%02x", b[i]);
    printf("\n");
}

static void print_text(const char *label, const unsigned char *b, int len)
{
    printf("%s\"", label);
    for (int i = 0; i < len; i++)
        putchar((b[i] >= 32 && b[i] < 127) ? b[i] : '.');
    printf("\"\n");
}

int main(void)
{
    demo_prepare();
    unsigned char key[32];
    memset(key, 0x2b, sizeof(key));   /* fixed demo key */

    const char *m1 = "Attack begins at dawn, 06:00 hours!";
    const char *m2 = "Total balance is 45000, PIN is 1234";
    int len = (int)strlen(m1);                 /* the two messages are equal length */

    unsigned char p1[64], p2[64], c1[80], c2[80], tag[16];
    unsigned char pxor[64], cxor[64];
    memcpy(p1, m1, len);
    memcpy(p2, m2, len);
    xor_bytes(p1, p2, pxor, len);

    printf("Plaintext 1: \"%s\"\n", m1);
    printf("Plaintext 2: \"%s\"\n", m2);
    printf("==============================================================\n");

    /* --- BAD: the same nonce for both messages --- */
    unsigned char nonce_same[NONCE_LEN];
    memset(nonce_same, 0x00, NONCE_LEN);
    crypto_gcm_encrypt(key, nonce_same, NONCE_LEN, NULL, 0, p1,
                       (size_t)len, c1, tag);
    crypto_gcm_encrypt(key, nonce_same, NONCE_LEN, NULL, 0, p2,
                       (size_t)len, c2, tag);
    xor_bytes(c1, c2, cxor, len);

    printf("BAD CASE - the SAME nonce for both messages:\n");
    print_hex("  C1        = ", c1, len);
    print_hex("  C2        = ", c2, len);
    print_hex("  C1 xor C2 = ", cxor, len);
    print_hex("  P1 xor P2 = ", pxor, len);
    if (memcmp(cxor, pxor, len) == 0)
        printf("  ==> C1 xor C2 == P1 xor P2 : the keystream LEAKED!\n");
    else
        printf("  ==> not equal\n");

    /* If the attacker knows P1: P2 = (C1 xor C2) xor P1. */
    unsigned char p2_recovered[64];
    xor_bytes(cxor, p1, p2_recovered, len);
    print_text("  If the attacker knows P1, P2 = (C1 xor C2) xor P1 = ",
              p2_recovered, len);

    printf("==============================================================\n");

    /* --- GOOD: a different nonce for each message --- */
    unsigned char nonce_a[NONCE_LEN], nonce_b[NONCE_LEN];
    memset(nonce_a, 0x00, NONCE_LEN);
    memset(nonce_b, 0x00, NONCE_LEN);
    nonce_b[NONCE_LEN - 1] = 0x01;                /* a different nonce */
    crypto_gcm_encrypt(key, nonce_a, NONCE_LEN, NULL, 0, p1,
                       (size_t)len, c1, tag);
    crypto_gcm_encrypt(key, nonce_b, NONCE_LEN, NULL, 0, p2,
                       (size_t)len, c2, tag);
    xor_bytes(c1, c2, cxor, len);

    printf("GOOD CASE - a DIFFERENT nonce for each message:\n");
    print_hex("  C1 xor C2 = ", cxor, len);
    print_hex("  P1 xor P2 = ", pxor, len);
    if (memcmp(cxor, pxor, len) == 0)
        printf("  ==> still leaked (should not happen)\n");
    else
        printf("  ==> C1 xor C2 != P1 xor P2 : no leak.\n");

    return 0;
}
