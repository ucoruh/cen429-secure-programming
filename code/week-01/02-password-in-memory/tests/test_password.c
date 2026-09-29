/* Unit tests for week-01/02-password-in-memory/password.c.
 *
 * derive_key(), log_in() and deep_call_chain() are all safe to call in-process: none of them can
 * write past a buffer they own (log_in's file read is bounded by sizeof(password)-1), so there is
 * no risk of corrupting the test binary itself.
 *
 * Every expected value below is computed independently of derive_key(): the small ones by hand
 * (shown in a comment), the larger ones with reference_hash(), a *different* expression of the
 * same djb2-style hash (h = (h<<5)+h+c instead of h = h*33+c) written only in this file — never by
 * calling derive_key()/log_in() and trusting whatever they happen to return.
 */
#define main program_main
#include "../password.c"
#undef main
#include "../../../common/test_check.h"

/* Independent reference implementation: (h<<5)+h+c == h*33+c, but expressed differently on
 * purpose. Uses the platform's native `unsigned long` width, same as derive_key(), so the 32-bit
 * (Windows/LLP64) vs 64-bit (Linux/LP64) wraparound always matches automatically. */
static unsigned long reference_hash(const char *p, size_t n)
{
    unsigned long h = 5381;
    for (size_t i = 0; i < n; i++)
        h = (h << 5) + h + (unsigned char)p[i];
    return h;
}

int main(void)
{
    /* --- derive_key(): direct, hand-checked cases ------------------------------------------- */
    CHECK_EQ_INT(derive_key("", 0), 5381);                    /* empty: loop never runs */
    CHECK_EQ_INT(derive_key("A", 1), 177638);                 /* 5381*33 + 'A'(65) = 177638 */
    CHECK_EQ_INT(derive_key("AB", 2), 5862120);                /* 177638*33 + 'B'(66) = 5862120 */
    CHECK_EQ_INT(derive_key("ignored-content", 0), 5381);      /* n=0: buffer content must not matter */
    {
        /* -1 has the bit pattern 0xFF: checks derive_key()'s (unsigned char) cast handles the
         * top-bit-set byte as 255, not sign-extended to a negative value. Written as -1 (not
         * 0xFF) because 0xFF does not fit in a plain, signed-by-default `char` constant. */
        char one_byte[1] = { (char)-1 };
        CHECK_EQ_INT(derive_key(one_byte, 1), reference_hash(one_byte, 1));
    }
    CHECK_EQ_INT(derive_key("Secret-Password-2026", 21), reference_hash("Secret-Password-2026", 21));

    /* --- log_in(): normal, empty, boundary, too-long, invalid ------------------------------- */
    CHECK_EQ_INT(log_in("tests/fixtures/hello.txt"), reference_hash("hello", 5));          /* trailing \n stripped */
    CHECK_EQ_INT(log_in("tests/fixtures/world.txt"), reference_hash("world", 5));          /* no trailing newline */
    CHECK_EQ_INT(log_in("tests/fixtures/crlf.txt"), reference_hash("line", 4));            /* \r\n both stripped */
    CHECK_EQ_INT(log_in("tests/fixtures/empty.txt"), 0);                                    /* 0-byte file: hard 0 */
    CHECK_EQ_INT(log_in("tests/fixtures/allnewlines.txt"), 5381);   /* 3 bytes read, all stripped to n=0: NOT the
                                                                        same code path as an empty file — this one
                                                                        reaches derive_key(..., 0) == 5381, the
                                                                        empty-file case above returns a hardcoded 0 */
    CHECK_EQ_INT(log_in("tests/fixtures/does-not-exist.txt"), 0);   /* open() fails */
    CHECK_EQ_INT(log_in("tests"), 0);                                /* a directory, not a file: read() fails */
    {
        /* boundary63.txt is exactly 63 'x' bytes (generated, not hand-typed, to avoid a miscount). */
        char sixtythree_x[63];
        memset(sixtythree_x, 'x', sizeof(sixtythree_x));
        CHECK_EQ_INT(log_in("tests/fixtures/boundary63.txt"), reference_hash(sixtythree_x, 63));
    }
    {
        /* boundary64.txt has 64 'x' but the read buffer only holds sizeof(password)-1 == 63 bytes:
           the 64th 'x' must never be read. */
        char sixtythree_x[63];
        memset(sixtythree_x, 'x', sizeof(sixtythree_x));
        CHECK_EQ_INT(log_in("tests/fixtures/boundary64.txt"), reference_hash(sixtythree_x, 63));
    }
    {
        /* toolong200.txt has 200 'y'; same 63-byte cap applies, far past the boundary. */
        char sixtythree_y[63];
        memset(sixtythree_y, 'y', sizeof(sixtythree_y));
        CHECK_EQ_INT(log_in("tests/fixtures/toolong200.txt"), reference_hash(sixtythree_y, 63));
    }

    /* --- deep_call_chain(): wraps log_in(); checked against the SAME independent reference, not
       against log_in()'s own return value. --------------------------------------------------- */
    CHECK_EQ_INT(deep_call_chain("tests/fixtures/hello.txt"), reference_hash("hello", 5));
    CHECK_EQ_INT(deep_call_chain("tests/fixtures/does-not-exist.txt"), 0);

    TEST_SUMMARY();
}
