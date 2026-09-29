/* Unit tests for week-11/01-toy-table/toy_table.c.
 *
 * S, E, Sinv, build_tables(), naive_table(), encoded_table() and naive_recover() are all pure
 * (no file/network/global state beyond the module's own static tables) and safe to call in-process.
 * Every expected value below is computed independently, by hand, from the formulas printed in the
 * source's own comments (S[x] = (167*x+13) & 0xFF, E[x] = (91*x+7) & 0xFF) — never by calling the
 * function under test and trusting its own output.
 */
#define main program_main
#include "../toy_table.c"
#undef main
#include "../../../common/test_check.h"

/* Independent (re-derived by hand, not read from the module's S[]/E[] tables) */
static unsigned char ref_S(int x) { return (unsigned char)((167 * x + 13) & 0xFF); }
static unsigned char ref_E(int x) { return (unsigned char)((91 * x + 7) & 0xFF); }

int main(void)
{
    build_tables();

    /* --- normal: S-box formula, a handful of spot values ------------------------------------ */
    CHECK_EQ_INT(S[0], ref_S(0));
    CHECK_EQ_INT(S[1], ref_S(1));
    CHECK_EQ_INT(S[0x3C], ref_S(0x3C));
    CHECK_EQ_INT(S[0x55], ref_S(0x55));
    CHECK_EQ_INT(S[255], ref_S(255));          /* boundary: last index */

    /* --- normal: E (secret output encoding) formula, a handful of spot values --------------- */
    CHECK_EQ_INT(E[0], ref_E(0));
    CHECK_EQ_INT(E[1], ref_E(1));
    CHECK_EQ_INT(E[0x3C], ref_E(0x3C));
    CHECK_EQ_INT(E[255], ref_E(255));          /* boundary: last index */

    /* --- S is a bijection: Sinv must undo S for every one of the 256 possible bytes --------- */
    {
        int x, all_ok = 1;
        for (x = 0; x < 256; x++)
            if (Sinv[S[(unsigned char)x]] != (unsigned char)x) all_ok = 0;
        CHECK(all_ok);
    }

    /* --- naive_table(k): T[x] must equal S[x ^ k] for the demo's own key and boundary keys --- */
    {
        unsigned char T[256];
        naive_table(0x3C, T);
        CHECK_EQ_INT(T[0], ref_S(0 ^ 0x3C));
        CHECK_EQ_INT(T[1], ref_S(1 ^ 0x3C));
        CHECK_EQ_INT(T[0x3C], ref_S(0x3C ^ 0x3C));   /* x == k: S[0] */
        CHECK_EQ_INT(T[255], ref_S(255 ^ 0x3C));     /* boundary index */

        naive_table(0x00, T);                         /* edge: zero key -> table equals S itself */
        CHECK_EQ_INT(T[7], ref_S(7));
        CHECK_EQ_INT(T[255], ref_S(255));
    }

    /* --- encoded_table(k): T2[x] must equal E[S[x ^ k]] ------------------------------------- */
    {
        unsigned char T2[256];
        encoded_table(0x3C, T2);
        CHECK_EQ_INT(T2[0], ref_E(ref_S(0 ^ 0x3C)));
        CHECK_EQ_INT(T2[1], ref_E(ref_S(1 ^ 0x3C)));
        CHECK_EQ_INT(T2[255], ref_E(ref_S(255 ^ 0x3C)));
    }

    /* --- naive_recover on the NAIVE table: must succeed and return the exact key ------------ */
    {
        unsigned char T[256];
        int k_out = -1;

        naive_table(0x3C, T);
        CHECK_EQ_INT(naive_recover(T, &k_out), 1);
        CHECK_EQ_INT(k_out, 0x3C);

        naive_table(0x00, T);                          /* edge: zero key */
        CHECK_EQ_INT(naive_recover(T, &k_out), 1);
        CHECK_EQ_INT(k_out, 0x00);

        naive_table(0xFF, T);                          /* edge: maximum key byte */
        CHECK_EQ_INT(naive_recover(T, &k_out), 1);
        CHECK_EQ_INT(k_out, 0xFF);
    }

    /* --- naive_recover on the ENCODED table: must FAIL for every key tried ------------------ */
    {
        unsigned char T2[256];
        int k_out = -1;

        encoded_table(0x3C, T2);
        CHECK_EQ_INT(naive_recover(T2, &k_out), 0);

        encoded_table(0x00, T2);                        /* edge: zero key, still encoded */
        CHECK_EQ_INT(naive_recover(T2, &k_out), 0);

        encoded_table(0xFF, T2);
        CHECK_EQ_INT(naive_recover(T2, &k_out), 0);
    }

    /* --- the two tables differ (the encoding actually changes the bytes on the wire) -------- */
    {
        unsigned char T[256], T2[256];
        naive_table(0x3C, T);
        encoded_table(0x3C, T2);
        CHECK(T[0] != T2[0] || T[1] != T2[1] || T[2] != T2[2]);
    }

    TEST_SUMMARY();
}
