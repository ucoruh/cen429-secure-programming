/*
 * CEN429 — demo helper (used by every week)
 *
 * demo_prepare(): on Windows, closes the dialog boxes that would otherwise pop up when the program
 * crashes or a secure library function (like strcpy_s) detects an overflow; it prints a plain message
 * to the screen instead. This way the demos run the same way on every platform, without ever getting
 * stuck waiting for a dialog. Does nothing on Linux.
 */
#ifndef CEN429_DEMO_H
#define CEN429_DEMO_H

#ifdef _WIN32
#include <windows.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

static void demo_invalid_parameter_handler(const wchar_t *expression, const wchar_t *function, const wchar_t *file,
                                            unsigned int line, uintptr_t reserved)
{
    (void)expression; (void)function; (void)file; (void)line; (void)reserved;
    fprintf(stderr, "*** A secure library function detected an overflow: program stopped ***\n");
    fflush(stderr);
    _exit(3);
}

static inline void demo_prepare(void)
{
    SetErrorMode(SEM_FAILCRITICALERRORS | SEM_NOGPFAULTERRORBOX);
    _set_invalid_parameter_handler(demo_invalid_parameter_handler);
}
#else
static inline void demo_prepare(void) {}
#endif

#endif /* CEN429_DEMO_H */
