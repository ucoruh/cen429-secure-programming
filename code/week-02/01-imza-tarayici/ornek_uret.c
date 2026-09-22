/*
 * CEN429 — Hafta 2 — Demo 1: Zararsız örnek dosyaları üretir
 *
 * Kullanım: bin/linux/ornek_uret <klasor>
 *
 * Üretilen dosyaların HİÇBİRİ çalıştırılabilir değildir; içlerinde yalnız
 * düz metin ya da o metnin karıştırılmış hali vardır. Dosyalar:
 *   temiz.txt          sıradan bir metin dosyası
 *   ornek_a.bin        düz gövdeli kapsül ("yakalanmış örnek")
 *   ornek_a_1bayt.bin  aynı dosya, gövdede tek bir bayt farklı
 *   poli_1.bin         aynı gövde, xs32 çözücüsüyle, tohum 1
 *   poli_2.bin         aynı gövde, xs32 çözücüsüyle, tohum 2
 *   poli_3.bin         aynı gövde, DEĞİŞTİRİLMİŞ çözücüyle (lcg8 + çöp komut)
 *   arsiv.bin          kapsül OLMAYAN, yüksek entropili zararsız dosya
 *                      (sezgisel yöntemin yanlış pozitifini göstermek için)
 *
 * Tohumlar sabittir: böylece çıktı her bilgisayarda aynıdır. Gerçek
 * polimorfik motorlar her kopyada rastgele anahtar seçer.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cen429_demo.h"
#include "kapsul.h"

#define GOVDE_AZAMI 8192

/* Kapsülün gövdesi: 64 satır zararsız metin; 24. satırda bir "işaret" var. */
static size_t govde_olustur(unsigned char *b, size_t kap)
{
    size_t n = 0;
    for (int i = 1; i <= 64; i++) {
        char satir[128];
        int m;
        if (i == 24)
            m = snprintf(satir, sizeof satir,
                         "satir %02d | isaret: MAVI-KEDI-42 | "
                         "bu govde zararsiz bir metindir\n", i);
        else
            m = snprintf(satir, sizeof satir,
                         "satir %02d | CEN429 ders ornegi, kapsul govdesi, "
                         "deger=%05d\n", i, (i * 7919) % 100000);
        if (m < 0 || (size_t)m >= sizeof satir || n + (size_t)m > kap)
            break;
        memcpy(b + n, satir, (size_t)m);
        n += (size_t)m;
    }
    return n;
}

static int dosya_yaz(const char *klasor, const char *ad, const char *bas2,
                     const unsigned char *govde, size_t n)
{
    char yol[512];
    snprintf(yol, sizeof yol, "%s/%s", klasor, ad);
    FILE *f = fopen(yol, "wb");
    if (!f) {
        perror(yol);
        return -1;
    }
    fputs(KAPSUL_SIHIR, f);
    fputs(bas2, f);
    fwrite(govde, 1, n, f);
    return fclose(f);
}

static int temiz_yaz(const char *klasor)
{
    char yol[512];
    snprintf(yol, sizeof yol, "%s/temiz.txt", klasor);
    FILE *f = fopen(yol, "wb");     /* ikili kip: iki platformda aynı bayt */
    if (!f) {
        perror(yol);
        return -1;
    }
    fputs("Haftalik ders plani\n", f);
    for (int h = 1; h <= 16; h++)
        fprintf(f, "Hafta %2d: konu basligi, okuma listesi, %d sayfa\n",
                h, 10 + (h * 13) % 40);
    return fclose(f);
}

/* Sıkıştırılmış/şifreli bir dosyayı taklit eden, yüksek entropili ama
   tamamen zararsız içerik (sabit tohumlu xorshift -> her çalıştırmada aynı).
   Bir kapsül DEĞİLDİR; sezgisel yöntemin yanlış pozitifini gösterir. */
static int arsiv_yaz(const char *klasor, size_t n)
{
    char yol[512];
    snprintf(yol, sizeof yol, "%s/arsiv.bin", klasor);
    FILE *f = fopen(yol, "wb");
    if (!f) {
        perror(yol);
        return -1;
    }
    uint32_t s = 0xc0ffee11u;
    for (size_t i = 0; i < n; i++) {
        s ^= s << 13;
        s ^= s >> 17;
        s ^= s << 5;
        fputc((int)(s & 0xffu), f);
    }
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
    unsigned char duz[GOVDE_AZAMI], tmp[GOVDE_AZAMI];
    size_t n = govde_olustur(duz, sizeof duz);
    char bas[160];

    if (temiz_yaz(k) != 0)
        return 1;

    /* 1) Yakalanmış örnek: düz gövde */
    snprintf(bas, sizeof bas, "GOVDE UZUNLUK=%zu\n", n);
    dosya_yaz(k, "ornek_a.bin", bas, duz, n);

    /* 2) Tek bayt farklı kopya ("satir 01" -> "satir 00") */
    memcpy(tmp, duz, n);
    tmp[7] ^= 0x01;
    dosya_yaz(k, "ornek_a_1bayt.bin", bas, tmp, n);

    /* 3) Polimorfik kopyalar: aynı gövde, farklı anahtar */
    const uint32_t tohumlar[2] = { 0x1a2b3c4du, 0x99c0ffeeu };
    for (int i = 0; i < 2; i++) {
        char ad[32];
        memcpy(tmp, duz, n);
        xs32_uygula(tmp, n, tohumlar[i]);
        snprintf(bas, sizeof bas,
                 "COZUCU: ALGO=xs32 TOHUM=%08x UZUNLUK=%zu COZ\n",
                 (unsigned)tohumlar[i], n);
        snprintf(ad, sizeof ad, "poli_%d.bin", i + 1);
        dosya_yaz(k, ad, bas, tmp, n);
    }

    /* 4) Çözücüsü de değişmiş kopya: başka algoritma, sıra ve çöp komutlar */
    memcpy(tmp, duz, n);
    lcg8_uygula(tmp, n, 0x5eed1234u, 1);
    snprintf(bas, sizeof bas,
             "BOS UZUNLUK=%zu BOS BOS TOHUM=%08x ALGO=lcg8 BOS COZ\n",
             n, 0x5eed1234u);
    dosya_yaz(k, "poli_3.bin", bas, tmp, n);

    /* 5) Kapsül olmayan, yüksek entropili zararsız dosya */
    arsiv_yaz(k, 1600);

    printf("  %s/ altina 7 ornek dosya uretildi (govde %zu bayt)\n", k, n);
    return 0;
}
