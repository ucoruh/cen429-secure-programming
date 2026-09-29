/*
 * CEN429 - Week 6 - Demo 2: Debugger detection
 *
 * A classic part of RASP's detection step: is a debugger (gdb, lldb, x64dbg, WinDbg, Visual
 * Studio) ATTACHED to the application? The textbook covers this in Recipe 12.13 (Unix, ptrace)
 * and 12.14 (Windows, IsDebuggerPresent); SoftICE (12.15) is dead, we use its modern equivalents.
 *
 * This demo only READS state; it changes nothing:
 *   Linux/WSL : the TracerPid field inside /proc/self/status. 0 means no tracer; >0 means that
 *               PID is tracing us with ptrace (a debugger). We also look at the parent process's
 *               name (/proc/<ppid>/comm) for gdb/strace/ltrace.
 *   Windows   : IsDebuggerPresent() (PEB BeingDebugged) + PEB NtGlobalFlag +
 *               CheckRemoteDebuggerPresent(). Three independent signals.
 *
 * We never trust a single signal; every one of them can be EVADED (see Demo 4). What matters is
 * combining several independent signals with a response policy (Demo 8), not just "if debugger
 * printf".
 */
#include "cen429_demo.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#ifdef _WIN32
#include <windows.h>
#else
#include <unistd.h>
#endif

#ifndef _WIN32
/* Pure parsing step, independently testable: scans the (multi-line) text of /proc/<pid>/status
 * for the "TracerPid:" line and returns its value. Returns -1 if the line is not present. Kept
 * separate from tracer_pid() below so a unit test can feed it a fabricated string instead of a
 * real /proc file. */
static long parse_tracer_pid(const char *status_text)
{
    const char *line = status_text;
    while (line && *line) {
        if (strncmp(line, "TracerPid:", 10) == 0)
            return strtol(line + 10, NULL, 10);
        const char *next = strchr(line, '\n');
        line = next ? next + 1 : NULL;
    }
    return -1;
}

/* /proc/self/status -> TracerPid. -1: could not read, 0: no tracer, >0: tracer's PID. */
static long tracer_pid(void)
{
    FILE *f = fopen("/proc/self/status", "r");
    if (!f)
        return -1;
    char text[4096];
    size_t n = fread(text, 1, sizeof(text) - 1, f);
    text[n] = '\0';
    fclose(f);
    long pid = parse_tracer_pid(text);
    return pid < 0 ? 0 : pid;   /* "TracerPid:" is always present on Linux; -1 here would mean a
                                   truncated/unexpected read, treated as "no tracer" rather than
                                   a false positive. */
}

/* Pure check, independently testable: does a parent process NAME look like a debugger or tracer?
 * Substring match on purpose (matches "gdb", "cgdb", "gdbserver" alike); a name that merely
 * contains one of these words as an unrelated substring is a known, accepted false-positive risk
 * for a single-signal heuristic (see the note printed at the end of main()). */
static int parent_name_is_suspicious(const char *name)
{
    if (!name || !*name)
        return 0;
    return strstr(name, "gdb") || strstr(name, "lldb") || strstr(name, "strace") ||
           strstr(name, "ltrace") || strstr(name, "valgrind");
}

/* Parent process's command name. Debuggers are usually the parent process. */
static int parent_process_name(char *name, size_t size)
{
    char path[64];
    snprintf(path, sizeof(path), "/proc/%ld/comm", (long)getppid());
    FILE *f = fopen(path, "r");
    if (!f)
        return 0;
    if (!fgets(name, (int)size, f)) { fclose(f); return 0; }
    fclose(f);
    name[strcspn(name, "\n")] = '\0';
    return 1;
}
#endif

int main(void)
{
    demo_prepare();
    printf("Debugger detection (read-only; nothing changes)\n");
    printf("--------------------------------------------------------------\n");
    int suspicious = 0;

#ifdef _WIN32
    BOOL peb = IsDebuggerPresent();
    printf("1) IsDebuggerPresent (PEB BeingDebugged) : %s\n", peb ? "YES" : "no");
    if (peb) suspicious++;

    BOOL remote = FALSE;
    CheckRemoteDebuggerPresent(GetCurrentProcess(), &remote);
    printf("2) CheckRemoteDebuggerPresent            : %s\n", remote ? "YES" : "no");
    if (remote) suspicious++;

    /* PEB NtGlobalFlag: under a debugger, bits 0x70 are typically set. */
#if defined(_M_X64) || defined(__x86_64__)
    unsigned char *peb_addr = (unsigned char *)__readgsqword(0x60);
    unsigned int ntglobal = peb_addr ? *(unsigned int *)(peb_addr + 0xBC) : 0;
#else
    unsigned int ntglobal = 0;
#endif
    int ntbit = (ntglobal & 0x70) != 0;
    printf("3) PEB NtGlobalFlag (bits 0x70)           : %s (0x%X)\n", ntbit ? "YES" : "no", ntglobal);
    if (ntbit) suspicious++;
#else
    long tp = tracer_pid();
    if (tp < 0)
        printf("1) /proc/self/status TracerPid           : could not read\n");
    else {
        printf("1) /proc/self/status TracerPid           : %ld %s\n", tp,
               tp > 0 ? "(TRACED)" : "(no tracer)");
        if (tp > 0) suspicious++;
    }

    char parent[128] = {0};
    if (parent_process_name(parent, sizeof(parent))) {
        int bad = parent_name_is_suspicious(parent);
        printf("2) Parent process name                   : %s %s\n", parent, bad ? "(SUSPICIOUS)" : "");
        if (bad) suspicious++;
    }
#endif

    printf("--------------------------------------------------------------\n");
    if (suspicious > 0)
        printf("RESULT: a debugger/tracing TOOL was detected (%d signal(s)).\n", suspicious);
    else
        printf("RESULT: clean - no tracing tool visible.\n");
    printf("Note: every signal can be evaded; RASP ties multiple independent\n");
    printf("signals to a response policy (Demo 8), not a single 'if'.\n");
    return suspicious > 0 ? 3 : 0;
}
