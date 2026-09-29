/*
 * CEN429 - Week 9 - Demo 1: COMMON RUNNER (the clean and obfuscated versions share this main).
 * Tokens are given ON THE COMMAND LINE, so the valid token is NEVER EMBEDDED IN THE BINARY
 * (demo.sh passes the valid token as an argument). Without an argument, only invalid examples
 * are tried. Both versions' output must be BYTE-IDENTICAL for the same tokens.
 */
#include <stdio.h>
#include "common.h"

static void try_token(const char *token)
{
    int r = grant_access(token);
    printf("  token=\"%s\"  -> %s\n", token, r == GRANTED ? "GRANTED" : "DENIED");
}

int main(int argc, char **argv)
{
    printf("=== grant_access ===\n");
    if (argc > 1) {
        for (int i = 1; i < argc; i++) try_token(argv[i]);
    } else {
        /* Invalid examples (NOT a secret, safe to embed). */
        try_token("short");
        try_token("CEN429-XX");
        try_token("");
        printf("  (Pass the valid token as an argument to try it: %s <token>)\n", argv[0]);
    }
    return 0;
}
