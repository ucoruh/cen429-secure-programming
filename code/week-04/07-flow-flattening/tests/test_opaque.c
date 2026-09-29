/* Unit tests for week-04/07-flow-flattening/opaque.c.
 *
 * opaque_true()/opaque_false()/pin_verify_obfuscated() are pure integer/string checks — safe to
 * call in-process with any x or guess. The expected values below come from the number-theory fact
 * itself (a perfect square modulo 4 is never 2), computed independently for each x by hand, never
 * taken from opaque_true()'s own output — the whole point of these checks is to catch a mistake in
 * that reasoning, or in the modulo-of-a-negative-number handling, before trusting the predicate.
 */
#define main program_main
#include "../opaque.c"
#undef main
#include "../../../common/test_check.h"

int main(void)
{
    /* opaque_true: ALWAYS true, for zero, small, negative and large x */
    CHECK_EQ_INT(opaque_true(0), 1);        /* 0*0 % 4 = 0 != 2 */
    CHECK_EQ_INT(opaque_true(1), 1);        /* 1*1 % 4 = 1 != 2 */
    CHECK_EQ_INT(opaque_true(2), 1);        /* 2*2 % 4 = 0 != 2 */
    CHECK_EQ_INT(opaque_true(3), 1);        /* 3*3 % 4 = 9 % 4 = 1 != 2 */
    CHECK_EQ_INT(opaque_true(-5), 1);       /* (-5)*(-5) = 25, 25 % 4 = 1 != 2 */
    CHECK_EQ_INT(opaque_true(100), 1);      /* 100*100 = 10000, 10000 % 4 = 0 != 2 */

    /* opaque_false: ALWAYS false, the exact complement of opaque_true */
    CHECK_EQ_INT(opaque_false(0), 0);
    CHECK_EQ_INT(opaque_false(7), 0);        /* 49 % 4 = 1 */
    CHECK_EQ_INT(opaque_false(-100000), 0);
    CHECK_EQ_INT(opaque_false(100000), 0);

    /* pin_verify_obfuscated: the result must not depend on x at all (x only feeds the dead branches) */
    CHECK_EQ_INT(pin_verify_obfuscated("4291", 0), 1);
    CHECK_EQ_INT(pin_verify_obfuscated("4291", 7), 1);
    CHECK_EQ_INT(pin_verify_obfuscated("4291", -50), 1);
    CHECK_EQ_INT(pin_verify_obfuscated("0000", 7), 0);
    CHECK_EQ_INT(pin_verify_obfuscated("42911", 7), 0);      /* wrong length, x irrelevant */
    CHECK_EQ_INT(pin_verify_obfuscated("", 0), 0);

    TEST_SUMMARY();
}
