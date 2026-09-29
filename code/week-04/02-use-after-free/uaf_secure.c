/*
 * CEN429 - Week 4 - Demo 2: use-after-free / double-free (SECURE VERSION)
 *
 * Two simple rules close both bug classes at once:
 *  1) Ownership and "set to NULL right after freeing": the pointer is set to NULL immediately
 *     after free(). No dangling pointer survives; a NULL check runs before every use
 *     (use-after-free is closed).
 *  2) Free from a single point: safe_free() both frees and sets the pointer to NULL; a second
 *     call does nothing (double-free is closed).
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

/* Frees and sets the pointer to NULL (makes a double-free impossible). */
static void safe_free(void **p)
{
    if (p && *p) {
        free(*p);
        *p = NULL;
    }
}

static int mode_uaf(void)
{
    struct session *s = malloc(sizeof *s);
    if (!s) return 1;
    s->action = normal_panel;
    strcpy(s->role, "user");
    printf("1) Session opened: role=%s\n", s->role);

    safe_free((void **)&s);   /* free + NULL */
    printf("2) Session closed; the pointer was set to NULL.\n");

    if (s == NULL) {
        printf("3) NULL check before use: no session, action rejected.\n");
        return 0;
    }
    s->action();               /* never reached */
    return 0;
}

static int mode_double(void)
{
    char *buffer = malloc(32);
    if (!buffer) return 1;
    strcpy(buffer, "sample data");
    printf("1) Block allocated.\n");
    safe_free((void **)&buffer);
    printf("2) safe_free: free + NULL.\n");
    safe_free((void **)&buffer);
    printf("3) The second safe_free did nothing (NULL): no double-free.\n");
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
