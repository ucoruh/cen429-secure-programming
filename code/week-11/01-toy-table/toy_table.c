/*
 * CEN429 - Week 11 - Demo 1: toy whitebox table (DEFENSIVE lesson)
 *
 * Goal: SEE, in a small synthetic example, the rule "folding a key into a lookup table does NOT
 * hide the key UNLESS the table is also encoded." This is NOT real WB-AES or a real attack tool;
 * it shows the concept on a toy 8-bit box.
 *
 * Setup (the miniature of the slide deck's 5 steps):
 *   - There is a public S-box (S) - not secret.
 *   - There is a secret key byte k.
 *   - A miniature of one AES round:  output = S[x XOR k].
 *   - NAIVE table:    T[x]  = S[x XOR k]           -> the key LEAKS
 *   - ENCODED table:  T2[x] = E( S[x XOR k] )      -> naive recovery FAILS
 *
 * SAFETY: every value is synthetic; no file/network/system operation.
 */
#include <stdio.h>

/* Public S-box: an affine transform with an odd multiplier is a bijection over 0..255. We use this
   instead of copying the real AES S-box, to keep the bijection property without reproducing it. */
static unsigned char S[256], Sinv[256];
/* Secret output encoding E is also a bijection (odd multiplier 91). In WBC this is the
   "input/output encoding" step. */
static unsigned char E[256];

static void build_tables(void)
{
    for (int x = 0; x < 256; x++) {
        S[x] = (unsigned char)((167 * x + 13) & 0xFF);
        E[x] = (unsigned char)((91 * x + 7) & 0xFF);
    }
    for (int x = 0; x < 256; x++) Sinv[S[x]] = (unsigned char)x;
}

/* Step 1: "cook" the key into the table -> T[x] = S[x ^ k]  (NO encoding) */
static void naive_table(unsigned char k, unsigned char T[256])
{
    for (int x = 0; x < 256; x++) T[x] = S[x ^ k];
}

/* Steps 3-5: apply a secret encoding to the output -> T2[x] = E[S[x ^ k]] */
static void encoded_table(unsigned char k, unsigned char T2[256])
{
    for (int x = 0; x < 256; x++) T2[x] = E[S[x ^ k]];
}

/*
 * NAIVE RECOVERY (for this lesson only, to test the defense):
 * "T is the known S, shifted by x^k." For every x, check whether Sinv[T[x]] ^ x stays constant;
 * if it does, that constant is the key.
 * In the encoded table, Sinv[T2[x]] no longer corresponds to S's inverse -> the value is not
 * constant -> recovery collapses.
 */
static int naive_recover(const unsigned char T[256], int *k_out)
{
    int k0 = Sinv[T[0]] ^ 0;
    for (int x = 1; x < 256; x++)
        if ((Sinv[T[x]] ^ x) != k0) return 0;   /* not constant -> could not recover */
    *k_out = k0;
    return 1;
}

int main(void)
{
    build_tables();
    unsigned char k = 0x3C;   /* secret key (synthetic) */
    unsigned char T[256], T2[256];
    int found;

    printf("=== Toy whitebox table (defensive lesson) ===\n");
    printf("Secret key (for verification only): k = 0x%02X\n\n", k);

    naive_table(k, T);
    printf("[1] NAIVE table  T[x] = S[x ^ k]  (NO encoding)\n");
    if (naive_recover(T, &found))
        printf("    -> Naive recovery FOUND the key: 0x%02X  ==> KEY LEAKED.\n\n", found);
    else
        printf("    -> Recovery failed.\n\n");

    encoded_table(k, T2);
    printf("[2] ENCODED table  T2[x] = E[S[x ^ k]]  (secret output encoding)\n");
    if (naive_recover(T2, &found))
        printf("    -> Naive recovery found: 0x%02X\n", found);
    else
        printf("    -> Naive recovery FAILED. The key cannot be read directly from this table.\n\n");

    printf("LESSON:\n");
    printf("  * Folding the key into a table alone is not enough; an unencoded table gives the key away.\n");
    printf("  * Input/output encoding stops naive reading -- but published WBC designs were still\n");
    printf("    broken by general attacks such as DCA/DFA (see the slides). WBC = a LAYER, not a solution.\n");
    return 0;
}
