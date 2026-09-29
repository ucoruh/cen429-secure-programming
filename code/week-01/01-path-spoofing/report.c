/*
 * CEN429 — Week 1 — Demo 1: PATH spoofing (VULNERABLE VERSION)
 *
 * The program prints a report header and then calls a system command ("date" on
 * Linux, "hostname" on Windows). The problem: the command name is given bare,
 * not as an absolute path. system() runs it through a shell (Linux: /bin/sh,
 * Windows: cmd.exe); the shell searches the folders listed in the PATH
 * environment variable, one by one (on Windows it also checks the working
 * folder first). Whoever controls PATH, or the working folder, controls which
 * program actually runs. (CWE-426 untrusted search path, CWE-427 uncontrolled
 * search path element)
 */
#include <stdio.h>
#include <stdlib.h>
#include "cen429_demo.h"

#ifdef _WIN32
#define COMMAND "hostname"
#define LABEL "Computer name: "
#else
#define COMMAND "date"
#define LABEL "Report date: "
#endif

int main(void)
{
    demo_prepare();
    printf("=== Monthly Sales Report ===\n");
    printf(LABEL);
    fflush(stdout);

    /* BUG: bare command name + inherited environment (PATH, IFS, LD_* ...) + shell */
    int status = system(COMMAND);
    if (status != 0) {
        fprintf(stderr, "%s could not be run (status=%d)\n", COMMAND, status);
        return 1;
    }
    return 0;
}
