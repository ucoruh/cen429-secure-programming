/* Unit tests for week-09/01-manual-obfuscation/obfuscated.c's grant_access().
 *
 * grant_access() is pure (no file/network/global state) and safe to call in-process.
 * Every expected value below is one of the only two possible outcomes (GRANTED/DENIED); each
 * is decided by hand from the token text, never by calling grant_access() itself.
 *
 * This file is intentionally near-identical to test_access_clean.c: the whole point of this
 * demo is that the obfuscation (R-01 opaque predicate, R-04 flattening, R-05 randomized exit,
 * R-07 encoded constant, R-08 opaque boolean) does NOT change any observable answer.
 */
#include "../obfuscated.c"
#include "../../../common/test_check.h"

int main(void)
{
    /* --- normal: the one valid token ---------------------------------------------------- */
    CHECK_EQ_INT(grant_access("CEN429-OK"), GRANTED);
    CHECK_EQ_INT(grant_access("CEN429-OK"), GRANTED);   /* repeated call: decoded buffer is wiped and rebuilt each time */

    /* --- empty / boundary length -------------------------------------------------------- */
    CHECK_EQ_INT(grant_access(""), DENIED);              /* empty string */
    CHECK_EQ_INT(grant_access("short"), DENIED);          /* too short (5 chars) */
    CHECK_EQ_INT(grant_access("CEN429-O"), DENIED);       /* one char too short (8 chars) */
    CHECK_EQ_INT(grant_access("CEN429-OKX"), DENIED);     /* one char too long (10 chars) */
    CHECK_EQ_INT(grant_access("CEN429-OK-TOO-LONG-BY-A-LOT"), DENIED); /* much too long */

    /* --- same length, wrong content (invalid) ------------------------------------------- */
    CHECK_EQ_INT(grant_access("123456789"), DENIED);      /* same length, all different */
    CHECK_EQ_INT(grant_access("XEN429-OK"), DENIED);       /* first char differs */
    CHECK_EQ_INT(grant_access("CEN429-OX"), DENIED);       /* last char differs */
    CHECK_EQ_INT(grant_access("CEN4Z9-OK"), DENIED);       /* middle char differs */
    CHECK_EQ_INT(grant_access("CEN429-0K"), DENIED);       /* confusable: '0' (zero) vs 'O' */

    /* --- case sensitivity ---------------------------------------------------------------- */
    CHECK_EQ_INT(grant_access("cen429-ok"), DENIED);       /* all lowercase */
    CHECK_EQ_INT(grant_access("CEN429-Ok"), DENIED);        /* last letter lowercase */

    /* --- whitespace is significant, not trimmed ------------------------------------------- */
    CHECK_EQ_INT(grant_access(" CEN429-OK"), DENIED);       /* leading space (10 chars) */
    CHECK_EQ_INT(grant_access("CEN429-OK "), DENIED);       /* trailing space (10 chars) */

    /* --- CEN429-XX is the demo's other "known invalid" example, used in run.c ------------- */
    CHECK_EQ_INT(grant_access("CEN429-XX"), DENIED);

    TEST_SUMMARY();
}
