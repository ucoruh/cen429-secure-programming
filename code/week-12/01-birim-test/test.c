/*
 * CEN429 - Hafta 12 - Demo 1: Birim test kosucusu (S16 "test SONUCLARI").
 * Her test bir "test karti"dir: kimlik, amac, beklenen, gozlenen, karar.
 * Cikis kodu = basarisiz test sayisi (CI/degerlendirmede kullanilir).
 * GUVENLIK: saf hesap; dosya/ag/sistem islemi yok.
 */
#include <stdio.h>
#include <limits.h>
#include "sut.h"

static int gecen = 0, kalan = 0;

/* Bir test karti: kosul dogruysa GECTI, degilse KALDI (kanit satiriyla). */
static void kart(const char *kimlik, const char *amac, int kosul, const char *gozlenen)
{
    const char *karar = kosul ? "GECTI" : "KALDI";
    if (kosul) gecen++; else kalan++;
    printf("  [%s] %-6s %s\n", kimlik, karar, amac);
    printf("        gozlenen: %s\n", gozlenen);
}

int main(void)
{
    int r;
    printf("=== S16 Birim Testleri (girdi_dogrula, guvenli_topla) ===\n");

    kart("T-01", "Gecerli girdi kabul edilir",
         girdi_dogrula("Ayse_2026") == 1, "girdi_dogrula(\"Ayse_2026\") = 1");

    kart("T-02", "Bosluk/metakarakter reddedilir",
         girdi_dogrula("rm -rf /") == 0, "girdi_dogrula(\"rm -rf /\") = 0");

    kart("T-03", "Bos girdi reddedilir",
         girdi_dogrula("") == 0, "girdi_dogrula(\"\") = 0");

    kart("T-04", "32'den uzun girdi reddedilir",
         girdi_dogrula("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa") == 0, "33 karakter -> 0");

    r = 0;
    kart("T-05", "Normal toplama dogru",
         guvenli_topla(2, 3, &r) == 1 && r == 5, "guvenli_topla(2,3)=5, tamam");

    r = 12345;
    kart("T-06", "Tasma ONCEDEN yakalanir",
         guvenli_topla(INT_MAX, 1, &r) == 0, "guvenli_topla(INT_MAX,1) = tasma (0)");

    printf("\nSONUC: %d gecti, %d kaldi.\n", gecen, kalan);
    if (kalan == 0) printf("Tum testler GECTI. Bu tablo projede S16'ya girer.\n");
    return kalan;   /* cikis kodu = basarisiz sayisi */
}
