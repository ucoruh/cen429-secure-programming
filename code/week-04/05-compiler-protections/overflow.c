/*
 * CEN429 - Week 4 - Demo 5: compiler and operating-system protections.
 *
 * The same overflow bug (unbounded strcpy into a 64-byte local buffer) is built two different ways:
 *   weak     : protections OFF (no canary, no PIE/ASLR, no RELRO)
 *   hardened : protections ON  (stack canary, _FORTIFY, PIE/ASLR, RELRO, CFG)
 *
 * When a long input overflows the buffer:
 *   - in the hardened build the STACK CANARY is corrupted and the program stops safely:
 *     Linux "*** stack smashing detected ***", Windows 0xC0000409.
 *   - in the weak build the same overflow either silently corrupts something or crashes later.
 *
 * ETHICS: the overflow only ever stays on this program's own stack; it is bounded on Linux with
 * prlimit+timeout, on Windows with demo_prepare().
 */
#include <stdio.h>
#include <string.h>
#include "cen429_demo.h"

static void copy_in(const char *input)
{
    char buffer[64];
    strcpy(buffer, input);            /* BUG: destination size is never checked */
    printf("Copied (first bytes): %.16s\n", buffer);
}

int main(int argc, char **argv)
{
    demo_prepare();
    if (argc != 2) {
        fprintf(stderr, "Usage: %s <text>\n", argv[0]);
        return 1;
    }
    copy_in(argv[1]);
    printf("Function returned normally (canary not corrupted).\n");
    return 0;
}
