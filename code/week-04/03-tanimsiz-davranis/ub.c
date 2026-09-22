/*
 * CEN429 - Hafta 4 - Demo 3: Tanimsiz davranis (undefined behavior) (HATALI)
 *
 * C'de bazi islemler "tanimsiz davranistir": derleyici bunlarin OLMAYACAGINI
 * varsayar ve ona gore eniyileme yapar. x86'da coguna donanim ses cikarmaz,
 * program "calisiyor gibi" gorunur; ama sonuc yanlistir ve derleyici sürümü
 * degisince davranis da degisir. UndefinedBehaviorSanitizer (UBSan) bunlari
 * CALISMA ANINDA yakalar.
 *
 * Kip:
 *   tasma    : isaretli tamsayi tasmasi (INT_MAX + 1)   -> CWE-190
 *   kaydir   : gecersiz bit kaydirma (1 << 31 / >=genislik) -> CWE-190/CWE-758
 *   hizasiz  : hizasiz (misaligned) bellek erisimi        -> CWE-758
 */
#include <limits.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cen429_demo.h"

static int kip_tasma(int ekle)
{
    int x = INT_MAX;
    int y = x + ekle;            /* UB: isaretli tamsayi tasmasi */
    printf("   INT_MAX + %d = %d  (matematikte %lld olmaliydi)\n",
           ekle, y, (long long)INT_MAX + ekle);
    return 0;
}

static int kip_kaydir(int n)
{
    int x = 1;
    int y = x << n;              /* UB: n>=31 ise int'e sigmaz / tanimsiz */
    printf("   1 << %d = %d\n", n, y);
    return 0;
}

static int kip_hizasiz(void)
{
    /* 1 bayt kaydirilmis adresten 4 baytlik int okuma: hizasiz erisim */
    unsigned char tampon[8] = { 1, 2, 3, 4, 5, 6, 7, 8 };
    int *p = (int *)(tampon + 1);   /* UB: hizalama gerekliligi ihlali */
    printf("   hizasiz adresten okunan int = %d\n", *p);
    return 0;
}

int main(int argc, char **argv)
{
    demo_hazirla();
    const char *kip = (argc >= 2) ? argv[1] : "tasma";
    if (strcmp(kip, "tasma") == 0)   return kip_tasma(argc >= 3 ? atoi(argv[2]) : 1);
    if (strcmp(kip, "kaydir") == 0)  return kip_kaydir(argc >= 3 ? atoi(argv[2]) : 31);
    if (strcmp(kip, "hizasiz") == 0) return kip_hizasiz();
    fprintf(stderr, "Kullanim: %s <tasma|kaydir|hizasiz> [sayi]\n", argv[0]);
    return 2;
}
