/*
 * CEN429 - Week 4 - Demo 4: reproducer / replay.
 * Reads a file and hands its contents to the parser. Built with AddressSanitizer, so when we
 * replay a crashing input (one the fuzzer found, or a ready-made seed) it reports the bug at
 * the exact spot. We also use this on platforms without a fuzzer (e.g. WSL without clang) to
 * see the bug at all.
 */
#include <stdio.h>
#include <stdlib.h>
#include "parser.h"
#include "cen429_demo.h"

int main(int argc, char **argv)
{
    demo_prepare();
    if (argc != 2) {
        fprintf(stderr, "Usage: %s <input-file>\n", argv[0]);
        return 2;
    }
    FILE *f = fopen(argv[1], "rb");
    if (!f) { perror("fopen"); return 2; }
    fseek(f, 0, SEEK_END);
    long size = ftell(f);
    fseek(f, 0, SEEK_SET);
    if (size < 0) { fclose(f); return 2; }

    /* A heap buffer sized exactly to fit: an out-of-bounds read is caught by ASan. */
    unsigned char *data = (unsigned char *)malloc((size_t)size ? (size_t)size : 1);
    size_t read = fread(data, 1, (size_t)size, f);
    fclose(f);

    printf("Parsing input: %s (%zu bytes)...\n", argv[1], read);
    int result = parse_document(data, read);
    printf("Parse result: %d\n", result);

    free(data);
    return 0;
}
