/*
 * CEN429 - Hafta 4 - Demo 4: HATALI belge ayristiricisi.
 *
 * Bicim:  [tur][uzunluk][veri...]   (basit uzunluk-onekli kayit)
 * tur == 0x42 ('B') ise: ikinci bayt uzunlugu verir, sonra o kadar bayt bir
 * yerel tampona kopyalanir. Iki klasik hata var:
 *   1) veri[1] okunurken n>=2 denetlenmiyor (kisa girdide sinir disi okuma).
 *   2) uzunluk, hem kalan girdiye hem de 16 baytlik hedefe gore denetlenmiyor
 *      (sinir disi okuma + yigin tamponunu tasirma).
 * Bu hatalar rastgele girdide saniyeler icinde tetiklenir; fuzzer'in isi budur.
 */
#include "ayristir.h"

int belge_ayristir(const unsigned char *veri, size_t n)
{
    if (n < 1)
        return 0;
    unsigned char tur = veri[0];
    if (tur == 0x42) {
        unsigned char uzunluk = veri[1];      /* HATA 1: n>=2 denetlenmedi */
        unsigned char hedef[16];
        for (unsigned i = 0; i < uzunluk; i++)
            hedef[i] = veri[2 + i];           /* HATA 2: sinir disi + tasma */
        return hedef[0];
    }
    return 0;
}
