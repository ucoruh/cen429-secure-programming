/*
 * CEN429 — Hafta 2 — Demo 2: Entropi demosu için örnek dosya üretici
 *
 * Kullanım: ./bin/.../uret <klasor>
 *
 * Bütün örnekler bu klasörde, iki platformda AYNI biçimde üretilir (harici
 * gzip/openssl/objcopy gerekmez):
 *   tekduze.txt   4096 bayt 'A' (entropi ~0)
 *   belge.txt     düz metin (entropi ~4-5)
 *   kod.bin       makine kodu benzeri, orta entropili sentetik veri (~6)
 *   sifreli.bin   belge.txt'in AES-256-GCM ile şifrelenmiş hali (~8)
 *   rastgele.bin  sabit tohumlu üreteçten yüksek entropili veri (~8)
 *   karma.bin     metin + şifreli bölüm + metin (pencereli tarama için)
 *
 * Şifreleme anahtarı/nonce demo için sabittir; gizli bir değer DEĞİLDİR ve
 * hiçbir gerçek veriyi korumaz. Amaç yalnız "aynı içerik şifrelenince
 * entropisi sıçrar" olgusunu göstermektir.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cen429_demo.h"
#include "cen429_kripto.h"

/* Sabit tohumlu xorshift: her platformda ve her çalıştırmada aynı çıktı */
static uint32_t rn_durum = 0x1234abcdu;
static unsigned char rn_bayt(void)
{
    rn_durum ^= rn_durum << 13;
    rn_durum ^= rn_durum >> 17;
    rn_durum ^= rn_durum << 5;
    return (unsigned char)(rn_durum & 0xffu);
}

static void yaz(const char *klasor, const char *ad, const void *v, size_t n)
{
    char yol[512];
    snprintf(yol, sizeof yol, "%s/%s", klasor, ad);
    FILE *f = fopen(yol, "wb");
    if (!f) {
        perror(yol);
        return;
    }
    fwrite(v, 1, n, f);
    fclose(f);
}

/* Düz metin: kısa bir alfabeden, tekrarlı (düşük entropi) */
static size_t metin_uret(unsigned char *b, size_t kap)
{
    size_t n = 0;
    for (int i = 1; i <= 48 && n < kap - 80; i++)
        n += (size_t)snprintf((char *)b + n, kap - n,
                              "satir %02d: bu bir duz metin ornegidir, "
                              "az sayida harf sik tekrar eder.\n", i);
    return n;
}

int main(int argc, char **argv)
{
    demo_hazirla();
    if (argc != 2) {
        fprintf(stderr, "kullanim: %s <klasor>\n", argv[0]);
        return 2;
    }
    const char *k = argv[1];
    static unsigned char metin[4096];
    size_t mn = metin_uret(metin, sizeof metin);

    /* tekduze.txt */
    static unsigned char tek[4096];
    memset(tek, 'A', sizeof tek);
    yaz(k, "tekduze.txt", tek, sizeof tek);

    /* belge.txt */
    yaz(k, "belge.txt", metin, mn);

    /* kod.bin: baytların çoğu 6 bitlik dar aralıkta, ara sıra tam bayt ->
       derlenmiş makine kodunun tipik ~6 bit/bayt entropisini taklit eder */
    static unsigned char kod[2048];
    for (size_t i = 0; i < sizeof kod; i++) {
        unsigned char r = rn_bayt();
        kod[i] = (r & 0x07u) == 0 ? r : (unsigned char)(r & 0x3fu);
    }
    yaz(k, "kod.bin", kod, sizeof kod);

    /* sifreli.bin: belge.txt'in AES-256-GCM sifresi (sabit demo anahtar) */
    static const unsigned char anahtar[32] = {
        0x2b, 0x7e, 0x15, 0x16, 0x28, 0xae, 0xd2, 0xa6,
        0xab, 0xf7, 0x15, 0x88, 0x09, 0xcf, 0x4f, 0x3c,
        0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88,
        0x99, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff, 0x00
    };
    static const unsigned char nonce[12] = {
        0x00, 0x01, 0x02, 0x03, 0x04, 0x05,
        0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b
    };
    static unsigned char sifreli[4096 + 16];
    unsigned char tag[16];
    if (kripto_gcm_sifrele(anahtar, nonce, sizeof nonce, NULL, 0, metin, mn,
                           sifreli, tag)) {
        memcpy(sifreli + mn, tag, 16);
        yaz(k, "sifreli.bin", sifreli, mn + 16);
    } else {
        fprintf(stderr, "sifreleme basarisiz (kripto kutuphanesi?)\n");
    }

    /* rastgele.bin: yüksek entropili sentetik veri */
    static unsigned char rast[4096];
    for (size_t i = 0; i < sizeof rast; i++)
        rast[i] = rn_bayt();
    yaz(k, "rastgele.bin", rast, sizeof rast);

    /* karma.bin: 1536 metin + 1536 sifreli + 1536 metin */
    static unsigned char karma[4608];
    size_t p = 0;
    memcpy(karma + p, metin, 1536); p += 1536;
    memcpy(karma + p, sifreli, 1536); p += 1536;
    memcpy(karma + p, metin + 1536, 1536); p += 1536;
    yaz(k, "karma.bin", karma, p);

    printf("  %s/ altina 7 ornek dosya uretildi\n", k);
    return 0;
}
