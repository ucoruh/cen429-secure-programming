/*
 * CEN429 — Hafta 2 — Demo 2: Entropi ölçer
 *
 * Kullanım: bin/linux/entropi dosya...            (her dosya için tek satır)
 *           bin/linux/entropi -p <bayt> dosya     (dosyayı pencerelere bölerek)
 *
 * Shannon entropisi, bir veri parçasındaki bayt değerlerinin ne kadar
 * "karışık" dağıldığını ölçer:
 *
 *      H = - toplam( p(b) * log2 p(b) ),   b = 0..255
 *
 * H = 0   : bütün baytlar aynı (ör. "AAAA...")
 * H ~ 4-5 : düz metin, kaynak kod (az sayıda harf, sık tekrar)
 * H ~ 5-7 : derlenmiş program, karışık ikili veri
 * H ~ 8   : şifreli, sıkıştırılmış ya da rastgele veri
 *
 * Antivirüsler ve EDR ürünleri bu ölçüyü "paketlenmiş/şifreli kod" ve
 * "dosyalarını hızla şifreleyen süreç" (fidye yazılımı) belirtisi olarak
 * kullanır. Program yalnız okur; hiçbir dosyayı değiştirmez.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include "cen429_demo.h"

#define AZAMI_BOYUT (16 * 1024 * 1024)

static double entropi(const unsigned char *v, size_t n)
{
    size_t say[256] = { 0 };
    if (n == 0)
        return 0.0;
    for (size_t i = 0; i < n; i++)
        say[v[i]]++;
    double h = 0.0;
    for (int b = 0; b < 256; b++) {
        if (say[b] == 0)
            continue;
        double p = (double)say[b] / (double)n;
        h -= p * log2(p);
    }
    return h;
}

/* Entropi tek başına "ne olduğunu" söylemez; yalnız bir ipucudur. */
static const char *yorum(double h)
{
    if (h < 1.0)
        return "tekduze";
    if (h < 5.5)
        return "dusuk";
    if (h < 7.2)
        return "orta";
    return "YUKSEK";
}

/* 0..8 bit aralığını genislik karakterlik bir çubuğa çevirir */
static void cubuk(double h, char *out, int genislik)
{
    int dolu = (int)(h / 8.0 * genislik + 0.5);
    for (int i = 0; i < genislik; i++)
        out[i] = i < dolu ? '#' : '.';
    out[genislik] = '\0';
}

static unsigned char *oku(const char *yol, size_t *boy)
{
    FILE *f = fopen(yol, "rb");
    if (!f) {
        perror(yol);
        return NULL;
    }
    unsigned char *v = malloc(AZAMI_BOYUT);
    size_t n = v ? fread(v, 1, AZAMI_BOYUT, f) : 0;
    fclose(f);
    *boy = n;
    return v;
}

static const char *kisa_ad(const char *yol)
{
    const char *s1 = strrchr(yol, '/');
    const char *s2 = strrchr(yol, '\\');
    const char *s = s1 > s2 ? s1 : s2;
    return s ? s + 1 : yol;
}

int main(int argc, char **argv)
{
    demo_hazirla();
    size_t pencere = 0;
    int ilk = 1;
    if (argc >= 3 && strcmp(argv[1], "-p") == 0) {
        char *son;
        unsigned long p = strtoul(argv[2], &son, 10);
        if (*son != '\0' || p < 64 || p > 1048576) {
            fprintf(stderr, "pencere 64..1048576 bayt olmali\n");
            return 2;
        }
        pencere = (size_t)p;
        ilk = 3;
    }
    if (ilk >= argc) {
        fprintf(stderr, "kullanim: %s [-p pencere] dosya...\n", argv[0]);
        return 2;
    }
    char bar[40];
    for (int i = ilk; i < argc; i++) {
        size_t n = 0;
        unsigned char *v = oku(argv[i], &n);
        if (!v)
            continue;
        if (pencere == 0) {
            double h = entropi(v, n);
            cubuk(h, bar, 24);
            printf("  %-14.14s %6zu %5.2f |%s| %s\n", kisa_ad(argv[i]), n, h,
                   bar, yorum(h));
        } else {
            printf("  %s (%zu bayt), pencere %zu bayt:\n", kisa_ad(argv[i]),
                   n, pencere);
            for (size_t o = 0; o < n; o += pencere) {
                size_t m = n - o < pencere ? n - o : pencere;
                double h = entropi(v + o, m);
                cubuk(h, bar, 32);
                printf("  %6zu-%6zu %5.2f |%s| %s\n", o, o + m - 1, h, bar,
                       yorum(h));
            }
        }
        free(v);
    }
    return 0;
}
