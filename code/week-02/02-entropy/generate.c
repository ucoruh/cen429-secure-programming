/*
 * CEN429 — Week 2 — Demo 2: sample file generator for the entropy demo
 *
 * Usage: ./bin/.../generate <folder>
 *
 * Every sample is generated in this folder, IDENTICALLY on both platforms (no
 * external gzip/openssl/objcopy needed):
 *   uniform.txt   4096 bytes of 'A' (entropy ~0)
 *   document.txt  plain text (entropy ~4-5)
 *   code.bin      machine-code-like, medium-entropy synthetic data (~6)
 *   encrypted.bin document.txt encrypted with AES-256-GCM (~8)
 *   random.bin    high-entropy data from a fixed-seed generator (~8)
 *   mixed.bin     text + an encrypted section + text (for windowed scanning)
 *
 * The encryption key/nonce are fixed for the demo; they are NOT a secret value
 * and protect no real data. The only goal is to show that "the same content
 * jumps in entropy once it's encrypted."
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cen429_demo.h"
#include "cen429_crypto.h"

/* Fixed-seed xorshift: the same output on every platform and every run */
static uint32_t rng_state = 0x1234abcdu;
static unsigned char rng_byte(void)
{
    rng_state ^= rng_state << 13;
    rng_state ^= rng_state >> 17;
    rng_state ^= rng_state << 5;
    return (unsigned char)(rng_state & 0xffu);
}

static void write_file(const char *folder, const char *name, const void *v, size_t n)
{
    char path[512];
    snprintf(path, sizeof path, "%s/%s", folder, name);
    FILE *f = fopen(path, "wb");
    if (!f) {
        perror(path);
        return;
    }
    fwrite(v, 1, n, f);
    fclose(f);
}

/* Plain text: from a short alphabet, repetitive (low entropy) */
static size_t generate_text(unsigned char *b, size_t cap)
{
    size_t n = 0;
    for (int i = 1; i <= 48 && n < cap - 80; i++)
        n += (size_t)snprintf((char *)b + n, cap - n,
                              "line %02d: this is a plain text sample, "
                              "few distinct letters repeat often.\n", i);
    return n;
}

int main(int argc, char **argv)
{
    demo_prepare();
    if (argc != 2) {
        fprintf(stderr, "usage: %s <folder>\n", argv[0]);
        return 2;
    }
    const char *dir = argv[1];
    static unsigned char text[4096];
    size_t tn = generate_text(text, sizeof text);

    /* uniform.txt */
    static unsigned char uniform[4096];
    memset(uniform, 'A', sizeof uniform);
    write_file(dir, "uniform.txt", uniform, sizeof uniform);

    /* document.txt */
    write_file(dir, "document.txt", text, tn);

    /* code.bin: most bytes squeezed into a 6-bit range, occasionally a full
       byte -> imitates a compiled program's typical ~6 bit/byte entropy */
    static unsigned char code[2048];
    for (size_t i = 0; i < sizeof code; i++) {
        unsigned char r = rng_byte();
        code[i] = (r & 0x07u) == 0 ? r : (unsigned char)(r & 0x3fu);
    }
    write_file(dir, "code.bin", code, sizeof code);

    /* encrypted.bin: document.txt encrypted with AES-256-GCM (a fixed demo key) */
    static const unsigned char key[32] = {
        0x2b, 0x7e, 0x15, 0x16, 0x28, 0xae, 0xd2, 0xa6,
        0xab, 0xf7, 0x15, 0x88, 0x09, 0xcf, 0x4f, 0x3c,
        0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88,
        0x99, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff, 0x00
    };
    static const unsigned char nonce[12] = {
        0x00, 0x01, 0x02, 0x03, 0x04, 0x05,
        0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b
    };
    static unsigned char encrypted[4096 + 16];
    unsigned char tag[16];
    if (crypto_gcm_encrypt(key, nonce, sizeof nonce, NULL, 0, text, tn,
                           encrypted, tag)) {
        memcpy(encrypted + tn, tag, 16);
        write_file(dir, "encrypted.bin", encrypted, tn + 16);
    } else {
        fprintf(stderr, "encryption failed (crypto library?)\n");
    }

    /* random.bin: high-entropy synthetic data */
    static unsigned char random_data[4096];
    for (size_t i = 0; i < sizeof random_data; i++)
        random_data[i] = rng_byte();
    write_file(dir, "random.bin", random_data, sizeof random_data);

    /* mixed.bin: 1536 text + 1536 encrypted + 1536 text */
    static unsigned char mixed[4608];
    size_t p = 0;
    memcpy(mixed + p, text, 1536); p += 1536;
    memcpy(mixed + p, encrypted, 1536); p += 1536;
    memcpy(mixed + p, text + 1536, 1536); p += 1536;
    write_file(dir, "mixed.bin", mixed, p);

    printf("  6 sample files generated under %s/\n", dir);
    return 0;
}
