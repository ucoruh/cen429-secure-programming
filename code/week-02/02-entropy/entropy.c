/*
 * CEN429 — Week 2 — Demo 2: entropy meter
 *
 * Usage: bin/linux/entropy file...           (one line per file)
 *        bin/linux/entropy -p <bytes> file   (splitting the file into windows)
 *
 * Shannon entropy measures how "mixed up" the byte values in a piece of data
 * are:
 *
 *      H = - sum( p(b) * log2 p(b) ),   b = 0..255
 *
 * H = 0    : every byte is the same (e.g. "AAAA...")
 * H ~ 4-5  : plain text, source code (few distinct letters, frequent repeats)
 * H ~ 5-7  : a compiled program, mixed binary data
 * H ~ 8    : encrypted, compressed, or random data
 *
 * Antivirus and EDR products use this measurement as a sign of
 * "packed/encrypted code" and of "a process rapidly encrypting its files"
 * (ransomware). The program only reads; it never modifies any file.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include "cen429_demo.h"

#define MAX_SIZE (16 * 1024 * 1024)

static double entropy(const unsigned char *v, size_t n)
{
    size_t count[256] = { 0 };
    if (n == 0)
        return 0.0;
    for (size_t i = 0; i < n; i++)
        count[v[i]]++;
    double h = 0.0;
    for (int b = 0; b < 256; b++) {
        if (count[b] == 0)
            continue;
        double p = (double)count[b] / (double)n;
        h -= p * log2(p);
    }
    return h;
}

/* Entropy alone doesn't say "what" the data is; it is only a clue. */
static const char *interpret(double h)
{
    if (h < 1.0)
        return "uniform";
    if (h < 5.5)
        return "low";
    if (h < 7.2)
        return "medium";
    return "HIGH";
}

/* Turns the 0..8 bit range into a bar `width` characters wide */
static void bar(double h, char *out, int width)
{
    int filled = (int)(h / 8.0 * width + 0.5);
    for (int i = 0; i < width; i++)
        out[i] = i < filled ? '#' : '.';
    out[width] = '\0';
}

static unsigned char *read_file(const char *path, size_t *len)
{
    FILE *f = fopen(path, "rb");
    if (!f) {
        perror(path);
        return NULL;
    }
    unsigned char *v = malloc(MAX_SIZE);
    size_t n = v ? fread(v, 1, MAX_SIZE, f) : 0;
    fclose(f);
    *len = n;
    return v;
}

static const char *short_name(const char *path)
{
    const char *s1 = strrchr(path, '/');
    const char *s2 = strrchr(path, '\\');
    const char *s = s1 > s2 ? s1 : s2;
    return s ? s + 1 : path;
}

int main(int argc, char **argv)
{
    demo_prepare();
    size_t window = 0;
    int first = 1;
    if (argc >= 3 && strcmp(argv[1], "-p") == 0) {
        char *end;
        unsigned long p = strtoul(argv[2], &end, 10);
        if (*end != '\0' || p < 64 || p > 1048576) {
            fprintf(stderr, "window must be between 64 and 1048576 bytes\n");
            return 2;
        }
        window = (size_t)p;
        first = 3;
    }
    if (first >= argc) {
        fprintf(stderr, "usage: %s [-p window] file...\n", argv[0]);
        return 2;
    }
    char b[40];
    for (int i = first; i < argc; i++) {
        size_t n = 0;
        unsigned char *v = read_file(argv[i], &n);
        if (!v)
            continue;
        if (window == 0) {
            double h = entropy(v, n);
            bar(h, b, 24);
            printf("  %-14.14s %6zu %5.2f |%s| %s\n", short_name(argv[i]), n, h,
                   b, interpret(h));
        } else {
            printf("  %s (%zu bytes), window %zu bytes:\n", short_name(argv[i]),
                   n, window);
            for (size_t o = 0; o < n; o += window) {
                size_t m = n - o < window ? n - o : window;
                double h = entropy(v + o, m);
                bar(h, b, 32);
                printf("  %6zu-%6zu %5.2f |%s| %s\n", o, o + m - 1, h, b,
                       interpret(h));
            }
        }
        free(v);
    }
    return 0;
}
