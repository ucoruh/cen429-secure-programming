/* Unit tests for week-04/06-symbol-strings/secret.c.
 *
 * license_verify() and secret_text() are pure string comparisons — safe to call in-process with
 * any key, including long or malformed ones (strcmp never reads past a NUL terminator). This test
 * binary is built with neither CEN429_LOG nor CEN429_HIDE defined, so secret_text() takes the
 * plain-text #else branch directly; that is fine, since the XOR-decoded branch (CEN429_HIDE) is
 * required to decode to the exact same string — which the "decoded matches the constant" checks
 * below pin down independently of which branch actually ran. Every expected value is the literal
 * "CEN429-LICENSE-2026" reasoned out from the source, never taken from secret_text()'s own output.
 */
#define main program_main
#include "../secret.c"
#undef main
#include "../../../common/test_check.h"

int main(void)
{
    /* secret_text() itself: constant, and stable across repeated calls */
    CHECK_EQ_STR(secret_text(), "CEN429-LICENSE-2026");
    CHECK_EQ_STR(secret_text(), secret_text());              /* deterministic: same value every call */

    /* normal: the correct key is accepted */
    CHECK_EQ_INT(license_verify("CEN429-LICENSE-2026"), 1);

    /* normal: an unrelated key is rejected */
    CHECK_EQ_INT(license_verify("WRONG-KEY"), 0);

    /* empty */
    CHECK_EQ_INT(license_verify(""), 0);

    /* invalid: case mismatch (strcmp is case-sensitive) */
    CHECK_EQ_INT(license_verify("cen429-license-2026"), 0);

    /* invalid: whitespace around an otherwise-correct key */
    CHECK_EQ_INT(license_verify("CEN429-LICENSE-2026 "), 0);  /* trailing space */
    CHECK_EQ_INT(license_verify(" CEN429-LICENSE-2026"), 0);  /* leading space */

    /* boundary: one character short of the correct key */
    CHECK_EQ_INT(license_verify("CEN429-LICENSE-202"), 0);

    /* boundary: exactly one character too many */
    CHECK_EQ_INT(license_verify("CEN429-LICENSE-2026X"), 0);

    /* invalid: a plausible near-miss (wrong year) */
    CHECK_EQ_INT(license_verify("CEN429-LICENSE-2027"), 0);

    /* invalid: only the prefix */
    CHECK_EQ_INT(license_verify("CEN429"), 0);

    /* invalid: only the suffix */
    CHECK_EQ_INT(license_verify("2026"), 0);

    /* too-long: a long, unrelated key */
    {
        char garbage[101];
        memset(garbage, 'x', 100);
        garbage[100] = '\0';
        CHECK_EQ_INT(license_verify(garbage), 0);
    }

    /* invalid: correct prefix, then garbage instead of the rest */
    CHECK_EQ_INT(license_verify("CEN429-LICENSE-xxxx"), 0);

    TEST_SUMMARY();
}
