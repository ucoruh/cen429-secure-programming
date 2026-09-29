/*
 * CEN429 - Week 4 - Demo 3: undefined behavior (VULNERABLE)
 *
 * Some C operations are "undefined behavior": the compiler ASSUMES they NEVER HAPPEN and
 * optimizes accordingly. On x86 most of them cause no visible hardware fault, so the program
 * "looks like it works" — but the result is wrong, and the behavior can change with a new
 * compiler version. UndefinedBehaviorSanitizer (UBSan) catches these AT RUN TIME.
 *
 * Mode:
 *   overflow : signed integer overflow (INT_MAX + 1)        -> CWE-190
 *   shift    : invalid bit shift (1 << 31 / >= width)        -> CWE-190/CWE-758
 *   unaligned: misaligned memory access                      -> CWE-758
 */
#include <limits.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cen429_demo.h"

static int mode_overflow(int add)
{
    int x = INT_MAX;
    int y = x + add;             /* UB: signed integer overflow */
    printf("   INT_MAX + %d = %d  (mathematically it should be %lld)\n",
           add, y, (long long)INT_MAX + add);
    return 0;
}

static int mode_shift(int n)
{
    int x = 1;
    int y = x << n;               /* UB: if n>=31 it does not fit in an int / undefined */
    printf("   1 << %d = %d\n", n, y);
    return 0;
}

static int mode_unaligned(void)
{
    /* Reading a 4-byte int from an address shifted by 1 byte: misaligned access */
    unsigned char buffer[8] = { 1, 2, 3, 4, 5, 6, 7, 8 };
    int *p = (int *)(buffer + 1);   /* UB: violates alignment requirements */
    printf("   int read from a misaligned address = %d\n", *p);
    return 0;
}

int main(int argc, char **argv)
{
    demo_prepare();
    const char *mode = (argc >= 2) ? argv[1] : "overflow";
    if (strcmp(mode, "overflow") == 0)   return mode_overflow(argc >= 3 ? atoi(argv[2]) : 1);
    if (strcmp(mode, "shift") == 0)      return mode_shift(argc >= 3 ? atoi(argv[2]) : 31);
    if (strcmp(mode, "unaligned") == 0)  return mode_unaligned();
    fprintf(stderr, "Usage: %s <overflow|shift|unaligned> [number]\n", argv[0]);
    return 2;
}
