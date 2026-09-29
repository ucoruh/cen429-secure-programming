/* Unit tests for week-03/01-aes-gcm-file/aes_gcm_file.c.
 *
 * encrypt_file()/decrypt_file()/read_file()/write_file() are all safe to call in-process (none of
 * them can corrupt the test binary itself); the two `fail()` paths that call exit() (wrong key
 * length, truncated file) are intentionally NOT exercised here — they are covered by the
 * end-to-end CTest entries instead, which run the real compiled binary as a separate process.
 *
 * tests/fixtures/secret.enc was produced by a DIFFERENT implementation (Python's `cryptography`
 * library, AES-256-GCM) with the same key and a fixed nonce, encrypting tests/fixtures/plain.txt.
 * Decrypting it here with our own crypto_gcm_decrypt (OpenSSL EVP / BCrypt CNG) and getting back
 * the exact original bytes is an interoperability check that is genuinely independent of this
 * program's own encrypt_file() — a bug in our nonce/tag placement or in the platform crypto call
 * would make this fail even though a pure round trip through our own encrypt_file() might still
 * accidentally pass.
 */
#define main program_main
#include "../aes_gcm_file.c"
#undef main
#include "../../../common/test_check.h"

#ifdef _WIN32
#include <direct.h>
#else
#include <sys/stat.h>
#endif

static void ensure_bin_dir(void)
{
#ifdef _WIN32
    _mkdir("bin");
#else
    mkdir("bin", 0755);
#endif
}

/* Encrypts `plain` (plain_len bytes) to a temp file, decrypts it back, and checks the round trip
 * matches byte-for-byte. Returns 1 on success (used to keep the CHECK count meaningful even
 * though several byte comparisons happen inside one round trip). */
static int roundtrip_ok(const char *tag, const unsigned char *plain, long plain_len)
{
    char ct_path[128], pt_path[128];
    snprintf(ct_path, sizeof(ct_path), "bin/rt-%s.enc", tag);
    snprintf(pt_path, sizeof(pt_path), "bin/rt-%s.dec", tag);

    long key_len;
    unsigned char *key = read_file("tests/fixtures/key32.bin", &key_len);
    if (key_len != KEY_LEN) { free(key); return 0; }

    /* encrypt_file/decrypt_file read their plaintext from a file, so write `plain` out first. */
    char src_path[128];
    snprintf(src_path, sizeof(src_path), "bin/rt-%s.src", tag);
    write_file(src_path, plain, plain_len);

    int enc_rc = encrypt_file(key, src_path, ct_path);
    if (enc_rc != 0) { free(key); return 0; }
    int dec_rc = decrypt_file(key, ct_path, pt_path);
    if (dec_rc != 0) { free(key); return 0; }

    long got_len;
    unsigned char *got = read_file(pt_path, &got_len);
    int ok = (got_len == plain_len) && (plain_len == 0 || memcmp(got, plain, (size_t)plain_len) == 0);
    free(got);
    free(key);
    return ok;
}

