/*
 * CEN429 — Week 1 — Demo 2: Password left in memory
 *
 * The program reads the password from a file, uses it to compute a "key", and tries to
 * wipe the password from memory once it is done. The wipe method is chosen at compile
 * time through the WIPE macro:
 *
 *   WIPE=0  never wipes it                                   (worst case)
 *   WIPE=1  wipes with memset(password, 0, ...)              (the compiler may remove this!)
 *   WIPE=2  wipes with explicit_bzero / SecureZeroMemory     (the compiler cannot remove this)
 *
 * After the wipe, the program stops inside wait_here() and its memory at that moment is
 * dumped to a file; the demo script then searches the dump for the password. This is a
 * safe simulation of an attacker stealing a secret from a crash dump, a swap file, or a
 * debugger.
 *   Linux  : demo.sh starts the program under gdb, stops it in wait_here(), and dumps it
 *            with "gcore".
 *   Windows: inside wait_here(), if the CEN429_DUMP environment variable is set, the
 *            program dumps its own memory (MiniDumpWriteDump) FROM A SEPARATE THREAD, so
 *            the dump call itself does not overwrite the old password bytes on the stack.
 */
#include <stdio.h>
#include <string.h>
#include <fcntl.h>
#include "cen429_demo.h"

#ifdef _WIN32
#include <io.h>
#include <windows.h>
#include <dbghelp.h>
#define file_open(y) _open((y), _O_RDONLY | _O_BINARY)
#define file_read _read
#define file_close _close
#else
#include <unistd.h>
#define file_open(y) open((y), O_RDONLY)
#define file_read read
#define file_close close
#endif

#ifndef WIPE
#define WIPE 0
#endif

#ifdef _WIN32
static DWORD WINAPI capture_dump(LPVOID path)
{
    HANDLE f = CreateFileA((const char *)path, GENERIC_WRITE, 0, NULL, CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);
    if (f == INVALID_HANDLE_VALUE)
        return 1;
    BOOL ok = MiniDumpWriteDump(GetCurrentProcess(), GetCurrentProcessId(), f, MiniDumpWithFullMemory,
                                NULL, NULL, NULL);
    CloseHandle(f);
    return ok ? 0 : 1;
}
#endif

/* The point where the demo stops. noinline: the compiler must not optimize this function away. */
#if defined(_MSC_VER)
__declspec(noinline)
#else
__attribute__((noinline))
#endif
void wait_here(void)
{
#ifdef _WIN32
    char path[MAX_PATH];
    if (GetEnvironmentVariableA("CEN429_DUMP", path, MAX_PATH)) {
        HANDLE t = CreateThread(NULL, 0, capture_dump, path, 0, NULL);
        if (t) {
            WaitForSingleObject(t, INFINITE);
            CloseHandle(t);
        }
    }
#else
    /* GCC -O2 would remove a call to a fully empty function; then gdb would have nowhere to
       stop. This empty asm line says "something observable happens here" and keeps the call. */
    __asm__ __volatile__("" ::: "memory");
#endif
}

/* A simple computation that "uses" the password (in reality this would be a key derivation function). */
static unsigned long derive_key(const char *p, size_t n)
{
    unsigned long h = 5381;
    for (size_t i = 0; i < n; i++)
        h = h * 33 + (unsigned char)p[i];
    return h;
}

#if defined(_MSC_VER)
__declspec(noinline)
#else
__attribute__((noinline))
#endif
unsigned long log_in(const char *file)
{
    char password[64];

    /* Low-level read: no stdio buffering is used, the password lives only in this array. */
    int fd = file_open(file);
    if (fd < 0)
        return 0;
    int n = (int)file_read(fd, password, sizeof(password) - 1);
    file_close(fd);
    if (n <= 0)
        return 0;
    while (n > 0 && (password[n - 1] == '\n' || password[n - 1] == '\r'))
        n--;
    password[n] = '\0';

    unsigned long key = derive_key(password, (size_t)n);

#if WIPE == 1
    memset(password, 0, sizeof(password));         /* "dead store": never read again */
#elif WIPE == 2
#ifdef _WIN32
    SecureZeroMemory(password, sizeof(password));  /* the compiler cannot remove this */
#else
    explicit_bzero(password, sizeof(password));    /* the compiler cannot remove this */
#endif
#endif
    return key;
}

/*
 * In real programs the password travels through a DEEP call chain: interface -> session ->
 * key derivation, and so on. Shallow functions called later (printf, wait_here) never reach
 * down into that region, so an un-wiped leftover can live on for a long time. This function
 * imitates that depth, so the result does not depend on how much stack space printf happens
 * to use.
 */
#if defined(_MSC_VER)
__declspec(noinline)
#else
__attribute__((noinline))
#endif
unsigned long deep_call_chain(const char *file)
{
    volatile char frames[16384];                      /* stack space for the calls in between */
    frames[0] = 0;
    return log_in(file) + (unsigned long)frames[0];
}

int main(int argc, char **argv)
{
    demo_prepare();
    const char *file = argc > 1 ? argv[1] : "password.txt";
    unsigned long key = deep_call_chain(file);
    printf("Key computed: %lx (WIPE=%d)\n", key, WIPE);
    wait_here();                                       /* memory is dumped here */
    return 0;
}
