/*
 * CEN429 - Hafta 6 - Demo 4: SAHTE kanca kutuphanesi (yalniz demo icin)
 *
 * Bu kucuk paylasimli kutuphane, saldirganin LD_PRELOAD ile standart bir
 * fonksiyonu nasil DEGISTIRDIGINI (interposition) gosterir. Yalniz time()
 * fonksiyonunu ele gecirir ve sabit, sahte bir deger dondurur. Zararsizdir:
 * ekrana bir sey basmaz, dosyaya dokunmaz; yalniz LD_PRELOAD ile calistirilan
 * demo surecini etkiler.
 *
 * Gercek bir kancanin nasil yakalandigi kanca_ana.c'de anlatilir.
 */
#include <time.h>

time_t time(time_t *t)
{
    time_t sahte = (time_t)1234567890;   /* saldirganin dayattigi sabit zaman */
    if (t)
        *t = sahte;
    return sahte;
}
