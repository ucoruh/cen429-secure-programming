/*
 * CEN429 — Week 2 — Demo 1: generates harmless sample files
 *
 * Usage: bin/linux/generate_samples <folder>
 *
 * NONE of the generated files are executable; they contain only plain text or
 * a scrambled version of that text. Files:
 *   clean.txt          an ordinary text file
 *   sample_a.bin       a plain-body capsule ("captured sample")
 *   sample_a_1byte.bin the same file, with a single byte of the body different
 *   poly_1.bin         same body, with the xs32 decoder, seed 1
 *   poly_2.bin         same body, with the xs32 decoder, seed 2
 *   poly_3.bin         same body, with a CHANGED decoder (lcg8 + a junk command)
 *   archive.bin        NOT a capsule, a harmless high-entropy file
 *                      (to illustrate the heuristic method's false positive)
 *
 * The seeds are fixed, so the output is identical on every computer. Real
 * polymorphic engines pick a random key for every copy.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cen429_demo.h"
#include "capsule.h"

#define BODY_MAX 8192

/* The capsule's body: 64 lines of harmless text; line 24 carries a "marker". */
static size_t build_body(unsigned char *b, size_t cap)
{
    size_t n = 0;
    for (int i = 1; i <= 64; i++) {
        char line[128];
        int m;
        if (i == 24)
            m = snprintf(line, sizeof line,
                         "line %02d | marker: BLUE-CAT-42 | "
                         "this body is harmless text\n", i);
        else
            m = snprintf(line, sizeof line,
                         "line %02d | CEN429 course sample, capsule body, "
                         "value=%05d\n", i, (i * 7919) % 100000);
        if (m < 0 || (size_t)m >= sizeof line || n + (size_t)m > cap)
            break;
        memcpy(b + n, line, (size_t)m);
        n += (size_t)m;
    }
    return n;
}

static int write_file(const char *folder, const char *name, const char *header2,
                      const unsigned char *body, size_t n)
{
    char path[512];
    snprintf(path, sizeof path, "%s/%s", folder, name);
    FILE *f = fopen(path, "wb");
    if (!f) {
        perror(path);
        return -1;
    }
    fputs(CAPSULE_MAGIC, f);
    fputs(header2, f);
    fwrite(body, 1, n, f);
    return fclose(f);
}

static int write_clean(const char *folder)
{
    char path[512];
    snprintf(path, sizeof path, "%s/clean.txt", folder);
    FILE *f = fopen(path, "wb");     /* binary mode: identical bytes on both platforms */
    if (!f) {
        perror(path);
        return -1;
    }
    fputs("Weekly lecture plan\n", f);
    for (int h = 1; h <= 16; h++)
        fprintf(f, "Week %2d: topic title, reading list, %d pages\n",
                h, 10 + (h * 13) % 40);
    return fclose(f);
}

/* Content that imitates a compressed/encrypted file — high entropy, but
   completely harmless (fixed-seed xorshift -> identical on every run).
   It is NOT a capsule; it illustrates the heuristic method's false positive. */
static int write_archive(const char *folder, size_t n)
{
    char path[512];
    snprintf(path, sizeof path, "%s/archive.bin", folder);
    FILE *f = fopen(path, "wb");
    if (!f) {
        perror(path);
        return -1;
    }
    uint32_t s = 0xc0ffee11u;
    for (size_t i = 0; i < n; i++) {
        s ^= s << 13;
        s ^= s >> 17;
        s ^= s << 5;
        fputc((int)(s & 0xffu), f);
    }
    return fclose(f);
}

int main(int argc, char **argv)
{
    demo_prepare();
    if (argc != 2) {
        fprintf(stderr, "usage: %s <folder>\n", argv[0]);
        return 2;
    }
    const char *dir = argv[1];
    unsigned char plain[BODY_MAX], tmp[BODY_MAX];
    size_t n = build_body(plain, sizeof plain);
    char header[160];

    if (write_clean(dir) != 0)
        return 1;

    /* 1) Captured sample: plain body */
    snprintf(header, sizeof header, "BODY LEN=%zu\n", n);
    write_file(dir, "sample_a.bin", header, plain, n);

    /* 2) A copy with a single byte different ("line 01" -> "line 00") */
    memcpy(tmp, plain, n);
    tmp[7] ^= 0x01;
    write_file(dir, "sample_a_1byte.bin", header, tmp, n);

    /* 3) Polymorphic copies: same body, different key */
    const uint32_t seeds[2] = { 0x1a2b3c4du, 0x99c0ffeeu };
    for (int i = 0; i < 2; i++) {
        char name[32];
        memcpy(tmp, plain, n);
        xs32_apply(tmp, n, seeds[i]);
        snprintf(header, sizeof header,
                 "DECODER: ALGO=xs32 SEED=%08x LEN=%zu DECODE\n",
                 (unsigned)seeds[i], n);
        snprintf(name, sizeof name, "poly_%d.bin", i + 1);
        write_file(dir, name, header, tmp, n);
    }

    /* 4) A copy whose decoder also changed: a different algorithm, order, and junk commands */
    memcpy(tmp, plain, n);
    lcg8_apply(tmp, n, 0x5eed1234u, 1);
    snprintf(header, sizeof header,
             "NOP LEN=%zu NOP NOP SEED=%08x ALGO=lcg8 NOP DECODE\n",
             n, 0x5eed1234u);
    write_file(dir, "poly_3.bin", header, tmp, n);

    /* 5) Not a capsule, a harmless high-entropy file */
    write_archive(dir, 1600);

    printf("  7 sample files generated under %s/ (body %zu bytes)\n", dir, n);
    return 0;
}
