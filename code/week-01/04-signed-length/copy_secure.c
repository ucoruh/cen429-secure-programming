/*
 * CEN429 — Week 1 — Demo 4: Signed length error (SECURE VERSION)
 *
 * Fixes:
 *  1) The length is read from text with strtol; input that is not a number, that
 *     overflows, or that has leftover characters is rejected (atoi silently turns
 *     errors into 0).
 *  2) The length is checked against both a lower and an upper bound, and is only
 *     passed to the memory function as a size_t after that check.
 */
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cen429_demo.h"

#define RECORD_SIZE 16

static int read_length(const char *text, size_t *result)
{
    char *end;
    errno = 0;
    long value = strtol(text, &end, 10);
    if (errno != 0 || end == text || *end != '\0')
        return -1;                       /* not a number, or it overflowed */
    if (value < 0 || value > RECORD_SIZE)
        return -1;                       /* out of range */
    *result = (size_t)value;
    return 0;
}

int main(int argc, char **argv)
{
    demo_prepare();
    if (argc != 2) {
        fprintf(stderr, "Usage: %s <length>\n", argv[0]);
        return 1;
    }
    size_t length;
    if (read_length(argv[1], &length) != 0) {
        printf("Rejected: length must be an integer between 0 and %d.\n", RECORD_SIZE);
        return 1;
    }
    char source[RECORD_SIZE] = "SAMPLE-RECORD-1";
    char dest[RECORD_SIZE]   = { 0 };
    memcpy(dest, source, length);
    printf("Copied (%zu bytes): %.*s\n", length, (int)length, dest);
    return 0;
}
