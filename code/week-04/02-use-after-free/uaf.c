/*
 * CEN429 - Week 4 - Demo 2: use-after-free and double-free (VULNERABLE VERSION)
 *
 * The "session" object is kept on the HEAP, not the stack, and it holds a function pointer
 * (action). If the pointer is still used after the object was free()d (dangling), an attacker
 * can allocate a new block of the same size and put their own data there; the "dangling" pointer
 * now points at the attacker's data. That is how role 'user' becomes 'admin', and the function
 * pointer ends up calling a different function.
 *
 * Mode:
 *   uaf    : use-after-free exploit (privilege escalation)
 *   double : freeing the same block twice (double-free)
 *
 * ETHICS: every action calls this program's own functions; no code is injected from the outside.
 * Steps that could crash are bounded on Linux with prlimit+timeout, on Windows with demo_prepare().
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cen429_demo.h"

struct session {
    void (*action)(void);
    char  role[16];
};

static void normal_panel(void) { printf("   -> Normal user panel.\n"); }
static void admin_panel(void)  { printf("   -> >>> ADMIN panel opened! <<<\n"); }

static int mode_uaf(void)
{
    struct session *s = malloc(sizeof *s);
    if (!s) return 1;
    s->action = normal_panel;
    strcpy(s->role, "user");
    printf("1) Session opened: role=%s\n", s->role);

    free(s);                 /* s is now dangling; it was not set to NULL */
    printf("2) Session freed (but the pointer is still in hand).\n");

    /* An attacker allocates a block of the same size; the allocator usually hands back the
       same spot. */
    struct session *fake = malloc(sizeof *s);
    if (!fake) return 1;
    fake->action = admin_panel;
    strcpy(fake->role, "admin");

    /* BUG: the freed 's' is used (use-after-free) */
    printf("3) Role read through the dangling pointer: %s\n", s->role);
    printf("4) Action called through the dangling pointer:\n");
    s->action();

    free(fake);
    return 0;
}

static int mode_double(void)
{
    char *buffer = malloc(32);
    if (!buffer) return 1;
    strcpy(buffer, "sample data");
    printf("1) Block allocated and filled.\n");
    free(buffer);
    printf("2) Block freed.\n");
    printf("3) The SAME block is freed AGAIN (double-free)...\n");
    free(buffer);             /* BUG: double-free */
    printf("4) If we got here, the allocator did not notice the corruption.\n");
    return 0;
}

int main(int argc, char **argv)
{
    demo_prepare();
    const char *mode = (argc >= 2) ? argv[1] : "uaf";
    if (strcmp(mode, "uaf") == 0)    return mode_uaf();
    if (strcmp(mode, "double") == 0) return mode_double();
    fprintf(stderr, "Usage: %s <uaf|double>\n", argv[0]);
    return 2;
}
