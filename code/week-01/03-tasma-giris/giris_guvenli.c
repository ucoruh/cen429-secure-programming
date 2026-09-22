/*
 * CEN429 — Hafta 1 — Demo 3: Arabellek taşmasıyla yetki yükseltme (GÜVENLİ SÜRÜM)
 *
 * Düzeltmeler:
 *  1) Girdi, kopyalanmadan ÖNCE doğrulanır: uzunluk ve izin verilen karakterler
 *     (izin listesi — Cookbook R3.1 "temel veri doğrulama").
 *  2) Kopya, hedefin boyutunu bilen snprintf ile yapılır.
 *  3) Yetki bilgisi kullanıcı girdisinin yanında ayrı bir alanda "varsayılan
 *     güvenli" (0) başlatılır ve yalnız doğrulama sonucuyla değiştirilir.
 */
#include <ctype.h>
#include <stdio.h>
#include <string.h>
#include "cen429_demo.h"

struct oturum {
    char ad[16];
    int  yonetici;
};

/* Kullanıcı adı: 1–15 karakter, yalnız harf, rakam, '_' ve '-'. */
static int ad_gecerli_mi(const char *s)
{
    size_t n = strnlen(s, 16);
    if (n == 0 || n >= 16)
        return 0;
    for (size_t i = 0; i < n; i++) {
        unsigned char c = (unsigned char)s[i];
        if (!isalnum(c) && c != '_' && c != '-')
            return 0;
    }
    return 1;
}

int main(int argc, char **argv)
{
    demo_hazirla();
    if (argc != 2) {
        fprintf(stderr, "Kullanim: %s <kullanici-adi>\n", argv[0]);
        return 1;
    }
    if (!ad_gecerli_mi(argv[1])) {
        fprintf(stderr, "Reddedildi: ad 1-15 karakter; yalniz harf, rakam, _ ve - olabilir.\n");
        return 1;
    }

    struct oturum o = { .yonetici = 0 };
    snprintf(o.ad, sizeof(o.ad), "%s", argv[1]);

    printf("Hos geldin, %s\n", o.ad);
    printf("yonetici alani = %d\n", o.yonetici);
    printf("%s\n", o.yonetici ? ">>> YONETICI <<<" : "Normal kullanici oturumu.");
    return 0;
}
