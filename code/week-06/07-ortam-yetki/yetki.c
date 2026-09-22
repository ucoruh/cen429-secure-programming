/*
 * CEN429 - Hafta 6 - Demo 7: Root / ayricalikli ortam gostergesi algilama
 *
 * Mobil RASP'te "root algilama" (Katalog K4/K5) su gostergelere bakar: su
 * ikilisinin varligi, tehlikeli paketler, yazilabilir sistem yollari, root
 * gizleme cerceveleri. Masaustunde bunun tasinabilir, GUVENLI karsiligi:
 *
 *  1) Ayricalik seviyesi: uygulama YONETICI/ROOT olarak mi calisiyor?
 *     Bir odeme uygulamasi genelde root'ta calismayi REDDEDER (en az ayricalik).
 *     Linux: geteuid()==0.  Windows: sürecin token'i yukseltilmis mi (elevated).
 *
 *  2) "Tehlikeli gosterge" tarayici: bilinen isaret yollarinin VARLIGINI
 *     (yalniz OKUYARAK) kontrol eder. Masaustunde tipik mobil isaretler (su,
 *     magisk) bulunmaz -> temiz. Demoyu deterministik kilmak icin komut
 *     satirindan ek "sahte isaret" yollari verilebilir (demo.sh bunu kendi
 *     cikti/ klasorunde uretir), boylece hem temiz hem isaretli durum gorulur.
 *
 * ONEMLI: bu gostergeler SINYALDIR, kanit degildir; hepsi kolayca sahtelenebilir
 * (root gizleme). RASP bunlari tek basina degil, tepki politikasiyla (Demo 8)
 * ve baska sinyallerle birlikte kullanir. Program hicbir sey degistirmez.
 */
#include "cen429_demo.h"
#include <stdio.h>
#include <string.h>

#ifdef _WIN32
#include <windows.h>
#include <io.h>
static int var_mi(const char *yol) { return _access(yol, 0) == 0; }
static int ayricalikli(void)
{
    HANDLE t = NULL;
    if (!OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &t))
        return 0;
    TOKEN_ELEVATION e;
    DWORD n = 0;
    int sonuc = 0;
    if (GetTokenInformation(t, TokenElevation, &e, sizeof(e), &n))
        sonuc = e.TokenIsElevated ? 1 : 0;
    CloseHandle(t);
    return sonuc;
}
#else
#include <unistd.h>
static int var_mi(const char *yol) { return access(yol, F_OK) == 0; }
static int ayricalikli(void) { return geteuid() == 0; }
#endif

/* Tipik mobil root/emulator isaretleri (masaustunde normalde bulunmaz). */
static const char *ISARETLER[] = {
    "/system/xbin/su", "/system/bin/su", "/sbin/su", "/su/bin/su",
    "/system/app/Superuser.apk", "/data/adb/magisk", "/dev/socket/magisk",
    NULL
};

int main(int argc, char **argv)
{
    demo_hazirla();
    printf("Root / ayricalikli ortam gostergesi (yalniz okuma)\n");
    printf("--------------------------------------------------------------\n");
    int supheli = 0;

    int ayr = ayricalikli();
    printf("1) Ayricalik seviyesi : %s\n", ayr ? "YUKSELTILMIS (root/admin)" : "normal kullanici");
    if (ayr) {
        printf("   -> Odeme benzeri uygulamalar root/admin'de calismayi REDDEDER.\n");
        supheli++;
    }

    printf("2) Tehlikeli gosterge taramasi:\n");
    int bulunan = 0;
    for (int i = 0; ISARETLER[i]; i++)
        if (var_mi(ISARETLER[i])) {
            printf("   [BULUNDU] %s\n", ISARETLER[i]);
            bulunan++;
        }
    /* Komut satirindan verilen ek isaret yollari (demo icin). */
    for (int i = 1; i < argc; i++)
        if (var_mi(argv[i])) {
            printf("   [BULUNDU] %s (ek isaret)\n", argv[i]);
            bulunan++;
        }
    if (bulunan == 0)
        printf("   (bilinen isaret bulunmadi)\n");
    supheli += bulunan;

    printf("--------------------------------------------------------------\n");
    if (supheli > 0)
        printf("SONUC: Ayricalikli/riskli ortam GOSTERGESI var (%d sinyal).\n", supheli);
    else
        printf("SONUC: Temiz - riskli ortam gostergesi yok.\n");
    printf("Not: bu gostergeler SINYALDIR, kanit degil; sahtelenebilir. RASP bunlari\n");
    printf("bir tepki politikasina baglar (Demo 8), yanlis pozitife dikkat eder.\n");
    return supheli > 0 ? 3 : 0;
}
