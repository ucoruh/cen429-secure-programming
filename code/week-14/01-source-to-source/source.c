/*
 * CEN429 - Week 14 - Demo 1: source-to-source obfuscation input.
 * This is the function a source-to-source tool (Tigress) reads and transforms: a small,
 * sensitive check, kept exactly as readable as any other function in the course.
 * SAFETY: entirely synthetic; no file/network/system operation.
 *
 * Same interface as week-09/01-manual-obfuscation's grant_access()/token/VALID_TOKEN: there
 * the same idea was applied BY HAND (see clean.c/obfuscated.c); here a real source-to-source
 * TOOL applies it automatically, from this one unmodified file, with diversification driven
 * by a --Seed value instead of a hand-picked one. Compare the two demos side by side.
 */
#include <stdio.h>
#include <string.h>

/* Function to obfuscate: 1 for the valid synthetic token, 0 otherwise.
   noinline: stays its own symbol so its cost can be measured separately from main(). */
#if defined(__GNUC__) || defined(__clang__)
__attribute__((noinline))
#endif
int grant_access(const char *token)
{
    static const char VALID_TOKEN[] = "CEN429-OK";
    if (strlen(token) != strlen(VALID_TOKEN)) return 0;
    unsigned diff = 0;
    for (unsigned i = 0; i < sizeof VALID_TOKEN - 1; i++)
        diff |= (unsigned)((unsigned char)token[i] ^ (unsigned char)VALID_TOKEN[i]);
    return diff == 0;
}

int main(int argc, char **argv)
{
    const char *token = (argc > 1) ? argv[1] : "CEN429-OK";
    printf("grant_access(\"%s\") = %s\n", token, grant_access(token) ? "GRANTED" : "DENIED");
    return 0;
}
