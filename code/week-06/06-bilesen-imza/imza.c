/*
 * CEN429 - Hafta 6 - Demo 6: Bilesen / paket imza ve ozet dogrulamasi
 *
 * Android'de bir uygulama, yeniden paketlemeye (repackaging) karsi APK imzasini
 * dogrular (APK Signature Scheme v2/v3). Bu, "bileseni yukleyen/cagiran taraf
 * beklenen, degistirilmemis surum mu?" sorusunun genel halidir (Katalog K2/K3/K6).
 *
 * Burada bu mekanizmayi TASINABILIR bir C ortaminda gosteriyoruz: bir "eklenti
 * modulu" dosyasi (modul.dat) yuklenmeden ONCE bir ayrik imza (modul.imza) ile
 * dogrulanir. Imza, modulun HMAC-SHA-256'sidir. Modul bir bayt bile degisirse
 * (repackaging) HMAC tutmaz ve yukleme REDDEDILIR.
 *
 *   imza uret    <modul> <imza>          -> modulun HMAC'ini yazar (uretim adimi)
 *   imza dogrula <modul> <imza>          -> yuklemeden once dogrular
 *
 * Onemli fark (notlarda): APK v2/v3 ACIK ANAHTAR (asimetrik) imza kullanir;
 * boylece dogrulayanin imzalama anahtarina ihtiyaci olmaz (yalniz acik anahtar).
 * Burada ogretim icin PAYLASILAN anahtarli HMAC kullaniyoruz; asimetrik imza
 * (Ed25519 / RSA-PSS) Hafta 10'da. Ilke ayni: yuklemeden once butunluk+kaynak.
 *
 * Guvenlik: yalniz demonun kendi klasorundeki dosyalari okur/yazar; sistem yok.
 */
#include "cen429_demo.h"
#include "cen429_kripto.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* Sentetik imzalama anahtari (gercek urunde korunur/asimetrik olur). */
static const unsigned char IMZA_ANAHTAR[32] = {
    0x62, 0x69, 0x6c, 0x65, 0x73, 0x65, 0x6e, 0x2d, 0x69, 0x6d, 0x7a, 0x61,
    0x2d, 0x61, 0x6e, 0x61, 0x68, 0x74, 0x61, 0x72, 0x2d, 0x63, 0x65, 0x6e,
    0x34, 0x32, 0x39, 0x2d, 0x76, 0x31, 0x21, 0x00
};

static int dosya_oku(const char *yol, unsigned char **veri, size_t *boy)
{
    FILE *f = fopen(yol, "rb");
    if (!f)
        return 0;
    fseek(f, 0, SEEK_END);
    long n = ftell(f);
    fseek(f, 0, SEEK_SET);
    if (n < 0) { fclose(f); return 0; }
    unsigned char *b = (unsigned char *)malloc((size_t)n + 1);
    if (!b) { fclose(f); return 0; }
    *boy = fread(b, 1, (size_t)n, f);
    fclose(f);
    *veri = b;
    return 1;
}

static void hex_yaz(FILE *f, const unsigned char *b, size_t n)
{
    for (size_t i = 0; i < n; i++)
        fprintf(f, "%02x", b[i]);
}

int main(int argc, char **argv)
{
    demo_hazirla();
    if (argc < 4) {
        printf("Kullanim: %s uret|dogrula <modul_dosyasi> <imza_dosyasi>\n", argv[0]);
        return 1;
    }
    const char *komut = argv[1], *modul = argv[2], *imza_yolu = argv[3];

    unsigned char *veri = NULL;
    size_t boy = 0;
    if (!dosya_oku(modul, &veri, &boy)) {
        fprintf(stderr, "Modul okunamadi: %s\n", modul);
        return 2;
    }
    unsigned char mac[32];
    kripto_hmac_sha256(IMZA_ANAHTAR, sizeof(IMZA_ANAHTAR), veri, boy, mac);
    free(veri);

    if (strcmp(komut, "uret") == 0) {
        FILE *f = fopen(imza_yolu, "w");
        if (!f) { fprintf(stderr, "Imza yazilamadi.\n"); return 2; }
        hex_yaz(f, mac, 32);
        fprintf(f, "\n");
        fclose(f);
        printf("Modul imzalandi (%zu bayt).\n", boy);
        printf("  imza (HMAC): "); hex_yaz(stdout, mac, 32); printf("\n  -> %s\n", imza_yolu);
        return 0;
    }

    if (strcmp(komut, "dogrula") == 0) {
        FILE *f = fopen(imza_yolu, "r");
        if (!f) { fprintf(stderr, "Imza dosyasi yok.\n"); return 2; }
        char satir[128] = {0};
        if (!fgets(satir, sizeof(satir), f)) { fclose(f); return 2; }
        fclose(f);
        unsigned char beklenen[32];
        for (int i = 0; i < 32; i++) {
            unsigned int v = 0;
            if (sscanf(satir + i * 2, "%02x", &v) != 1) { fprintf(stderr, "Imza bozuk.\n"); return 2; }
            beklenen[i] = (unsigned char)v;
        }
        unsigned char fark = 0;
        for (int i = 0; i < 32; i++)
            fark |= (unsigned char)(beklenen[i] ^ mac[i]);
        if (fark == 0) {
            printf("Modul imzasi TUTTU -> guvenle yuklenebilir.\n");
            return 0;
        }
        printf("Modul imzasi TUTMADI -> YENIDEN PAKETLENMIS/degistirilmis.\n");
        printf("Yukleme REDDEDILDI.\n");
        return 3;
    }

    printf("Bilinmeyen komut: %s\n", komut);
    return 1;
}
