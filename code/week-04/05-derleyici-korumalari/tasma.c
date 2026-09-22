/*
 * CEN429 - Hafta 4 - Demo 5: Derleyici ve isletim sistemi korumalari.
 *
 * Ayni tasma hatasi (64 baytlik yerel tampona sinirsiz strcpy) iki farkli
 * derleme ile uretilir:
 *   zayif : korumalar KAPALI (kanary yok, PIE/ASLR yok, RELRO yok)
 *   sert  : korumalar ACIK  (stack canary, _FORTIFY, PIE/ASLR, RELRO, CFG)
 *
 * Uzun bir girdi tamponu tasirinca:
 *   - sert surumde yigin kanary'si (stack canary) bozulur ve program guvenli
 *     bicimde durur: Linux "*** stack smashing detected ***", Windows 0xC0000409.
 *   - zayif surumde ayni tasma ya sessizce bozar ya da ileride coker.
 *
 * ETIK: tasma yalniz bu programin kendi yigininda kalir; Linux'ta prlimit+
 * timeout, Windows'ta demo_hazirla() ile sinirlanir.
 */
#include <stdio.h>
#include <string.h>
#include "cen429_demo.h"

static void kopyala(const char *girdi)
{
    char tampon[64];
    strcpy(tampon, girdi);            /* HATA: hedef boyutu denetlenmiyor */
    printf("Kopyalandi (ilk baytlar): %.16s\n", tampon);
}

int main(int argc, char **argv)
{
    demo_hazirla();
    if (argc != 2) {
        fprintf(stderr, "Kullanim: %s <metin>\n", argv[0]);
        return 1;
    }
    kopyala(argv[1]);
    printf("Fonksiyon normal dondu (kanary bozulmadi).\n");
    return 0;
}
