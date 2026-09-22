/*
 * CEN429 — Hafta 2 — Demo 1: Oyuncak bir antivirüs tarayıcısı
 *
 * Kullanım: ./bin/.../tarayici <yontem> <imzalar.txt> <dosya>...
 *   yontem: ozet | hash | desen | sezgisel | emulasyon | govde16
 *
 * Gerçek tarayıcıların yöntemlerini ve sınırlarını gösterir:
 *   hash      dosyanın SHA-256 özeti imza veritabanındaki bir özetle aynı mı?
 *   desen     dosyada bilinen bir bayt dizisi (imza) geçiyor mu?
 *   sezgisel  şüpheli özellikler (yüksek entropi, çözücü, çöp komut) var mı?
 *   emulasyon kapsülün çözücüsü güvenli bir "sanal makinede" çalıştırılır,
 *             çözülen gövde yeniden desenle taranır.
 *   govde16   kapsül gövdesinin ilk 16 baytını onaltılık yazar (görsel).
 *
 * SHA-256 iki platformda da çalışır: Linux'ta OpenSSL, Windows'ta BCrypt
 * (bkz. common/cen429_kripto.h). Program yalnız okur; hiçbir dosyayı
 * değiştirmez, silmez, çalıştırmaz.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include "cen429_demo.h"
#include "cen429_kripto.h"
#include "kapsul.h"

#define AZAMI_BOYUT (1024 * 1024) /* 1 MB'tan büyük dosyayı taramayız   */
#define AZAMI_IMZA 64
#define AZAMI_KOMUT 32            /* emülatörün komut sınırı (zaman aşımı) */
#define ESIK_ENTROPI 7.0          /* bit/bayt; üstü "şifreli/sıkışık?"     */
#define ESIK_PUAN 50              /* sezgisel puan eşiği                   */

enum imza_turu { T_HASH, T_DESEN };

struct imza {
    enum imza_turu tur;
    char ad[64];
    char deger[128];
};

static struct imza imzalar[AZAMI_IMZA];
static int imza_sayisi;

/* ---------- yardımcılar ---------- */

static int imzalari_yukle(const char *yol)
{
    FILE *f = fopen(yol, "r");
    if (!f) {
        perror(yol);
        return -1;
    }
    char satir[256];
    while (fgets(satir, sizeof satir, f) && imza_sayisi < AZAMI_IMZA) {
        satir[strcspn(satir, "\r\n")] = '\0';
        if (satir[0] == '#' || satir[0] == '\0')
            continue;
        char tur[16], ad[64];
        int kullanilan = 0;
        if (sscanf(satir, "%15s %63s %n", tur, ad, &kullanilan) != 2)
            continue;
        struct imza *im = &imzalar[imza_sayisi];
        if (strcmp(tur, "HASH") == 0)
            im->tur = T_HASH;
        else if (strcmp(tur, "DESEN") == 0)
            im->tur = T_DESEN;
        else
            continue;
        snprintf(im->ad, sizeof im->ad, "%s", ad);
        snprintf(im->deger, sizeof im->deger, "%s", satir + kullanilan);
        imza_sayisi++;
    }
    fclose(f);
    return 0;
}

static unsigned char *dosya_oku(const char *yol, size_t *boy)
{
    FILE *f = fopen(yol, "rb");
    if (!f)
        return NULL;
    unsigned char *v = malloc(AZAMI_BOYUT + 1);
    size_t n = v ? fread(v, 1, AZAMI_BOYUT + 1, f) : 0;
    fclose(f);
    if (!v || n > AZAMI_BOYUT) { /* çok büyük: taramayı reddet */
        free(v);
        return NULL;
    }
    *boy = n;
    return v;
}

static int sha256_hex(const unsigned char *v, size_t n, char hex[65])
{
    unsigned char md[32];
    if (!kripto_sha256(v, n, md))
        return -1;
    for (int i = 0; i < 32; i++)
        snprintf(hex + 2 * i, 3, "%02x", md[i]);
    hex[64] = '\0';
    return 0;
}

/* Shannon entropisi: 0 (hep aynı bayt) ... 8 (tamamen rastgele) bit/bayt */
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

static int icerir(const unsigned char *v, size_t n, const char *desen)
{
    size_t m = strlen(desen);
    if (m == 0 || m > n)
        return 0;
    for (size_t i = 0; i + m <= n; i++)
        if (memcmp(v + i, desen, m) == 0)
            return 1;
    return 0;
}

