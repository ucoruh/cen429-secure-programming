/*
 * CEN429 - Week 12 - Demo 1: System under test (SUT).
 * Two small security functions; the unit tests below verify them.
 * SAFE: pure computation; no file/network/system access.
 */
#include <string.h>
#include "system_under_test.h"

/* Whitelist input validation: only letters/digits/underscore, length 1..32. */
int validate_input(const char *s)
{
    size_t n = strlen(s);
    if (n == 0 || n > 32) return 0;
    for (size_t i = 0; i < n; i++) {
        char c = s[i];
        int ok = (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') ||
                 (c >= '0' && c <= '9') || c == '_';
        if (!ok) return 0;
    }
    return 1;
}

/* Overflow-safe addition that catches integer overflow BEFORE it happens (INT32-C). */
int safe_add(int a, int b, int *result)
{
#if defined(__GNUC__) || defined(__clang__)
    return !__builtin_add_overflow(a, b, result);   /* returns 0 if it would overflow */
#else
    if ((b > 0 && a > 2147483647 - b) || (b < 0 && a < (-2147483647 - 1) - b)) return 0;
    *result = a + b; return 1;
#endif
}
