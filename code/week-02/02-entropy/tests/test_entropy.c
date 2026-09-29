/* Unit tests for week-02/02-entropy/entropy.c.
 *
 * entropy(), interpret() and bar() are pure, bounded functions -- safe to call in-process.
 * Expected entropy values are the exact Shannon formula for hand-picked byte distributions,
 * written independently in this file (not by calling entropy() a second time).
 */
#define main program_main
#include "../entropy.c"
#undef main
#include "../../../common/test_check.h"
#include <math.h>

int main(void)
{
    /* --- entropy(): normal, empty, boundary, skewed --------------------------------------- */
    {
        unsigned char same[100];
        memset(same, 'A', sizeof same);
        CHECK(fabs(entropy(same, sizeof same) - 0.0) < 1e-9);   /* one byte value: H = 0 */
    }
    CHECK(fabs(entropy(NULL, 0) - 0.0) < 1e-9);                  /* n == 0: hard 0 */
    {
        unsigned char one[1] = { 0x7f };
        CHECK(fabs(entropy(one, 1) - 0.0) < 1e-9);
    }
    {
        unsigned char half[4] = { 1, 2, 1, 2 };                  /* 2 values, 50/50: H = 1.0 */
        CHECK(fabs(entropy(half, 4) - 1.0) < 1e-9);
    }
    {
        unsigned char four[16] = { 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4 };
        CHECK(fabs(entropy(four, 16) - 2.0) < 1e-9);             /* 4 values, equal: H = 2.0 */
    }
    {
        unsigned char eight[8] = { 0, 1, 2, 3, 4, 5, 6, 7 };      /* 8 distinct, equal: H = 3.0 */
        CHECK(fabs(entropy(eight, 8) - 3.0) < 1e-9);
    }
    {
        unsigned char skew[3] = { 9, 9, 5 };
        double expected = -(2.0 / 3.0 * log2(2.0 / 3.0) + 1.0 / 3.0 * log2(1.0 / 3.0));
        CHECK(fabs(entropy(skew, 3) - expected) < 1e-9);
    }

    /* --- interpret(): the four boundaries (1.0, 5.5, 7.2), each side ---------------------- */
    CHECK_EQ_STR(interpret(0.0), "uniform");
    CHECK_EQ_STR(interpret(0.99), "uniform");
    CHECK_EQ_STR(interpret(1.0), "low");
    CHECK_EQ_STR(interpret(5.49), "low");
    CHECK_EQ_STR(interpret(5.5), "medium");
    CHECK_EQ_STR(interpret(7.19), "medium");
    CHECK_EQ_STR(interpret(7.2), "HIGH");
    CHECK_EQ_STR(interpret(8.0), "HIGH");

    /* --- bar(): fill fraction and fixed output width --------------------------------------- */
    {
        char out[41];
        bar(0.0, out, 8);
        CHECK_EQ_STR(out, "........");
        bar(8.0, out, 8);
        CHECK_EQ_STR(out, "########");
        bar(4.0, out, 8);
        CHECK_EQ_STR(out, "####....");
        bar(6.0, out, 32);
        CHECK_EQ_INT((int)strlen(out), 32);
    }

    TEST_SUMMARY();
}
