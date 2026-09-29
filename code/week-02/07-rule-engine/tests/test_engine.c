/* Unit tests for week-02/07-rule-engine/engine.c.
 *
 * matches_at(), count_matches() and evaluate_condition() are pure/bounded functions over a
 * `struct rule` this test builds directly (bypassing the rule-file parser) -- the same trick used
 * by the other demos' static-state tests. Every expected condition result below is reasoned out
 * by hand from the operator definitions in the file's own header comment.
 */
#define main program_main
#include "../engine.c"
#undef main
#include "../../../common/test_check.h"

/* Builds a rule with two strings ($a, $b) whose match counts are given directly (bypassing an
   actual file scan), and the given condition text. */
static struct rule make_rule(const char *condition, int count_a, int count_b, int count_c)
{
    struct rule k;
    memset(&k, 0, sizeof k);
    snprintf(k.name, sizeof k.name, "Test");
    snprintf(k.strings[0].id, sizeof k.strings[0].id, "a");
    k.strings[0].count = count_a;
    snprintf(k.strings[1].id, sizeof k.strings[1].id, "b");
    k.strings[1].count = count_b;
    snprintf(k.strings[2].id, sizeof k.strings[2].id, "c");
    k.strings[2].count = count_c;
    k.nstr = 3;
    snprintf(k.condition, sizeof k.condition, "%s", condition);
    return k;
}

int main(void)
{
    /* --- matches_at() / count_matches(): a literal and a wildcard pattern ------------------ */
    {
        struct pattern d;
        memset(&d, 0, sizeof d);
        memcpy(d.bytes, "MA", 2);
        d.wildcard[0] = 0;
        d.wildcard[1] = 1;              /* "M??" i.e. M followed by any byte */
        d.len = 2;
        unsigned char v1[3] = { 'M', 'X', 0 };
        CHECK_EQ_INT(matches_at(v1, &d), 1);
        unsigned char v2[3] = { 'N', 'X', 0 };
        CHECK_EQ_INT(matches_at(v2, &d), 0);

        const unsigned char hay[10] = { 'x', 'M', 'A', 'x', 'M', 'B', 'x', 'M', 'Z', 'x' };
        CHECK_EQ_INT(count_matches(hay, 10, &d), 3);              /* MA, MB, MZ all match "M??" */

        struct pattern too_long;
        memset(&too_long, 0, sizeof too_long);
        too_long.len = 20;
        CHECK_EQ_INT(count_matches(hay, 10, &too_long), 0);        /* pattern longer than buffer */
    }

    /* --- evaluate_condition(): literals ----------------------------------------------------- */
    {
        struct rule k = make_rule("true", 0, 0, 0);
        CHECK_EQ_INT(evaluate_condition(&k), 1);
        k = make_rule("false", 0, 0, 0);
        CHECK_EQ_INT(evaluate_condition(&k), 0);
    }

    /* --- evaluate_condition(): $id presence ------------------------------------------------- */
    {
        struct rule k = make_rule("$a", 1, 0, 0);
        CHECK_EQ_INT(evaluate_condition(&k), 1);
        k = make_rule("$a", 0, 0, 0);
        CHECK_EQ_INT(evaluate_condition(&k), 0);
    }

    /* --- evaluate_condition(): and / or / not, and operator precedence --------------------- */
    {
        struct rule k = make_rule("$a and $b", 1, 1, 0);
        CHECK_EQ_INT(evaluate_condition(&k), 1);
        k = make_rule("$a and $b", 1, 0, 0);
        CHECK_EQ_INT(evaluate_condition(&k), 0);
        k = make_rule("$a or $b", 0, 1, 0);
        CHECK_EQ_INT(evaluate_condition(&k), 1);
        k = make_rule("$a or $b", 0, 0, 0);
        CHECK_EQ_INT(evaluate_condition(&k), 0);
        k = make_rule("not $a", 0, 0, 0);
        CHECK_EQ_INT(evaluate_condition(&k), 1);
        k = make_rule("not $a and $b", 0, 1, 0);      /* 'not' binds tighter than 'and' */
        CHECK_EQ_INT(evaluate_condition(&k), 1);
        k = make_rule("($a or $b) and not $c", 1, 0, 1);
        CHECK_EQ_INT(evaluate_condition(&k), 0);        /* $c present: 'not $c' fails */
        k = make_rule("($a or $b) and not $c", 1, 0, 0);
        CHECK_EQ_INT(evaluate_condition(&k), 1);
    }

    /* --- evaluate_condition(): #id <op> n (a count comparison) ------------------------------ */
    {
        struct rule k = make_rule("#a >= 3", 3, 0, 0);
        CHECK_EQ_INT(evaluate_condition(&k), 1);
        k = make_rule("#a >= 3", 2, 0, 0);
        CHECK_EQ_INT(evaluate_condition(&k), 0);
        k = make_rule("#a == 0", 0, 0, 0);
        CHECK_EQ_INT(evaluate_condition(&k), 1);
        k = make_rule("#a < 5", 4, 0, 0);
        CHECK_EQ_INT(evaluate_condition(&k), 1);
    }

    /* --- evaluate_condition(): "n of them" / "all of them" / "any of them" ------------------ */
    {
        struct rule k = make_rule("2 of them", 1, 1, 0);          /* a and b present, c absent */
        CHECK_EQ_INT(evaluate_condition(&k), 1);
        k = make_rule("2 of them", 1, 0, 0);
        CHECK_EQ_INT(evaluate_condition(&k), 0);
        k = make_rule("all of them", 1, 1, 1);
        CHECK_EQ_INT(evaluate_condition(&k), 1);
        k = make_rule("all of them", 1, 1, 0);
        CHECK_EQ_INT(evaluate_condition(&k), 0);
        k = make_rule("any of them", 0, 0, 1);
        CHECK_EQ_INT(evaluate_condition(&k), 1);
        k = make_rule("any of them", 0, 0, 0);
        CHECK_EQ_INT(evaluate_condition(&k), 0);
    }

    /* --- evaluate_condition(): syntax errors return -1 --------------------------------------- */
    {
        struct rule k = make_rule("$a and", 1, 0, 0);              /* incomplete */
        CHECK_EQ_INT(evaluate_condition(&k), -1);
        k = make_rule("$z", 0, 0, 0);                                /* undefined string id */
        CHECK_EQ_INT(evaluate_condition(&k), -1);
        k = make_rule("$a $b", 1, 1, 0);                             /* no operator between them */
        CHECK_EQ_INT(evaluate_condition(&k), -1);
    }

    TEST_SUMMARY();
}
