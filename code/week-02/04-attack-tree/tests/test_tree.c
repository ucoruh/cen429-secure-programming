/* Unit tests for week-02/04-attack-tree/tree.c.
 *
 * count_indent() is a pure function. compute() walks the file-scope `nodes[]` array, which this
 * test builds directly (bypassing the text-file parser) -- the same trick used by the other
 * demos' static-state tests. Every expected cost/time/skill below is worked out by hand from the
 * AND (sum) / OR (minimum) rule stated in the file's own header comment.
 */
#define main program_main
#include "../tree.c"
#undef main
#include "../../../common/test_check.h"
#include <stdarg.h>

/* Adds a LEAF node and returns its index. */
static int add_leaf(const char *name, int cost, int time, int skill)
{
    struct node *x = &nodes[node_count];
    memset(x, 0, sizeof *x);
    x->type = LEAF;
    snprintf(x->name, sizeof x->name, "%s", name);
    x->cost = cost;
    x->time = time;
    x->skill = skill;
    x->cheapest_child = -1;
    return node_count++;
}

/* Adds an AND/OR node with the given children and returns its index. */
static int add_internal(enum node_type t, const char *name, int n, ...)
{
    struct node *x = &nodes[node_count];
    memset(x, 0, sizeof *x);
    x->type = t;
    snprintf(x->name, sizeof x->name, "%s", name);
    x->cheapest_child = -1;
    va_list ap;
    va_start(ap, n);
    for (int i = 0; i < n; i++)
        x->children[x->child_count++] = va_arg(ap, int);
    va_end(ap);
    return node_count++;
}

int main(void)
{
    /* --- count_indent(): normal, zero, boundary -------------------------------------------- */
    CHECK_EQ_INT(count_indent(""), 0);
    CHECK_EQ_INT(count_indent("x"), 0);
    CHECK_EQ_INT(count_indent(" x"), 0);              /* 1 space: not a full level (integer /2) */
    CHECK_EQ_INT(count_indent("  x"), 1);
    CHECK_EQ_INT(count_indent("    x"), 2);
    CHECK_EQ_INT(count_indent("      x"), 3);

    /* --- compute(): a single LEAF root ------------------------------------------------------ */
    node_count = 0;
    add_leaf("Guess a weak password", 5, 1, 1);
    CHECK_EQ_INT(compute(0), 5);

    /* --- compute(): OR picks the cheaper branch, and records which one --------------------- */
    node_count = 0;
    {
        int cheap = add_leaf("Phishing", 5, 2, 1);
        int expensive = add_leaf("Zero-day exploit", 40, 10, 5);
        int root = add_internal(OR, "Goal", 2, cheap, expensive);
        CHECK_EQ_INT(compute(root), 5);
        CHECK_EQ_INT(nodes[root].cheapest_child, cheap);
        CHECK_EQ_INT(nodes[root].time, 2);              /* the chosen branch's own attributes */
        CHECK_EQ_INT(nodes[root].skill, 1);
    }

    /* --- compute(): AND sums cost/time, takes the HIGHEST skill ----------------------------- */
    node_count = 0;
    {
        int a = add_leaf("Get root", 3, 2, 3);
        int b = add_leaf("Find the DB key", 6, 5, 2);
        int root = add_internal(AND, "Decrypt", 2, a, b);
        CHECK_EQ_INT(compute(root), 9);                  /* 3 + 6 */
        CHECK_EQ_INT(nodes[root].time, 7);               /* 2 + 5 */
        CHECK_EQ_INT(nodes[root].skill, 3);              /* max(3, 2) */
    }

    /* --- compute(): a mixed 3-level tree, hand-computed ------------------------------------- */
    node_count = 0;
    {
        int a = add_leaf("Get root", 3, 1, 1);
        int b = add_leaf("Find the DB key", 6, 1, 1);
        int decrypt = add_internal(AND, "Decrypt the database", 2, a, b);   /* cost 9 */
        int steal = add_leaf("Steal a backup tape", 8, 1, 1);
        int root = add_internal(OR, "Obtain the payment key", 2, decrypt, steal);
        CHECK_EQ_INT(compute(root), 8);                  /* min(9, 8) = 8 */
        CHECK_EQ_INT(nodes[root].cheapest_child, steal);
    }

    /* --- compute(): a tie keeps the FIRST child (strict '<', not '<=') --------------------- */
    node_count = 0;
    {
        int x = add_leaf("Path X", 10, 0, 0);
        int y = add_leaf("Path Y", 10, 0, 0);
        int root = add_internal(OR, "Goal", 2, x, y);
        CHECK_EQ_INT(compute(root), 10);
        CHECK_EQ_INT(nodes[root].cheapest_child, x);

    }

    /* --- compute(): edge case, an OR node with no children at all (invalid/empty structure) - */
    node_count = 0;
    {
        int root = add_internal(OR, "Empty goal", 0);
        CHECK_EQ_INT(compute(root), INF_COST);
        CHECK_EQ_INT(nodes[root].cheapest_child, -1);
    }

    TEST_SUMMARY();
}
