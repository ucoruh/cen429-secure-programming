/* Unit tests for week-01/04-signed-length/copy.c's copy_record().
 *
 * copy_record() only checks the UPPER bound (`length > RECORD_SIZE`); a NEGATIVE length passes
 * that check and reaches memcpy() with a size_t built from a negative int, which is exactly the
 * bug this demo teaches — and exactly why it is never called with a negative length here: doing
 * that in-process would corrupt this test binary's own memory. That input is exercised only
 * end-to-end, against the real `copy` process (see CMakeLists.txt), where a crash just fails that
 * one OS process instead of the whole test run.
 *
 * Every expected value is a literal, hand-transcribed prefix/suffix of `source` or of the sentinel
 * pattern — never a value read back from copy_record()'s own output.
 */
#define main program_main
#include "../copy.c"
#undef main
#include "../../../common/test_check.h"
#include <string.h>

/* Same 16 bytes ("SAMPLE-RECORD-1" + the implicit NUL) that main() uses, written out here
 * independently rather than shared with copy.c. */
static const char SOURCE[RECORD_SIZE] = "SAMPLE-RECORD-1";
/* 0x55 (not 0xEE): a value that fits in a plain (signed-by-default-on-MSVC) `char` without a
 * narrowing-conversion warning, still clearly not real record content and not NUL. */
static const char SENTINEL[RECORD_SIZE] = {
    0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55,
    0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55
};

static void check_accepted(int length)
{
    char dest[RECORD_SIZE];
    memcpy(dest, SENTINEL, RECORD_SIZE);
    CHECK_EQ_INT(copy_record(dest, SOURCE, length), 0);
    CHECK_MEM(dest, SOURCE, (size_t)length);                                 /* copied prefix */
    CHECK_MEM(dest + length, SENTINEL + length, RECORD_SIZE - length);       /* untouched tail */
}

static void check_rejected(int length)
{
    char dest[RECORD_SIZE];
    memcpy(dest, SENTINEL, RECORD_SIZE);
    CHECK_EQ_INT(copy_record(dest, SOURCE, length), -1);
    CHECK_MEM(dest, SENTINEL, RECORD_SIZE);                                  /* memcpy never ran */
}

int main(void)
{
    /* normal / boundary: 0 (empty copy), 1, 5 (partial), 15, 16 (== RECORD_SIZE, full copy) */
    check_accepted(0);
    check_accepted(1);
    check_accepted(5);
    check_accepted(15);
    check_accepted(16);

    /* too-long: rejected before memcpy ever runs */
    check_rejected(17);
    check_rejected(18);
    check_rejected(1000);

    TEST_SUMMARY();
}