int main(void)
{
    ensure_bin_dir();

    /* --- read_file(): sanity on a known fixture -------------------------------------------- */
    long key_len;
    unsigned char *key = read_file("tests/fixtures/key32.bin", &key_len);
    CHECK_EQ_INT(key_len, 32);
    CHECK_EQ_INT(key[0], 0x00);
    CHECK_EQ_INT(key[31], 0x1f);

    /* --- round trips: empty, 1 byte, one block (16), just under/over a block, a normal size --- */
    CHECK(roundtrip_ok("empty", (const unsigned char *)"", 0));
    CHECK(roundtrip_ok("one", (const unsigned char *)"A", 1));
    CHECK(roundtrip_ok("fifteen", (const unsigned char *)"123456789012345", 15));
    CHECK(roundtrip_ok("sixteen", (const unsigned char *)"1234567890123456", 16));
    CHECK(roundtrip_ok("seventeen", (const unsigned char *)"12345678901234567", 17));
    {
        unsigned char big[500];
        for (int i = 0; i < 500; i++) big[i] = (unsigned char)(i * 7 + 3);
        CHECK(roundtrip_ok("big500", big, 500));
    }

    /* --- decrypting a fixture ciphertext produced by a DIFFERENT AES-GCM implementation ----- */
    {
        long plain_len;
        unsigned char *plain = read_file("tests/fixtures/plain.txt", &plain_len);
        CHECK_EQ_INT(plain_len, 54);
        int rc = decrypt_file(key, "tests/fixtures/secret.enc", "bin/cross-decrypted.txt");
        CHECK_EQ_INT(rc, 0);
        long got_len;
        unsigned char *got = read_file("bin/cross-decrypted.txt", &got_len);
        CHECK_EQ_INT(got_len, plain_len);
        CHECK_MEM(got, plain, (size_t)plain_len);
        free(got);
        free(plain);
    }

    /* --- tamper detection: fixtures with one flipped bit in the ciphertext / in the tag ----- */
    CHECK_EQ_INT(decrypt_file(key, "tests/fixtures/tampered_ct.enc", "bin/should-not-exist-1.txt"), 2);
    CHECK_EQ_INT(decrypt_file(key, "tests/fixtures/tampered_tag.enc", "bin/should-not-exist-2.txt"), 2);

    /* --- tamper detection on freshly, locally encrypted data (ciphertext byte, tag byte, nonce byte) */
    {
        const unsigned char msg[] = "attack begins at dawn, do not repeat this nonce";
        write_file("bin/tamper-src.bin", msg, (long)sizeof(msg) - 1);
        CHECK_EQ_INT(encrypt_file(key, "bin/tamper-src.bin", "bin/tamper.enc"), 0);
        long blob_len;
        unsigned char *blob = read_file("bin/tamper.enc", &blob_len);
        CHECK(blob_len > NONCE_LEN + TAG_LEN);

        unsigned char *bad_ct = (unsigned char *)malloc((size_t)blob_len);
        memcpy(bad_ct, blob, (size_t)blob_len);
        bad_ct[NONCE_LEN + 2] ^= 0x80;   /* flip a bit in the ciphertext */
        write_file("bin/tamper-ct.enc", bad_ct, blob_len);
        CHECK_EQ_INT(decrypt_file(key, "bin/tamper-ct.enc", "bin/tamper-ct.out"), 2);

        unsigned char *bad_tag = (unsigned char *)malloc((size_t)blob_len);
        memcpy(bad_tag, blob, (size_t)blob_len);
        bad_tag[blob_len - 1] ^= 0x01;   /* flip the tag's last byte */
        write_file("bin/tamper-tag.enc", bad_tag, blob_len);
        CHECK_EQ_INT(decrypt_file(key, "bin/tamper-tag.enc", "bin/tamper-tag.out"), 2);

        unsigned char *bad_nonce = (unsigned char *)malloc((size_t)blob_len);
        memcpy(bad_nonce, blob, (size_t)blob_len);
        bad_nonce[0] ^= 0x01;            /* flip the nonce's first byte */
        write_file("bin/tamper-nonce.enc", bad_nonce, blob_len);
        CHECK_EQ_INT(decrypt_file(key, "bin/tamper-nonce.enc", "bin/tamper-nonce.out"), 2);

        /* the untouched original must still decrypt correctly */
        CHECK_EQ_INT(decrypt_file(key, "bin/tamper.enc", "bin/tamper-ok.out"), 0);

        free(bad_ct);
        free(bad_tag);
        free(bad_nonce);
        free(blob);
    }

    /* --- nonce is randomized: encrypting the same plaintext twice gives different ciphertext -- */
    {
        const unsigned char msg[] = "same plaintext, different nonce each time";
        write_file("bin/rand-src.bin", msg, (long)sizeof(msg) - 1);
        CHECK_EQ_INT(encrypt_file(key, "bin/rand-src.bin", "bin/rand1.enc"), 0);
        CHECK_EQ_INT(encrypt_file(key, "bin/rand-src.bin", "bin/rand2.enc"), 0);
        long l1, l2;
        unsigned char *b1 = read_file("bin/rand1.enc", &l1);
        unsigned char *b2 = read_file("bin/rand2.enc", &l2);
        CHECK_EQ_INT(l1, l2);
        CHECK(memcmp(b1, b2, (size_t)l1) != 0);   /* nonce (and so the whole blob) must differ */
        free(b1);
        free(b2);
    }

    free(key);
    TEST_SUMMARY();
}
