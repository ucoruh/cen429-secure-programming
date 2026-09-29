/* Unit tests for week-03/02-nonce-reuse/nonce_reuse.c.
 *
 * xor_bytes() is tested directly with hand-computed vectors. The core lesson of the demo — that
 * reusing a nonce leaks C1 xor C2 == P1 xor P2, and that a different nonce per message does not —
 * is re-derived here by calling crypto_gcm_encrypt() directly with our OWN plaintexts and nonces
 * (never the program's p1/p2/c1/c2 buffers), so the expected result comes from the XOR algebra
 * itself, not from trusting the demo's own output.
 */
#define main program_main
#include "../nonce_reuse.c"
#undef main
#include "../../../common/test_check.h"

int main(void)
{
    /* --- xor_bytes(): hand-computed vectors ------------------------------------------------- */
    {
        unsigned char a[3] = { 0x00, 0xFF, 0x0F };
        unsigned char b[3] = { 0xFF, 0xFF, 0xF0 };
        unsigned char out[3];
        xor_bytes(a, b, out, 3);
        CHECK_EQ_INT(out[0], 0xFF);
        CHECK_EQ_INT(out[1], 0x00);
        CHECK_EQ_INT(out[2], 0xFF);
    }
    {
        unsigned char a[1] = { 0x5A }, b[1] = { 0x5A }, out[1];
        xor_bytes(a, b, out, 1);
        CHECK_EQ_INT(out[0], 0x00);            /* x xor x == 0 */
    }
    {
        unsigned char a[4] = { 1, 2, 3, 4 }, out[4];
        xor_bytes(a, a, out, 4);
        CHECK_EQ_INT(out[0], 0); CHECK_EQ_INT(out[1], 0);
        CHECK_EQ_INT(out[2], 0); CHECK_EQ_INT(out[3], 0);
    }
    {
        unsigned char a[2] = { 0, 0 }, out[2];
        xor_bytes(a, a, out, 0);   /* len 0: must not touch out at all, must not crash */
        CHECK(1);
    }

    /* --- the actual leak: same nonce -> C1 xor C2 == P1 xor P2 ------------------------------ */
    {
        unsigned char key[32]; memset(key, 0x77, sizeof(key));
        unsigned char nonce[NONCE_LEN]; memset(nonce, 0x00, NONCE_LEN);
        const unsigned char p1[16] = "0123456789abcde";  /* 15 chars + NUL, len used below is 15 */
        const unsigned char p2[16] = "ZYXWVUTSRQPONML";
        int n = 15;
        unsigned char c1[16], c2[16], tag1[16], tag2[16];
        CHECK(crypto_gcm_encrypt(key, nonce, NONCE_LEN, NULL, 0, p1, (size_t)n, c1, tag1));
        CHECK(crypto_gcm_encrypt(key, nonce, NONCE_LEN, NULL, 0, p2, (size_t)n, c2, tag2));
        unsigned char cxor[16], pxor[16];
        xor_bytes(c1, c2, cxor, n);
        xor_bytes(p1, p2, pxor, n);
        CHECK_MEM(cxor, pxor, (size_t)n);        /* the leak: independent of the demo's own printout */

        /* recovering p2 from (c1 xor c2) xor p1, knowing only p1 */
        unsigned char recovered[16];
        xor_bytes(cxor, p1, recovered, n);
        CHECK_MEM(recovered, p2, (size_t)n);
    }

    /* --- different nonces -> the leak disappears ------------------------------------------- */
    {
        unsigned char key[32]; memset(key, 0x77, sizeof(key));
        unsigned char nonce_a[NONCE_LEN]; memset(nonce_a, 0x00, NONCE_LEN);
        unsigned char nonce_b[NONCE_LEN]; memset(nonce_b, 0x00, NONCE_LEN);
        nonce_b[NONCE_LEN - 1] = 0x01;
        const unsigned char p1[16] = "0123456789abcde";
        const unsigned char p2[16] = "ZYXWVUTSRQPONML";
        int n = 15;
        unsigned char c1[16], c2[16], tag1[16], tag2[16];
        CHECK(crypto_gcm_encrypt(key, nonce_a, NONCE_LEN, NULL, 0, p1, (size_t)n, c1, tag1));
        CHECK(crypto_gcm_encrypt(key, nonce_b, NONCE_LEN, NULL, 0, p2, (size_t)n, c2, tag2));
        unsigned char cxor[16], pxor[16];
        xor_bytes(c1, c2, cxor, n);
        xor_bytes(p1, p2, pxor, n);
        CHECK(memcmp(cxor, pxor, (size_t)n) != 0);   /* the leak must be gone */
    }

    /* --- boundary: a 64-byte message (the demo's buffer size) round-trips through the leak too */
    {
        unsigned char key[32]; memset(key, 0x11, sizeof(key));
        unsigned char nonce[NONCE_LEN]; memset(nonce, 0x22, NONCE_LEN);
        unsigned char p1[64], p2[64];
        for (int i = 0; i < 64; i++) { p1[i] = (unsigned char)i; p2[i] = (unsigned char)(255 - i); }
        unsigned char c1[64], c2[64], tag1[16], tag2[16];
        CHECK(crypto_gcm_encrypt(key, nonce, NONCE_LEN, NULL, 0, p1, 64, c1, tag1));
        CHECK(crypto_gcm_encrypt(key, nonce, NONCE_LEN, NULL, 0, p2, 64, c2, tag2));
        unsigned char cxor[64], pxor[64];
        xor_bytes(c1, c2, cxor, 64);
        xor_bytes(p1, p2, pxor, 64);
        CHECK_MEM(cxor, pxor, 64);
    }

    /* --- the demo program itself runs cleanly end-to-end (smoke test) ---------------------- */
    CHECK_EQ_INT(program_main(), 0);

    TEST_SUMMARY();
}
