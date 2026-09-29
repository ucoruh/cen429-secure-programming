/* Unit tests for week-06/01-integrity-hmac/integrity.c.
 *
 * read_file(), write_hex() and target_hmac() are all safe to call in-process: they only read files
 * inside tests/fixtures/ (created for this test) and this test binary's own path, never write
 * outside tests/ or execute anything.
 *
 * write_hex()'s expected strings below are hand-written, not produced by calling write_hex() with a
 * different argument. target_hmac()'s expected digest is computed independently in this file with a
 * direct call to crypto_hmac_sha256() (the shared, separately used primitive) over bytes this test
 * reads itself with plain fopen/fread — never by trusting read_file()'s own return value for the
 * comparison.
 */
#define main program_main
#include "../integrity.c"
#undef main
#include "../../../common/test_check.h"

static void hex_encode_reference(const unsigned char *b, size_t n, char *out)
{
    static const char digits[] = "0123456789abcdef";
    for (size_t i = 0; i < n; i++) {
        out[i * 2]     = digits[(b[i] >> 4) & 0xF];
        out[i * 2 + 1] = digits[b[i] & 0xF];
    }
    out[n * 2] = '\0';
}

int main(void)
{
    /* --- write_hex(): hand-checked byte -> hex text -------------------------------------- */
    {
        unsigned char bytes[4] = {0x00, 0x01, 0xAB, 0xFF};
        char text[16] = {0};
        FILE *f = tmpfile();
        CHECK(f != NULL);
        write_hex(f, bytes, 4);
        rewind(f);
        size_t n = fread(text, 1, sizeof(text) - 1, f);
        text[n] = '\0';
        fclose(f);
        CHECK_EQ_STR(text, "0001abff");
    }
    {
        unsigned char bytes[4] = {0xDE, 0xAD, 0xBE, 0xEF};
        char text[16] = {0};
        FILE *f = tmpfile();
        CHECK(f != NULL);
        write_hex(f, bytes, 4);
        rewind(f);
        size_t n = fread(text, 1, sizeof(text) - 1, f);
        text[n] = '\0';
        fclose(f);
        CHECK_EQ_STR(text, "deadbeef");
    }
    {
        /* n=1 boundary: a single byte. */
        unsigned char one = 0xFF;
        char text[8] = {0};
        FILE *f = tmpfile();
        write_hex(f, &one, 1);
        rewind(f);
        size_t n = fread(text, 1, sizeof(text) - 1, f);
        text[n] = '\0';
        fclose(f);
        CHECK_EQ_STR(text, "ff");
    }
    {
        /* n=0: empty input writes nothing. */
        char text[8] = {0};
        FILE *f = tmpfile();
        write_hex(f, (const unsigned char *)"", 0);
        rewind(f);
        size_t n = fread(text, 1, sizeof(text) - 1, f);
        text[n] = '\0';
        CHECK_EQ_STR(text, "");
        fclose(f);
    }

    /* --- read_file(): normal, empty, too-short buffer never an issue, missing, blank path -- */
    {
        unsigned char *data = NULL;
        size_t size = 0;
        CHECK(read_file("tests/fixtures/fixture_a.bin", &data, &size));
        CHECK_EQ_INT(size, 19);                              /* "The quick brown fox", no newline */
        CHECK_MEM(data, "The quick brown fox", 19);
        free(data);
    }
    {
        unsigned char *data = NULL;
        size_t size = 0;
        CHECK(read_file("tests/fixtures/fixture_b.bin", &data, &size));
        CHECK_EQ_INT(size, 23);                              /* "jumps over the lazy dog" */
        CHECK_MEM(data, "jumps over the lazy dog", 23);
        free(data);
    }
    {
        /* empty file: success, 0 bytes. */
        unsigned char *data = NULL;
        size_t size = 999;
        CHECK(read_file("tests/fixtures/empty.bin", &data, &size));
        CHECK_EQ_INT(size, 0);
        free(data);
    }
    {
        /* missing file: read_file must fail cleanly (no crash, returns 0). */
        unsigned char *data = NULL;
        size_t size = 0;
        CHECK(!read_file("tests/fixtures/does-not-exist.bin", &data, &size));
    }
    {
        /* blank path: also a clean failure, not a crash. */
        unsigned char *data = NULL;
        size_t size = 0;
        CHECK(!read_file("", &data, &size));
    }

    /* --- target_hmac(): digest matches an independently computed HMAC, path_out is filled,
       different content gives a different digest, same content is deterministic, missing target
       fails cleanly, and a too-small path_out buffer never overflows. ------------------------- */
    {
        unsigned char expected[32];
        FILE *f = fopen("tests/fixtures/fixture_a.bin", "rb");
        CHECK(f != NULL);
        unsigned char raw[64];
        size_t n = fread(raw, 1, sizeof(raw), f);
        fclose(f);
        CHECK(crypto_hmac_sha256(RASP_KEY, sizeof(RASP_KEY), raw, n, expected));

        unsigned char digest[32];
        char path_out[256] = {0};
        CHECK(target_hmac("tests/fixtures/fixture_a.bin", digest, path_out, sizeof(path_out)));
        CHECK_MEM(digest, expected, 32);
        CHECK_EQ_STR(path_out, "tests/fixtures/fixture_a.bin");
    }
    {
        /* Different content -> a different digest (compared to fixture_a's digest above). */
        unsigned char digest_a[32], digest_b[32];
        char unused[256];
        CHECK(target_hmac("tests/fixtures/fixture_a.bin", digest_a, unused, sizeof(unused)));
        CHECK(target_hmac("tests/fixtures/fixture_b.bin", digest_b, unused, sizeof(unused)));
        CHECK(memcmp(digest_a, digest_b, 32) != 0);
    }
    {
        /* Same file hashed twice -> identical digest (deterministic). */
        unsigned char first[32], second[32];
        char unused[256];
        CHECK(target_hmac("tests/fixtures/fixture_a.bin", first, unused, sizeof(unused)));
        CHECK(target_hmac("tests/fixtures/fixture_a.bin", second, unused, sizeof(unused)));
        CHECK_MEM(first, second, 32);
    }
    {
        /* self: reads this very test binary's own path; must succeed with a non-empty path. */
        unsigned char digest[32];
        char path_out[256] = {0};
        CHECK(target_hmac("self", digest, path_out, sizeof(path_out)));
        CHECK(strlen(path_out) > 0);
    }
    {
        /* Missing target file: fails cleanly. */
        unsigned char digest[32];
        char path_out[256] = {0};
        CHECK(!target_hmac("tests/fixtures/does-not-exist.bin", digest, path_out, sizeof(path_out)));
    }
    {
        /* Too-small path_out buffer: hashing still succeeds, and the truncated path is always
           NUL-terminated within bounds (snprintf's contract) -- never an overflow. */
        unsigned char digest[32];
        char tiny[3] = {0x7F, 0x7F, 0x7F};
        CHECK(target_hmac("tests/fixtures/fixture_a.bin", digest, tiny, sizeof(tiny)));
        CHECK(strlen(tiny) <= sizeof(tiny) - 1);
    }

    /* --- hex round trip: write_hex()'s output can be parsed back with the same sscanf loop
       verify() uses, recovering the exact original bytes. ------------------------------------ */
    {
        unsigned char digest[32];
        char reference[65];
        FILE *f = fopen("tests/fixtures/fixture_a.bin", "rb");
        unsigned char raw[64];
        size_t n = fread(raw, 1, sizeof(raw), f);
        fclose(f);
        CHECK(crypto_hmac_sha256(RASP_KEY, sizeof(RASP_KEY), raw, n, digest));
        hex_encode_reference(digest, 32, reference);

        FILE *tf = tmpfile();
        write_hex(tf, digest, 32);
        rewind(tf);
        char roundtrip[65] = {0};
        size_t rt_n = fread(roundtrip, 1, 64, tf);
        roundtrip[rt_n] = '\0';
        fclose(tf);
        CHECK_EQ_STR(roundtrip, reference);

        unsigned char parsed[32];
        for (int i = 0; i < 32; i++) {
            unsigned int v = 0;
            sscanf(roundtrip + i * 2, "%02x", &v);
            parsed[i] = (unsigned char)v;
        }
        CHECK_MEM(parsed, digest, 32);
    }

    TEST_SUMMARY();
}
