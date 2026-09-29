/*
 * CEN429 - Week 4 - Demo 7 (extra): opaque predicates.
 *
 * An opaque predicate is a condition whose truth value the PROGRAM AUTHOR knows in advance (always
 * true, or always false, for every possible input) but which is hard for a static analyzer or
 * disassembler to prove without deep reasoning. Obfuscators insert them to add branches that LOOK
 * reachable in the disassembly but never actually execute (or always execute), wasting a reverse
 * engineer's time on a dead end.
 *
 * This demo's predicate is a small number-theory fact: for ANY integer x, (x*x) % 4 is always 0 or
 * 1 -- it can never be 2 or 3 (a perfect square is never congruent to 2 or 3 modulo 4). So the
 * condition below is ALWAYS TRUE, for every int x, without exception.
 *
 * VIEW: written from the DEFENDER's/evaluator's side -- what the predicate does, how we can MEASURE
 * that it really is always-true/false, and its limits (it slows down reading; it does not make
 * analysis impossible).
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cen429_demo.h"

/* ALWAYS TRUE for every int x: a perfect square modulo 4 is never 2. */
int opaque_true(int x)
{
    return ((x * x) % 4) != 2;
}

/* ALWAYS FALSE for every int x: the same fact, negated. */
int opaque_false(int x)
{
    return ((x * x) % 4) == 2;
}

/* The decoy branch: reachable-LOOKING in the disassembly (there is a real conditional jump to it),
   but never actually taken, because opaque_false() never returns nonzero. */
static void decoy_branch(int x)
{
    printf("   [decoy] unreachable: opaque_false(%d) was somehow true.\n", x);
}

/* The real check, guarded by an always-true opaque predicate: adds a branch a decompiler must
   consider, that always resolves the same way. */
static int real_check(const char *guess)
{
    return strlen(guess) == 4 && guess[0] == '4' && guess[1] == '2' &&
           guess[2] == '9' && guess[3] == '1';
}

int pin_verify_obfuscated(const char *guess, int x)
{
    if (opaque_false(x)) {         /* looks like a real branch; never taken for ANY x */
        decoy_branch(x);
        return -1;                  /* dead code: never returned */
    }
    if (opaque_true(x)) {          /* looks like a real branch; ALWAYS taken for ANY x */
        return real_check(guess) ? 1 : 0;
    }
    return -2;                      /* dead code: never returned (opaque_true is always true) */
}

int main(int argc, char **argv)
{
    demo_prepare();
    if (argc >= 2 && strcmp(argv[1], "verify") == 0) {
        /* Defender's view: PROVE the predicate really is always true/false by sweeping x across a
           wide range, instead of trusting the algebra alone. */
        int checked = 0, wrong = 0;
        for (int x = -100000; x <= 100000; x++) {
            if (opaque_false(x)) wrong++;
            if (!opaque_true(x)) wrong++;
            checked++;
        }
        printf("Swept %d values of x: opaque_false was true %d time(s) (expected 0).\n", checked, wrong);
        return wrong == 0 ? 0 : 1;
    }
    const char *p = (argc >= 2) ? argv[1] : "0000";
    int x = (argc >= 3) ? atoi(argv[2]) : 7;
    int result = pin_verify_obfuscated(p, x);
    printf("PIN %s (x=%d) -> %s\n", p, x, result == 1 ? "CORRECT" : "wrong");
    return 0;
}
