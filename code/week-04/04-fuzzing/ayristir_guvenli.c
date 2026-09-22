/*
 * CEN429 - Hafta 4 - Demo 4: DUZELTILMIS belge ayristiricisi.
 *
 * Ilke: dis girdiye asla guvenme (Tarif 3.1). Her erisimden ONCE hem kalan
 * girdi uzunlugunu hem de hedef tamponun sinirini denetle.
 */
#include "ayristir.h"
#include <string.h>

int belge_ayristir(const unsigned char *veri, size_t n)
{
    if (n < 2)
        return 0;                          /* tur + uzunluk icin en az 2 bayt */
    unsigned char tur = veri[0];
    if (tur == 0x42) {
        size_t uzunluk = veri[1];
        unsigned char hedef[16];
        if (uzunluk > sizeof(hedef))       /* hedef sinir denetimi */
            return -1;
        if ((size_t)2 + uzunluk > n)       /* girdi sinir denetimi */
            return -1;
        memcpy(hedef, veri + 2, uzunluk);
        return uzunluk > 0 ? hedef[0] : 0;
    }
    return 0;
}