/* Desen imzalarından ilk eşleşenin adını döndürür (yoksa NULL) */
static const char *desen_ara(const unsigned char *v, size_t n)
{
    for (int i = 0; i < imza_sayisi; i++)
        if (imzalar[i].tur == T_DESEN && icerir(v, n, imzalar[i].deger))
            return imzalar[i].ad;
    return NULL;
}

struct kapsul {
    char komut[256];
    unsigned char *govde;
    size_t govde_boy;
};

/* Kapsül değilse 0 döner. Kapsülse 2. satırı ve gövdeyi ayırır. */
static int kapsul_ayir(unsigned char *v, size_t n, struct kapsul *k)
{
    size_t s = strlen(KAPSUL_SIHIR);
    if (n < s || memcmp(v, KAPSUL_SIHIR, s) != 0)
        return 0;
    unsigned char *bas = v + s;
    unsigned char *son = memchr(bas, '\n', n - s);
    if (!son || (size_t)(son - bas) >= sizeof k->komut)
        return 0;
    memcpy(k->komut, bas, (size_t)(son - bas));
    k->komut[son - bas] = '\0';
    k->govde = son + 1;
    k->govde_boy = n - (size_t)(k->govde - v);
    return 1;
}

/* ---------- emülatör: çözücü komutlarını güvenle "çalıştırır" ---------- */

/* Başarılıysa 0 döner ve gövde yerinde çözülmüş olur. Dosyaya güvenmeyiz:
   bilinmeyen komut, fazla komut, gövdeden uzun UZUNLUK -> reddedilir. */
static int emule_et(struct kapsul *k, char *not, size_t not_boy)
{
    char kopya[256];
    snprintf(kopya, sizeof kopya, "%s", k->komut);
    int algo = 0, adim = 0, bos = 0;
    unsigned long tohum = 0, uzunluk = 0;
    for (char *t = strtok(kopya, " "); t; t = strtok(NULL, " ")) {
        if (++adim > AZAMI_KOMUT) {
            snprintf(not, not_boy, "komut siniri asildi");
            return -1;
        }
        if (strcmp(t, "GOVDE") == 0 || strcmp(t, "COZUCU:") == 0) {
            /* etiket */
        } else if (strcmp(t, "BOS") == 0) {
            bos++;
        } else if (strcmp(t, "ALGO=xs32") == 0) {
            algo = 1;
        } else if (strcmp(t, "ALGO=lcg8") == 0) {
            algo = 2;
        } else if (strncmp(t, "TOHUM=", 6) == 0) {
            tohum = strtoul(t + 6, NULL, 16);
        } else if (strncmp(t, "UZUNLUK=", 8) == 0) {
            uzunluk = strtoul(t + 8, NULL, 10);
        } else if (strcmp(t, "COZ") == 0) {
            if (uzunluk > k->govde_boy) {
                snprintf(not, not_boy, "UZUNLUK govdeden buyuk");
                return -1;
            }
            if (algo == 1)
                xs32_uygula(k->govde, uzunluk, (uint32_t)tohum);
            else if (algo == 2)
                lcg8_uygula(k->govde, uzunluk, (uint32_t)tohum, 0);
            else {
                snprintf(not, not_boy, "algoritma yok");
                return -1;
            }
            snprintf(not, not_boy, "%d komut, %d BOS, %s", adim, bos,
                     algo == 1 ? "xs32" : "lcg8");
            return 0;
        } else {
            snprintf(not, not_boy, "bilinmeyen komut");
            return -1;
        }
    }
    snprintf(not, not_boy, "cozucu yok (duz govde)");
    return 0;
}

/* ---------- yöntemler ---------- */

/* Ekranda yalnız dosya adını gösteririz (klasör yolu satırı uzatmasın) */
static const char *kisa_ad(const char *yol)
{
    const char *s1 = strrchr(yol, '/');
    const char *s2 = strrchr(yol, '\\');
    const char *s = s1 > s2 ? s1 : s2;
    return s ? s + 1 : yol;
}

