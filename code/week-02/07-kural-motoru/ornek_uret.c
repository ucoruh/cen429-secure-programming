/*
 * CEN429 — Hafta 2 — Demo 07: Kural motoru için zararsız örnek dosyalar
 *
 * Kullanım: bin/.../ornek_uret <klasor>
 *
 * Üretilen dosyaların HİÇBİRİ çalıştırılabilir değildir; hepsi düz metindir.
 *   temiz.txt    sıradan bir ders planı: hiçbir kurala uymamalı
 *   kilavuz.txt  zararsız bir kurulum kılavuzu; "indir" ve "calistir"
 *                kelimelerini doğal olarak içerir (yanlış pozitif adayı)
 *   kapsul.bin   Demo 1'deki oyuncak KAPSUL biçimine benzeyen metin
 *   varyant.bin  kapsülün değiştirilmiş hali: başlık farklı, işaret
 *                "MAVI_KEDI" (tire yerine alt çizgi)
 *   notlar.txt   "YAPILACAK" kelimesini dört kez içeren not dosyası
 */
#include <stdio.h>
#include "cen429_demo.h"

static int yaz(const char *klasor, const char *ad, const char *metin)
{
    char yol[512];
    snprintf(yol, sizeof yol, "%s/%s", klasor, ad);
    FILE *f = fopen(yol, "wb");      /* ikili kip: iki platformda aynı bayt */
    if (!f) {
        perror(yol);
        return -1;
    }
    fputs(metin, f);
    return fclose(f);
}

int main(int argc, char **argv)
{
    demo_hazirla();
    if (argc != 2) {
        fprintf(stderr, "kullanim: %s <klasor>\n", argv[0]);
        return 2;
    }
    const char *k = argv[1];
    int h = 0;
    h |= yaz(k, "temiz.txt",
             "Haftalik ders plani\n"
             "Hafta 1: giris ve tehdit modeli\n"
             "Hafta 2: zararli yazilim ve guvenlik modelleri\n");
    h |= yaz(k, "kilavuz.txt",
             "Kurulum kilavuzu\n"
             "1. Programi resmi siteden indir.\n"
             "2. Imzasini dogrula, sonra kurulum dosyasini calistir.\n"
             "3. Ilk acilista guncellemeleri denetle.\n");
    h |= yaz(k, "kapsul.bin",
             "KAPSUL/1\n"
             "COZUCU: ALGO=xs32 TOHUM=1a2b3c4d COZ\n"
             "govde: indir ve calistir komutlarini taklit eden metin\n"
             "isaret: MAVI-KEDI-42 (zararsiz ders ornegi)\n");
    h |= yaz(k, "varyant.bin",
             "KAPSUL/1\n"
             "GOVDE UZUNLUK=64\n"
             "isaret: MAVI_KEDI-42 (tire yerine alt cizgi)\n");
    h |= yaz(k, "notlar.txt",
             "YAPILACAK: raporu bitir\n"
             "YAPILACAK: demo 07'yi dene\n"
             "YAPILACAK: kurallari gozden gecir\n"
             "YAPILACAK: quiz'e calis\n");
    if (h != 0)
        return 1;
    printf("  %s/ altina 5 ornek dosya uretildi\n", k);
    return 0;
}
