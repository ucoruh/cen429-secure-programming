/*
 * CEN429 - Week 2 - Demo 10: log injection and escaping
 *
 * TOPIC: CWE-117 (Improper Output Neutralization for Logs / "log
 * forging"). If an audit log writes a field that comes from outside
 * (here, a username) into a log line WITHOUT CHECKING it, an attacker
 * can put a line ending (CR/LF) and control characters into their
 * field and produce FORGED log lines; this misleads the analyst and
 * corrupts the incident trail.
 *
 * This demo is a SAFE simulation:
 *   - It only writes under its own folder's work/ subfolder.
 *   - It performs no real authentication; it only produces an audit
 *     line shaped like "this user attempted to log in".
 *   - It reads the username from a FILE as raw bytes; that way, line
 *     endings and control characters are represented naturally,
 *     without having to pass them through a command-line argument.
 *
 * Usage:
 *   logtool generate <dir>                     write sample input files
 *   logtool write    <mode> <input> <log>      append one audit line
 *                     mode = unsafe | safe
 *   logtool count     <log>                     count lines/forged lines
 *
 * Note (CWE-134): another classic trap is using user data as the
 * FORMAT STRING itself: fprintf(f, name). This code ALWAYS uses a
 * fixed format string plus an argument: fprintf(f, "%s", name). That
 * closes off the format-string vulnerability from the start.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include "cen429_demo.h"

#define MAX_NAME 4096

/* A fixed, deterministic timestamp (we use a fixed string instead of the
 * real clock so the demo's output is reproducible). */
static const char *TIMESTAMP = "2026-09-25 09:15:42";

/* Reads raw bytes from a file; returns the number read (<0 on error). */
static long read_file(const char *path, unsigned char *tmp, size_t cap)
{
    FILE *f = fopen(path, "rb");
    if (!f)
        return -1;
    size_t n = fread(tmp, 1, cap, f);
    fclose(f);
    return (long)n;
}

/* UNSAFE: writes the username into the log exactly as it is (raw). */
static void write_unsafe(const char *log_path, const unsigned char *name,
                         size_t name_len)
{
    FILE *f = fopen(log_path, "ab");
    if (!f) {
        perror(log_path);
        return;
    }
    /* A fixed format string; but the field's content is NEVER checked. */
    fprintf(f, "%s AUDIT login user=", TIMESTAMP);
    fwrite(name, 1, name_len, f);      /* raw: CR/LF leaks through here */
    fprintf(f, " result=FAILURE\n");
    fclose(f);
}

/* Escapes control characters and line endings; limits the length.
 * Turns every byte outside printable ASCII (0x20-0x7E) into \xNN;
 * this neutralizes CR/LF, ANSI escape sequences, and embedded NULs. */
static void escape(const unsigned char *name, size_t name_len,
                   char *out, size_t cap)
{
    size_t j = 0;
    const size_t LIMIT = 64;          /* max logical length per field */
    size_t usable = (name_len < LIMIT) ? name_len : LIMIT;
    for (size_t i = 0; i < usable && j + 5 < cap; i++) {
        unsigned char c = name[i];
        if (c >= 0x20 && c <= 0x7E && c != '\\') {
            out[j++] = (char)c;
        } else if (c == '\\') {
            out[j++] = '\\';
            out[j++] = '\\';
        } else {
            j += (size_t)snprintf(out + j, cap - j, "\\x%02X", c);
        }
    }
    if (name_len > LIMIT && j + 3 < cap) {
        out[j++] = '.';
        out[j++] = '.';
        out[j++] = '.';
    }
    out[j] = '\0';
}

/* SAFE: escape + a fixed format string + a guaranteed single line. */
static void write_safe(const char *log_path, const unsigned char *name,
                       size_t name_len)
{
    char clean[256];
    escape(name, name_len, clean, sizeof clean);
    FILE *f = fopen(log_path, "ab");
    if (!f) {
        perror(log_path);
        return;
    }
    fprintf(f, "%s AUDIT login user=%s result=FAILURE\n",
            TIMESTAMP, clean);
    fclose(f);
}

/* Sample input files: normal, injection, control character, too long. */
static int generate(const char *dir)
{
    char path[512];
    /* 1) A normal username. */
    snprintf(path, sizeof path, "%s/01-normal.bin", dir);
    FILE *f = fopen(path, "wb");
    if (!f) { perror(path); return 1; }
    fputs("alice", f);
    fclose(f);

    /* 2) Injection: a line ending + a forged "admin SUCCESS" line. */
    snprintf(path, sizeof path, "%s/02-injection.bin", dir);
    f = fopen(path, "wb");
    if (!f) { perror(path); return 1; }
    fputs("bob\n", f);
    fprintf(f, "%s AUDIT login user=admin result=SUCCESS", TIMESTAMP);
    fclose(f);

    /* 3) A control character: the ANSI "clear line" + carriage return. */
    snprintf(path, sizeof path, "%s/03-control.bin", dir);
    f = fopen(path, "wb");
    if (!f) { perror(path); return 1; }
    fputs("carol", f);
    fputc(0x1b, f); fputs("[2K", f);   /* ESC [2K : clears the line (terminal) */
    fputc('\r', f);
    fputs("hidden", f);
    fclose(f);

    /* 4) A very long field (5000 bytes): for testing the length limit. */
    snprintf(path, sizeof path, "%s/04-too-long.bin", dir);
    f = fopen(path, "wb");
    if (!f) { perror(path); return 1; }
    for (int i = 0; i < 5000; i++)
        fputc('A', f);
    fclose(f);

    printf("  Sample input files written: %s/01..04\n", dir);
    return 0;
}

/* Counts the total lines in the log and the "forged admin SUCCESS" lines. */
static int count(const char *log_path)
{
    FILE *f = fopen(log_path, "rb");
    if (!f) { perror(log_path); return 1; }
    char line[8192];
    int total = 0, forged = 0;
    while (fgets(line, sizeof line, f)) {
        total++;
        if (strstr(line, "user=admin result=SUCCESS"))
            forged++;
    }
    fclose(f);
    printf("  Log: %d line(s); forged 'admin SUCCESS' line(s): %d\n",
           total, forged);
    if (forged > 0)
        printf("   ^ WARNING: an admin login that never happened may have "
               "been injected.\n");
    return 0;
}

int main(int argc, char **argv)
{
    demo_prepare();
    (void)TIMESTAMP;
    if (argc >= 2 && strcmp(argv[1], "generate") == 0 && argc == 3)
        return generate(argv[2]);
    if (argc >= 2 && strcmp(argv[1], "count") == 0 && argc == 3)
        return count(argv[2]);
    if (argc == 5 && strcmp(argv[1], "write") == 0) {
        unsigned char tmp[MAX_NAME];
        long n = read_file(argv[3], tmp, sizeof tmp);
        if (n < 0) { perror(argv[3]); return 1; }
        if (strcmp(argv[2], "unsafe") == 0)
            write_unsafe(argv[4], tmp, (size_t)n);
        else if (strcmp(argv[2], "safe") == 0)
            write_safe(argv[4], tmp, (size_t)n);
        else { fprintf(stderr, "mode: unsafe|safe\n"); return 2; }
        return 0;
    }
    fprintf(stderr,
        "usage:\n"
        "  %s generate <dir>\n"
        "  %s write <unsafe|safe> <input> <log>\n"
        "  %s count <log>\n", argv[0], argv[0], argv[0]);
    return 2;
}
