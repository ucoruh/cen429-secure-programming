/*
 * CEN429 - Week 4 - Demo 6: symbol and string leakage.
 *
 * The same source is built twice:
 *   exposed : LOG macros on, meaningful function names, the SECRET STRING sits in the binary as
 *             OPEN plain text (not stripped)     -> strings/nm leak a lot
 *   hidden  : LOG is compiled out, the SECRET STRING is XOR-obfuscated at compile time and
 *             decoded at run time, symbols are stripped, -fvisibility=hidden
 *
 * This closes off what 'strings' and 'nm' would otherwise leak.
 * All values are SYNTHETIC (made up for the demo).
 */
#include <stdio.h>
#include <string.h>
#include "cen429_demo.h"

/* A logging macro that disappears completely from the release build. */
#ifdef CEN429_LOG
#define LOG(...) fprintf(stderr, "[LOG] " __VA_ARGS__)
#else
#define LOG(...) ((void)0)
#endif

/* The synthetic license/build string that must not leak: "CEN429-LICENSE-2026". */
static const char *secret_text(void)
{
#ifdef CEN429_HIDE
    /* XOR'd with 0x5A at compile time; the PLAIN TEXT is NOT visible in the binary.
       Decoded at run time (a simple compile-time string obfuscation). */
    static const unsigned char g[] = {
        0x19,0x1f,0x14,0x6e,0x68,0x63,0x77,0x16,0x13,
        0x19,0x1f,0x14,0x09,0x1f,0x77,0x68,0x6a,0x68,0x6c
    };
    static char decoded[sizeof(g) + 1];
    for (size_t i = 0; i < sizeof(g); i++)
        decoded[i] = (char)(g[i] ^ 0x5A);
    decoded[sizeof(g)] = '\0';
    return decoded;
#else
    return "CEN429-LICENSE-2026";   /* PLAIN text: visible with 'strings' */
#endif
}

/* A simple license check (meaningful name: visible with 'nm'). */
int license_verify(const char *key)
{
    LOG("verifying key: %s\n", key);
    int ok = (strcmp(key, secret_text()) == 0);
    LOG("result = %d\n", ok);
    return ok;
}

int main(int argc, char **argv)
{
    demo_prepare();
    const char *key = (argc >= 2) ? argv[1] : "WRONG-KEY";
    int ok = license_verify(key);
    printf("License: %s\n", ok ? "VALID" : "invalid");
    return ok ? 0 : 1;
}
