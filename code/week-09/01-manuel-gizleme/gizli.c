/*
 * CEN429 - Hafta 9 - Demo 1: GIZLI surum (ayni davranis, el ile guclendirilmis).
 * Uygulanan kurallar (slaytlarla ayni):
 *   K-01 opak yuklem   : dallanma daima-dogru bir aritmetik ozdesyige baglanir.
 *   K-04 duzlestirme   : akis tek bir switch dagiticisina tasinir.
 *   K-05 rastgele cikis : hata, durum degiskenini tanimsiz bir degere iterek default'tan cikar.
 *   K-07 sabit kodlama  : gecerli jeton dizgesi XOR ile kodlu durur, kullanimda cozulur ve HEMEN silinir.
 *   K-08 opak boolean   : sonuc duz 0/1 degil; iki alandan turetilir.
 * Davranis temiz.c ile birebir AYNIDIR; yalniz okunmasi zorlasir ve maliyeti artar.
 */
#include <string.h>
#include "ortak.h"

/* Kodlanmis "CEN429-OK" (her bayt ^ 0x5A). strings ile duz gorunmez. */
static const unsigned char KOD[] = {
    0x19, 0x1F, 0x14, 0x6E, 0x68, 0x63, 0x77, 0x15, 0x11  /* "CEN429-OK" her bayt ^ 0x5A */
};
#define KOD_N ((unsigned)(sizeof KOD))

/* K-01: x*(x+1) daima cifttir -> daima 0. Statik analiz kolay kanitlayamaz. */
static int opak_sifir(unsigned x) { return (int)((x * (x + 1u)) & 1u); }

/* K-08: opak boolean; a ^ b == 0xFFFF -> IZIN. */
typedef struct { unsigned a, b; } Karar;
static int karar_izin(Karar k) { return (k.a ^ k.b) == 0xFFFFu; }

static int esit_sabit(const unsigned char *a, const char *b, unsigned n)
{
    unsigned fark = 0;
    for (unsigned i = 0; i < n; i++)
        fark |= (unsigned)(a[i] ^ (unsigned char)b[i]);
    return fark == 0;
}

int erisim_ver(const char *jeton)
{
    enum { BASLA, UZUNLUK, COZ, KIYAS, IZINLI, REDDET, BITTI = 99 };
    int durum = BASLA + opak_sifir((unsigned)strlen(jeton)); /* opak: yine BASLA */
    unsigned n = KOD_N;
    char coz[KOD_N + 1];
    Karar k = { 0, 0 };
    int sonuc = RED;

    for (;;) {
        switch (durum) {
        case BASLA:
            durum = UZUNLUK;
            break;
        case UZUNLUK:
            /* K-05: uzunluk tutmazsa tanimsiz bir duruma it -> default -> REDDET */
            durum = (strlen(jeton) == n) ? COZ : (BITTI + 7);
            break;
        case COZ:
            for (unsigned i = 0; i < n; i++) coz[i] = (char)(KOD[i] ^ 0x5A);
            coz[n] = '\0';
            durum = KIYAS;
            break;
        case KIYAS:
            if (esit_sabit((const unsigned char *)jeton, coz, n))
                k.a = 0xA3C1u, k.b = 0x5C3Eu;   /* a^b == 0xFFFF -> izin */
            else
                k.a = 0x1111u, k.b = 0x2222u;   /* izin degil */
            memset(coz, 0, sizeof coz);         /* K-07: cozulen dizgeyi HEMEN sil */
            durum = karar_izin(k) ? IZINLI : REDDET;
            break;
        case IZINLI:
            sonuc = IZIN;
            durum = -1;                         /* default -> cik (basari da default'tan) */
            break;
        case REDDET:
            sonuc = RED;
            durum = -2;
            break;
        default:                                /* K-05 rastgele cikis noktasi */
            return sonuc;
        }
    }
}
