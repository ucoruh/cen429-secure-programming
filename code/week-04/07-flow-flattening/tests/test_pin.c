/* Unit tests for week-04/07-flow-flattening/pin.c.
 *
 * pin_verify() is a pure, bounded string check (strlen caps it, the four comparisons only read
 * bytes strlen found) — safe to call in-process with any string, including empty or long ones.
 * pin_flattened.c defines a function of the SAME name with the SAME behaviour (only its internal
 * structure differs — see demo.sh/demo.ps1, which run both real binaries side by side on the same
 * inputs and compare their output directly); it is not included here too, to avoid a duplicate
 * `pin_verify` symbol in one test binary. Every expected value below is reasoned out from the
 * definition "correct = 4-2-9-1", never taken from pin_verify()'s own output.
 */
#define main program_main
#include "../pin.c"
#undef main
#include "../../../common/test_check.h"

int main(void)
{
    /* normal: the correct PIN */
    CHECK_EQ_INT(pin_verify("4291"), 1);

    /* normal: plausible but wrong PINs */
    CHECK_EQ_INT(pin_verify("1234"), 0);
    CHECK_EQ_INT(pin_verify("0000"), 0);

    /* empty */
    CHECK_EQ_INT(pin_verify(""), 0);

    /* boundary: 3 characters (one short) and 5 characters (one long) */
    CHECK_EQ_INT(pin_verify("429"), 0);
    CHECK_EQ_INT(pin_verify("42911"), 0);
    CHECK_EQ_INT(pin_verify("42"), 0);

    /* invalid: each digit wrong in turn, everything else correct */
    CHECK_EQ_INT(pin_verify("3291"), 0);          /* digit 0 wrong */
    CHECK_EQ_INT(pin_verify("4191"), 0);          /* digit 1 wrong */
    CHECK_EQ_INT(pin_verify("4271"), 0);          /* digit 2 wrong */
    CHECK_EQ_INT(pin_verify("4292"), 0);          /* digit 3 wrong */

    /* invalid: whitespace changes the length even if the digits look right */
    CHECK_EQ_INT(pin_verify("4291 "), 0);         /* trailing space: length 5 */
    CHECK_EQ_INT(pin_verify(" 4291"), 0);         /* leading space: length 5 */

    /* invalid: letters instead of digits */
    CHECK_EQ_INT(pin_verify("abcd"), 0);

    /* invalid: correct length, all digits wrong */
    CHECK_EQ_INT(pin_verify("9999"), 0);

    /* invalid: a leading zero changes the value, and the string, entirely */
    CHECK_EQ_INT(pin_verify("0429"), 0);

    TEST_SUMMARY();
}
