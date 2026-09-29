/* Unit tests for week-03/06-tls-pinning/tls_client.c.
 *
 * hex_decode() is tested directly with hand-computed cases. spki_digest() is checked against
 * tests/fixtures/test.crt, a real self-signed certificate generated once with the OpenSSL CLI;
 * tests/fixtures/test.pin.txt holds that certificate's SPKI SHA-256 digest, computed
 * independently with `openssl x509 -pubkey | openssl pkey -pubin -outform der | openssl dgst
 * -sha256` AND cross-checked with Python's hashlib.sha256 (see the progress notes) — two
 * separate tools agreeing, neither of them this program's own spki_digest().
 *
 * This file does not open any socket and does not need a running TLS server; the live
 * client/server handshake scenarios (insecure/verify/pin, MITM, tampered pin) are covered by the
 * end-to-end shell script (tests/e2e_tls.sh), which mirrors demo.sh.
 */
#define main program_main
#include "../tls_client.c"
#undef main
#include "../../../common/test_check.h"

static char *read_text_file(const char *path)
{
    FILE *f = fopen(path, "rb");
    if (!f) return NULL;
    fseek(f, 0, SEEK_END);
    long n = ftell(f);
    fseek(f, 0, SEEK_SET);
    char *buf = (char *)malloc((size_t)n + 1);
    long got = (long)fread(buf, 1, (size_t)n, f);
    buf[got] = '\0';
    fclose(f);
    n = got;
    /* strip trailing newline(s) */
    while (n > 0 && (buf[n - 1] == '\n' || buf[n - 1] == '\r')) buf[--n] = '\0';
    return buf;
}

int main(void)
{
    /* --- hex_decode(): normal, uppercase, empty, odd length, invalid, size-limited ---------- */
    {
        unsigned char out[8];
        CHECK_EQ_INT(hex_decode("deadbeef", out, sizeof(out)), 4);
        CHECK_EQ_INT(out[0], 0xde); CHECK_EQ_INT(out[1], 0xad);
        CHECK_EQ_INT(out[2], 0xbe); CHECK_EQ_INT(out[3], 0xef);
    }
    {
        unsigned char out[8];
        CHECK_EQ_INT(hex_decode("DEADBEEF", out, sizeof(out)), 4);
        CHECK_EQ_INT(out[0], 0xde); CHECK_EQ_INT(out[3], 0xef);
    }
    {
        unsigned char out[8];
        CHECK_EQ_INT(hex_decode("", out, sizeof(out)), 0);
    }
    {
        /* "abc": one full pair "ab" is consumed (n=1), then the loop sees p[1] == '\0' and stops
           WITHOUT treating the leftover "c" as an error. */
        unsigned char out[8];
        CHECK_EQ_INT(hex_decode("abc", out, sizeof(out)), 1);
        CHECK_EQ_INT(out[0], 0xab);
    }
    {
        unsigned char out[8];
        CHECK_EQ_INT(hex_decode("zz11", out, sizeof(out)), -1);   /* 'z' is not a hex digit */
    }
    {
        unsigned char out[2];
        CHECK_EQ_INT(hex_decode("aabbccdd", out, sizeof(out)), 2);   /* out_len caps the output */
        CHECK_EQ_INT(out[0], 0xaa); CHECK_EQ_INT(out[1], 0xbb);
    }
    {
        /* a realistic 32-byte SPKI pin (64 hex chars) */
        unsigned char out[32];
        CHECK_EQ_INT(hex_decode("286b18539ee22589312684d4f51cd1aa2055211eedeb07fce6865b5583143aa3",
                                 out, sizeof(out)), 32);
    }

    /* --- spki_digest() against a real certificate, cross-checked with the OpenSSL CLI ------- */
    {
        FILE *f = fopen("tests/fixtures/test.crt", "r");
        CHECK(f != NULL);
        if (f) {
            X509 *cert = PEM_read_X509(f, NULL, NULL, NULL);
            fclose(f);
            CHECK(cert != NULL);
            if (cert) {
                unsigned char actual[32];
                CHECK(spki_digest(cert, actual));

                char *expected_hex = read_text_file("tests/fixtures/test.pin.txt");
                CHECK(expected_hex != NULL);
                if (expected_hex) {
                    CHECK_EQ_INT((int)strlen(expected_hex), 64);
                    unsigned char expected[32];
                    CHECK_EQ_INT(hex_decode(expected_hex, expected, sizeof(expected)), 32);
                    CHECK_MEM(actual, expected, 32);   /* our spki_digest() == the OpenSSL-CLI-computed pin */

                    /* a tampered pin must NOT match (sanity: the comparison actually discriminates) */
                    expected[0] ^= 0xFF;
                    CHECK(memcmp(actual, expected, 32) != 0);
                    free(expected_hex);
                }
                X509_free(cert);
            }
        }
    }

    TEST_SUMMARY();
}
