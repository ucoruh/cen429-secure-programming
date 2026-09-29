/* Unit tests for week-06/04-preload-hook/preload_hook.c (Linux/WSL only, see CMakeLists.txt).
 *
 * is_legitimate() is a pure string-matching function; every expected value below is hand-checked
 * against the substrings it looks for (libc.so, /libc-, linux-vdso, linux-gate, ld-linux, /ld-).
 * check_symbol() is exercised live against real libc symbols this test process actually has
 * loaded, checked against dlsym()/dladdr()'s own observable behaviour (a function that resolves
 * must never be reported as a hook when LD_PRELOAD is not set, and a name that does not exist
 * must resolve to NULL) rather than a value trusted from check_symbol() itself.
 */
#define main program_main
#include "../preload_hook.c"
#undef main
#include "../../../common/test_check.h"

int main(void)
{
    /* --- is_legitimate(): real libc/loader paths, on various distros -------------------------- */
    CHECK(is_legitimate("libc.so"));
    CHECK(is_legitimate("libc.so.6"));
    CHECK(is_legitimate("/lib/x86_64-linux-gnu/libc.so.6"));
    CHECK(is_legitimate("/usr/lib/libc.so"));
    CHECK(is_legitimate("/lib/x86_64-linux-gnu/libc-2.31.so"));       /* older glibc naming: /libc- */
    CHECK(is_legitimate("linux-vdso.so.1"));
    CHECK(is_legitimate("linux-gate.so.1"));                          /* 32-bit vDSO name */
    CHECK(is_legitimate("/lib64/ld-linux-x86-64.so.2"));
    CHECK(is_legitimate("/lib/ld-linux.so.2"));
    CHECK(is_legitimate("/lib/x86_64-linux-gnu/ld-2.31.so"));         /* older glibc naming: /ld- */

    /* --- is_legitimate(): NULL path (dladdr found no info) is treated as legitimate, i.e. not
       flagged -- this is a documented, deliberate choice (an unknown source is not evidence of a
       hook by itself). ---------------------------------------------------------------------- */
    CHECK(is_legitimate(NULL));

    /* --- is_legitimate(): NOT legitimate -- anything that is not libc/vdso/loader ------------- */
    CHECK(!is_legitimate("/tmp/evil.so"));
    CHECK(!is_legitimate("./libfake_hook.so"));                       /* no "libc" substring */
    CHECK(!is_legitimate("/home/student/bin/linux/libfake_hook.so"));
    CHECK(!is_legitimate(""));                                        /* empty string: no match */
    CHECK(!is_legitimate("libmylibcwrapper.so"));                     /* contains "libc" but not "libc.so" or "/libc-" */

    /* --- check_symbol(): live, real dlsym/dladdr behaviour, no LD_PRELOAD set in this test ---- */
    CHECK_EQ_INT(check_symbol("printf"), 0);     /* a real libc function: never reported as a hook */
    CHECK_EQ_INT(check_symbol("malloc"), 0);
    CHECK(dlsym(RTLD_DEFAULT, "printf") != NULL);                     /* sanity: it does resolve */
    CHECK(dlsym(RTLD_DEFAULT, "___cen429_does_not_exist___") == NULL); /* a bogus name resolves to NULL */
    CHECK_EQ_INT(check_symbol("___cen429_does_not_exist___"), 0);      /* not-found is not a hook either */

    TEST_SUMMARY();
}
