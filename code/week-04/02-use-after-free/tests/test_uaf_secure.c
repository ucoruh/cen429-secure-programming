/* Unit tests for week-04/02-use-after-free/uaf_secure.c.
 *
 * safe_free() is exercised directly, in-process: it only ever operates on blocks THIS test
 * allocated itself with malloc(), and it always leaves the pointer in a defined state (NULL), so
 * there is nothing here that could corrupt this test binary's own memory — unlike uaf.c's
 * mode_uaf()/mode_double(), which are deliberately NOT exercised in-process (see the end-to-end
 * tests in CMakeLists.txt, which run uaf.c's real, separate OS process instead). Every expected
 * value below is reasoned out by hand, never taken from safe_free()'s own behaviour.
 */
#define main program_main
#include "../uaf_secure.c"
#undef main
#include "../../../common/test_check.h"

int main(void)
{
    /* normal: free a heap block through safe_free, pointer becomes NULL */
    {
        char *p = malloc(32);
        CHECK(p != NULL);                                   /* allocation succeeded */
        safe_free((void **)&p);
        CHECK(p == NULL);                                   /* set to NULL right after free */
    }

    /* different sizes: safe_free always nulls the pointer, regardless of block size */
    {
        char *p8 = malloc(8), *p16 = malloc(16), *p1024 = malloc(1024);
        safe_free((void **)&p8);
        safe_free((void **)&p16);
        safe_free((void **)&p1024);
        CHECK(p8 == NULL);
        CHECK(p16 == NULL);
        CHECK(p1024 == NULL);
    }

    /* double-free through safe_free: the SECOND call must be a no-op, not a crash */
    {
        char *p = malloc(16);
        safe_free((void **)&p);
        CHECK(p == NULL);
        safe_free((void **)&p);                              /* p is already NULL: must do nothing */
        CHECK(p == NULL);                                    /* still NULL, no crash reaching here */
    }

    /* boundary: a pointer that was already NULL before the first call */
    {
        char *p = NULL;
        safe_free((void **)&p);
        CHECK(p == NULL);
    }

    /* invalid: p itself is NULL (no pointer-to-pointer at all) — must not crash */
    safe_free(NULL);
    CHECK(1);                                                 /* reaching here means it did not crash */

    /* session struct: role and action survive until the session is freed */
    {
        struct session *s = malloc(sizeof *s);
        CHECK(s != NULL);
        s->action = normal_panel;
        strcpy(s->role, "user");
        CHECK_EQ_STR(s->role, "user");                        /* role set correctly before free */
        CHECK(s->action == normal_panel);                     /* function pointer set correctly */
        safe_free((void **)&s);
        CHECK(s == NULL);                                     /* dangling pointer eliminated */
    }

    /* role buffer boundary: exactly 15 characters + NUL fits the 16-byte field */
    {
        struct session *s = malloc(sizeof *s);
        strcpy(s->role, "123456789012345");                   /* 15 chars */
        CHECK_EQ_INT((int)strlen(s->role), 15);
        CHECK_EQ_STR(s->role, "123456789012345");
        safe_free((void **)&s);
        CHECK(s == NULL);
    }

    TEST_SUMMARY();
}
