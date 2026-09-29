/* Unit tests for week-01/03-overflow-input/login_secure.c.
 *
 * name_is_valid() is a pure, bounded string check (strnlen caps the scan at 16, the loop only
 * reads the bytes strnlen found) — safe to call in-process with any string, including long ones.
 *
 * login.c (the vulnerable version) is deliberately NOT exercised here: even the "safe", documented
 * 17-character overflow only stays contained because it is run as its own OS process (see the
 * end-to-end tests in CMakeLists.txt). Calling that code path in-process, inside this same test
 * binary, would corrupt this test binary's own stack — exactly the bug the demo teaches, just in
 * the wrong process. Every expected value below is reasoned out by hand (shown in a comment),
 * never taken from name_is_valid()'s own output.
 */
#define main program_main
#include "../login_secure.c"
#undef main
#include "../../../common/test_check.h"

int main(void)
{
    /* normal */
    CHECK_EQ_INT(name_is_valid("a"), 1);                    /* 1 char, alnum: valid */
    CHECK_EQ_INT(name_is_valid("alice"), 1);                 /* ordinary lowercase name */
    CHECK_EQ_INT(name_is_valid("Bob42"), 1);                 /* mixed case + digits */
    CHECK_EQ_INT(name_is_valid("12345"), 1);                 /* digits only */
    CHECK_EQ_INT(name_is_valid("____"), 1);                  /* underscores only */
    CHECK_EQ_INT(name_is_valid("----"), 1);                  /* hyphens only */
    CHECK_EQ_INT(name_is_valid("a-b_c-d_e-f_g12"), 1);       /* 15 chars, mixed allowed set */

    /* empty */
    CHECK_EQ_INT(name_is_valid(""), 0);                      /* n == 0: rejected */

    /* boundary: exactly 15 (max valid) vs exactly 16 (one over) */
    CHECK_EQ_INT(name_is_valid("abcdefghij12345"), 1);       /* exactly 15 chars: still valid */
    CHECK_EQ_INT(name_is_valid("abcdefghij123456"), 0);      /* exactly 16 chars: n >= 16, rejected */

    /* too-long */
    {
        char hundred[101];
        memset(hundred, 'a', 100);
        hundred[100] = '\0';
        CHECK_EQ_INT(name_is_valid(hundred), 0);              /* 100 chars: rejected */
    }

    /* invalid characters */
    CHECK_EQ_INT(name_is_valid(" ab"), 0);                    /* leading space */
    CHECK_EQ_INT(name_is_valid("ab@cd"), 0);                  /* '@' not in the allow-list */
    CHECK_EQ_INT(name_is_valid("ab\ncd"), 0);                 /* embedded control character */
    CHECK_EQ_INT(name_is_valid("ab.cd"), 0);                  /* '.' not in the allow-list */
    {
        /* UTF-8 'e' with acute (bytes 0xC3 0xA9), written as -61/-87 since those bit patterns do
         * not fit in a plain, signed-by-default `char` constant. */
        char two_bytes[3] = { (char)-61, (char)-87, '\0' };
        CHECK_EQ_INT(name_is_valid(two_bytes), 0);            /* not alnum in the "C" locale */
    }

    TEST_SUMMARY();
}