static void tara(const char *yontem, const char *yol)
{
    const char *ad_kisa = kisa_ad(yol);
    size_t n = 0;
    unsigned char *v = dosya_oku(yol, &n);
    if (!v) {
        printf("  %-18s %-10s %s\n", ad_kisa, "HATA", "okunamadi/buyuk");
        return;
    }
    char hex[65] = "";
    char ayrinti[96] = "";
    const char *sonuc = "TEMIZ";

    if (strcmp(yontem, "ozet") == 0) {
        sha256_hex(v, n, hex);
        printf("  %s (%zu bayt, entropi %.2f)\n    sha256=%s\n", ad_kisa, n,
               entropi(v, n), hex);
        free(v);
        return;
    } else if (strcmp(yontem, "govde16") == 0) {
        struct kapsul k;
        if (kapsul_ayir(v, n, &k)) {
            char h[64] = "";
            size_t m = k.govde_boy < 16 ? k.govde_boy : 16;
            for (size_t i = 0; i < m; i++)
                snprintf(h + 3 * i, 4, "%02x ", k.govde[i]);
            if (m > 0)
                h[3 * m - 1] = '\0';        /* sondaki boşluğu at */
            printf("  %-11s govde[0..15]: %s\n", ad_kisa, h);
        } else {
            printf("  %-12s (kapsul degil)\n", ad_kisa);
        }
        free(v);
        return;
    } else if (strcmp(yontem, "hash") == 0) {
        sha256_hex(v, n, hex);
        for (int i = 0; i < imza_sayisi; i++)
            if (imzalar[i].tur == T_HASH &&
                strcmp(imzalar[i].deger, hex) == 0) {
                sonuc = "YAKALANDI";
                snprintf(ayrinti, sizeof ayrinti, "%s", imzalar[i].ad);
            }
        if (strcmp(sonuc, "TEMIZ") == 0)
            snprintf(ayrinti, sizeof ayrinti, "sha256=%.16s...", hex);
    } else if (strcmp(yontem, "desen") == 0) {
        const char *ad = desen_ara(v, n);
        if (ad) {
            sonuc = "YAKALANDI";
            snprintf(ayrinti, sizeof ayrinti, "%s", ad);
        }
    } else if (strcmp(yontem, "sezgisel") == 0) {
        int puan = 0;
        double h = entropi(v, n);
        struct kapsul k;
        char neden[80] = "";
        if (h > ESIK_ENTROPI) {
            puan += 50;
            strcat(neden, "entropi ");
        }
        if (kapsul_ayir(v, n, &k)) {
            if (strncmp(k.komut, "GOVDE", 5) != 0) {
                puan += 30; /* gövdeden önce kod çalışıyor: çözücü */
                strcat(neden, "cozucu ");
            }
            if (strstr(k.komut, "BOS")) {
                puan += 20; /* anlamsız komutlar: çöp kod */
                strcat(neden, "cop-komut ");
            }
        }
        if (puan >= ESIK_PUAN)
            sonuc = "SUPHELI";
        snprintf(ayrinti, sizeof ayrinti, "puan=%3d H=%.2f %s", puan, h,
                 neden);
    } else if (strcmp(yontem, "emulasyon") == 0) {
        struct kapsul k;
        char not[64] = "kapsul degil";
        const char *ad = NULL;
        if (kapsul_ayir(v, n, &k)) {
            if (emule_et(&k, not, sizeof not) == 0)
                ad = desen_ara(k.govde, k.govde_boy);
            else
                sonuc = "SUPHELI"; /* çözülemeyen kapsül: temkinli ol */
        } else {
            ad = desen_ara(v, n);
        }
        if (ad)
            sonuc = "YAKALANDI";
        snprintf(ayrinti, sizeof ayrinti, "%s%s%s", ad ? ad : "",
                 ad ? " | " : "", not);
    } else {
        fprintf(stderr, "bilinmeyen yontem: %s\n", yontem);
        free(v);
        exit(2);
    }
    size_t m = strlen(ayrinti);
    while (m > 0 && ayrinti[m - 1] == ' ') /* sondaki boşlukları at */
        ayrinti[--m] = '\0';
    if (m == 0)
        printf("  %-18s %s\n", ad_kisa, sonuc);
    else
        printf("  %-18s %-10s %s\n", ad_kisa, sonuc, ayrinti);
    free(v);
}

int main(int argc, char **argv)
{
    demo_hazirla();
    if (argc < 4) {
        fprintf(stderr, "kullanim: %s ozet|hash|desen|sezgisel|emulasyon|"
                        "govde16 <imzalar.txt> <dosya>...\n", argv[0]);
        return 2;
    }
    if (imzalari_yukle(argv[2]) != 0)
        return 1;
    for (int i = 3; i < argc; i++)
        tara(argv[1], argv[i]);
    return 0;
}
