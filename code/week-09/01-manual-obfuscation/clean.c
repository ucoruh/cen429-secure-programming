/*
 * CEN429 - Week 9 - Demo 1: CLEAN (unprotected) version.
 * One branch, one return: an easy target for a reverse engineer.
 */
#include <string.h>
#include "common.h"

/* Constant-time comparison (no early exit -> no timing side channel). */
static int constant_time_equals(const char *a, const char *b, unsigned n)
{
    unsigned diff = 0;
    for (unsigned i = 0; i < n; i++)
        diff |= (unsigned)((unsigned char)a[i] ^ (unsigned char)b[i]);
    return diff == 0;
}

int grant_access(const char *token)
{
    static const char VALID_TOKEN[] = "CEN429-OK";     /* plainly visible (strings) */
    if (strlen(token) != strlen(VALID_TOKEN))
        return DENIED;
    if (constant_time_equals(token, VALID_TOKEN, (unsigned)strlen(VALID_TOKEN)))
        return GRANTED;
    return DENIED;
}
