/*
 * CEN429 - Hafta 9 - Demo 2: Cesitlendirme (diversification).
 * AYNI kaynak, DERLEME ANINDA farkli TOHUM ile derlenir -> davranisca ozdes ama
 * MAKINE KODU farkli iki ikili. Bir kopyaya yazilan yama digerinde calismaz.
 * (Tigress'in --Seed'inin el ile, derleyici makrosuyla benzetimi; 14. hafta araci.)
 *
 * TOHUM, dize kodlama maskesini ve duzlestirme case degerlerini belirler; sonuc
 * ayni kalir ama uretilen kod degisir. GUVENLI: sentetik, dosya/ag/sistem islemi yok.
 */
#include <stdio.h>
#include <string.h>

#ifndef TOHUM
#define TOHUM 1001
#endif

/* Tohumdan turetilen (derleme aninda sabit) maske ve case tabani. */
#define MASKE ((unsigned char)((TOHUM * 2654435761u) >> 24))
#define C0    ((TOHUM * 40503u) & 0x3F)
#define C1    (C0 + 7)
#define C2    (C0 + 19)
#define C3    (C0 + 41)

static const char GECERLI[] = "CEN429-OK";

#if defined(__GNUC__) || defined(__clang__)
__attribute__((noinline))
#endif
int erisim_ver(const char *jeton)
{
    unsigned n = (unsigned)(sizeof GECERLI - 1);
    int durum = C0;
    int sonuc = 0;
    unsigned char kod[sizeof GECERLI];
    /* Dizeyi tohuma bagli maskeyle kodla (her tohumda farkli baytlar). */
    for (unsigned i = 0; i < n; i++) kod[i] = (unsigned char)(GECERLI[i] ^ MASKE);

    for (;;) {
        if (durum == C0) { durum = (strlen(jeton) == n) ? C1 : 999; }
        else if (durum == C1) {
            unsigned fark = 0;
            for (unsigned i = 0; i < n; i++)
                fark |= (unsigned)((unsigned char)(jeton[i] ^ MASKE) ^ kod[i]);
            durum = fark ? C3 : C2;
        }
        else if (durum == C2) { sonuc = 1; durum = -1; }
        else if (durum == C3) { sonuc = 0; durum = -1; }
        else { memset(kod, 0, sizeof kod); return sonuc; }  /* rastgele/tek cikis */
    }
}

int main(int argc, char **argv)
{
    const char *j = (argc > 1) ? argv[1] : "CEN429-OK";
    printf("[tohum %d] erisim_ver(\"%s\") = %s\n", (int)TOHUM, j, erisim_ver(j) ? "IZIN" : "RED");
    return 0;
}
