/*
 * CEN429 - Week 9 - Demo 2: Diversification.
 * The SAME source, compiled with a different SEED at build time, produces two binaries that
 * are behaviorally IDENTICAL but have DIFFERENT MACHINE CODE. A patch written into one copy
 * does not work on the other.
 * (A hand-written, compiler-macro imitation of Tigress's --Seed; see week-14 for the real tool.)
 *
 * SEED determines the string-encoding mask and the flattening's case values; the RESULT stays
 * the same but the GENERATED CODE changes. SAFE: synthetic, no file/network/system operation.
 */
#include <stdio.h>
#include <string.h>

#ifndef SEED
#define SEED 1001
#endif

/* Mask and case base derived from the seed (compile-time constants). */
#define MASK  ((unsigned char)((SEED * 2654435761u) >> 24))
#define C0    ((SEED * 40503u) & 0x3F)
#define C1    (C0 + 7)
#define C2    (C0 + 19)
#define C3    (C0 + 41)

static const char VALID_TOKEN[] = "CEN429-OK";

#if defined(__GNUC__) || defined(__clang__)
__attribute__((noinline))
#endif
int grant_access(const char *token)
{
    unsigned n = (unsigned)(sizeof VALID_TOKEN - 1);
    int state = C0;
    int result = 0;
    unsigned char encoded[sizeof VALID_TOKEN];
    /* Encode the string with the seed-dependent mask (different bytes for every seed). */
    for (unsigned i = 0; i < n; i++) encoded[i] = (unsigned char)(VALID_TOKEN[i] ^ MASK);

    for (;;) {
        if (state == C0) { state = (strlen(token) == n) ? C1 : 999; }
        else if (state == C1) {
            unsigned diff = 0;
            for (unsigned i = 0; i < n; i++)
                diff |= (unsigned)((unsigned char)(token[i] ^ MASK) ^ encoded[i]);
            state = diff ? C3 : C2;
        }
        else if (state == C2) { result = 1; state = -1; }
        else if (state == C3) { result = 0; state = -1; }
        else { memset(encoded, 0, sizeof encoded); return result; }  /* random/single exit */
    }
}

int main(int argc, char **argv)
{
    const char *token = (argc > 1) ? argv[1] : "CEN429-OK";
    printf("[seed %d] grant_access(\"%s\") = %s\n", (int)SEED, token, grant_access(token) ? "GRANTED" : "DENIED");
    return 0;
}
