/*
 * CEN429 - Week 4 - Demo 1: format string vulnerability (SECURE VERSION)
 *
 * The fix is tiny but critical: user data must NEVER be the format argument.
 * We use a constant format ("%s") and pass the data as an ARGUMENT instead.
 * That way any %x / %n the user types is printed as ordinary text; nothing is
 * read from or written to memory because of it.
 *
 * The input length is also validated (defensive programming).
 */
#include <stdio.h>
#include <string.h>
#include "cen429_demo.h"

/* The destination buffer used to be 64 bytes in the vulnerable version; here we no longer copy
   into a fixed buffer at all (printf("%s", argv[1]) reads argv[1] directly), but we still cap the
   length so a demo run's output stays readable. Pure and bounded: safe to unit-test in-process. */
static int text_length_ok(const char *s)
{
    return strlen(s) < 64;
}

int main(int argc, char **argv)
{
    demo_prepare();
    if (argc != 2) {
        fprintf(stderr, "Usage: %s <text>\n", argv[0]);
        return 1;
    }
    if (!text_length_ok(argv[1])) {
        fprintf(stderr, "Rejected: text too long (63 characters max).\n");
        return 1;
    }

    volatile unsigned secret_value = 0x5ECE7u;
    printf("Secret value in memory: 0x%05x (should NOT appear on screen)\n",
           secret_value);
    printf("Program output -> ");
    printf("%s", argv[1]);     /* CORRECT: constant format, data is the argument */
    printf("\n");
    return 0;
}
