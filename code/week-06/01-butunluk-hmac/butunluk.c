/*
 * CEN429 - Hafta 6 - Demo 1: Calisma zamani butunluk denetimi (self-hashing)
 *
 * RASP'in ilk adimi ALGILAMA'dir: uygulama, kendi ikili dosyasinin (ya da
 * korunan bir modulun) YAMALANIP yamalanmadigini calisma zamaninda anlar.
 * Kitap (Viega & Messier, Tarif 12.2 "Detecting Modification") bunu CRC32 ile
 * yapar; CRC kriptografik degildir (saldirgan kolayca ayni CRC'yi uretir), bu
 * yuzden burada HMAC-SHA-256 kullaniyoruz (cen429_kripto.h).
 *
 * Program bir hedefin (varsayilan: KENDI ikili dosyasi) HMAC'ini hesaplar:
 *   butunluk kaydet  <hedef|oz> <imza_dosyasi>   -> altin (golden) degeri yazar
 *   butunluk dogrula <hedef|oz> <imza_dosyasi>   -> yeniden hesaplar, karsilastirir
 * "oz" hedefi programin kendi calisan dosyasini (self) ifade eder.
 *
 * Guvenlik: yalniz dosya OKUR ve karsilastirir; hicbir sey degistirmez, sistem
 * ayarina dokunmaz. demo.sh yamayi programin KENDI bin/ klasorundeki bir KOPYA
 * uzerinde yapar.
 *
 * Onemli ders sinirlari (notlarda tartisiliyor):
 *   - HMAC anahtari ikili dosyanin icindedir; tek basina yeterli degildir.
 *     Saldirgan denetleyici kodun kendisini de yamalayabilir. Bu yuzden gercek
 *     RASP: (1) coklu/ortusen denetleyiciler, (2) sonucu bir VERI BAGIMLILIGI
 *     yapmak (bkz. Demo 5), (3) sunucu tarafli attestation ile birlestirir.
 */
#include "cen429_demo.h"
#include "cen429_kripto.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#ifdef _WIN32
#include <windows.h>
#else
#include <unistd.h>
#include <limits.h>
#endif

/* Sentetik butunluk anahtari (gercek urunde turetilir/korunur). */
static const unsigned char RASP_ANAHTAR[32] = {
    0x43, 0x45, 0x4e, 0x34, 0x32, 0x39, 0x2d, 0x52, 0x41, 0x53, 0x50, 0x2d,
    0x62, 0x75, 0x74, 0x75, 0x6e, 0x6c, 0x75, 0x6b, 0x2d, 0x61, 0x6e, 0x61,
    0x68, 0x74, 0x61, 0x72, 0x2d, 0x76, 0x31, 0x00
};

static int oz_yol(char *tampon, size_t boy)
{
#ifdef _WIN32
    DWORD n = GetModuleFileNameA(NULL, tampon, (DWORD)boy);
    return (n > 0 && n < boy);
#else
    ssize_t n = readlink("/proc/self/exe", tampon, boy - 1);
    if (n <= 0)
        return 0;
    tampon[n] = '\0';
    return 1;
#endif
}

/* Dosyanin tamamini belleye okur; cagiran free() eder. Basari: 1. */
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
    size_t okunan = fread(b, 1, (size_t)n, f);
    fclose(f);
    *veri = b;
    *boy = okunan;
    return 1;
}

static void hex_yaz(FILE *f, const unsigned char *b, size_t n)
{
    for (size_t i = 0; i < n; i++)
        fprintf(f, "%02x", b[i]);
}

static int hedef_hmac(const char *hedef, unsigned char ozet[32], char *yol_out, size_t yol_boy)
{
    char yol[4096];
    if (strcmp(hedef, "oz") == 0) {
        if (!oz_yol(yol, sizeof(yol))) {
            fprintf(stderr, "Kendi yol bulunamadi.\n");
            return 0;
        }
    } else {
        snprintf(yol, sizeof(yol), "%s", hedef);
    }
    if (yol_out)
        snprintf(yol_out, yol_boy, "%s", yol);

    unsigned char *veri = NULL;
    size_t boy = 0;
    if (!dosya_oku(yol, &veri, &boy)) {
        fprintf(stderr, "Hedef okunamadi: %s\n", yol);
        return 0;
    }
    int ok = kripto_hmac_sha256(RASP_ANAHTAR, sizeof(RASP_ANAHTAR), veri, boy, ozet);
    free(veri);
    return ok;
}

int main(int argc, char **argv)
{
    demo_hazirla();
    if (argc < 4) {
        printf("Kullanim: %s kaydet|dogrula <hedef|oz> <imza_dosyasi>\n", argv[0]);
        return 1;
    }
    const char *komut = argv[1];
    const char *hedef = argv[2];
    const char *imza_yolu = argv[3];

    unsigned char ozet[32];
    char yol[4096] = {0};
    if (!hedef_hmac(hedef, ozet, yol, sizeof(yol)))
        return 2;

    if (strcmp(komut, "kaydet") == 0) {
        FILE *f = fopen(imza_yolu, "w");
        if (!f) { fprintf(stderr, "Imza dosyasi yazilamadi.\n"); return 2; }
        hex_yaz(f, ozet, 32);
        fprintf(f, "\n");
        fclose(f);
        printf("Altin butunluk degeri kaydedildi.\n");
        printf("  hedef : %s\n", yol);
        printf("  HMAC  : ");
        hex_yaz(stdout, ozet, 32);
        printf("\n  -> %s\n", imza_yolu);
        return 0;
    }

    if (strcmp(komut, "dogrula") == 0) {
        FILE *f = fopen(imza_yolu, "r");
        if (!f) { fprintf(stderr, "Altin deger yok, once 'kaydet' calistirin.\n"); return 2; }
        char satir[128] = {0};
        if (!fgets(satir, sizeof(satir), f)) { fclose(f); return 2; }
        fclose(f);
        unsigned char beklenen[32];
        for (int i = 0; i < 32; i++) {
            unsigned int v = 0;
            if (sscanf(satir + i * 2, "%02x", &v) != 1) {
                fprintf(stderr, "Altin deger bozuk.\n");
                return 2;
            }
            beklenen[i] = (unsigned char)v;
        }
        printf("Hedef      : %s\n", yol);
        printf("Beklenen   : "); hex_yaz(stdout, beklenen, 32); printf("\n");
        printf("Hesaplanan : "); hex_yaz(stdout, ozet, 32); printf("\n");
        /* Sabit zamanli karsilastirma (zamanlama sizintisini onler). */
        unsigned char fark = 0;
        for (int i = 0; i < 32; i++)
            fark |= (unsigned char)(beklenen[i] ^ ozet[i]);
        if (fark == 0) {
            printf("SONUC: BUTUNLUK TAMAM - hedef degismemis.\n");
            return 0;
        }
        printf("SONUC: YAMA ALGILANDI - hedef degistirilmis! (tamper)\n");
        return 3;
    }

    printf("Bilinmeyen komut: %s\n", komut);
    return 1;
}
