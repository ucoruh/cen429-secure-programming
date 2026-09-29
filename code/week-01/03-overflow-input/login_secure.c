/*
 * CEN429 — Week 1 — Demo 3: Privilege escalation through overflow (SECURE VERSION)
 *
 * Fixes:
 *  1) The input is validated BEFORE it is copied: length and allowed characters
 *     (an allow-list — Cookbook R3.1, "basic input validation").
 *  2) The copy uses snprintf, which knows the destination size.
 *  3) The privilege field sits next to the user input in a separate field, starts out
 *     "secure by default" (0), and only ever changes as the result of validation.
 */
#include <ctype.h>
#include <stdio.h>
#include <string.h>
#include "cen429_demo.h"

struct session {
    char name[16];
    int  admin;
};

/* Username: 1-15 characters, only letters, digits, '_' and '-'. */
static int name_is_valid(const char *s)
{
    size_t n = strnlen(s, 16);
    if (n == 0 || n >= 16)
        return 0;
    for (size_t i = 0; i < n; i++) {
        unsigned char c = (unsigned char)s[i];
        if (!isalnum(c) && c != '_' && c != '-')
            return 0;
    }
    return 1;
}

int main(int argc, char **argv)
{
    demo_prepare();
    if (argc != 2) {
        fprintf(stderr, "Usage: %s <username>\n", argv[0]);
        return 1;
    }
    if (!name_is_valid(argv[1])) {
        fprintf(stderr, "Rejected: the name must be 1-15 characters; only letters, digits, _ and - are allowed.\n");
        return 1;
    }

    struct session s = { .admin = 0 };
    snprintf(s.name, sizeof(s.name), "%s", argv[1]);

    printf("Welcome, %s\n", s.name);
    printf("admin field = %d\n", s.admin);
    printf("%s\n", s.admin ? ">>> ADMIN <<<" : "Normal user session.");
    return 0;
}
