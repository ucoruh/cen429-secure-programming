/*
 * CEN429 - Hafta 9 - Demo 1: TEMIZ (korumasiz) surum.
 * Tek dal, tek donus: tersine muhendis icin kolay hedef.
 */
#include <string.h>
#include "ortak.h"

/* Sabit zamanli karsilastirma (erken cikis yok -> yan kanal yok). */
static int esit_sabit(const char *a, const char *b, unsigned n)
{
    unsigned fark = 0;
    for (unsigned i = 0; i < n; i++)
        fark |= (unsigned)((unsigned char)a[i] ^ (unsigned char)b[i]);
    return fark == 0;
}

int erisim_ver(const char *jeton)
{
    static const char GECERLI[] = "CEN429-OK";        /* duz gorunur (strings) */
    if (strlen(jeton) != strlen(GECERLI))
        return RED;
    if (esit_sabit(jeton, GECERLI, (unsigned)strlen(GECERLI)))
        return IZIN;
    return RED;
}
