/* Unit tests for week-06/06-component-signature/signature.c.
 *
 * read_file() and write_hex() are exercised the same way as demo 1's test_integrity.c. The HMAC
 * expected values are computed independently in this file with a direct call to
 * crypto_hmac_sha256(SIGNING_KEY, ...) over bytes read here with plain fopen/fread -- never by
 * trusting the compiled signature.c binary's own prior output.
 */
#define main program_main
#include "../signature.c"
#undef main
#include "../../../common/test_check.h"

static int read_whole(const char *path, unsigned char *buf, size_t buf_size, size_t *out_size)
{
    FILE *f = fopen(path, "rb");
    if (!f)
        return 0;
    *out_size = fread(buf, 1, buf_size, f);
    fclose(f);
    return 1;
}

int main(void)
{
    /* --- write_hex(): hand-checked byte -> hex text (same contract as demo 1) --------------- */
    {
        unsigned char bytes[3] = {0x12, 0x34, 0x56};
        char text[16] = {0};
        FILE *f = tmpfile();
        write_hex(f, bytes, 3);
        rewind(f);
        size_t n = fread(text, 1, sizeof(text) - 1, f);
        text[n] = '\0';
        fclose(f);
        CHECK_EQ_STR(text, "123456");
    }
    {
        unsigned char one = 0x00;
        char text[8] = {0};
        FILE *f = tmpfile();
        write_hex(f, &one, 1);
        rewind(f);
        size_t n = fread(text, 1, sizeof(text) - 1, f);
        text[n] = '\0';
        fclose(f);
        CHECK_EQ_STR(text, "00");
    }

    /* --- read_file(): normal, boundary content, empty, missing ------------------------------ */
    {
        unsigned char *data = NULL;
        size_t size = 0;
        CHECK(read_file("tests/fixtures/module_a.bin", &data, &size));
        CHECK_EQ_INT(size, 23);
        CHECK_MEM(data, "PLUGIN-MODULE-CONTENT-A", 23);
        free(data);
    }
    {
        unsigned char *data = NULL;
        size_t size = 0;
        CHECK(read_file("tests/fixtures/module_b.bin", &data, &size));
        CHECK_EQ_INT(size, 33);
        free(data);
    }
    {
        unsigned char *data = NULL;
        size_t size = 999;
        CHECK(read_file("tests/fixtures/empty_module.bin", &data, &size));
        CHECK_EQ_INT(size, 0);
        free(data);
    }
    {
        unsigned char *data = NULL;
        size_t size = 0;
        CHECK(!read_file("tests/fixtures/does-not-exist.bin", &data, &size));
    }

    /* --- HMAC over the fixture, independently computed here with the same key + primitive as
       the demo's own code, but never via the demo's compiled output. ------------------------- */
    {
        unsigned char raw[64];
        size_t n = 0;
        CHECK(read_whole("tests/fixtures/module_a.bin", raw, sizeof(raw), &n));
        unsigned char expected[32];
        CHECK(crypto_hmac_sha256(SIGNING_KEY, sizeof(SIGNING_KEY), raw, n, expected));

        unsigned char *data = NULL;
        size_t size = 0;
        CHECK(read_file("tests/fixtures/module_a.bin", &data, &size));
        unsigned char actual[32];
        CHECK(crypto_hmac_sha256(SIGNING_KEY, sizeof(SIGNING_KEY), data, size, actual));
        free(data);
        CHECK_MEM(actual, expected, 32);
    }
    {
        /* Different module content -> a different HMAC (module_a vs module_b). */
        unsigned char raw_a[64], raw_b[64];
        size_t n_a = 0, n_b = 0;
        CHECK(read_whole("tests/fixtures/module_a.bin", raw_a, sizeof(raw_a), &n_a));
        CHECK(read_whole("tests/fixtures/module_b.bin", raw_b, sizeof(raw_b), &n_b));
        unsigned char mac_a[32], mac_b[32];
        CHECK(crypto_hmac_sha256(SIGNING_KEY, sizeof(SIGNING_KEY), raw_a, n_a, mac_a));
        CHECK(crypto_hmac_sha256(SIGNING_KEY, sizeof(SIGNING_KEY), raw_b, n_b, mac_b));
        CHECK(memcmp(mac_a, mac_b, 32) != 0);
    }
    {
        /* One extra byte appended (repackaging simulation) -> HMAC must differ from the original. */
        unsigned char raw[64];
        size_t n = 0;
        CHECK(read_whole("tests/fixtures/module_a.bin", raw, sizeof(raw), &n));
        unsigned char original[32];
        CHECK(crypto_hmac_sha256(SIGNING_KEY, sizeof(SIGNING_KEY), raw, n, original));
        raw[n] = 'X';   /* append one byte, like demo.sh's repackaging attack */
        unsigned char tampered[32];
        CHECK(crypto_hmac_sha256(SIGNING_KEY, sizeof(SIGNING_KEY), raw, n + 1, tampered));
        CHECK(memcmp(original, tampered, 32) != 0);
    }

    TEST_SUMMARY();
}
