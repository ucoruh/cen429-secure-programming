/*
 * CEN429 - Week 3 - Demo 8: data in use - keeping and wiping it safely in memory
 *
 * A key/password is at risk the whole time it sits in memory: it can be
 * written to the swap file, end up in a crash dump (core), or be read by a
 * debugger. This demo does not repeat Week 1's gcore demonstration; it
 * builds THREE extra layers for data in use:
 *
 *   Layer 1 - close crash/error dumps: the secret must not land in a file.
 *             Linux: setrlimit(RLIMIT_CORE, 0). Windows: SetErrorMode
 *             (in demo_prepare) turns off error dialogs/automatic dumps.
 *   Layer 2 - lock the memory: this page is never written to swap.
 *             Linux: mlock. Windows: VirtualLock.
 *   Layer 3 - wipe securely: once done, the secret is overwritten. Unlike
 *             memset, the compiler cannot remove this as a "dead store".
 *             Linux: OPENSSL_cleanse. Windows: SecureZeroMemory.
 *             (crypto_wipe calls the right one on each platform.)
 *
 * The program reads the buffer back after wiping and confirms it is
 * really zeroed. It only touches its own memory; it changes no system
 * setting.
 */
#include "cen429_demo.h"
#include "cen429_crypto.h"
#include <stdio.h>
#include <string.h>

#ifdef _WIN32
#include <windows.h>
#else
#include <sys/mman.h>
#include <sys/resource.h>
#include <string.h>
#endif

#define BUF_LEN 64

static int nonzero_bytes(const char *p)
{
    int n = 0;
    for (int i = 0; i < BUF_LEN; i++)
        if (p[i] != 0)
            n++;
    return n;
}

int main(void)
{
    demo_prepare();

    /* Layer 1: close crash/error dumps. */
#ifdef _WIN32
    printf("Layer 1 - error dialogs/automatic dump turned off "
           "(SetErrorMode): OK\n");
#else
    struct rlimit rl = { 0, 0 };
    int core_disabled = (setrlimit(RLIMIT_CORE, &rl) == 0);
    printf("Layer 1 - crash dump turned off (RLIMIT_CORE=0): %s\n",
           core_disabled ? "OK" : "could not be done");
#endif

    char secret[BUF_LEN];
    memset(secret, 0, sizeof(secret));
    strcpy(secret, "Synthetic-Password-2026");

    /* Layer 2: protect the memory from being written to swap. */
#ifdef _WIN32
    int lock_ok = VirtualLock(secret, sizeof(secret)) ? 1 : 0;
    printf("Layer 2 - VirtualLock blocked writing to swap: %s\n",
           lock_ok ? "OK" : "could not be done (working-set limit)");
#else
    int lock_ok = (mlock(secret, sizeof(secret)) == 0);
    printf("Layer 2 - mlock blocked writing to swap: %s\n",
           lock_ok ? "OK" : "could not be done (ulimit -l may be low)");
#endif

    printf("Secret in use: length = %zu, non-zero bytes = %d\n",
           strlen(secret), nonzero_bytes(secret));

    /* Layer 3: wipe securely once done. */
    crypto_wipe(secret, sizeof(secret));
    printf("Layer 3 - non-zero bytes after secure wipe = %d\n",
           nonzero_bytes(secret));
    printf("   ==> %s\n", nonzero_bytes(secret) == 0
           ? "the secret was cleared from memory." : "the secret is still in memory (!)");

#ifdef _WIN32
    if (lock_ok)
        VirtualUnlock(secret, sizeof(secret));
#else
    if (lock_ok)
        munlock(secret, sizeof(secret));
#endif

    printf("\nNote: an OPENSSL_cleanse / SecureZeroMemory call CANNOT be\n"
           "removed by the compiler as a \"dead store\"; memset CAN be removed\n"
           "at -O2 (see Week 1 Demo 2).\n");
    return 0;
}
