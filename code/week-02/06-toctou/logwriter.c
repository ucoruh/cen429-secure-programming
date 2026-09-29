/*
 * CEN429 — Week 2 — Demo 6: a TOCTOU race condition (CWE-367)
 *
 * Usage: bin/linux/logwriter <unsafe|safe> <target-file> <text>
 *
 * Shows the "time of check, time of use" (TOCTOU) race, entirely safely,
 * inside OUR OWN demo folder. The program is a "log writer": it appends a
 * line to the given file, but first checks "is it safe for me to write to
 * this file?"
 *
 *   unsafe : checks with access()/lstat() first, THEN opens with fopen().
 *            If the file is replaced with a symbolic link between the two
 *            operations, it writes to a file OTHER than the one it checked
 *            (the race window).
 *   safe   : opens with O_NOFOLLOW | O_CREAT; if there is a symbolic link,
 *            the open is REFUSED. The check and the use happen in one
 *            atomic step.
 *
 * ETHICS/SAFETY: this demo only writes to a "trap" target inside its own
 * folder; it touches no system file and needs no administrator privilege.
 * The attack script also only creates a symbolic link inside this folder.
 */
#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <fcntl.h>
#include <unistd.h>
#include <sys/stat.h>
#include <errno.h>
#include "cen429_demo.h"

/* A small delay between the check and the open, giving the attacker a
   window to step in (to make the race visible in class). */
static void small_delay(void)
{
    const char *env = getenv("TOCTOU_DELAY_US");
    useconds_t us = env ? (useconds_t)strtoul(env, NULL, 10) : 0;
    if (us)
        usleep(us);
}

static int write_unsafe(const char *target, const char *text)
{
    /* TIME OF CHECK: is the target a regular file, or a symbolic link? */
    struct stat st;
    if (lstat(target, &st) == 0 && S_ISLNK(st.st_mode)) {
        fprintf(stderr, "  rejected: the target is a symbolic link\n");
        return 1;
    }
    /* ... an attacker could replace the target with a symbolic link here ... */
    small_delay();

    /* TIME OF USE: fopen FOLLOWS symbolic links; we may write to another file */
    FILE *f = fopen(target, "a");
    if (!f) {
        perror("  fopen");
        return 1;
    }
    fprintf(f, "%s\n", text);
    fclose(f);
    printf("  unsafe: '%s' -> %s (written)\n", text, target);
    return 0;
}

static int write_safe(const char *target, const char *text)
{
    small_delay();
    /* Check and open in ONE step: if there is a symbolic link, the open fails. */
    int fd = open(target, O_WRONLY | O_CREAT | O_APPEND | O_NOFOLLOW, 0600);
    if (fd < 0) {
        if (errno == ELOOP)
            fprintf(stderr,
                    "  rejected: the target is a symbolic link (O_NOFOLLOW)\n");
        else
            perror("  open");
        return 1;
    }
    dprintf(fd, "%s\n", text);
    close(fd);
    printf("  safe:   '%s' -> %s (written)\n", text, target);
    return 0;
}

int main(int argc, char **argv)
{
    demo_prepare();
    if (argc != 4) {
        fprintf(stderr, "usage: %s unsafe|safe <target> <text>\n",
                argv[0]);
        return 2;
    }
    if (strcmp(argv[1], "unsafe") == 0)
        return write_unsafe(argv[2], argv[3]);
    if (strcmp(argv[1], "safe") == 0)
        return write_safe(argv[2], argv[3]);
    fprintf(stderr, "unknown mode: %s\n", argv[1]);
    return 2;
}
