/*
 * CEN429 - Week 9 - Demo 1: OBFUSCATED version (same behavior, hand-hardened).
 * Rules applied (same names as the slides/notes):
 *   R-01 opaque predicate  : the branch is tied to an always-true arithmetic identity.
 *   R-04 flattening        : control flow is moved into a single switch dispatcher.
 *   R-05 randomized exit   : on failure, the state variable is pushed to an undefined value,
 *                            exiting through the default case.
 *   R-07 constant encoding : the valid token string stays XOR-encoded, is decoded only at use,
 *                            and is wiped IMMEDIATELY after use.
 *   R-08 opaque boolean    : the result is not a plain 0/1; it is derived from two fields.
 * Behavior is IDENTICAL to clean.c; only readability drops and cost rises.
 */
#include <string.h>
#include "common.h"

/* Encoded "CEN429-OK" (each byte ^ 0x5A). Not plainly visible with `strings`. */
static const unsigned char ENCODED[] = {
    0x19, 0x1F, 0x14, 0x6E, 0x68, 0x63, 0x77, 0x15, 0x11  /* "CEN429-OK", each byte ^ 0x5A */
};
#define ENCODED_LEN ((unsigned)(sizeof ENCODED))

/* R-01: x*(x+1) is always even -> always 0. Hard for static analysis to prove. */
static int opaque_zero(unsigned x) { return (int)((x * (x + 1u)) & 1u); }

/* R-08: opaque boolean; a ^ b == 0xFFFF -> GRANTED. */
typedef struct { unsigned a, b; } Decision;
static int decision_grants(Decision d) { return (d.a ^ d.b) == 0xFFFFu; }

static int constant_time_equals(const unsigned char *a, const char *b, unsigned n)
{
    unsigned diff = 0;
    for (unsigned i = 0; i < n; i++)
        diff |= (unsigned)(a[i] ^ (unsigned char)b[i]);
    return diff == 0;
}

int grant_access(const char *token)
{
    enum { START, LENGTH, DECODE, COMPARE, GRANT, DENY, DONE = 99 };
    int state = START + opaque_zero((unsigned)strlen(token)); /* opaque: still START */
    unsigned n = ENCODED_LEN;
    char decoded[ENCODED_LEN + 1];
    Decision d = { 0, 0 };
    int result = DENIED;

    for (;;) {
        switch (state) {
        case START:
            state = LENGTH;
            break;
        case LENGTH:
            /* R-05: on a length mismatch, jump to an undefined state -> default -> DENY */
            state = (strlen(token) == n) ? DECODE : (DONE + 7);
            break;
        case DECODE:
            for (unsigned i = 0; i < n; i++) decoded[i] = (char)(ENCODED[i] ^ 0x5A);
            decoded[n] = '\0';
            state = COMPARE;
            break;
        case COMPARE:
            if (constant_time_equals((const unsigned char *)token, decoded, n))
                d.a = 0xA3C1u, d.b = 0x5C3Eu;   /* a^b == 0xFFFF -> grant */
            else
                d.a = 0x1111u, d.b = 0x2222u;   /* not granted */
            memset(decoded, 0, sizeof decoded);  /* R-07: wipe the decoded string IMMEDIATELY */
            state = decision_grants(d) ? GRANT : DENY;
            break;
        case GRANT:
            result = GRANTED;
            state = -1;                          /* default -> exit (success also exits via default) */
            break;
        case DENY:
            result = DENIED;
            state = -2;
            break;
        default:                                  /* R-05 randomized exit point */
            return result;
        }
    }
}
