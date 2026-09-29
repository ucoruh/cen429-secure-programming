/* Unit tests for week-12/02-attack-potential/attack_potential.c.
 *
 * compute_score(), rating() and safe_index() are pure computation (no file/network/system
 * access), so they are safe to call directly, in-process.
 */
#define main program_main
#include "../attack_potential.c"
#undef main
#include "../../../common/test_check.h"

int main(void)
{
    /* --- safe_index(): normal, negative clamps to 0, over-max clamps to n-1 -------------- */
    CHECK_EQ_INT(safe_index("0", 4), 0);
    CHECK_EQ_INT(safe_index("3", 4), 3);                          /* normal, last valid index */
    CHECK_EQ_INT(safe_index("-1", 4), 0);                          /* negative: clamped to 0 */
    CHECK_EQ_INT(safe_index("99", 4), 3);                           /* too large: clamped to n-1 */
    CHECK_EQ_INT(safe_index("2", 3), 2);
    CHECK_EQ_INT(safe_index("5", 3), 2);                             /* too large: clamped to n-1 */
    CHECK_EQ_INT(safe_index("-5", 3), 0);                             /* negative: clamped to 0 */

    /* --- rating(): every threshold boundary (9|10, 13|14, 19|20, 24|25) ------------------ */
    CHECK(strncmp(rating(0),  "BASIC", 5) == 0);
    CHECK(strncmp(rating(9),  "BASIC", 5) == 0);                       /* boundary: still BASIC */
    CHECK(strncmp(rating(10), "MODERATE", 8) == 0);                     /* boundary: now MODERATE */
    CHECK(strncmp(rating(13), "MODERATE", 8) == 0);                      /* boundary: still MODERATE */
    CHECK(strncmp(rating(14), "HIGH", 4) == 0);                           /* boundary: now HIGH */
    CHECK(strncmp(rating(19), "HIGH", 4) == 0);                            /* boundary: still HIGH */
    CHECK(strncmp(rating(20), "VERY HIGH", 9) == 0);                        /* boundary: now VERY HIGH */
    CHECK(strncmp(rating(24), "VERY HIGH", 9) == 0);                         /* boundary: still VERY HIGH */
    CHECK(strncmp(rating(25), "BEYOND", 6) == 0);                            /* boundary: now BEYOND */
    CHECK(strncmp(rating(1000), "BEYOND", 6) == 0);                           /* far beyond: still BEYOND */

    /* --- compute_score(): the worked examples from the lecture notes -------------------- */
    CHECK_EQ_INT(compute_score(0, 1, 0, 0, 0), 3);      /* license check, unprotected -> BASIC */
    CHECK_EQ_INT(compute_score(1, 2, 1, 1, 0), 17);      /* license check, protected -> HIGH */
    CHECK_EQ_INT(compute_score(2, 3, 2, 1, 1), 33);       /* white-box key extraction -> BEYOND */
    CHECK_EQ_INT(compute_score(3, 3, 3, 2, 2), 55);        /* secure element extraction -> BEYOND */
    CHECK_EQ_INT(compute_score(0, 0, 0, 0, 0), 0);          /* all-zero boundary */

    TEST_SUMMARY();
}
