/*
 * CEN429 - Week 4 - Demo 7: control-flow FLATTENED version.
 *
 * The SAME logic as pin.c, but hand-"flattened": every step is placed in a switch dispatcher
 * inside a single infinite loop. A "state" variable holds which step comes next. The output is
 * identical, but the control-flow graph (CFG) no longer looks like a natural if-chain: every block
 * passes through the dispatcher, and the original adjacency between blocks disappears. This is the
 * hand-made equivalent of Tigress's --Transform=Flatten (Week 14).
 *
 * Cost: the dispatcher loop does extra work; the demo shows this with a timing measurement.
 */
#include <stdio.h>
#include <string.h>
#include <time.h>
#include "cen429_demo.h"

int pin_verify(const char *guess)
{
    int state = 0;
    int ok = 0;
    for (;;) {
        switch (state) {
        case 0:  state = (strlen(guess) != 4) ? 99 : 1; break;
        case 1:  state = (guess[0] != '4')     ? 99 : 2; break;
        case 2:  state = (guess[1] != '2')     ? 99 : 3; break;
        case 3:  state = (guess[2] != '9')     ? 99 : 4; break;
        case 4:  state = (guess[3] != '1')     ? 99 : 5; break;
        case 5:  ok = 1; state = 99;                     break;
        case 99: return ok;
        default: return 0;
        }
    }
}

int main(int argc, char **argv)
{
    demo_prepare();
    if (argc >= 2 && strcmp(argv[1], "timing") == 0) {
        volatile int sink = 0;
        char buffer[8];
        clock_t start = clock();
        for (int i = 0; i < 20000000; i++) {
            snprintf(buffer, sizeof(buffer), "%04d", i % 10000);
            sink += pin_verify(buffer);
        }
        clock_t end = clock();
        double ms = 1000.0 * (double)(end - start) / CLOCKS_PER_SEC;
        printf("FLATTENED version: 20M checks -> %.1f ms (sink=%d)\n", ms, sink);
        return 0;
    }
    const char *p = (argc >= 2) ? argv[1] : "0000";
    printf("PIN %s -> %s\n", p, pin_verify(p) ? "CORRECT" : "wrong");
    return 0;
}
