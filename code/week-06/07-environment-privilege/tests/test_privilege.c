/* Unit tests for week-06/07-environment-privilege/privilege.c.
 *
 * path_exists() is a thin, pure wrapper over access()/_access(); every expected value below is
 * hand-checked against fixture files/folders this test creates and controls, or against paths
 * that are known not to exist on an ordinary Windows/Linux development or CI machine (the
 * INDICATOR_PATHS themselves are mobile-only paths -- see the demo's own comment).
 */
#define main program_main
#include "../privilege.c"
#undef main
#include "../../../common/test_check.h"

int main(void)
{
    /* --- path_exists(): normal file, directory, missing file, blank path -------------------- */
    CHECK(path_exists("tests/fixtures/exists.txt"));       /* a real file */
    CHECK(path_exists("tests/fixtures"));                   /* a directory counts as existing too */
    CHECK(path_exists("tests/fixtures/sub"));                /* a nested directory */
    CHECK(path_exists("tests/fixtures/sub/nested.txt"));      /* a file inside a nested directory */
    CHECK(!path_exists("tests/fixtures/does-not-exist.txt")); /* missing file */
    CHECK(!path_exists("tests/fixtures/sub/does-not-exist"));  /* missing file, nested */
    CHECK(!path_exists(""));                                    /* blank path */
    CHECK(!path_exists("tests/fixtures/does/not/exist/at/all")); /* missing nested path */

    /* --- is_elevated(): a live call, but its return value is always a valid boolean (0 or 1) -- */
    {
        int elevated = is_elevated();
        CHECK(elevated == 0 || elevated == 1);
    }

    /* --- INDICATOR_PATHS[]: exactly 7 entries, NULL-terminated (a structural regression check:
       if a future edit forgets the trailing NULL, this catches it instead of an out-of-bounds
       scan in main()). ------------------------------------------------------------------------ */
    {
        int count = 0;
        while (INDICATOR_PATHS[count] != NULL)
            count++;
        CHECK_EQ_INT(count, 7);
    }

    /* --- INDICATOR_PATHS[]: on an ordinary Windows/Linux dev or CI machine, none of the
       mobile-only markers exist -- this is the "clean" branch main() takes by default. --------- */
    for (int i = 0; INDICATOR_PATHS[i]; i++)
        CHECK(!path_exists(INDICATOR_PATHS[i]));

    TEST_SUMMARY();
}
