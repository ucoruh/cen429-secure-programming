/*
 * CEN429 — Week 1 — Demo 3: Privilege escalation through overflow (VULNERABLE VERSION)
 *
 * Session information is kept in a struct: a 16-byte username, immediately followed by
 * an "admin" flag. The username is copied with strcpy and its length is never checked.
 * A name longer than 16 bytes overwrites the admin field that sits right behind it in
 * memory.
 *
 * In memory (x86-64, little-endian):
 *   offset:  0 ........................ 15 | 16 17 18 19
 *            [ name[0] ............ name[15] ][ admin     ]
 *
 * "checked" build: on Linux, _FORTIFY_SOURCE=2; on Windows, strcpy_s (C11 Annex K) — both
 * know the destination is 16 bytes, so they catch the overflow at run time.
 */
#include <stdio.h>
#include <string.h>
#include "cen429_demo.h"

struct session {
    char name[16];
    int  admin;          /* 0 = normal user, non-zero = admin */
};

int main(int argc, char **argv)
{
    demo_prepare();
    if (argc != 2) {
        fprintf(stderr, "Usage: %s <username>\n", argv[0]);
        return 1;
    }

    struct session s;
    s.admin = 0;

#if defined(CHECKED_BUILD) && defined(_MSC_VER)
    strcpy_s(s.name, sizeof(s.name), argv[1]);   /* Windows "checked" build: a copy that knows the size */
#else
    strcpy(s.name, argv[1]);  /* BUG: the 16-byte destination size is never checked */
#endif

    printf("Welcome, %s\n", s.name);
    printf("admin field = %d (0x%08x)\n", s.admin, (unsigned)s.admin);
    if (s.admin)
        printf(">>> Access granted to the ADMIN panel! <<<\n");
    else
        printf("Normal user session.\n");
    return 0;
}
