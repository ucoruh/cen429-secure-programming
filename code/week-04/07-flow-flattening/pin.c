/*
 * CEN429 - Week 4 - Demo 7: control-flow flattening - PLAIN (normal) version.
 *
 * A small PIN check, written with natural if/branches. A reverse engineer reading this easily
 * recovers the control flow (the control-flow graph, CFG). The 07-flow demo compares this against
 * the same logic in "flattened" form (pin_flattened.c).
 *
 * The correct PIN is synthetic (made up) and is encoded as digit-by-digit comparisons rather than
 * a single string constant, so it does not leak with 'strings' either.
 */
#include <stdio.h>
#include <string.h>
#include <time.h>
#include "cen429_demo.h"

/* Is the PIN correct? (correct = 4-2-9-1) */
int pin_verify(const char *guess)
{
    if (strlen(guess) != 4) return 0;
    if (guess[0] != '4') return 0;
    if (guess[1] != '2') return 0;
    if (guess[2] != '9') return 0;
    if (guess[3] != '1') return 0;
    return 1;
}

int main(int argc, char **argv)
{
    demo_prepare();
    if (argc >= 2 && strcmp(argv[1], "timing") == 0) {
        volatile int sink = 0;
        char buffer[8];
        clock_t start = clock();
        for (int i = 0; i < 20000000; i++) {
            /* a different input each round, so the compiler cannot delete the call */
            snprintf(buffer, sizeof(buffer), "%04d", i % 10000);
            sink += pin_verify(buffer);
        }
        clock_t end = clock();
        double ms = 1000.0 * (double)(end - start) / CLOCKS_PER_SEC;
        printf("PLAIN version: 20M checks -> %.1f ms (sink=%d)\n", ms, sink);
        return 0;
    }
    const char *p = (argc >= 2) ? argv[1] : "0000";
    printf("PIN %s -> %s\n", p, pin_verify(p) ? "CORRECT" : "wrong");
    return 0;
}
