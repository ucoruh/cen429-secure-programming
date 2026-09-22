/*
 * CEN429 — Hafta 1 — Demo 4: İşaretli uzunluk hatası (GÜVENLİ SÜRÜM)
 *
 * Düzeltmeler:
 *  1) Uzunluk metinden strtol ile okunur; sayı olmayan, taşan ya da artık
 *     karakter içeren girdi reddedilir (atoi hataları sessizce 0 yapar).
 *  2) Uzunluk hem alt hem üst sınırla denetlenir ve bellek fonksiyonuna
 *     yalnız denetimden sonra size_t olarak verilir.
 */
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cen429_demo.h"

#define KAYIT_BOYUTU 16

static int uzunluk_oku(const char *metin, size_t *sonuc)
{
    char *son;
    errno = 0;
    long deger = strtol(metin, &son, 10);
    if (errno != 0 || son == metin || *son != '\0')
        return -1;                       /* sayı değil ya da taştı */
    if (deger < 0 || deger > KAYIT_BOYUTU)
        return -1;                       /* aralık dışı */
    *sonuc = (size_t)deger;
    return 0;
}

int main(int argc, char **argv)
{
    demo_hazirla();
    if (argc != 2) {
        fprintf(stderr, "Kullanim: %s <uzunluk>\n", argv[0]);
        return 1;
    }
    size_t uzunluk;
    if (uzunluk_oku(argv[1], &uzunluk) != 0) {
        printf("Reddedildi: uzunluk 0-%d arasinda bir tamsayi olmali.\n", KAYIT_BOYUTU);
        return 1;
    }
    char kaynak[KAYIT_BOYUTU] = "ORNEK-KAYIT-123";
    char hedef[KAYIT_BOYUTU]  = { 0 };
    memcpy(hedef, kaynak, uzunluk);
    printf("Kopyalandi (%zu bayt): %.*s\n", uzunluk, (int)uzunluk, hedef);
    return 0;
}
