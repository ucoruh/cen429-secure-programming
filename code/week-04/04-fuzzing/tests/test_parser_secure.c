/* Unit tests for week-04/04-fuzzing/parser_secure.c.
 *
 * parse_document() checks both the remaining input length and the destination bound BEFORE any
 * access, so it is safe to call in-process with any byte array, including short, malformed or
 * adversarial ones — that is the whole point of the fix. parser.c's own parse_document() (same
 * name, the buggy version) is NOT exercised here: calling it in-process with a crafted input
 * would corrupt this test binary's own stack, exactly the bug this demo teaches, in the wrong
 * process (see the end-to-end / fuzz tests in CMakeLists.txt and demo.sh/demo.ps1, which run its
 * real, separate OS process — under ASan or the fuzzer — instead). Every expected value below is
 * reasoned out by hand from the format description, never taken from parse_document()'s own output.
 */
#define main program_main
#include "../parser_secure.c"
#undef main
#include "../../../common/test_check.h"

int main(void)
{
    /* empty */
    CHECK_EQ_INT(parse_document(NULL, 0), 0);                       /* n=0: rejected before any deref */

    /* too short for the 2-byte header (type + length) */
    {
        unsigned char d1[] = { 0x42 };
        CHECK_EQ_INT(parse_document(d1, 1), 0);                     /* n=1: header incomplete */
    }
    {
        unsigned char d1[] = { 0x00 };
        CHECK_EQ_INT(parse_document(d1, 1), 0);                     /* n=1, unrelated type: still 0 */
    }

    /* normal: unknown type is ignored regardless of what "length" would say */
    {
        unsigned char d[] = { 0x41, 0xFF };
        CHECK_EQ_INT(parse_document(d, 2), 0);                      /* type != 0x42: ignored */
    }

    /* normal: recognised type, length 0 */
    {
        unsigned char d[] = { 0x42, 0x00 };
        CHECK_EQ_INT(parse_document(d, 2), 0);                      /* length 0: returns 0 by definition */
    }

    /* normal: a small, well-formed record */
    {
        unsigned char d[] = { 0x42, 0x01, 0xAA };
        CHECK_EQ_INT(parse_document(d, 3), 0xAA);                   /* length 1: dest[0] = 0xAA = 170 */
    }
    {
        unsigned char d[] = { 0x42, 0x03, 'a', 'b', 'c' };
        CHECK_EQ_INT(parse_document(d, 5), 'a');                    /* length 3, input matches exactly */
    }

    /* boundary: length exactly 16 (fits dest[16]) with exactly enough input */
    {
        unsigned char d[18] = { 0x42, 16 };
        for (int i = 0; i < 16; i++) d[2 + i] = (unsigned char)(0x50 + i);
        CHECK_EQ_INT(parse_document(d, 18), 0x50);                  /* length == sizeof(dest): still valid */
    }

    /* invalid: length 17 (one past the 16-byte destination) */
    {
        unsigned char d[19] = { 0x42, 17 };
        CHECK_EQ_INT(parse_document(d, 19), -1);                    /* destination bound check rejects it */
    }

    /* invalid: length 16 claimed but input is one byte short */
    {
        unsigned char d[17] = { 0x42, 16 };
        CHECK_EQ_INT(parse_document(d, 17), -1);                    /* 2+16=18 > n=17: input bound check rejects it */
    }

    /* invalid: length says far more than the tiny input that follows */
    {
        unsigned char d[] = { 0x42, 10, 1, 2, 3 };                  /* claims 10, only 3 bytes follow */
        CHECK_EQ_INT(parse_document(d, 5), -1);
    }

    /* invalid: length (0xFF = 255) already exceeds the destination, checked before the input length */
    {
        unsigned char d[] = { 0x42, 0xFF };
        CHECK_EQ_INT(parse_document(d, 2), -1);
    }

    /* boundary: length 15 (one under the destination size), input matches exactly */
    {
        unsigned char d[17] = { 0x42, 15 };
        for (int i = 0; i < 15; i++) d[2 + i] = (unsigned char)(0x30 + i);
        CHECK_EQ_INT(parse_document(d, 17), 0x30);
    }

    /* invalid: header present but zero payload bytes follow for a nonzero length */
    {
        unsigned char d[] = { 0x42, 0x02 };
        CHECK_EQ_INT(parse_document(d, 2), -1);                    /* 2+2=4 > n=2: input bound check rejects it */
    }

    /* normal: unknown type short-circuits before length/bounds are even looked at */
    {
        unsigned char d[] = { 0x99, 0xFF };
        CHECK_EQ_INT(parse_document(d, 2), 0);                      /* type != 0x42: ignored regardless of "length" */
    }

    TEST_SUMMARY();
}
