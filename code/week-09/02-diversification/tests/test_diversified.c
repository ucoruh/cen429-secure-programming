/* Unit tests for week-09/02-diversification/diversified.c's grant_access().
 *
 * Built twice by CMakeLists.txt with DEFINES SEED=1001 and SEED=2002 (same source, two builds
 * of this exact test file) so both seeds are proven, independently, to answer every token below
 * the exact same way -- diversification must change the MACHINE CODE, never the BEHAVIOR.
 *
 * grant_access() is pure and safe to call in-process; every expected value is one of the two
 * possible outcomes (1/0), decided by hand from the token text.
 */
#define main program_main
#include "../diversified.c"
#undef main
#include "../../../common/test_check.h"

int main(void)
{
    /* --- normal: the one valid token ---------------------------------------------------- */
    CHECK_EQ_INT(grant_access("CEN429-OK"), 1);
    CHECK_EQ_INT(grant_access("CEN429-OK"), 1);          /* repeated call: stable */

    /* --- empty / boundary length -------------------------------------------------------- */
    CHECK_EQ_INT(grant_access(""), 0);                    /* empty string */
    CHECK_EQ_INT(grant_access("short"), 0);                /* too short (5 chars) */
    CHECK_EQ_INT(grant_access("CEN429-O"), 0);             /* one char too short (8 chars) */
    CHECK_EQ_INT(grant_access("CEN429-OKX"), 0);           /* one char too long (10 chars) */
    CHECK_EQ_INT(grant_access("CEN429-OK-TOO-LONG-BY-A-LOT"), 0); /* much too long */

    /* --- same length, wrong content (invalid) ------------------------------------------- */
    CHECK_EQ_INT(grant_access("123456789"), 0);            /* same length, all different */
    CHECK_EQ_INT(grant_access("XEN429-OK"), 0);             /* first char differs */
    CHECK_EQ_INT(grant_access("CEN429-OX"), 0);             /* last char differs */
    CHECK_EQ_INT(grant_access("CEN4Z9-OK"), 0);             /* middle char differs */
    CHECK_EQ_INT(grant_access("CEN429-0K"), 0);             /* confusable: '0' (zero) vs 'O' */

    /* --- case sensitivity ---------------------------------------------------------------- */
    CHECK_EQ_INT(grant_access("cen429-ok"), 0);             /* all lowercase */
    CHECK_EQ_INT(grant_access("CEN429-Ok"), 0);              /* last letter lowercase */

    /* --- whitespace is significant, not trimmed ------------------------------------------- */
    CHECK_EQ_INT(grant_access(" CEN429-OK"), 0);             /* leading space (10 chars) */
    CHECK_EQ_INT(grant_access("CEN429-OK "), 0);             /* trailing space (10 chars) */

    CHECK_EQ_INT(grant_access("wrong-token"), 0);

    TEST_SUMMARY();
}
