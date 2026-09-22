/*
 * CEN429 - Hafta 12 - Demo 2: Saldiri potansiyeli hesaplayici (basitlestirilmis).
 * Bes faktorden (sure, uzmanlik, hedef bilgisi, firsat, ekipman) puan toplar ve
 * bir direniclik duzeyine esler. DUSUK toplam = kolay saldiri = CIDDI bulgu.
 * (Ortak Kriterler / JIL tarzinin ders icin sadelestirilmis halidir.)
 *
 * Kullanim: saldiri_potansiyeli            -> gomulu ornek bulgular
 *           saldiri_potansiyeli s u b f e  -> faktor seviyeleri (0..3 gibi indeksler)
 * GUVENLI: saf hesap; dosya/ag/sistem islemi yok.
 */
#include <stdio.h>
#include <stdlib.h>

/* Her faktor icin seviye puanlari (indeks -> puan). */
static const int SURE[]     = {0, 4, 10, 19};   /* <1 gun, <1 hafta, <1 ay, aylar */
static const int UZMAN[]    = {0, 3, 6, 8};     /* siradan, yetkin, uzman, coklu uzman */
static const int BILGI[]    = {0, 3, 7, 11};    /* kamuya acik, kisitli, hassas, kritik */
static const int FIRSAT[]   = {0, 4, 10};       /* sinirsiz/uzak, kisitli, cok kisitli */
static const int EKIPMAN[]  = {0, 4, 7};        /* standart/ucretsiz, ozel, ozel-uyarlanmis */

static const char *duzey(int p)
{
    if (p <= 9)  return "TEMEL   (dusuk direnc -> CIDDI bulgu)";
    if (p <= 13) return "ORTA";
    if (p <= 19) return "YUKSEK";
    if (p <= 24) return "COK YUKSEK";
    return "OTESI (yalniz cok yetenekli saldirgan)";
}

static int guvenli_idx(const char *s, int n)
{
    int v = atoi(s); if (v < 0) v = 0; if (v >= n) v = n - 1; return v;
}

static void hesapla(const char *ad, int s, int u, int b, int f, int e)
{
    int p = SURE[s] + UZMAN[u] + BILGI[b] + FIRSAT[f] + EKIPMAN[e];
    printf("  %-28s puan=%2d -> %s\n", ad, p, duzey(p));
}

int main(int argc, char **argv)
{
    printf("=== Saldiri potansiyeli ===\n");
    if (argc >= 6) {
        hesapla("(girilen)",
                guvenli_idx(argv[1], 4), guvenli_idx(argv[2], 4), guvenli_idx(argv[3], 4),
                guvenli_idx(argv[4], 3), guvenli_idx(argv[5], 3));
        return 0;
    }
    /* Gomulu ornek bulgular (slaytlardaki senaryolar). */
    printf(" Ornek bulgular:\n");
    hesapla("Lisans denetimi tek-bayt yama", 0, 1, 0, 0, 0);   /* saat/orta/kamu/uzak/ucretsiz */
    hesapla("WBC anahtar cikarma (DCA)",      2, 3, 2, 1, 1);   /* ay/uzman/hassas/kisitli/ozel */
    hesapla("Guvenli oge (SE) kirma",         3, 3, 3, 2, 2);   /* aylar/coklu uzman/kritik/... */
    printf(" Not: DUSUK puan = kolay saldiri = ilk kapatilacak bulgu. CVSS ile birlikte onceliklendirilir.\n");
    return 0;
}
