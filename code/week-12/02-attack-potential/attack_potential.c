/*
 * CEN429 - Week 12 - Demo 2: Attack potential calculator (simplified).
 * Sums points from five factors (elapsed time, expertise, knowledge of the TOE,
 * window of opportunity, equipment) and maps the total to a resistance rating.
 * LOW total = easy attack = SERIOUS finding.
 * (A simplified, teaching version of a Common Criteria / JIL-style scale.)
 *
 * Usage: attack_potential                  -> built-in example findings
 *        attack_potential t e k w q        -> factor levels (indices, e.g. 0..3)
 * SAFE: pure computation; no file/network/system access.
 */
#include <stdio.h>
#include <stdlib.h>

/* Points per level for each factor (index -> points). */
static const int ELAPSED_TIME[] = {0, 4, 10, 19};   /* <1 day, <1 week, <1 month, months */
static const int EXPERTISE[]    = {0, 3, 6, 8};     /* layman, proficient, expert, multiple experts */
static const int KNOWLEDGE[]    = {0, 3, 7, 11};    /* public, restricted, sensitive, critical */
static const int OPPORTUNITY[]  = {0, 4, 10};       /* unlimited/remote, restricted, very restricted */
static const int EQUIPMENT[]    = {0, 4, 7};        /* standard/free, specialized, bespoke */

/* Pure sum, independent of printing -- this is what the unit tests call directly. */
static int compute_score(int t, int e, int k, int w, int q)
{
    return ELAPSED_TIME[t] + EXPERTISE[e] + KNOWLEDGE[k] + OPPORTUNITY[w] + EQUIPMENT[q];
}

static const char *rating(int p)
{
    if (p <= 9)  return "BASIC      (low resistance -> SERIOUS finding)";
    if (p <= 13) return "MODERATE";
    if (p <= 19) return "HIGH";
    if (p <= 24) return "VERY HIGH";
    return "BEYOND     (only a highly capable attacker)";
}

static int safe_index(const char *s, int n)
{
    int v = atoi(s); if (v < 0) v = 0; if (v >= n) v = n - 1; return v;
}

static void compute(const char *name, int t, int e, int k, int w, int q)
{
    int p = compute_score(t, e, k, w, q);
    printf("  %-32s score=%2d -> %s\n", name, p, rating(p));
}

int main(int argc, char **argv)
{
    printf("=== Attack potential ===\n");
    if (argc >= 6) {
        compute("(entered)",
                safe_index(argv[1], 4), safe_index(argv[2], 4), safe_index(argv[3], 4),
                safe_index(argv[4], 3), safe_index(argv[5], 3));
        return 0;
    }
    /* Built-in example findings (the scenarios from the slides). */
    printf(" Example findings:\n");
    compute("License check one-byte patch",     0, 1, 0, 0, 0);   /* hour/proficient/public/remote/free */
    compute("White-box key extraction (DCA)",   2, 3, 2, 1, 1);   /* month/expert/sensitive/restricted/specialized */
    compute("Secure element key extraction",    3, 3, 3, 2, 2);   /* months/multiple experts/critical/... */
    printf(" Note: LOW score = easy attack = the first finding to close. Prioritized together with CVSS.\n");
    return 0;
}
