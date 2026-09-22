/*
 * CEN429 — Hafta 1 — Demo 4: İşaretli uzunluk hatası (HATALI SÜRÜM)
 *
 * Bir ağ paketinden ya da dosyadan gelen "kayıt uzunluğu" alanı int olarak
 * okunuyor ve yalnız üst sınır denetleniyor. Negatif bir uzunluk denetimi
 * geçer; memcpy'nin üçüncü parametresi size_t (işaretsiz) olduğu için -1,
 * 18446744073709551615 gibi dev bir sayıya dönüşür ve bellek taşar.
 * (Cookbook R3.5: tamsayı dönüşümü ve taşması.)
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cen429_demo.h"

#define KAYIT_BOYUTU 16

static int kaydi_kopyala(char *hedef, const char *kaynak, int uzunluk)
{
    if (uzunluk > KAYIT_BOYUTU)          /* HATA: alt sınır (negatif) denetlenmiyor */
        return -1;
    memcpy(hedef, kaynak, uzunluk);      /* int -> size_t: -1 -> 2^64 - 1 */
    return 0;
}

int main(int argc, char **argv)
{
    demo_hazirla();
    if (argc != 2) {
        fprintf(stderr, "Kullanim: %s <uzunluk>\n", argv[0]);
        return 1;
    }
    int uzunluk = atoi(argv[1]);
    char kaynak[KAYIT_BOYUTU] = "ORNEK-KAYIT-123";
    char hedef[KAYIT_BOYUTU]  = { 0 };

    printf("Istenen uzunluk: %d  ->  memcpy'ye giden deger: %zu\n", uzunluk, (size_t)uzunluk);
    if (kaydi_kopyala(hedef, kaynak, uzunluk) != 0) {
        printf("Reddedildi: uzunluk cok buyuk.\n");
        return 1;
    }
    printf("Kopyalandi: %.*s\n", KAYIT_BOYUTU, hedef);
    return 0;
}
