/*
 * CEN429 - Week 6 - Demo 7: Root / elevated-environment indicator detection
 *
 * Mobile RASP's "root detection" (catalog K4/K5) looks at signals such as: the presence of the
 * `su` binary, dangerous packages, writable system paths, root-hiding frameworks. The portable,
 * SAFE desktop equivalent here:
 *
 *  1) Privilege level: is the application running as ADMINISTRATOR/ROOT?
 *     A payment application typically REFUSES to run as root/admin (least privilege).
 *     Linux: geteuid()==0.  Windows: is the process token elevated?
 *
 *  2) "Dangerous indicator" scan: checks the EXISTENCE (by READING only) of known marker paths.
 *     Typical mobile markers (su, magisk) are not found on a desktop -> clean. To make the demo
 *     deterministic, extra "fake marker" paths can be given on the command line (demo.sh
 *     generates one in its own output/ folder), so both the clean and the flagged case are shown.
 *
 * IMPORTANT: these indicators are SIGNALS, not proof; every one of them can easily be spoofed
 * (root hiding). RASP uses these together with a response policy (Demo 8) and other signals, not
 * alone. The program changes nothing.
 */
#include "cen429_demo.h"
#include <stdio.h>
#include <string.h>

#ifdef _WIN32
#include <windows.h>
#include <io.h>
static int path_exists(const char *path) { return _access(path, 0) == 0; }
static int is_elevated(void)
{
    HANDLE token = NULL;
    if (!OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &token))
        return 0;
    TOKEN_ELEVATION e;
    DWORD n = 0;
    int result = 0;
    if (GetTokenInformation(token, TokenElevation, &e, sizeof(e), &n))
        result = e.TokenIsElevated ? 1 : 0;
    CloseHandle(token);
    return result;
}
#else
#include <unistd.h>
static int path_exists(const char *path) { return access(path, F_OK) == 0; }
static int is_elevated(void) { return geteuid() == 0; }
#endif

/* Typical mobile root/emulator indicators (not normally found on a desktop). */
static const char *INDICATOR_PATHS[] = {
    "/system/xbin/su", "/system/bin/su", "/sbin/su", "/su/bin/su",
    "/system/app/Superuser.apk", "/data/adb/magisk", "/dev/socket/magisk",
    NULL
};

int main(int argc, char **argv)
{
    demo_prepare();
    printf("Root / elevated-environment indicator (read-only)\n");
    printf("--------------------------------------------------------------\n");
    int suspicious = 0;

    int elevated = is_elevated();
    printf("1) Privilege level : %s\n", elevated ? "ELEVATED (root/admin)" : "normal user");
    if (elevated) {
        printf("   -> Payment-like applications REFUSE to run as root/admin.\n");
        suspicious++;
    }

    printf("2) Dangerous-indicator scan:\n");
    int found = 0;
    for (int i = 0; INDICATOR_PATHS[i]; i++)
        if (path_exists(INDICATOR_PATHS[i])) {
            printf("   [FOUND] %s\n", INDICATOR_PATHS[i]);
            found++;
        }
    /* Extra indicator paths given on the command line (for the demo). */
    for (int i = 1; i < argc; i++)
        if (path_exists(argv[i])) {
            printf("   [FOUND] %s (extra indicator)\n", argv[i]);
            found++;
        }
    if (found == 0)
        printf("   (no known indicator found)\n");
    suspicious += found;

    printf("--------------------------------------------------------------\n");
    if (suspicious > 0)
        printf("RESULT: an elevated/risky environment INDICATOR is present (%d signal(s)).\n", suspicious);
    else
        printf("RESULT: clean - no risky-environment indicator.\n");
    printf("Note: these indicators are SIGNALS, not proof; they can be spoofed. RASP ties\n");
    printf("them to a response policy (Demo 8) and watches for false positives.\n");
    return suspicious > 0 ? 3 : 0;
}
