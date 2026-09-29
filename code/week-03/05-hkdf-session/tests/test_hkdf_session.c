/* Unit tests for week-03/05-hkdf-session/hkdf_session.c.
 *
 * crypto_hkdf_sha256() is checked against:
 *  (a) the official RFC 5869 Appendix A.1 Test Case 1 vector (a published, independently
 *      verifiable known-answer test), and
 *  (b) vectors computed with Python's `cryptography` HKDF implementation for the exact
 *      master secret / salt / info strings this demo uses (see tests/hkdf_vectors.h, generated
 *      once, not hand-typed).
 * The forward-secrecy chain property (Ki cannot be un-computed from Ki+1) is not something a
 * unit test can prove by brute force; instead we check that the chain is REPRODUCIBLE (the same
 * master secret always derives the same K1, K2, ...) and that different info labels/different
 * chain positions give different keys, which is the property the demo's output relies on.
 */
#define main program_main
#include "../hkdf_session.c"
#undef main
#include "../../../common/test_check.h"
#include "hkdf_vectors.h"

static void to_hex(const unsigned char *b, int len, char *out)
{
    static const char digits[] = "0123456789abcdef";
    for (int i = 0; i < len; i++) {
        out[2 * i] = digits[b[i] >> 4];
        out[2 * i + 1] = digits[b[i] & 0xf];
    }
    out[2 * len] = '\0';
}

int main(void)
{
    char hex[128];
    unsigned char out[48];

    /* --- RFC 5869 A.1 Test Case 1 (official published HKDF-SHA256 vector) ------------------ */
    {
        unsigned char ikm[22];
        memset(ikm, 0x0b, sizeof(ikm));
        unsigned char salt[13] = { 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c };
        unsigned char info[10] = { 0xf0, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9 };
        CHECK(crypto_hkdf_sha256(ikm, sizeof(ikm), salt, sizeof(salt), info, sizeof(info), out, 42));
        to_hex(out, 42, hex);
        CHECK_EQ_STR(hex, HV_RFC5869_TC1_42);
    }

    /* --- the demo's own master secret + info labels ----------------------------------------- */
    unsigned char master[32]; memset(master, 0x5a, sizeof(master));
    unsigned char salt16[16]; memset(salt16, 0x00, sizeof(salt16));

    CHECK(crypto_hkdf_sha256(master, 32, salt16, 16,
        (const unsigned char *)"cen429 encryption key v1", 24, out, 32));
    to_hex(out, 32, hex);
    CHECK_EQ_STR(hex, HV_MASTER_ENC_V1_32);

    CHECK(crypto_hkdf_sha256(master, 32, salt16, 16,
        (const unsigned char *)"cen429 MAC key v1", 17, out, 32));
    to_hex(out, 32, hex);
    CHECK_EQ_STR(hex, HV_MASTER_MAC_V1_32);

    /* different info -> different key (not just different from a hand guess, from each other) */
    {
        unsigned char k_enc[32], k_mac[32];
        CHECK(crypto_hkdf_sha256(master, 32, salt16, 16,
            (const unsigned char *)"cen429 encryption key v1", 24, k_enc, 32));
        CHECK(crypto_hkdf_sha256(master, 32, salt16, 16,
            (const unsigned char *)"cen429 MAC key v1", 17, k_mac, 32));
        CHECK(memcmp(k_enc, k_mac, 32) != 0);
    }

    /* --- forward-secrecy chain: K1 and K2, matching the demo's own "chain advance" info ----- */
    unsigned char k1[32];
    CHECK(crypto_hkdf_sha256(master, 32, salt16, 16,
        (const unsigned char *)"chain advance", 13, k1, 32));
    to_hex(k1, 32, hex);
    CHECK_EQ_STR(hex, HV_MASTER_CHAIN_1_32);

    unsigned char k2[32];
    CHECK(crypto_hkdf_sha256(k1, 32, salt16, 16,
        (const unsigned char *)"chain advance", 13, k2, 32));
    to_hex(k2, 32, hex);
    CHECK_EQ_STR(hex, HV_MASTER_CHAIN_2_32);

    /* chain positions differ from each other, and the chain is reproducible */
    CHECK(memcmp(k1, k2, 32) != 0);
    {
        unsigned char k1_again[32];
        CHECK(crypto_hkdf_sha256(master, 32, salt16, 16,
            (const unsigned char *)"chain advance", 13, k1_again, 32));
        CHECK_MEM(k1, k1_again, 32);
    }

    /* --- boundary: an empty salt must fall back to a 32-byte zero salt (per RFC 5869 section 2.2) */
    {
        unsigned char with_null_salt[32], with_zero_salt[32];
        CHECK(crypto_hkdf_sha256(master, 32, NULL, 0,
            (const unsigned char *)"x", 1, with_null_salt, 32));
        unsigned char zero_salt[32]; memset(zero_salt, 0, sizeof(zero_salt));
        CHECK(crypto_hkdf_sha256(master, 32, zero_salt, 32,
            (const unsigned char *)"x", 1, with_zero_salt, 32));
        CHECK_MEM(with_null_salt, with_zero_salt, 32);
    }

    TEST_SUMMARY();
}
