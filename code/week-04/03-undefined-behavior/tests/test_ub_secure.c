/* Unit tests for week-04/03-undefined-behavior/ub_secure.c.
 *
 * checked_add() is a pure, bounded function (no undefined behavior by construction: the GCC/Clang
 * builtin path never actually overflows, and the portable fallback checks BEFORE adding) — safe to
 * call in-process with any pair of ints. ub.c's own mode_overflow()/mode_shift()/mode_unaligned()
 * are NOT exercised in-process: they are the demo's undefined-behavior itself, and even though
 * x86 usually tolerates them silently, "usually" is exactly the point of this lesson (see the
 * end-to-end tests in CMakeLists.txt, which run ub.c's real, separate OS process instead). Every
 * expected value below is computed by hand in 64-bit arithmetic, never taken from checked_add()'s
 * own output.
 */
#define main program_main
#include "../ub_secure.c"
#undef main
#include "../../../common/test_check.h"

static void expect_ok(int a, int b, int expected_sum)
{
    int r = -12345;
    int ok = checked_add(a, b, &r);
    CHECK_EQ_INT(ok, 1);
    CHECK_EQ_INT(r, expected_sum);
}

static void expect_overflow(int a, int b)
{
    int r = -12345;
    int ok = checked_add(a, b, &r);
    CHECK_EQ_INT(ok, 0);
}

int main(void)
{
    /* normal */
    expect_ok(0, 0, 0);
    expect_ok(1, 1, 2);
    expect_ok(100, 200, 300);
    expect_ok(-1, -1, -2);

    /* boundary: right at INT_MAX / INT_MIN, both sides */
    expect_ok(INT_MAX, 0, INT_MAX);                  /* no change: still valid */
    expect_overflow(INT_MAX, 1);                     /* one past INT_MAX: overflow */
    expect_ok(INT_MAX - 1, 1, INT_MAX);               /* lands exactly on INT_MAX: still valid */
    expect_ok(INT_MAX, -1, INT_MAX - 1);              /* subtracting via a negative b: valid */
    expect_ok(INT_MIN, 0, INT_MIN);                   /* no change: still valid */
    expect_overflow(INT_MIN, -1);                     /* one past INT_MIN: underflow */
    expect_ok(INT_MIN + 1, -1, INT_MIN);               /* lands exactly on INT_MIN: still valid */
    expect_ok(INT_MIN, 1, INT_MIN + 1);                /* moving away from INT_MIN: valid */

    /* too-long-equivalent: sums that clearly overflow/underflow by a wide margin */
    expect_ok(1000000000, 1000000000, 2000000000);    /* 2e9 fits in a 32-bit int */
    expect_overflow(1500000000, 1000000000);           /* 2.5e9 does not fit: overflow */
    expect_overflow(-1500000000, -1000000000);         /* -2.5e9 does not fit: underflow */
    expect_ok(-1000000000, -1000000000, -2000000000);  /* -2e9 fits: valid */

    TEST_SUMMARY();
}
