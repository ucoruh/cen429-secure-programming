/* Unit tests for week-14/01-source-to-source/source.c's grant_access() -- the function fed
 * into the source-to-source pipeline (Tigress or the local fallback). These tests run
 * against the PLAIN, unmodified source, so a transform that accidentally changes behaviour
 * is caught by pipeline_check.py's semantic-equivalence check comparing against exactly
 * this program's own output, not by re-deriving the expected values a second time here.
 *
 * Every expected value below is one of only two possible outcomes (1 = GRANTED, 0 = DENIED),
 * decided by hand from the token text -- never by calling grant_access() itself.
 * Deliberately close to week-09/01-manual-obfuscation/tests/test_access_clean.c: the whole
 * point of week 14 is that the SAME check, run through a tool instead of by hand, answers
 * these exact same tokens the exact same way.
 */
#define main program_main
#include "../source.c"
#undef main
#include "../../../common/test_check.h"

int main(void)
{
    /* --- normal: the one valid token ---------------------------------------------------- */
    CHECK_EQ_INT(grant_access("CEN429-OK"), 1);
    CHECK_EQ_INT(grant_access("CEN429-OK"), 1);   /* repeated call: no hidden state, stable */

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

    /* --- the "wrong-token" example used by pipeline_check.py and demo.sh/demo.ps1 --------- */
    CHECK_EQ_INT(grant_access("wrong-token"), 0);

    /* NULL is not tested: grant_access()'s only documented contract is a NUL-terminated C
       string (like every strlen()-based function in this course); strlen(NULL) is undefined
       behaviour, not a "reject" case, so passing NULL here would not be a meaningful check. */

    TEST_SUMMARY();
}
