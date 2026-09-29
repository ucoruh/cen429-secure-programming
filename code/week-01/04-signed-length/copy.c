/*
 * CEN429 — Week 1 — Demo 4: Signed length error (VULNERABLE VERSION)
 *
 * A "record length" field coming from a network packet or a file is read as an int,
 * and only its upper bound is checked. A negative length passes the check; since
 * memcpy's third parameter is size_t (unsigned), -1 turns into a huge number like
 * 18446744073709551615 and memory overflows.
 * (Cookbook R3.5: integer conversion and overflow.)
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cen429_demo.h"

#define RECORD_SIZE 16

static int copy_record(char *dest, const char *source, int length)
{
    if (length > RECORD_SIZE)          /* BUG: the lower bound (negative) is never checked */
        return -1;
    memcpy(dest, source, length);      /* int -> size_t: -1 -> 2^64 - 1 */
    return 0;
}

int main(int argc, char **argv)
{
    demo_prepare();
    if (argc != 2) {
        fprintf(stderr, "Usage: %s <length>\n", argv[0]);
        return 1;
    }
    int length = atoi(argv[1]);
    char source[RECORD_SIZE] = "SAMPLE-RECORD-1";
    char dest[RECORD_SIZE]   = { 0 };

    printf("Requested length: %d  ->  value passed to memcpy: %zu\n", length, (size_t)length);
    if (copy_record(dest, source, length) != 0) {
        printf("Rejected: length is too large.\n");
        return 1;
    }
    printf("Copied: %.*s\n", RECORD_SIZE, dest);
    return 0;
}
