/*
 * CEN429 - Hafta 6 - Demo 4: LD_PRELOAD / fonksiyon kancasi (hook) algilama
 *   (yalniz Linux / WSL)
 *
 * Dinamik enstrumantasyon ve fonksiyon kancalama, saldirganin en guclu
 * araclarindandir (Frida, Xposed, LD_PRELOAD, PLT/GOT ve satir-ici kanca).
 * Saldirgan bir kutuphaneyi ONYUKLER (LD_PRELOAD) ve uygulamanin cagirdigi
 * standart fonksiyonlari (time, getenv, ...) kendi surumuyle degistirir;
 * boylece anti-debug/anti-root kontrollerini yalancilar (Demo 2'yi atlatir).
 *
 * Bu demo iki tasinabilir, GUVENLI algilama tekniği kullanir (Katalog K7/K8):
 *   1) LD_PRELOAD ortam degiskeni bos mu? (getenv - manipule edilebilir, zayif)
 *   2) Kritik fonksiyon HANGI paylasimli nesneden cozuluyor? dlsym(RTLD_DEFAULT)
 *      ile fonksiyonun adresini alir, dladdr ile o adresi saglayan .so DOSYASINI
 *      buluruz. Beklenen libc yerine baska bir .so cikiyorsa: onyuklu KANCA.
 *
 * Bu ikinci yontem getenv sahteciligine dayanmaz: dogrudan sembolun nereden
 * geldigine bakar. demo.sh sahte bir kanca kutuphanesini LD_PRELOAD ile yalniz
 * bu surece yukler; hicbir sistem ayari degismez.
 */
#define _GNU_SOURCE
#include "cen429_demo.h"
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <dlfcn.h>
#include <time.h>

/* Simgenin geldigi .so mesru mu? libc, cekirdegin vDSO'su ve dinamik yukleyici
   (ld-linux) beklenen kaynaklardir; baskasi interpozisyon (kanca) demektir. */
static int mesru_mi(const char *yol)
{
    if (!yol)
        return 1;
    return strstr(yol, "libc.so") != NULL || strstr(yol, "/libc-") != NULL ||
           strstr(yol, "linux-vdso") != NULL || strstr(yol, "linux-gate") != NULL ||
           strstr(yol, "ld-linux") != NULL || strstr(yol, "/ld-") != NULL;
}

/* Bir simgeyi cozer ve onu saglayan .so'ya bakar. Kanca ise 1 doner. */
static int simge_denetle(const char *ad)
{
    void *p = dlsym(RTLD_DEFAULT, ad);
    if (!p) {
        printf("   %-8s -> bulunamadi\n", ad);
        return 0;
    }
    Dl_info info;
    if (dladdr(p, &info) && info.dli_fname) {
        int kanca = !mesru_mi(info.dli_fname);
        printf("   %-8s -> %s %s\n", ad, info.dli_fname, kanca ? "(KANCA!)" : "");
        return kanca;
    }
    printf("   %-8s -> (kaynak bilinmiyor)\n", ad);
    return 0;
}

int main(void)
{
    demo_hazirla();
    printf("LD_PRELOAD / fonksiyon kancasi (hook) algilama\n");
    printf("--------------------------------------------------------------\n");
    int supheli = 0;

    const char *pre = getenv("LD_PRELOAD");
    printf("1) LD_PRELOAD ortam degiskeni : %s\n", (pre && *pre) ? pre : "(bos)");
    if (pre && *pre)
        supheli++;

    printf("2) Kritik fonksiyonlar hangi kutuphaneden cozuluyor?\n");
    supheli += simge_denetle("time");
    supheli += simge_denetle("getenv");

    printf("3) time(NULL) dondurdu        : %ld\n", (long)time(NULL));

    printf("--------------------------------------------------------------\n");
    if (supheli)
        printf("SONUC: Fonksiyon kancasi / preload ALGILANDI (%d sinyal).\n", supheli);
    else
        printf("SONUC: Temiz - preload/kanca gorunmuyor.\n");
    printf("Not: getenv() sahteciligi kolaydir; bu yuzden fonksiyonun KAYNAGINI\n");
    printf("(dladdr/dli_fname) da dogrulariz. Kanca yuklu ise time() sabit sahte\n");
    printf("deger dondurur (1234567890).\n");
    return supheli ? 3 : 0;
}
