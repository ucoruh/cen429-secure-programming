/* Unit tests for week-13/02-requirement-quality/requirement_quality.c.
 *
 * to_lower(), contains_any(), has_digit() and check_requirement() are pure text checks: no file,
 * network or system call. Expected values below are decided by reading the VAGUE_PHRASES /
 * CONCRETE_TERMS lists in the source, never by calling check_requirement() on different text and
 * trusting its own answer.
 */
#define main program_main
#include "../requirement_quality.c"
#undef main
#include "../../../common/test_check.h"

int main(void)
{
    /* --- to_lower(): normal, already-lower, boundary buffer, empty -------------------------- */
    {
        char out[32];
        to_lower("Hello World", out, sizeof out);
        CHECK_EQ_STR(out, "hello world");
    }
    {
        char out[32];
        to_lower("already lower", out, sizeof out);
        CHECK_EQ_STR(out, "already lower");
    }
    {
        char out[6];                         /* smaller than the input: must truncate, not overflow */
        to_lower("ABCDEFGH", out, sizeof out);
        CHECK_EQ_INT((int) strlen(out), 5);
        CHECK_EQ_STR(out, "abcde");
    }
    {
        char out[8];
        to_lower("", out, sizeof out);
        CHECK_EQ_STR(out, "");
    }

    /* --- has_digit(): normal, none, boundary (digit only at the very end), empty ------------ */
    {
        CHECK_EQ_INT(has_digit("128-bit"), 1);
        CHECK_EQ_INT(has_digit("no digits here"), 0);
        CHECK_EQ_INT(has_digit("ends in 9"), 1);
        CHECK_EQ_INT(has_digit(""), 0);
    }

    /* --- contains_any(): normal hit, no hit, hit at the very first list entry, empty haystack */
    {
        CHECK_EQ_INT(contains_any("uses aes-gcm here", CONCRETE_TERMS), 1);
        CHECK_EQ_INT(contains_any("nothing concrete", CONCRETE_TERMS), 0);
        CHECK_EQ_INT(contains_any("should be secure please", VAGUE_PHRASES), 1);
        CHECK_EQ_INT(contains_any("", VAGUE_PHRASES), 0);
    }

    /* --- check_requirement(): the rule's four combinations, plus the sample sentences ------- */
    {
        /* vague AND not measurable -> WEAK, reason "vague phrase". */
        int weak = check_requirement("The application should be secure.");
        CHECK_EQ_INT(weak, 1);
    }
    {
        /* vague word present even though a number also appears -> still WEAK (vague wins the
           message, but the row is weak either way). */
        int weak = check_requirement("Keys should be well managed with 256 bit keys.");
        CHECK_EQ_INT(weak, 1);
    }
    {
        /* not vague, and a concrete technical term makes it measurable -> OK. */
        int weak = check_requirement("The build must use PIE and full RELRO.");
        CHECK_EQ_INT(weak, 0);
    }
    {
        /* not vague, and a bare number makes it measurable -> OK. */
        int weak = check_requirement("The session must expire after 15 minutes of inactivity.");
        CHECK_EQ_INT(weak, 0);
    }
    {
        /* not vague, but no number and no concrete term -> WEAK, reason "no measurable basis". */
        int weak = check_requirement("The interface must look clean and modern.");
        CHECK_EQ_INT(weak, 1);
    }
    {
        /* Case-insensitivity: an upper-case vague phrase is still caught. */
        int weak = check_requirement("Data SHOULD BE SECURE at all times.");
        CHECK_EQ_INT(weak, 1);
    }
    {
        /* The exact five sample sentences main() prints when run with no arguments: three weak,
           two OK (independently re-derived from the VAGUE_PHRASES / CONCRETE_TERMS lists, not by
           calling main() itself). */
        static const char *sample[] = {
            "The application should be secure.",
            "Keys should be well managed.",
            "The release build must be produced with a stack protector, PIE and full RELRO.",
            "Every Class C asset at rest must be encrypted with at least 128-bit AES-GCM.",
            "Data should be stored properly.",
        };
        static const int expected_weak[] = {1, 1, 0, 0, 1};
        int total_weak = 0;
        for (int i = 0; i < 5; i++) {
            int weak = check_requirement(sample[i]);
            CHECK_EQ_INT(weak, expected_weak[i]);
            total_weak += weak;
        }
        CHECK_EQ_INT(total_weak, 3);
    }

    TEST_SUMMARY();
}
