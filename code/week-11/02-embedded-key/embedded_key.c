/*
 * CEN429 - Week 11 - Demo 2: an embedded key sits PHYSICALLY in the binary.
 * "Embedding the key in the software" (the naive fix) is not protection: the program scans its
 * own binary file and finds the embedded (synthetic) key -> the key can be extracted.
 *
 * LESSON: a white-box attacker performs the exact same scan. A key that lives in software cannot
 *         be hidden without whitebox techniques (Demo 1) or hardware (TEE/HSM).
 * SAFE: the key is SYNTHETIC; the program only reads its OWN file; no network/system operation.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* Naive embedded (synthetic) key. NOT a real secret; a recognizable pattern. */
static const unsigned char KEY[16] = {
    0xC3, 0x9A, 0x71, 0x2E, 0x55, 0xF0, 0x18, 0xBD,
    0x4C, 0xA6, 0x37, 0xE9, 0x02, 0x8F, 0xD1, 0x64
};

/* Simple byte-array search (instead of memmem, for portability). Returns the offset of the first
   match, or -1 if the needle does not occur (including the degenerate empty-needle case). */
static long search_bytes(const unsigned char *haystack, long hn, const unsigned char *needle, long nn)
{
    if (nn <= 0 || hn < nn) return -1;
    for (long p = 0; p + nn <= hn; p++)
        if (memcmp(haystack + p, needle, (size_t)nn) == 0) return p;
    return -1;
}

/* Pure helper (kept separate from pseudo_use() so it can be unit-tested on its own). */
static unsigned key_checksum(void)
{
    unsigned s = 0;
    for (int i = 0; i < 16; i++) s = (s + KEY[i]) & 0xFF;
    return s;
}

static void pseudo_use(void)
{
    /* Pretend to use the key, so the compiler does not discard it. */
    printf("Pseudo-operation done (key checksum = 0x%02X).\n", key_checksum());
}

int main(int argc, char **argv)
{
    if (argc < 2 || strcmp(argv[1], "--scan") != 0) {
        pseudo_use();
        printf("To search the binary file for the key:  %s --scan\n", argv[0]);
        return 0;
    }

    /* Open our own binary file and search for the embedded key. */
    FILE *f = fopen(argv[0], "rb");
    char path[1024];
    if (!f) { snprintf(path, sizeof path, "%s.exe", argv[0]); f = fopen(path, "rb"); }
    if (!f) { fprintf(stderr, "Could not open binary: %s\n", argv[0]); return 2; }

    fseek(f, 0, SEEK_END); long n = ftell(f); fseek(f, 0, SEEK_SET);
    if (n <= 0 || n > 64L * 1024 * 1024) { fclose(f); return 2; }
    unsigned char *buf = malloc((size_t)n);
    if (!buf) { fclose(f); return 2; }
    if (fread(buf, 1, (size_t)n, f) != (size_t)n) { free(buf); fclose(f); return 2; }
    fclose(f);

    long off = search_bytes(buf, n, KEY, 16);
    if (off >= 0) {
        printf("LEAKED: the 16-byte embedded key was found in the binary at offset 0x%lX:\n  ", off);
        for (int i = 0; i < 16; i++) printf("%02X ", buf[off + i]);
        printf("\n-> A white-box attacker performs the exact same scan. A key in software is not protected.\n");
    } else {
        printf("Key not found (unexpected).\n");
    }
    free(buf);
    return 0;
}
