/* Unit tests for week-04/01-format-string/leak_secure.c.
 *
 * text_length_ok() is a pure, bounded string check (strlen only) — safe to call in-process with
 * any string, including a format-specifier-laden one: it never passes the string to printf as a
 * format argument, so there is nothing here that could read or write memory the way the
 * vulnerable leak.c does. leak.c itself is NOT exercised in-process for exactly that reason (see
 * the end-to-end tests in CMakeLists.txt, which run its real, separate OS process instead). Every
 * expected value below is reasoned out by hand, never taken from text_length_ok()'s own output.
 */
#define main program_main
#include "../leak_secure.c"
#undef main
#include "../../../common/test_check.h"

int main(void)
{
    /* normal */
    CHECK_EQ_INT(text_length_ok("Hello"), 1);                 /* 5 chars: well under 64 */
    CHECK_EQ_INT(text_length_ok("a"), 1);                      /* 1 char */
    CHECK_EQ_INT(text_length_ok(" "), 1);                      /* a single space */

    /* empty */
    CHECK_EQ_INT(text_length_ok(""), 1);                       /* 0 chars: accepted (no minimum) */

    /* boundary: 62 / 63 (still valid) vs 64 / 65 (one and two over) */
    {
        char s62[63], s63[64], s64[65], s65[66];
        memset(s62, 'a', 62); s62[62] = '\0';
        memset(s63, 'a', 63); s63[63] = '\0';
        memset(s64, 'a', 64); s64[64] = '\0';
        memset(s65, 'a', 65); s65[65] = '\0';
        CHECK_EQ_INT(text_length_ok(s62), 1);                  /* 62 < 64: valid */
        CHECK_EQ_INT(text_length_ok(s63), 1);                  /* 63 < 64: still valid (max accepted) */
        CHECK_EQ_INT(text_length_ok(s64), 0);                  /* 64 >= 64: rejected */
        CHECK_EQ_INT(text_length_ok(s65), 0);                  /* 65 >= 64: rejected */
    }

    /* too-long */
    {
        char hundred[101], thousand[1001];
        memset(hundred, 'x', 100); hundred[100] = '\0';
        memset(thousand, 'x', 1000); thousand[1000] = '\0';
        CHECK_EQ_INT(text_length_ok(hundred), 0);              /* 100 chars: rejected */
        CHECK_EQ_INT(text_length_ok(thousand), 0);             /* 1000 chars: rejected */
    }

    /* format specifiers are just characters to this check: length is all that matters here.
       The actual defense against %n/%x is printf("%s", ...) in main(), not this function — these
       cases document that text_length_ok() does not special-case them. */
    CHECK_EQ_INT(text_length_ok("%n%n%n%n"), 1);                /* 8 chars: still short */
    CHECK_EQ_INT(text_length_ok("%x.%x.%x.%x.%x.%x.%x.%x.%x.%x."), 1); /* 30 chars: short */
    {
        char many[65];  /* 64 copies of "%x" would be 128 chars; build a 64-char run instead */
        int i;
        for (i = 0; i < 32; i++) { many[2 * i] = '%'; many[2 * i + 1] = 'x'; }
        many[64] = '\0';
        CHECK_EQ_INT(text_length_ok(many), 0);                 /* 64 chars of "%x" pairs: rejected */
    }

    /* multi-byte (UTF-8) content: strlen counts bytes, not code points */
    {
        /* "cafe" with a combining accent byte sequence, well under the byte limit */
        char accented[] = "caf\xC3\xA9";  /* "café" in UTF-8 (2-byte accented e) */
        CHECK_EQ_INT(text_length_ok(accented), 1);
    }
    CHECK_EQ_INT(text_length_ok("normal input, no attack"), 1); /* 24 chars: ordinary sentence */

    TEST_SUMMARY();
}
