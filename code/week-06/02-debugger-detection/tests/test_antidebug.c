/* Unit tests for week-06/02-debugger-detection/antidebug.c (Linux/WSL only: the testable pure
 * helpers, parse_tracer_pid() and parent_name_is_suspicious(), only exist in the non-Windows half
 * of the file; see CMakeLists.txt, which only builds this test on non-Windows platforms).
 *
 * Both helpers are pure text-parsing functions that take a fabricated string, never a real
 * /proc file, so every expected value below is hand-checked directly against the input text.
 */
#define main program_main
#include "../antidebug.c"
#undef main
#include "../../../common/test_check.h"

int main(void)
{
    /* --- parse_tracer_pid(): normal, zero, missing line, boundary positions, malformed -------- */
    CHECK_EQ_INT(parse_tracer_pid("TracerPid:\t0\n"), 0);                    /* no tracer */
    CHECK_EQ_INT(parse_tracer_pid("TracerPid:\t1234\n"), 1234);              /* traced by pid 1234 */
    CHECK_EQ_INT(parse_tracer_pid("TracerPid:\t99999\n"), 99999);            /* larger pid */
    CHECK_EQ_INT(
        parse_tracer_pid("Name:\tbash\nState:\tS (sleeping)\nTracerPid:\t42\nUid:\t1000\t1000\n"),
        42);                                                                  /* line in the middle */
    CHECK_EQ_INT(parse_tracer_pid("Name:\tbash\nState:\tS (sleeping)\n"), -1); /* line absent */
    CHECK_EQ_INT(parse_tracer_pid(""), -1);                                   /* empty text */
    CHECK_EQ_INT(parse_tracer_pid("TracerPid:\t0"), 0);                      /* no trailing newline */
    CHECK_EQ_INT(parse_tracer_pid("XTracerPid:\t7\n"), -1);                  /* not at line start: no match */
    CHECK_EQ_INT(parse_tracer_pid("TracerPid:\tnotanumber\n"), 0);           /* strtol on garbage -> 0 */
    CHECK_EQ_INT(parse_tracer_pid("TracerPid:0\n"), 0);                      /* no tab, still parses (space=0 digits skipped) */

    /* --- tracer_pid(): the real, live call (this test binary itself is not being traced by
       ctest) must report 0, exercising the real /proc/self/status read end to end. ------------- */
    CHECK_EQ_INT(tracer_pid(), 0);

    /* --- parent_name_is_suspicious(): normal, empty, NULL, exact and substring matches, clean -- */
    CHECK(!parent_name_is_suspicious(""));                       /* empty: not suspicious */
    CHECK(!parent_name_is_suspicious(NULL));                     /* NULL: not suspicious, no crash */
    CHECK(!parent_name_is_suspicious("bash"));                   /* normal shell: clean */
    CHECK(!parent_name_is_suspicious("systemd"));                /* normal init: clean */
    CHECK(parent_name_is_suspicious("gdb"));                     /* exact match */
    CHECK(parent_name_is_suspicious("cgdb"));                    /* substring match (cgdb wraps gdb) */
    CHECK(parent_name_is_suspicious("gdbserver"));                /* substring match */
    CHECK(parent_name_is_suspicious("lldb"));
    CHECK(parent_name_is_suspicious("strace"));
    CHECK(parent_name_is_suspicious("ltrace"));
    CHECK(parent_name_is_suspicious("valgrind"));

    TEST_SUMMARY();
}
