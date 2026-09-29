/* Unit tests for week-03/04-password-to-key/password_to_key.c.
 *
 * crypto_pbkdf2_sha256() is checked against known-answer vectors computed independently with
 * Python's standard-library hashlib.pbkdf2_hmac('sha256', ...) — a completely different
 * implementation from the one under test (see tests/pbkdf2_vectors.h, generated once, not
 * hand-typed). This is a much stronger check than a round-trip: it catches a wrong-but-
 * self-consistent PBKDF2 implementation, not just a crash.
 */
#define main program_main
#include "../password_to_key.c"
#undef main
#include "../../../common/test_check.h"
#include "pbkdf2_vectors.h"

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

    /* --- empty password, empty salt, 1 round, 32-byte output ------------------------------- */
    CHECK(crypto_pbkdf2_sha256((const unsigned char *)"", 0, (const unsigned char *)"", 0, 1, out, 32));
    to_hex(out, 32, hex);
    CHECK_EQ_STR(hex, PV_EMPTY_EMPTY_1_32);

    /* --- "password"/"salt", rounds = 1, 2, 4096 (RFC-style vectors, independently computed) - */
    CHECK(crypto_pbkdf2_sha256((const unsigned char *)"password", 8, (const unsigned char *)"salt", 4, 1, out, 32));
    to_hex(out, 32, hex);
    CHECK_EQ_STR(hex, PV_PW_SALT_1_32);

    CHECK(crypto_pbkdf2_sha256((const unsigned char *)"password", 8, (const unsigned char *)"salt", 4, 2, out, 32));
    to_hex(out, 32, hex);
    CHECK_EQ_STR(hex, PV_PW_SALT_2_32);

    CHECK(crypto_pbkdf2_sha256((const unsigned char *)"password", 8, (const unsigned char *)"salt", 4, 4096, out, 32));
    to_hex(out, 32, hex);
    CHECK_EQ_STR(hex, PV_PW_SALT_4096_32);

    /* --- the demo's own password + its two salts, at its real round count (100000) --------- */
    {
        unsigned char salt_a[16]; memset(salt_a, 0xA1, sizeof(salt_a));
        unsigned char salt_b[16]; memset(salt_b, 0xB2, sizeof(salt_b));
        CHECK(crypto_pbkdf2_sha256((const unsigned char *)"dog123", 6, salt_a, 16, 100000, out, 32));
        to_hex(out, 32, hex);
        CHECK_EQ_STR(hex, PV_DOG123_SALTA_100000_32);

        CHECK(crypto_pbkdf2_sha256((const unsigned char *)"dog123", 6, salt_b, 16, 100000, out, 32));
        to_hex(out, 32, hex);
        CHECK_EQ_STR(hex, PV_DOG123_SALTB_100000_32);
    }
    {
        unsigned char salt_a[16]; memset(salt_a, 0xA1, sizeof(salt_a));
        unsigned char out_a1[32], out_a2[32];
        CHECK(crypto_pbkdf2_sha256((const unsigned char *)"dog123", 6, salt_a, 16, 100000, out_a1, 32));
        CHECK(crypto_pbkdf2_sha256((const unsigned char *)"dog123", 6, salt_a, 16, 100000, out_a2, 32));
        CHECK_MEM(out_a1, out_a2, 32);          /* determinism: same inputs -> identical key */
        to_hex(out_a1, 32, hex);
        CHECK_EQ_STR(hex, PV_DOG123_SALTA_100000_32);
    }

    /* --- boundary: password longer than the HMAC block size (64 bytes) --------------------- */
    {
        char longpw[101];
        memset(longpw, 'x', 100);
        longpw[100] = '\0';
        CHECK(crypto_pbkdf2_sha256((const unsigned char *)longpw, 100, (const unsigned char *)"salt", 4, 1, out, 32));
        to_hex(out, 32, hex);
        CHECK_EQ_STR(hex, PV_LONGPW100_SALT_1_32);
    }

    /* --- output length other than 32: 48 bytes (multi-block expand) and 16 (truncated) ----- */
    CHECK(crypto_pbkdf2_sha256((const unsigned char *)"password", 8, (const unsigned char *)"salt", 4, 1, out, 48));
    to_hex(out, 48, hex);
    CHECK_EQ_STR(hex, PV_PW_SALT_1_48);
    /* the first 32 bytes of the 48-byte output must equal the plain 32-byte output (same T1||T2 prefix) */
    {
        char hex32[80];
        unsigned char out32[32];
        CHECK(crypto_pbkdf2_sha256((const unsigned char *)"password", 8, (const unsigned char *)"salt", 4, 1, out32, 32));
        to_hex(out32, 32, hex32);
        char prefix48[65];
        memcpy(prefix48, hex, 64);
        prefix48[64] = '\0';
        CHECK_EQ_STR(prefix48, hex32);
    }

    CHECK(crypto_pbkdf2_sha256((const unsigned char *)"password", 8, (const unsigned char *)"salt", 4, 1, out, 16));
    to_hex(out, 16, hex);
    CHECK_EQ_STR(hex, PV_PW_SALT_1_16);

    TEST_SUMMARY();
}
