/*
 * CEN429 - Hafta 11 - Demo 2: Gomulu anahtar ikilide FIZIKSEL olarak durur.
 * "Anahtari yazilima gommek" (naif cozum) neden koruma degildir? Program kendi
 * ikili dosyasini tarar ve gomulu (sentetik) anahtari bulur -> anahtar cikarilabilir.
 *
 * DERS: Beyaz kutu saldirgan da ayni taramayi yapar. Yazilimda duran anahtar,
 *       whitebox (Demo 1) ya da donanim (TEE/HSM) olmadan gizlenemez.
 * GUVENLI: SENTETIK anahtar; program yalniz KENDI dosyasini okur; ag/sistem islemi yok.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* Naif gomulu (sentetik) anahtar. Gercek bir sir DEGIL; taninabilir desen. */
static const unsigned char ANAHTAR[16] = {
    0xC3, 0x9A, 0x71, 0x2E, 0x55, 0xF0, 0x18, 0xBD,
    0x4C, 0xA6, 0x37, 0xE9, 0x02, 0x8F, 0xD1, 0x64
};

/* Basit bayt dizisi arama (memmem yerine, tasinabilir). */
static long ara(const unsigned char *h, long hn, const unsigned char *i, long in)
{
    for (long p = 0; p + in <= hn; p++)
        if (memcmp(h + p, i, (size_t)in) == 0) return p;
    return -1;
}

static void sozde_kullan(void)
{
    /* Anahtarin ikiliye girmesi icin kullaniliyormus gibi yapalim (derleyici atmasin). */
    volatile unsigned s = 0;
    for (int i = 0; i < 16; i++) s = (s + ANAHTAR[i]) & 0xFF;
    printf("Sozde islem tamam (anahtar saglama = 0x%02X).\n", s);
}

int main(int argc, char **argv)
{
    if (argc < 2 || strcmp(argv[1], "--tara") != 0) {
        sozde_kullan();
        printf("Ikili dosyada anahtari aramak icin:  %s --tara\n", argv[0]);
        return 0;
    }

    /* Kendi ikili dosyasini ac ve gomulu anahtari ara. */
    FILE *f = fopen(argv[0], "rb");
    char yol[1024];
    if (!f) { snprintf(yol, sizeof yol, "%s.exe", argv[0]); f = fopen(yol, "rb"); }
    if (!f) { fprintf(stderr, "Ikili acilamadi: %s\n", argv[0]); return 2; }

    fseek(f, 0, SEEK_END); long n = ftell(f); fseek(f, 0, SEEK_SET);
    if (n <= 0 || n > 64L * 1024 * 1024) { fclose(f); return 2; }
    unsigned char *buf = malloc((size_t)n);
    if (!buf) { fclose(f); return 2; }
    if (fread(buf, 1, (size_t)n, f) != (size_t)n) { free(buf); fclose(f); return 2; }
    fclose(f);

    long off = ara(buf, n, ANAHTAR, 16);
    if (off >= 0) {
        printf("SIZDI: 16 baytlik gomulu anahtar ikilide 0x%lX ofsetinde bulundu:\n  ", off);
        for (int i = 0; i < 16; i++) printf("%02X ", buf[off + i]);
        printf("\n-> Beyaz kutu saldirgan da ayni taramayi yapar. Yazilimdaki anahtar korunmaz.\n");
    } else {
        printf("Anahtar bulunamadi (beklenmeyen).\n");
    }
    free(buf);
    return 0;
}
