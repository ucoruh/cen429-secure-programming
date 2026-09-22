/*
 * CEN429 — Hafta 1 — Demo 1: PATH ile kandırma (GÜVENLİ SÜRÜM)
 *
 * Üç düzeltme (iki platformda da aynı fikir):
 *  1) Program MUTLAK YOLLA çalıştırılır — PATH ya da çalışma klasörü araması yok.
 *     Linux: /bin/date     Windows: <sistem klasörü>\hostname.exe (GetSystemDirectoryW)
 *  2) KABUK KULLANILMAZ (system yok) — Linux'ta posix_spawn, Windows'ta CreateProcessW.
 *  3) Çocuk sürece devralınan ortam yerine KÜÇÜK VE BİLİNEN bir ortam verilir
 *     (Cookbook tarif 1.1 "ortamı temizleme" fikri).
 */
#include <stdio.h>
#include "cen429_demo.h"

#ifdef _WIN32
#include <windows.h>
#include <wchar.h>

int main(void)
{
    demo_hazirla();
    printf("=== Aylik Satis Raporu ===\n");
    printf("Bilgisayar adi: ");
    fflush(stdout);

    wchar_t sistem[MAX_PATH], program[MAX_PATH], kok[MAX_PATH];
    if (!GetSystemDirectoryW(sistem, MAX_PATH) || !GetEnvironmentVariableW(L"SystemRoot", kok, MAX_PATH)) {
        fprintf(stderr, "sistem klasoru bulunamadi\n");
        return 1;
    }
    swprintf(program, MAX_PATH, L"%ls\\hostname.exe", sistem);

    /* Küçük, bilinen ortam: yalnız SystemRoot (her değişken NUL ile biter, blok çift NUL ile) */
    wchar_t ortam[MAX_PATH + 32];
    int n = swprintf(ortam, MAX_PATH + 16, L"SystemRoot=%ls", kok);
    ortam[n + 1] = L'\0';

    wchar_t komut_satiri[] = L"hostname.exe";
    STARTUPINFOW si = { sizeof(si) };
    PROCESS_INFORMATION pi;
    if (!CreateProcessW(program, komut_satiri, NULL, NULL, FALSE, CREATE_UNICODE_ENVIRONMENT,
                        ortam, NULL, &si, &pi)) {
        fprintf(stderr, "hostname baslatilamadi (hata=%lu)\n", GetLastError());
        return 1;
    }
    WaitForSingleObject(pi.hProcess, INFINITE);
    DWORD cikis = 1;
    GetExitCodeProcess(pi.hProcess, &cikis);
    CloseHandle(pi.hThread);
    CloseHandle(pi.hProcess);
    return cikis == 0 ? 0 : 1;
}

#else
#include <spawn.h>
#include <sys/wait.h>

int main(void)
{
    demo_hazirla();
    printf("=== Aylik Satis Raporu ===\n");
    printf("Rapor tarihi: ");
    fflush(stdout);

    char *const arguman[] = { "date", NULL };
    char *const temiz_ortam[] = { "PATH=/usr/bin:/bin", "LANG=C", NULL };

    pid_t pid;
    int hata = posix_spawn(&pid, "/bin/date", NULL, NULL, arguman, temiz_ortam);
    if (hata != 0) {
        fprintf(stderr, "date baslatilamadi (hata=%d)\n", hata);
        return 1;
    }
    int durum;
    if (waitpid(pid, &durum, 0) < 0 || !WIFEXITED(durum) || WEXITSTATUS(durum) != 0) {
        fprintf(stderr, "date basarisiz oldu\n");
        return 1;
    }
    return 0;
}
#endif
