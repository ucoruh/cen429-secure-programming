/* Unit tests for week-01/04-signed-length/copy_secure.c's read_length().
 *
 * read_length() only ever writes through `result` after strtol() and a range check have both
 * succeeded, so it is safe to call with any text, including garbage and huge numbers.
 * Every expected (rc, value) pair is reasoned out by hand from strtol()'s documented behaviour
 * (skips leading whitespace, accepts a leading sign, stops at the first non-digit, sets errno on
 * overflow) and from read_length()'s own bound check (0 <= value <= RECORD_SIZE) — never taken
 * from a prior call to read_length() itself.
 */
#define main program_main
#include "../copy_secure.c"
#undef main
#include "../../../common/test_check.h"

static void check_accepted(const char *text, size_t expected)
{
    size_t result = (size_t)-1;
    CHECK_EQ_INT(read_length(text, &result), 0);
    CHECK_EQ_INT(result, expected);
}

static void check_rejected(const char *text)
{
    size_t result = 999;
    CHECK_EQ_INT(read_length(text, &result), -1);
}

int main(void)
{
    /* normal / boundary */
    check_accepted("8", 8);
    check_accepted("0", 0);                  /* lower bound */
    check_accepted("16", 16);                /* upper bound == RECORD_SIZE */
    check_accepted("+8", 8);                 /* strtol accepts a leading '+' */
    check_accepted("016", 16);               /* base is explicitly 10: no octal reinterpretation */
    check_accepted("   8", 8);               /* strtol skips LEADING whitespace */

    /* too-long / out of range */
    check_rejected("17");                    /* one past RECORD_SIZE */
    check_rejected("1000");
    check_rejected("99999999999999999999");  /* overflows long: errno == ERANGE */

    /* negative — safe to test here: read_length rejects it before it ever reaches memcpy */
    check_rejected("-1");

    /* invalid / not a number */
    check_rejected("");                      /* empty: end == text */
    check_rejected("abc");                   /* no digits at all */
    check_rejected("12abc");                 /* trailing garbage after a valid number */
    check_rejected("16 ");                   /* TRAILING whitespace is NOT skipped: *end != '\0' */

    TEST_SUMMARY();
}
