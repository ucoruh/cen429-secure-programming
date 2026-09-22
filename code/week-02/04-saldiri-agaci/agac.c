/*
 * CEN429 — Hafta 2 — Demo 4: Saldırı ağacı maliyet hesaplayıcı
 *
 * Kullanım: bin/linux/agac <agac.txt>
 *
 * Bir saldırı ağacını okur ve her düğüm için "en ucuz saldırı maliyetini"
 * aşağıdan yukarı hesaplar:
 *   YAPRAK düğüm : maliyeti dosyada verilir (ör. gün-adam, ekipman puanı)
 *   VEYA düğüm   : çocuklardan EN UCUZUNU seçer (saldırganın işine gelir)
 *   VE düğüm     : çocukların TOPLAMINI alır (hepsi gerekir)
 *
 * Kök düğümün maliyeti = saldırganın hedefe ulaşmasının en ucuz yolu.
 * Program ayrıca bu en ucuz yolu (savunulacak kritik zincir) yazar.
 *
 * Girdi biçimi (girinti = ağaç derinliği; iki boşluk bir düzey):
 *   HEDEF: Odeme anahtarini ele gecir        # kök (kod verilmezse VEYA)
 *     VEYA
 *       YAPRAK Veritabanini coz  maliyet=8
 *       VE
 *         YAPRAK Root al         maliyet=3
 *         YAPRAK DB anahtarini bul maliyet=6
 *
 * Bu bir HESAP MAKİNESİDİR; hiçbir saldırı yapmaz, yalnız sayı toplar.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cen429_demo.h"

#define AZAMI_DUGUM 256
#define AZAMI_COCUK 16
#define SONSUZ 1000000000

enum tip { YAPRAK, VE, VEYA };

struct dugum {
    enum tip tip;
    int girinti;
    char ad[80];
    int maliyet;            /* yaprakta girdi, iç düğümde hesaplanır */
    int sure;               /* gün cinsinden süre (öznitelik, seçime bağlı) */
    int beceri;             /* 1-5 uzmanlık düzeyi (öznitelik) */
    int cocuk[AZAMI_COCUK];
    int cocuk_n;
    int ucuz_cocuk;         /* VEYA düğümünde seçilen en ucuz çocuk */
};

static struct dugum d[AZAMI_DUGUM];
static int n;

static int girinti_say(const char *s)
{
    int i = 0;
    while (s[i] == ' ')
        i++;
    return i / 2;
}

/* Alt ağacı hesapla (özyineleme); en ucuz yolu ucuz_cocuk'a yaz */
static int hesapla(int i)
{
    struct dugum *x = &d[i];
    if (x->tip == YAPRAK)
        return x->maliyet;

    if (x->tip == VE) {
        /* Hepsi gerekir: maliyet ve süre TOPLANIR, beceri EN YÜKSEK
         * (en zor adım gereken uzmanlığı belirler). */
        long toplam = 0, sure = 0;
        int beceri = 0;
        for (int c = 0; c < x->cocuk_n; c++) {
            toplam += hesapla(x->cocuk[c]);
            sure += d[x->cocuk[c]].sure;
            if (d[x->cocuk[c]].beceri > beceri)
                beceri = d[x->cocuk[c]].beceri;
        }
        x->maliyet = toplam > SONSUZ ? SONSUZ : (int)toplam;
        x->sure = (int)sure;
        x->beceri = beceri;
    } else { /* VEYA */
        /* Biri yeter: saldırgan EN UCUZ dalı seçer; süre/beceri o dalın
         * değeridir (saldırganın gerçekten izleyeceği yol). */
        int en_ucuz = SONSUZ, sec = -1;
        for (int c = 0; c < x->cocuk_n; c++) {
            int m = hesapla(x->cocuk[c]);
            if (m < en_ucuz) {
                en_ucuz = m;
                sec = x->cocuk[c];
            }
        }
        x->maliyet = en_ucuz;
        x->ucuz_cocuk = sec;
        if (sec >= 0) {
            x->sure = d[sec].sure;
            x->beceri = d[sec].beceri;
        }
    }
    return x->maliyet;
}

static void yaz(int i, int derinlik)
{
    struct dugum *x = &d[i];
    for (int t = 0; t < derinlik; t++)
        printf("  ");
    const char *etiket = x->tip == YAPRAK ? "" :
                         x->tip == VE ? "[VE] " : "[VEYA] ";
    printf("%s%s  (maliyet=%d)\n", etiket, x->ad, x->maliyet);
    for (int c = 0; c < x->cocuk_n; c++)
        yaz(x->cocuk[c], derinlik + 1);
}

