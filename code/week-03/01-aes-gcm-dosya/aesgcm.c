/*
 * CEN429 - Hafta 3 - Demo 1: AES-256-GCM ile dosya sifreleme (AEAD)
 *
 * AES-GCM hem GIZLILIK (sifreleme) hem BUTUNLUK+KIMLIK (etiket, tag)
 * saglar; bu yuzden "kimlik dogrulamali sifreleme" (AEAD) denir.
 *
 * Dosya bicimi (hepsi tek dosyada, sirayla):
 *   [12 bayt nonce] [sifreli metin ...] [16 bayt etiket/tag]
 *
 * Anahtar 32 baytlik ikili "anahtar.bin" dosyasindan okunur.
 * Kullanim:
 *   aesgcm sifrele <anahtar> <girdi> <cikti>
 *   aesgcm coz     <anahtar> <girdi> <cikti>
 *
 * Cozerken etiket dogrulanir: sifreli metnin ya da etiketin tek bir
 * biti bile degismisse cozme REDDEDILIR (cikis kodu 2).
 *
 * Kripto, ortak baslik cen429_kripto.h uzerinden gelir: Linux'ta
 * OpenSSL EVP, Windows'ta BCrypt CNG. Ayni kaynak iki platformda derlenir.
 */
#include "cen429_demo.h"
#include "cen429_kripto.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define NONCE_BOYU 12
#define ETIKET_BOYU 16
#define ANAHTAR_BOYU 32

static void hata(const char *m)
{
    fprintf(stderr, "HATA: %s\n", m);
    exit(1);
}

static unsigned char *dosya_oku(const char *yol, long *boy)
{
    FILE *f = fopen(yol, "rb");
    if (!f)
        hata("dosya acilamadi");
    fseek(f, 0, SEEK_END);
    long n = ftell(f);
    fseek(f, 0, SEEK_SET);
    unsigned char *b = (unsigned char *)malloc(n > 0 ? (size_t)n : 1);
    if (!b)
        hata("bellek yetmedi");
    if (n > 0 && fread(b, 1, (size_t)n, f) != (size_t)n)
        hata("dosya okunamadi");
    fclose(f);
    *boy = n;
    return b;
}

static void dosya_yaz(const char *yol, const unsigned char *b, long n)
{
    FILE *f = fopen(yol, "wb");
    if (!f)
        hata("cikti dosyasi acilamadi");
    if (n > 0 && fwrite(b, 1, (size_t)n, f) != (size_t)n)
        hata("cikti yazilamadi");
    fclose(f);
}

static int sifrele(const unsigned char *anahtar, const char *girdi,
                   const char *cikti)
{
    long duz_boy;
    unsigned char *duz = dosya_oku(girdi, &duz_boy);

    unsigned char nonce[NONCE_BOYU];
    if (!kripto_rastgele(nonce, NONCE_BOYU))
        hata("nonce uretilemedi");

    unsigned char *cik = (unsigned char *)malloc((size_t)duz_boy
                                                 + NONCE_BOYU + ETIKET_BOYU);
    if (!cik)
        hata("bellek yetmedi");
    memcpy(cik, nonce, NONCE_BOYU);

    unsigned char etiket[ETIKET_BOYU];
    if (!kripto_gcm_sifrele(anahtar, nonce, NONCE_BOYU, NULL, 0, duz,
                            (size_t)duz_boy, cik + NONCE_BOYU, etiket))
        hata("sifreleme basarisiz");
    memcpy(cik + NONCE_BOYU + duz_boy, etiket, ETIKET_BOYU);

    dosya_yaz(cikti, cik, duz_boy + NONCE_BOYU + ETIKET_BOYU);
    printf("Sifrelendi: %s -> %s (%ld bayt sifreli metin + 12 nonce + "
           "16 etiket)\n", girdi, cikti, duz_boy);

    free(duz);
    free(cik);
    return 0;
}

static int coz(const unsigned char *anahtar, const char *girdi,
               const char *cikti)
{
    long boy;
    unsigned char *ver = dosya_oku(girdi, &boy);
    if (boy < NONCE_BOYU + ETIKET_BOYU)
        hata("dosya cok kisa (nonce + etiket yok)");

    unsigned char *nonce = ver;
    long sc_boy = boy - NONCE_BOYU - ETIKET_BOYU;
    unsigned char *sc = ver + NONCE_BOYU;
    unsigned char *etiket = ver + NONCE_BOYU + sc_boy;

    unsigned char *duz = (unsigned char *)malloc(sc_boy > 0
                                                 ? (size_t)sc_boy : 1);
    if (!duz)
        hata("bellek yetmedi");

    int ok = kripto_gcm_coz(anahtar, nonce, NONCE_BOYU, NULL, 0, sc,
                            (size_t)sc_boy, etiket, duz);
    if (!ok) {
        fprintf(stderr, "DOGRULAMA BASARISIZ: etiket tutmadi, veri "
                "kurcalanmis ya da yanlis anahtar. Cozme REDDEDILDI.\n");
        free(ver);
        free(duz);
        return 2;
    }
    dosya_yaz(cikti, duz, sc_boy);
    printf("Cozuldu ve DOGRULANDI: %s -> %s (%ld bayt)\n", girdi, cikti,
           sc_boy);

    free(ver);
    free(duz);
    return 0;
}

int main(int argc, char **argv)
{
    demo_hazirla();
    if (argc != 5) {
        fprintf(stderr, "Kullanim: %s <sifrele|coz> <anahtar.bin (32 baytlik dosya)> <girdi> "
                "<cikti>\n", argv[0]);
        return 1;
    }
    long ak_boy;
    unsigned char *ak = dosya_oku(argv[2], &ak_boy);
    if (ak_boy != ANAHTAR_BOYU)
        hata("anahtar dosyasi tam olarak 32 bayt olmali");

    int r;
    if (strcmp(argv[1], "sifrele") == 0)
        r = sifrele(ak, argv[3], argv[4]);
    else if (strcmp(argv[1], "coz") == 0)
        r = coz(ak, argv[3], argv[4]);
    else {
        fprintf(stderr, "Bilinmeyen komut: %s\n", argv[1]);
        r = 1;
    }
    free(ak);
    return r;
}
