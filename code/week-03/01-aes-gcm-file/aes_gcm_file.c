/*
 * CEN429 - Week 3 - Demo 1: file encryption with AES-256-GCM (AEAD)
 *
 * AES-GCM provides both CONFIDENTIALITY (encryption) and INTEGRITY+AUTHENTICITY
 * (the tag); that is why it is called "authenticated encryption" (AEAD).
 *
 * File format (all in one file, in order):
 *   [12-byte nonce] [ciphertext ...] [16-byte tag]
 *
 * The key is read from a 32-byte binary "key.bin" file.
 * Usage:
 *   aes_gcm_file encrypt <key> <input> <output>
 *   aes_gcm_file decrypt <key> <input> <output>
 *
 * On decryption the tag is verified: if even a single bit of the ciphertext
 * or the tag has changed, decryption is REJECTED (exit code 2).
 *
 * The crypto comes through the shared header cen429_crypto.h: OpenSSL EVP on
 * Linux, BCrypt CNG on Windows. The same source compiles on both platforms.
 */
#include "cen429_demo.h"
#include "cen429_crypto.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define NONCE_LEN 12
#define TAG_LEN 16
#define KEY_LEN 32

static void fail(const char *m)
{
    fprintf(stderr, "ERROR: %s\n", m);
    exit(1);
}

static unsigned char *read_file(const char *path, long *len)
{
    FILE *f = fopen(path, "rb");
    if (!f)
        fail("could not open the file");
    fseek(f, 0, SEEK_END);
    long n = ftell(f);
    fseek(f, 0, SEEK_SET);
    unsigned char *b = (unsigned char *)malloc(n > 0 ? (size_t)n : 1);
    if (!b)
        fail("out of memory");
    if (n > 0 && fread(b, 1, (size_t)n, f) != (size_t)n)
        fail("could not read the file");
    fclose(f);
    *len = n;
    return b;
}

static void write_file(const char *path, const unsigned char *b, long n)
{
    FILE *f = fopen(path, "wb");
    if (!f)
        fail("could not open the output file");
    if (n > 0 && fwrite(b, 1, (size_t)n, f) != (size_t)n)
        fail("could not write the output");
    fclose(f);
}

static int encrypt_file(const unsigned char *key, const char *input,
                        const char *output)
{
    long plain_len;
    unsigned char *plain = read_file(input, &plain_len);

    unsigned char nonce[NONCE_LEN];
    if (!crypto_random(nonce, NONCE_LEN))
        fail("could not generate the nonce");

    unsigned char *out = (unsigned char *)malloc((size_t)plain_len
                                                 + NONCE_LEN + TAG_LEN);
    if (!out)
        fail("out of memory");
    memcpy(out, nonce, NONCE_LEN);

    unsigned char tag[TAG_LEN];
    if (!crypto_gcm_encrypt(key, nonce, NONCE_LEN, NULL, 0, plain,
                            (size_t)plain_len, out + NONCE_LEN, tag))
        fail("encryption failed");
    memcpy(out + NONCE_LEN + plain_len, tag, TAG_LEN);

    write_file(output, out, plain_len + NONCE_LEN + TAG_LEN);
    printf("Encrypted: %s -> %s (%ld bytes of ciphertext + 12 nonce + "
           "16 tag)\n", input, output, plain_len);

    free(plain);
    free(out);
    return 0;
}

static int decrypt_file(const unsigned char *key, const char *input,
                        const char *output)
{
    long len;
    unsigned char *data = read_file(input, &len);
    if (len < NONCE_LEN + TAG_LEN)
        fail("file too short (no room for a nonce + tag)");

    unsigned char *nonce = data;
    long ct_len = len - NONCE_LEN - TAG_LEN;
    unsigned char *ct = data + NONCE_LEN;
    unsigned char *tag = data + NONCE_LEN + ct_len;

    unsigned char *plain = (unsigned char *)malloc(ct_len > 0
                                                 ? (size_t)ct_len : 1);
    if (!plain)
        fail("out of memory");

    int ok = crypto_gcm_decrypt(key, nonce, NONCE_LEN, NULL, 0, ct,
                            (size_t)ct_len, tag, plain);
    if (!ok) {
        fprintf(stderr, "VERIFICATION FAILED: the tag did not match, the "
                "data was tampered with, or the key is wrong. Decryption "
                "REJECTED.\n");
        free(data);
        free(plain);
        return 2;
    }
    write_file(output, plain, ct_len);
    printf("Decrypted and VERIFIED: %s -> %s (%ld bytes)\n", input, output,
           ct_len);

    free(data);
    free(plain);
    return 0;
}

int main(int argc, char **argv)
{
    demo_prepare();
    if (argc != 5) {
        fprintf(stderr, "Usage: %s <encrypt|decrypt> <key.bin (32-byte "
                "file)> <input> <output>\n", argv[0]);
        return 1;
    }
    long key_read_len;
    unsigned char *key = read_file(argv[2], &key_read_len);
    if (key_read_len != KEY_LEN)
        fail("the key file must be exactly 32 bytes");

    int r;
    if (strcmp(argv[1], "encrypt") == 0)
        r = encrypt_file(key, argv[3], argv[4]);
    else if (strcmp(argv[1], "decrypt") == 0)
        r = decrypt_file(key, argv[3], argv[4]);
    else {
        fprintf(stderr, "Unknown command: %s\n", argv[1]);
        r = 1;
    }
    free(key);
    return r;
}
