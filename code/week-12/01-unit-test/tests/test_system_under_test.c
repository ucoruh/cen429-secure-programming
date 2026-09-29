/* Unit tests for week-12/01-unit-test/system_under_test.c.
 *
 * validate_input() and safe_add() are pure computation (no file/network/system access), so they
 * are safe to call directly, in-process, with any input -- including the adversarial ones below.
 */
#include <limits.h>
#define main program_main
#include "../system_under_test.c"
#undef main
#include "../../../common/test_check.h"

int main(void)
{
    /* --- validate_input(): normal, boundary, empty, too long, invalid ------------------- */
    CHECK_EQ_INT(validate_input("Alice_2026"), 1);          /* normal: letters+digits+underscore */
    CHECK_EQ_INT(validate_input("a"), 1);                    /* boundary: length 1 */
    CHECK_EQ_INT(validate_input("123456"), 1);                /* all digits */
    CHECK_EQ_INT(validate_input("_____"), 1);                 /* all underscore */
    CHECK_EQ_INT(validate_input("MixedCase_1"), 1);            /* mixed case + digit */
    {
        char thirty_two[33];
        for (int i = 0; i < 32; i++) thirty_two[i] = 'a';
        thirty_two[32] = '\0';
        CHECK_EQ_INT(validate_input(thirty_two), 1);          /* boundary: length 32, accepted */
    }
    {
        char thirty_three[34];
        for (int i = 0; i < 33; i++) thirty_three[i] = 'a';
        thirty_three[33] = '\0';
        CHECK_EQ_INT(validate_input(thirty_three), 0);        /* boundary: length 33, rejected */
    }
    CHECK_EQ_INT(validate_input(""), 0);                       /* empty: rejected */
    CHECK_EQ_INT(validate_input("rm -rf /"), 0);                 /* space + metacharacters: rejected */
    CHECK_EQ_INT(validate_input("a-b"), 0);                     /* dash: rejected */
    CHECK_EQ_INT(validate_input("a.b"), 0);                      /* dot: rejected */
    CHECK_EQ_INT(validate_input("a;b"), 0);                       /* semicolon: rejected */
    CHECK_EQ_INT(validate_input("ab\ncd"), 0);                     /* embedded newline: rejected */
    CHECK_EQ_INT(validate_input("caf\xC3\xA9"), 0);                 /* non-ASCII byte: rejected */

    /* --- safe_add(): normal, boundary, overflow (both directions) ----------------------- */
    {
        int r = 0;
        CHECK_EQ_INT(safe_add(2, 3, &r), 1);
        CHECK_EQ_INT(r, 5);                                     /* normal */
    }
    {
        int r = 0;
        CHECK_EQ_INT(safe_add(-10, 4, &r), 1);
        CHECK_EQ_INT(r, -6);                                    /* normal, negative operand */
    }
    {
        int r = 0;
        CHECK_EQ_INT(safe_add(0, 0, &r), 1);
        CHECK_EQ_INT(r, 0);                                     /* zero + zero */
    }
    {
        int r = 0;
        CHECK_EQ_INT(safe_add(INT_MAX, 0, &r), 1);
        CHECK_EQ_INT(r, INT_MAX);                                /* boundary: no overflow at the edge */
    }
    {
        int r = 0;
        CHECK_EQ_INT(safe_add(INT_MIN, 0, &r), 1);
        CHECK_EQ_INT(r, INT_MIN);                                 /* boundary: no overflow at the edge */
    }
    {
        int r = 12345;
        CHECK_EQ_INT(safe_add(INT_MAX, 1, &r), 0);                 /* overflow: caught, not computed */
    }
    {
        int r = 12345;
        CHECK_EQ_INT(safe_add(INT_MIN, -1, &r), 0);                 /* overflow: negative direction */
    }

    TEST_SUMMARY();
}
