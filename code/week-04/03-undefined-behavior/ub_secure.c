/*
 * CEN429 - Week 4 - Demo 3: undefined behavior (SECURE VERSION)
 *
 * We check every operation EXPLICITLY, BEFORE it runs (SEI CERT C: INT32-C prevent overflow,
 * INT34-C do not perform an invalid shift, EXP36-C do not generate a misaligned pointer). The
 * overflow check uses the compiler builtin (GCC/Clang) where available so it stays portable, and
 * a hand-written check otherwise (MSVC). Instead of a misaligned access, we use memcpy: the
 * compiler turns it into an aligned access, and there is no UB.
 */
#include <limits.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cen429_demo.h"

/* Portable checked signed addition. Returns 1 on success, 0 on overflow. */
static int checked_add(int a, int b, int *result)
{
#if defined(__GNUC__) || defined(__clang__)
    return __builtin_add_overflow(a, b, result) ? 0 : 1;
#else
    if ((b > 0 && a > INT_MAX - b) || (b < 0 && a < INT_MIN - b))
        return 0;
    *result = a + b;
    return 1;
#endif
}

static int mode_overflow(int add)
{
    int y;
    if (!checked_add(INT_MAX, add, &y)) {
        printf("   Rejected: INT_MAX + %d overflows (operation not performed).\n", add);
        return 0;
    }
    printf("   INT_MAX + %d = %d\n", add, y);
    return 0;
}

static int mode_shift(int n)
{
    if (n < 0 || n >= 31) {         /* 0..30 is safe for a 32-bit int */
        printf("   Rejected: %d is outside the valid shift range (0-30).\n", n);
        return 0;
    }
    int y = 1 << n;
    printf("   1 << %d = %d\n", n, y);
    return 0;
}

static int mode_unaligned(void)
{
    unsigned char buffer[8] = { 1, 2, 3, 4, 5, 6, 7, 8 };
    int value;
    memcpy(&value, buffer + 1, sizeof value);  /* no alignment issue */
    printf("   int safely read with memcpy = %d\n", value);
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
