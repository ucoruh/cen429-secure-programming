/*
 * CEN429 - Hafta 6 - Demo 3: Ortam algilama (sanal makine / emulator) + zamanlama
 *
 * Mobil RASP'in "ortam algilama" adiminin masaustu/tasinabilir karsiligi.
 * Analiz cogu zaman bir SANAL MAKINE ya da EMULATOR icinde yapilir; uygulama
 * bunu ipuclarindan sezmeye calisir. Burada iki tasinabilir, GUVENLI teknik:
 *
 *  (A) CPUID hipervizor biti + hipervizor satici imzasi
 *      - CPUID yaprak 1, ECX bit 31: "hypervisor present". Bare-metal'de 0.
 *      - CPUID yaprak 0x40000000: hipervizor 12 karakterlik imza dondurur
 *        ("KVMKVMKVM", "VMwareVMware", "Microsoft Hv", "VBoxVBoxVBox"...).
 *      Yalniz CPU komutu; hicbir sey degistirmez, ag/dosya yok.
 *
 *  (B) Zamanlama (timing) - bilgilendirme amacli
 *      Kucuk bir islem iki kez olculur; tek adimli (single-step) hata
 *      ayiklama ya da agir emulasyon buyuk yavaslama yaratir. Esik makineye
 *      gore degisir; bu yuzden burada sadece OLCUP raporlar, kesin karar vermez.
 *
 * ONEMLI ders notu: WSL2, Hyper-V ve sanallastirma-tabanli guvenlik (VBS) ile
 * cogu modern Windows/laptop "hipervizor var" der. Yani hipervizor biti TEK
 * basina "analiz ortami" demek DEGILDIR - zayif bir sinyaldir. Root/emulator
 * algilama daima birden cok gostergeyi tartar ve atlatilabildigini kabul eder.
 */
#include "cen429_demo.h"
#include <stdio.h>
#include <string.h>
#include <stdint.h>

#if defined(_WIN32)
#include <windows.h>
#include <intrin.h>
static void cpuid(int yaprak, unsigned int reg[4])
{
    int r[4];
    __cpuid(r, yaprak);
    reg[0] = (unsigned)r[0]; reg[1] = (unsigned)r[1];
    reg[2] = (unsigned)r[2]; reg[3] = (unsigned)r[3];
}
static double simdi_sn(void)
{
    LARGE_INTEGER f, t;
    QueryPerformanceFrequency(&f);
    QueryPerformanceCounter(&t);
    return (double)t.QuadPart / (double)f.QuadPart;
}
#else
#include <cpuid.h>
#include <time.h>
static void cpuid(int yaprak, unsigned int reg[4])
{
    unsigned int a = 0, b = 0, c = 0, d = 0;
    __get_cpuid((unsigned)yaprak, &a, &b, &c, &d);
    reg[0] = a; reg[1] = b; reg[2] = c; reg[3] = d;
}
static double simdi_sn(void)
{
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (double)ts.tv_sec + (double)ts.tv_nsec / 1e9;
}
#endif

int main(void)
{
    demo_hazirla();
    printf("Ortam algilama: sanal makine / emulator + zamanlama\n");
    printf("(yalniz CPU komutu ve saat; hicbir sey degismez)\n");
    printf("--------------------------------------------------------------\n");

    unsigned int r[4];
    cpuid(1, r);
    int hv = (r[2] >> 31) & 1;         /* ECX bit 31 */
    printf("(A) CPUID.1:ECX[31] hipervizor biti : %s\n", hv ? "VAR" : "yok (bare-metal gibi)");

    if (hv) {
        cpuid(0x40000000, r);
        char imza[13];
        memcpy(imza + 0, &r[1], 4);    /* EBX */
        memcpy(imza + 4, &r[2], 4);    /* ECX */
        memcpy(imza + 8, &r[3], 4);    /* EDX */
        imza[12] = '\0';
        int bos = 1;
        for (int i = 0; i < 12; i++) {
            if (imza[i] != 0) bos = 0;
            if (imza[i] != 0 && (imza[i] < 32 || imza[i] > 126)) imza[i] = '.';
        }
        if (bos)
            printf("    Hipervizor satici imzasi        : (satici imzasi gizli/bos)\n");
        else
            printf("    Hipervizor satici imzasi        : \"%s\"\n", imza);
    }

    /* (B) Zamanlama: ayni islem iki kez; agir yavaslama tek-adim/emulasyon isaretidir. */
    volatile uint64_t toplam = 0;
    double t0 = simdi_sn();
    for (int tekrar = 0; tekrar < 2000000; tekrar++)
        toplam += (uint64_t)tekrar * 2654435761u;
    double sure = simdi_sn() - t0;
    printf("(B) 2.000.000 islem suresi            : %.3f ms  (kontrol=%llu)\n",
           sure * 1000.0, (unsigned long long)(toplam & 0xffff));
    printf("    (esik makineye gore degisir; burada sadece OLCUM raporlanir)\n");

    printf("--------------------------------------------------------------\n");
    if (hv)
        printf("SONUC: Hipervizor GORULDU. Ama WSL2/Hyper-V/VBS de boyle gorunur;\n"
               "bu TEK basina 'analiz ortami' demek degildir - zayif sinyal.\n");
    else
        printf("SONUC: Hipervizor gorunmuyor (bare-metal olabilir).\n");
    printf("RASP: root/emulator algilama daima birden cok gostergeyi tartar\n");
    printf("ve her birinin atlatilabilecegini kabul eder (Demo 8'de politika).\n");
    return 0;
}
