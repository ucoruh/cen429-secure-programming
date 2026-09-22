/*
 * CEN429 - Hafta 6 - Demo 2: Hata ayiklayici (debugger) algilama
 *
 * RASP algilama adiminin klasik parcasi: uygulamaya bir hata ayiklayici
 * (gdb, lldb, x64dbg, WinDbg, Visual Studio) BAGLI mi? Kitap Tarif 12.13
 * (Unix, ptrace) ve 12.14 (Windows, IsDebuggerPresent) bunu isler; SoftICE
 * (12.15) olduldu, modern karsiliklarini kullaniyoruz.
 *
 * Bu demo yalniz OKUMA yapar; hicbir sey degistirmez:
 *   Linux/WSL : /proc/self/status icindeki TracerPid alani. 0 ise izleyen yok;
 *               >0 ise o PID bizi ptrace ile izliyor (debugger). Ek olarak
 *               ana surec adina (/proc/<ppid>/comm) bakariz (gdb/strace/ltrace).
 *   Windows   : IsDebuggerPresent() (PEB BeingDebugged) + PEB NtGlobalFlag +
 *               CheckRemoteDebuggerPresent(). Uc bagimsiz gosterge.
 *
 * Tek bir gostergeye guvenmeyiz; hepsi ATLATILABILIR (bkz. Demo 4). Onemli
 * olan: birden cok bagimsiz sinyal + tespit sonucunu bir tepki politikasina
 * baglamak (Demo 8), sadece "if debugger printf" degil.
 */
#include "cen429_demo.h"
#include <stdio.h>
#include <string.h>

#ifdef _WIN32
#include <windows.h>
#else
#include <unistd.h>
#endif

#ifndef _WIN32
/* /proc/self/status -> TracerPid. -1: okunamadi, 0: izleyen yok, >0: izleyen PID. */
static long tracer_pid(void)
{
    FILE *f = fopen("/proc/self/status", "r");
    if (!f)
        return -1;
    char satir[256];
    long pid = 0;
    while (fgets(satir, sizeof(satir), f)) {
        if (strncmp(satir, "TracerPid:", 10) == 0) {
            pid = strtol(satir + 10, NULL, 10);
            break;
        }
    }
    fclose(f);
    return pid;
}

/* Ana surecin (parent) komut adi. Debugger'lar cogu zaman ana surec olur. */
static int ana_surec_adi(char *ad, size_t boy)
{
    char yol[64];
    snprintf(yol, sizeof(yol), "/proc/%ld/comm", (long)getppid());
    FILE *f = fopen(yol, "r");
    if (!f)
        return 0;
    if (!fgets(ad, (int)boy, f)) { fclose(f); return 0; }
    fclose(f);
    ad[strcspn(ad, "\n")] = '\0';
    return 1;
}
#endif

int main(void)
{
    demo_hazirla();
    printf("Hata ayiklayici algilama (yalniz okuma; hicbir sey degismez)\n");
    printf("--------------------------------------------------------------\n");
    int supheli = 0;

#ifdef _WIN32
    BOOL peb = IsDebuggerPresent();
    printf("1) IsDebuggerPresent (PEB BeingDebugged) : %s\n", peb ? "EVET" : "hayir");
    if (peb) supheli++;

    BOOL uzak = FALSE;
    CheckRemoteDebuggerPresent(GetCurrentProcess(), &uzak);
    printf("2) CheckRemoteDebuggerPresent            : %s\n", uzak ? "EVET" : "hayir");
    if (uzak) supheli++;

    /* PEB NtGlobalFlag: hata ayiklayici altinda tipik olarak 0x70 bitleri set olur. */
#if defined(_M_X64) || defined(__x86_64__)
    unsigned char *peb_adr = (unsigned char *)__readgsqword(0x60);
    unsigned int ntglobal = peb_adr ? *(unsigned int *)(peb_adr + 0xBC) : 0;
#else
    unsigned int ntglobal = 0;
#endif
    int ntbit = (ntglobal & 0x70) != 0;
    printf("3) PEB NtGlobalFlag (0x70 bitleri)       : %s (0x%X)\n", ntbit ? "EVET" : "hayir", ntglobal);
    if (ntbit) supheli++;
#else
    long tp = tracer_pid();
    if (tp < 0)
        printf("1) /proc/self/status TracerPid           : okunamadi\n");
    else {
        printf("1) /proc/self/status TracerPid           : %ld %s\n", tp,
               tp > 0 ? "(IZLENIYOR)" : "(izleyen yok)");
        if (tp > 0) supheli++;
    }

    char ana[128] = {0};
    if (ana_surec_adi(ana, sizeof(ana))) {
        int kotu = (strstr(ana, "gdb") || strstr(ana, "lldb") || strstr(ana, "strace") ||
                    strstr(ana, "ltrace") || strstr(ana, "valgrind"));
        printf("2) Ana surec (parent) adi                : %s %s\n", ana, kotu ? "(SUPHELI)" : "");
        if (kotu) supheli++;
    }
#endif

    printf("--------------------------------------------------------------\n");
    if (supheli > 0)
        printf("SONUC: Hata ayiklayici/izleme ARACI algilandi (%d sinyal).\n", supheli);
    else
        printf("SONUC: Temiz - izleyen bir arac gorunmuyor.\n");
    printf("Not: her sinyal atlatilabilir; RASP birden cok bagimsiz sinyali\n");
    printf("bir tepki politikasina baglar (Demo 8), tek 'if' kullanmaz.\n");
    return supheli > 0 ? 3 : 0;
}
