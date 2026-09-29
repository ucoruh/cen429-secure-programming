/*
 * CEN429 - Week 6 - Demo 4: LD_PRELOAD / function hook detection
 *   (Linux / WSL only)
 *
 * Dynamic instrumentation and function hooking are among an attacker's most powerful tools
 * (Frida, Xposed, LD_PRELOAD, PLT/GOT and inline hooking). An attacker PRELOADS a library
 * (LD_PRELOAD) and replaces standard functions the application calls (time, getenv, ...) with
 * their own version, lying to anti-debug/anti-root checks (evading Demo 2).
 *
 * This demo uses two portable, SAFE detection techniques (catalog K7/K8):
 *   1) Is the LD_PRELOAD environment variable non-empty? (getenv - can be spoofed, weak)
 *   2) WHICH shared object does a critical function actually resolve from? We take the
 *      function's address with dlsym(RTLD_DEFAULT) and use dladdr to find the .so FILE that
 *      provides that address. If something other than the expected libc comes out: a preloaded
 *      HOOK.
 *
 * The second method does not rely on faking getenv: it looks directly at where the symbol comes
 * from. demo.sh loads a fake hook library with LD_PRELOAD into this one process only; no system
 * setting changes.
 */
#define _GNU_SOURCE
#include "cen429_demo.h"
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <dlfcn.h>
#include <time.h>

/* Is the .so a symbol came from legitimate? libc, the kernel's vDSO and the dynamic loader
   (ld-linux) are the expected sources; anything else means interposition (a hook). */
static int is_legitimate(const char *path)
{
    if (!path)
        return 1;
    return strstr(path, "libc.so") != NULL || strstr(path, "/libc-") != NULL ||
           strstr(path, "linux-vdso") != NULL || strstr(path, "linux-gate") != NULL ||
           strstr(path, "ld-linux") != NULL || strstr(path, "/ld-") != NULL;
}

/* Resolves a symbol and looks at the .so that provides it. Returns 1 if it is a hook. */
static int check_symbol(const char *name)
{
    void *p = dlsym(RTLD_DEFAULT, name);
    if (!p) {
        printf("   %-8s -> not found\n", name);
        return 0;
    }
    Dl_info info;
    if (dladdr(p, &info) && info.dli_fname) {
        int hook = !is_legitimate(info.dli_fname);
        printf("   %-8s -> %s %s\n", name, info.dli_fname, hook ? "(HOOK!)" : "");
        return hook;
    }
    printf("   %-8s -> (source unknown)\n", name);
    return 0;
}

int main(void)
{
    demo_prepare();
    printf("LD_PRELOAD / function hook detection\n");
    printf("--------------------------------------------------------------\n");
    int suspicious = 0;

    const char *preload = getenv("LD_PRELOAD");
    printf("1) LD_PRELOAD environment variable : %s\n", (preload && *preload) ? preload : "(empty)");
    if (preload && *preload)
        suspicious++;

    printf("2) Which library do critical functions resolve from?\n");
    suspicious += check_symbol("time");
    suspicious += check_symbol("getenv");

    printf("3) time(NULL) returned              : %ld\n", (long)time(NULL));

    printf("--------------------------------------------------------------\n");
    if (suspicious)
        printf("RESULT: function hook / preload DETECTED (%d signal(s)).\n", suspicious);
    else
        printf("RESULT: clean - no preload/hook visible.\n");
    printf("Note: spoofing getenv() is easy; that is why we also verify the function's\n");
    printf("SOURCE (dladdr/dli_fname). If a hook is loaded, time() returns a fixed fake\n");
    printf("value (1234567890).\n");
    return suspicious ? 3 : 0;
}
