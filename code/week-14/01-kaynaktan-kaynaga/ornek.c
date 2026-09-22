/*
 * CEN429 - Hafta 14 - Demo 1: Tigress icin sentetik girdi (kaynaktan kaynaga gizleme).
 * Kucuk, hassas bir denetim: gizlenecek fonksiyon budur.
 * GUVENLIK: tumuyle sentetik; dosya/ag/sistem islemi yok.
 */
#include <stdio.h>
#include <string.h>

/* Gizlenecek fonksiyon: gecerli sentetik jeton icin 1, degilse 0.
   noinline: olcum icin fonksiyon ayri bir simge kalsin (main icine gomulmesin). */
#if defined(__GNUC__) || defined(__clang__)
__attribute__((noinline))
#endif
int erisim_ver(const char *jeton)
{
    static const char GECERLI[] = "CEN429-OK";
    if (strlen(jeton) != strlen(GECERLI)) return 0;
    unsigned fark = 0;
    for (unsigned i = 0; i < sizeof GECERLI - 1; i++)
        fark |= (unsigned)((unsigned char)jeton[i] ^ (unsigned char)GECERLI[i]);
    return fark == 0;
}

int main(int argc, char **argv)
{
    const char *j = (argc > 1) ? argv[1] : "CEN429-OK";
    printf("erisim_ver(\"%s\") = %s\n", j, erisim_ver(j) ? "IZIN" : "RED");
    return 0;
}