/* En ucuz yolu (yalnız seçilen dallar) yazar */
static void ucuz_yol(int i, int derinlik)
{
    struct dugum *x = &d[i];
    for (int t = 0; t < derinlik; t++)
        printf("  ");
    printf("-> %s (maliyet=%d)\n", x->ad, x->maliyet);
    if (x->tip == VE)
        for (int c = 0; c < x->cocuk_n; c++)
            ucuz_yol(x->cocuk[c], derinlik + 1);
    else if (x->tip == VEYA && x->ucuz_cocuk >= 0)
        ucuz_yol(x->ucuz_cocuk, derinlik + 1);
}

int main(int argc, char **argv)
{
    demo_hazirla();
    if (argc != 2) {
        fprintf(stderr, "kullanim: %s <agac.txt>\n", argv[0]);
        return 2;
    }
    FILE *f = fopen(argv[1], "r");
    if (!f) {
        perror(argv[1]);
        return 1;
    }
    char satir[256];
    int ebeveyn_yigin[64];
    ebeveyn_yigin[0] = -1;

    while (fgets(satir, sizeof satir, f) && n < AZAMI_DUGUM) {
        satir[strcspn(satir, "\r\n")] = '\0';
        char *bas = satir + strspn(satir, " ");
        if (bas[0] == '\0' || bas[0] == '#')
            continue;
        int g = girinti_say(satir);
        struct dugum *x = &d[n];
        memset(x, 0, sizeof *x);
        x->girinti = g;
        x->ucuz_cocuk = -1;

        if (strncmp(bas, "HEDEF:", 6) == 0) {
            x->tip = VEYA;
            snprintf(x->ad, sizeof x->ad, "%s", bas + 7);
        } else if (strncmp(bas, "VE", 2) == 0 &&
                   (bas[2] == '\0' || bas[2] == ' ')) {
            x->tip = VE;
            char *et = bas + 2 + strspn(bas + 2, " ");
            snprintf(x->ad, sizeof x->ad, "%s [hepsi gerekir]",
                     et[0] ? et : "VE");
        } else if (strncmp(bas, "VEYA", 4) == 0 &&
                   (bas[4] == '\0' || bas[4] == ' ')) {
            x->tip = VEYA;
            char *et = bas + 4 + strspn(bas + 4, " ");
            snprintf(x->ad, sizeof x->ad, "%s [biri yeter]",
                     et[0] ? et : "VEYA");
        } else if (strncmp(bas, "YAPRAK", 6) == 0) {
            x->tip = YAPRAK;
            char *m = strstr(bas, "maliyet=");
            x->maliyet = m ? atoi(m + 8) : 0;
            char *s = strstr(bas, "sure=");
            x->sure = s ? atoi(s + 5) : 0;
            char *b = strstr(bas, "beceri=");
            x->beceri = b ? atoi(b + 7) : 0;
            /* Ad, ilk öznitelikten önceki kısımdır. */
            char *ad = bas + 6 + strspn(bas + 6, " ");
            char *kes = m;
            if (s && (!kes || s < kes)) kes = s;
            if (b && (!kes || b < kes)) kes = b;
            size_t len = kes ? (size_t)(kes - ad) : strlen(ad);
            while (len > 0 && ad[len - 1] == ' ')
                len--;
            snprintf(x->ad, sizeof x->ad, "%.*s", (int)len, ad);
        } else {
            continue;
        }

        /* Ebeveyni bul: girintisi bir eksik olan en son düğüm */
        if (g > 0) {
            int p = ebeveyn_yigin[g - 1];
            if (p >= 0 && d[p].cocuk_n < AZAMI_COCUK)
                d[p].cocuk[d[p].cocuk_n++] = n;
        }
        ebeveyn_yigin[g] = n;
        n++;
    }
    fclose(f);
    if (n == 0) {
        fprintf(stderr, "bos agac\n");
        return 1;
    }

    hesapla(0);
    printf("  Saldiri agaci (yaprak maliyeti = orn. gun-adam eforu):\n\n");
    yaz(0, 1);
    printf("\n  EN UCUZ SALDIRI = %d birim. Savunmacinin oncelikle kirmasi\n"
           "  gereken zincir (en zayif nokta):\n\n", d[0].maliyet);
    ucuz_yol(0, 1);
    if (d[0].sure > 0 || d[0].beceri > 0)
        printf("\n  Bu en ucuz yolun ek oznitelikleri: toplam sure=%d gun, "
               "gereken beceri=%d/5.\n", d[0].sure, d[0].beceri);
    return 0;
}
