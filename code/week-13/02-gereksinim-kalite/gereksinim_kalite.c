/*
 * CEN429 - Hafta 13 - Demo 2: Gereksinim kalitesi denetleyicisi.
 * Bir gereksinim "iyi" mi? Belirsiz/dogrulanamaz ifadeleri isaretler:
 *   - belirsiz sozcukler ("guvenli olmali", "iyi", "uygun", "yeterince", "gerektigi gibi")
 *   - olculebilir bir dayanak yok (sayi/somut terim gecmiyor)
 * Cikis kodu = zayif gereksinim sayisi.
 * GUVENLI: saf metin analizi; dosya/ag/sistem islemi yok.
 */
#include <stdio.h>
#include <string.h>
#include <ctype.h>

static const char *BELIRSIZ[] = {
    "guvenli olmali", "iyi yonetil", "iyi olmali", "uygun sekilde",
    "yeterince", "gerektigi gibi", "mumkun oldugunca", "saglam olmali", NULL
};
/* Olculebilirlik ipuclari: sayi, birim, somut standart/teknik terim. */
static const char *SOMUT[] = {
    "aes", "gcm", "sha-256", "sha256", "relro", "pie", "bit", "128", "256",
    "tls 1.3", "hmac", "pbkdf2", "ed25519", "static analiz", "checksec", NULL
};

static void kucult(const char *s, char *o, size_t n)
{
    size_t i = 0; for (; s[i] && i + 1 < n; i++) o[i] = (char)tolower((unsigned char)s[i]); o[i] = '\0';
}
static int icerir(const char *h, const char *const *liste)
{
    for (int i = 0; liste[i]; i++) if (strstr(h, liste[i])) return 1;
    return 0;
}
static int sayi_var(const char *h) { for (; *h; h++) if (isdigit((unsigned char)*h)) return 1; return 0; }

static int denetle(const char *g)
{
    char low[512]; kucult(g, low, sizeof low);
    int belirsiz = icerir(low, BELIRSIZ);
    int olculebilir = sayi_var(low) || icerir(low, SOMUT);
    int zayif = belirsiz || !olculebilir;
    printf("  [%s] %s\n", zayif ? "ZAYIF" : " IYI ", g);
    if (zayif) {
        if (belirsiz)      printf("        neden: belirsiz ifade (dogrulanamaz). Olculebilir/tekil yazin.\n");
        else               printf("        neden: olculebilir dayanak yok (sayi/somut teknik terim ekleyin).\n");
    }
    return zayif;
}

int main(int argc, char **argv)
{
    printf("=== Gereksinim kalitesi denetimi ===\n");
    if (argc > 1) {   /* argumanla verilen gereksinim(ler) */
        int z = 0; for (int i = 1; i < argc; i++) z += denetle(argv[i]);
        printf("\n%d zayif gereksinim.\n", z); return z;
    }
    const char *ornek[] = {
        "Uygulama guvenli olmali.",
        "Anahtarlar iyi yonetilmeli.",
        "Surum derlemesi yigin koruyucu, PIE ve tam RELRO ile uretilmelidir.",
        "C sinifi her varlik beklemede en az 128 bit duzeyinde AES-GCM ile sifrelenmelidir.",
        "Veriler uygun sekilde saklanmali.",
    };
    int z = 0, n = (int)(sizeof ornek / sizeof ornek[0]);
    for (int i = 0; i < n; i++) z += denetle(ornek[i]);
    printf("\nOzet: %d/%d gereksinim ZAYIF. Zayif gereksinim test edilemez -> once duzeltilir.\n", z, n);
    return z;
}
