/*
 * CEN429 - Hafta 4 - Demo 3: Tanimsiz davranis (GUVENLI SURUM)
 *
 * Her islemi KULLANMADAN ONCE acikca denetleriz (SEI CERT C: INT32-C tasmayi
 * onle, INT34-C gecersiz kaydirma yapma, EXP36-C hizalanmamis isaretci
 * uretme). Tasma denetimi tasinabilir olsun diye derleyici yerlesigini
 * (GCC/Clang) ya da elle denetimi (MSVC) kullaniriz. Hizasiz erisim yerine
 * memcpy kullaniriz: derleyici hizali erisime cevirir, UB olmaz.
 */
#include <limits.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cen429_demo.h"

/* Tasinabilir isaretli toplama tasma denetimi. Basari 1, tasma 0. */
static int guvenli_topla(int a, int b, int *sonuc)
{
#if defined(__GNUC__) || defined(__clang__)
    return __builtin_add_overflow(a, b, sonuc) ? 0 : 1;
#else
    if ((b > 0 && a > INT_MAX - b) || (b < 0 && a < INT_MIN - b))
        return 0;
    *sonuc = a + b;
    return 1;
#endif
}

static int kip_tasma(int ekle)
{
    int y;
    if (!guvenli_topla(INT_MAX, ekle, &y)) {
        printf("   Reddedildi: INT_MAX + %d tasar (islem yapilmadi).\n", ekle);
        return 0;
    }
    printf("   INT_MAX + %d = %d\n", ekle, y);
    return 0;
}

static int kip_kaydir(int n)
{
    if (n < 0 || n >= 31) {         /* int icin 0..30 guvenli */
        printf("   Reddedildi: %d gecerli kaydirma araligi disinda (0-30).\n", n);
        return 0;
    }
    int y = 1 << n;
    printf("   1 << %d = %d\n", n, y);
    return 0;
}

static int kip_hizasiz(void)
{
    unsigned char tampon[8] = { 1, 2, 3, 4, 5, 6, 7, 8 };
    int deger;
    memcpy(&deger, tampon + 1, sizeof deger);  /* hizalama sorunu yok */
    printf("   memcpy ile guvenli okunan int = %d\n", deger);
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
