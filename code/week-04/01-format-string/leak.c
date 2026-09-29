/*
 * CEN429 - Week 4 - Demo 1: format string vulnerability (VULNERABLE VERSION)
 *
 * The program hands the user's text directly to printf as its FORMAT argument:
 * printf(user_text). That is the same as asking the user "what should printf
 * write?" If the user types a format specifier (%x, %p, %n, %s ...):
 *   - %x / %p : READS a value off the stack   -> information leak
 *   - %n      : WRITES to memory              -> crash / code execution
 *
 * The program's own "secret" value (secret_value) sits on the stack, near the
 * format buffer; enough %x specifiers dump it to the screen.
 *
 * ETHICS/SAFETY: every attack stays inside this program's own memory. Steps
 * that could crash are bounded on Linux with prlimit+timeout, on Windows with
 * demo_prepare(); no system setting changes, no administrator privileges needed.
 */
#include <stdio.h>
#include <string.h>
#include "cen429_demo.h"

int main(int argc, char **argv)
{
    demo_prepare();
    if (argc != 2) {
        fprintf(stderr, "Usage: %s <text>\n", argv[0]);
        return 1;
    }

    /* The program's "secret" value, which must never leak. On the stack, it
       sits next to the format buffer below. */
    volatile unsigned secret_value = 0x5ECE7u;   /* 388327 */
    char buffer[64];
    snprintf(buffer, sizeof(buffer), "%s", argv[1]);

    printf("Secret value in memory: 0x%05x (should NOT appear on screen)\n",
           secret_value);
    printf("Program output -> ");
    printf(buffer);            /* BUG: format string is under user control */
    printf("\n");
    return 0;
}
