/*
 * CEN429 - Hafta 4 - Demo 1: Bicim dizisi (format string) acigi (HATALI SURUM)
 *
 * Program, kullanicidan gelen metni dogrudan printf'in BICIM parametresi
 * olarak veriyor:  printf(kullanici);
 * Bu, "printf'e ne yazdiracagini kullaniciya sormak" demektir. Kullanici
 * bicim belirteci (%x, %p, %n, %s ...) yazarsa:
 *   - %x / %p : yigindan (stack) deger OKUR  -> bilgi sizintisi
 *   - %n      : bellege YAZAR                -> cokme / kod calistirma
 *
 * Programin kendi "gizli" degeri (gizli_deger) yiginda, bicim tamponunun
 * yakininda durur; yeterince %x ile bu deger ekrana dokulur.
 *
 * ETIK/GUVENLIK: butun saldirilar YALNIZ bu programin kendi bellegine.
 * Cokebilecek adimlar Linux'ta prlimit+timeout ile, Windows'ta demo_hazirla()
 * ile sinirlanir; sistem ayari degismez, yonetici yetkisi istenmez.
 */
#include <stdio.h>
#include <string.h>
#include "cen429_demo.h"

int main(int argc, char **argv)
{
    demo_hazirla();
    if (argc != 2) {
        fprintf(stderr, "Kullanim: %s <metin>\n", argv[0]);
        return 1;
    }

    /* Programin sizmamasi gereken "gizli" degeri. Yiginda, asagidaki
       bicim tamponuna komsu durur. */
    volatile unsigned gizli_deger = 0x5ECE7u;   /* 387303 */
    char tampon[64];
    snprintf(tampon, sizeof(tampon), "%s", argv[1]);

    printf("Gizli deger bellekte: 0x%05x (ekranda GORUNMEMELI)\n",
           gizli_deger);
    printf("Program ciktisi -> ");
    printf(tampon);            /* HATA: bicim dizisi kullanici denetiminde */
    printf("\n");
    return 0;
}
