/* Unit tests for week-02/08-integrity-monitoring/integrity.c.
 *
 * file_digest()/base_name()/compare_names() are pure/bounded, safe to call in-process.
 * Expected SHA-256 values are the two best-known published test vectors (SHA-256("") and
 * SHA-256("abc")) -- independent of crypto_sha256()'s own implementation.
 *
 * seal()/verify_seal()/compute_hmac() do real file I/O; they are tested for their DOCUMENTED,
 * deterministic behaviour (seal-then-verify passes; a tampered manifest or a different key is
 * caught) using scratch files under tests/tmp/, which this test creates and removes itself.
 */
#define main program_main
#include "../integrity.c"
#undef main
#include "../../../common/test_check.h"
#include <sys/stat.h>
#ifdef _WIN32
#include <direct.h>
#endif

#define TMP "tests/tmp"

static void write_text(const char *path, const char *text)
{
    FILE *f = fopen(path, "wb");
    fputs(text, f);
    fclose(f);
}

int main(void)
{
#ifdef _WIN32
    _mkdir(TMP);
#else
    mkdir(TMP, 0700);
#endif

    /* --- file_digest(): the two best-known published SHA-256 test vectors ----------------- */
    {
        char hex[65];
        long long size = -1;
        CHECK_EQ_INT(file_digest("tests/fixtures/abc.txt", hex, &size), 0);
        CHECK_EQ_STR(hex, "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
        CHECK_EQ_INT((int)size, 3);
    }
    {
        char hex[65];
        long long size = -1;
        CHECK_EQ_INT(file_digest("tests/fixtures/empty.bin", hex, &size), 0);
        CHECK_EQ_STR(hex, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
        CHECK_EQ_INT((int)size, 0);
    }
    {
        char hex[65];
        long long size = 0;
        CHECK_EQ_INT(file_digest("tests/fixtures/does-not-exist.txt", hex, &size), -1);
    }

    /* --- base_name(): forward slash, backslash, no folder at all --------------------------- */
    CHECK_EQ_STR(base_name("a/b/c.txt"), "c.txt");
    CHECK_EQ_STR(base_name("a\\b\\c.txt"), "c.txt");
    CHECK_EQ_STR(base_name("nofolder.txt"), "nofolder.txt");

    /* --- compare_names(): qsort comparator sign convention ---------------------------------- */
    {
        struct entry a, b;
        snprintf(a.name, NAME_LEN, "alpha");
        snprintf(b.name, NAME_LEN, "beta");
        CHECK(compare_names(&a, &b) < 0);
        CHECK(compare_names(&b, &a) > 0);
        CHECK_EQ_INT(compare_names(&a, &a), 0);
    }

    /* --- seal() / verify_seal(): sign, verify, then detect tampering ----------------------- */
    {
        const char *manifest = TMP "/manifest.txt";
        const char *key1 = TMP "/key1.bin";
        const char *key2 = TMP "/key2.bin";
        write_text(manifest, "ba7816bf...  3  abc.txt\n");
        write_text(key1, "correct-horse-battery-staple-key-one");
        write_text(key2, "a-completely-different-key");

        CHECK_EQ_INT(seal(manifest, key1), 0);
        CHECK_EQ_INT(verify_seal(manifest, key1), 0);             /* untouched: valid */
        CHECK_EQ_INT(verify_seal(manifest, key2), 1);              /* wrong key: invalid */

        write_text(manifest, "ba7816bf...  3  abc.txt   -- TAMPERED --\n");
        CHECK_EQ_INT(verify_seal(manifest, key1), 1);              /* content changed after sealing */

        remove(TMP "/manifest.txt.hmac");
        CHECK_EQ_INT(verify_seal(manifest, key1), 1);              /* no .hmac file at all */
    }
    {
        /* compute_hmac() itself: a missing key file is reported, not silently accepted. */
        unsigned char mac[32];
        write_text(TMP "/only_manifest.txt", "data");
        CHECK_EQ_INT(compute_hmac(TMP "/only_manifest.txt", TMP "/no-such-key.bin", mac), -1);
    }

    TEST_SUMMARY();
}
