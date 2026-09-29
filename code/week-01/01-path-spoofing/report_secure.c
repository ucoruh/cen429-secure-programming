/*
 * CEN429 — Week 1 — Demo 1: PATH spoofing (SECURE VERSION)
 *
 * Three fixes (same idea on both platforms):
 *  1) The program is launched with an ABSOLUTE PATH — no PATH search, no
 *     working-folder search.
 *     Linux: /bin/date     Windows: <system folder>\hostname.exe (GetSystemDirectoryW)
 *  2) NO SHELL IS USED (no system()) — posix_spawn on Linux, CreateProcessW on Windows.
 *  3) The child process is given a SMALL, KNOWN environment instead of the
 *     inherited one (Cookbook recipe 1.1, "cleaning up the environment").
 */
#include <stdio.h>
#include "cen429_demo.h"

#ifdef _WIN32
#include <windows.h>
#include <wchar.h>

int main(void)
{
    demo_prepare();
    printf("=== Monthly Sales Report ===\n");
    printf("Computer name: ");
    fflush(stdout);

    wchar_t system_dir[MAX_PATH], program_path[MAX_PATH], sys_root[MAX_PATH];
    if (!GetSystemDirectoryW(system_dir, MAX_PATH) || !GetEnvironmentVariableW(L"SystemRoot", sys_root, MAX_PATH)) {
        fprintf(stderr, "system directory not found\n");
        return 1;
    }
    swprintf(program_path, MAX_PATH, L"%ls\\hostname.exe", system_dir);

    /* Small, known environment: only SystemRoot (each variable ends with NUL, the block with a double NUL) */
    wchar_t env_block[MAX_PATH + 32];
    int n = swprintf(env_block, MAX_PATH + 16, L"SystemRoot=%ls", sys_root);
    env_block[n + 1] = L'\0';

    wchar_t cmd_line[] = L"hostname.exe";
    STARTUPINFOW si = { sizeof(si) };
    PROCESS_INFORMATION pi;
    if (!CreateProcessW(program_path, cmd_line, NULL, NULL, FALSE, CREATE_UNICODE_ENVIRONMENT,
                        env_block, NULL, &si, &pi)) {
        fprintf(stderr, "hostname could not be started (error=%lu)\n", GetLastError());
        return 1;
    }
    WaitForSingleObject(pi.hProcess, INFINITE);
    DWORD exit_code = 1;
    GetExitCodeProcess(pi.hProcess, &exit_code);
    CloseHandle(pi.hThread);
    CloseHandle(pi.hProcess);
    return exit_code == 0 ? 0 : 1;
}

#else
#include <spawn.h>
#include <sys/wait.h>

int main(void)
{
    demo_prepare();
    printf("=== Monthly Sales Report ===\n");
    printf("Report date: ");
    fflush(stdout);

    char *const args[] = { "date", NULL };
    char *const clean_env[] = { "PATH=/usr/bin:/bin", "LANG=C", NULL };

    pid_t pid;
    int err = posix_spawn(&pid, "/bin/date", NULL, NULL, args, clean_env);
    if (err != 0) {
        fprintf(stderr, "date could not be started (error=%d)\n", err);
        return 1;
    }
    int status;
    if (waitpid(pid, &status, 0) < 0 || !WIFEXITED(status) || WEXITSTATUS(status) != 0) {
        fprintf(stderr, "date failed\n");
        return 1;
    }
    return 0;
}
#endif
