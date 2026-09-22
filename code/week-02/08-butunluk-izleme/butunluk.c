/*
 * CEN429 — Hafta 2 — Demo 08: Bütünlük izleme (SHA-256 manifesti)
 *
 * Kullanım: bin/.../butunluk olustur <klasor> <manifest>
 *           bin/.../butunluk dogrula <klasor> <manifest>
 *
 * Tripwire / AIDE gibi bütünlük izleyicilerin ve uygulama beyaz listesinin
 * (allowlist) çekirdek fikrini gösterir:
 *   1. "Bilinen iyi" durumda klasördeki her dosyanın SHA-256 özeti alınıp
 *      bir manifeste yazılır (taban çizgisi, baseline).
 *   2. Sonra özetler yeniden hesaplanır ve manifestle karşılaştırılır:
 *      TAMAM / DEGISTI / SILINDI / YENI.
 *
 * Yalnız verilen klasörün ÜST düzeyindeki normal dosyalara bakar (alt klasöre
 * inmez, bağlantı izlemez). Hiçbir dosyayı değiştirmez; yalnız manifesti
 * (olustur komutunda) yazar. SHA-256: Linux'ta OpenSSL, Windows'ta BCrypt
 * (common/cen429_kripto.h).
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cen429_demo.h"
#include "cen429_kripto.h"

#ifdef _WIN32
#include <windows.h>
#else
#include <dirent.h>
#include <sys/stat.h>
#endif

#define AZAMI_DOSYA 256
#define AD_BOY 128
#define OKUMA_BLOK 4096

struct kayit {
    char ad[AD_BOY];
    char ozet[65];
    long long boy;
    int eslesti;            /* doğrulamada karşılığı bulundu mu */
};

static int ad_karsilastir(const void *a, const void *b)
{
    return strcmp(((const struct kayit *)a)->ad,
                  ((const struct kayit *)b)->ad);
}

/* Dosyanın SHA-256 özetini parça parça (artımlı) hesaplar. */
static int dosya_ozeti(const char *yol, char hex[65], long long *boy)
{
    FILE *f = fopen(yol, "rb");
    if (!f)
        return -1;
    kripto_sha256_ctx c;
    if (!kripto_sha256_basla(&c)) {
        fclose(f);
        return -1;
    }
    unsigned char blok[OKUMA_BLOK], md[32];
    size_t n;
    long long toplam = 0;
    int ok = 1;
    while ((n = fread(blok, 1, sizeof blok, f)) > 0) {
        if (!kripto_sha256_ekle(&c, blok, n))
            ok = 0;
        toplam += (long long)n;
    }
    fclose(f);
    if (!kripto_sha256_bitir(&c, md) || !ok)
        return -1;
    for (int i = 0; i < 32; i++)
        snprintf(hex + 2 * i, 3, "%02x", md[i]);
    hex[64] = '\0';
    *boy = toplam;
    return 0;
}

/* Klasördeki üst düzey normal dosyaların adlarını toplar (sıralı).
   Manifestin kendisi (atla) listeye alınmaz. */
static int klasoru_listele(const char *klasor, const char *atla,
                           struct kayit *k, int kap)
{
    int say = 0;
#ifdef _WIN32
    char desen[512];
    snprintf(desen, sizeof desen, "%s\\*", klasor);
    WIN32_FIND_DATAA fd;
    HANDLE h = FindFirstFileA(desen, &fd);
    if (h == INVALID_HANDLE_VALUE)
        return -1;
    do {
        if (fd.dwFileAttributes & (FILE_ATTRIBUTE_DIRECTORY |
                                   FILE_ATTRIBUTE_REPARSE_POINT))
            continue;                       /* klasör ve bağlantı yok */
        if (strlen(fd.cFileName) >= AD_BOY || strcmp(fd.cFileName, atla) == 0)
            continue;
        if (say < kap)
            snprintf(k[say++].ad, AD_BOY, "%s", fd.cFileName);
    } while (FindNextFileA(h, &fd));
    FindClose(h);
#else
    DIR *d = opendir(klasor);
    if (!d)
        return -1;
    struct dirent *e;
    while ((e = readdir(d)) != NULL) {
        char yol[512];
        struct stat st;
        size_t L = strlen(e->d_name);
        if (L >= AD_BOY || strcmp(e->d_name, atla) == 0)
            continue;
        snprintf(yol, sizeof yol, "%s/%s", klasor, e->d_name);
        if (lstat(yol, &st) != 0 || !S_ISREG(st.st_mode))
            continue;                       /* yalnız normal dosya */
        if (say < kap)
            memcpy(k[say++].ad, e->d_name, L + 1);   /* L < AD_BOY */
    }
    closedir(d);
#endif
    qsort(k, (size_t)say, sizeof *k, ad_karsilastir);
    return say;
}

static const char *taban_ad(const char *yol)
{
    const char *s1 = strrchr(yol, '/');
    const char *s2 = strrchr(yol, '\\');
    const char *s = s1 > s2 ? s1 : s2;
    return s ? s + 1 : yol;
}

/* Klasörün güncel durumunu (ad + özet + boy) hesaplar. */
static int durum_hesapla(const char *klasor, const char *manifest,
                         struct kayit *k)
{
    int n = klasoru_listele(klasor, taban_ad(manifest), k, AZAMI_DOSYA);
    if (n < 0) {
        fprintf(stderr, "klasor okunamadi: %s\n", klasor);
        return -1;
    }
    for (int i = 0; i < n; i++) {
        char yol[512];
        snprintf(yol, sizeof yol, "%s/%s", klasor, k[i].ad);
        if (dosya_ozeti(yol, k[i].ozet, &k[i].boy) != 0) {
            fprintf(stderr, "ozet alinamadi: %s\n", k[i].ad);
            return -1;
        }
        k[i].eslesti = 0;
    }
    return n;
}

static int olustur(const char *klasor, const char *manifest)
{
    static struct kayit k[AZAMI_DOSYA];
    int n = durum_hesapla(klasor, manifest, k);
    if (n < 0)
        return 1;
    FILE *f = fopen(manifest, "w");
    if (!f) {
        perror(manifest);
        return 1;
    }
    fprintf(f, "# CEN429 butunluk manifesti: sha256  boyut  ad\n");
    for (int i = 0; i < n; i++)
        fprintf(f, "%s %lld %s\n", k[i].ozet, k[i].boy, k[i].ad);
    fclose(f);
    printf("  Taban cizgisi yazildi: %d dosya -> %s\n", n, taban_ad(manifest));
    for (int i = 0; i < n; i++)
        printf("    %.16s...  %6lld  %s\n", k[i].ozet, k[i].boy, k[i].ad);
    return 0;
}

static int dogrula(const char *klasor, const char *manifest)
{
    static struct kayit eski[AZAMI_DOSYA], yeni[AZAMI_DOSYA];
    int ne = 0;
    FILE *f = fopen(manifest, "r");
    if (!f) {
        perror(manifest);
        return 2;
    }
    char satir[512];
    while (fgets(satir, sizeof satir, f) && ne < AZAMI_DOSYA) {
        satir[strcspn(satir, "\r\n")] = '\0';
        if (satir[0] == '#' || satir[0] == '\0')
            continue;
        struct kayit *e = &eski[ne];
        /* Manifest de bir girdidir: biçimi bozuk satır reddedilir. */
        if (sscanf(satir, "%64s %lld %127s", e->ozet, &e->boy, e->ad) != 3
            || strlen(e->ozet) != 64) {
            fprintf(stderr, "  bozuk manifest satiri atlandi\n");
            continue;
        }
        e->eslesti = 0;
        ne++;
    }
    fclose(f);

    int nn = durum_hesapla(klasor, manifest, yeni);
    if (nn < 0)
        return 2;

    int sorun = 0;
    for (int i = 0; i < ne; i++) {
        int bulundu = -1;
        for (int j = 0; j < nn; j++)
            if (strcmp(eski[i].ad, yeni[j].ad) == 0) {
                bulundu = j;
                break;
            }
        if (bulundu < 0) {
            printf("  SILINDI  %-16s (manifestte var, klasorde yok)\n",
                   eski[i].ad);
            sorun++;
            continue;
        }
        yeni[bulundu].eslesti = 1;
        if (strcmp(eski[i].ozet, yeni[bulundu].ozet) == 0) {
            printf("  TAMAM    %-16s %.16s...\n", eski[i].ad, eski[i].ozet);
        } else {
            printf("  DEGISTI  %-16s %.12s... -> %.12s... (%lld->%lld B)\n",
                   eski[i].ad, eski[i].ozet, yeni[bulundu].ozet,
                   eski[i].boy, yeni[bulundu].boy);
            sorun++;
        }
    }
    for (int j = 0; j < nn; j++)
        if (!yeni[j].eslesti) {
            printf("  YENI     %-16s %.16s... (taban cizgisinde yok)\n",
                   yeni[j].ad, yeni[j].ozet);
            sorun++;
        }
    if (sorun == 0)
        printf("  SONUC: butunluk korunmus (%d dosya)\n", ne);
    else
        printf("  SONUC: %d sapma bulundu -> incele!\n", sorun);
    return sorun ? 1 : 0;
}

/* ---------- manifestin kendisini korumak: HMAC-SHA256 mühürü ---------- */

/* Küçük bir dosyayı belleğe okur (en fazla kap bayt). */
static long dosya_yukle(const char *yol, unsigned char *v, size_t kap)
{
    FILE *f = fopen(yol, "rb");
    if (!f)
        return -1;
    size_t n = fread(v, 1, kap, f);
    int fazla = fgetc(f) != EOF;
    fclose(f);
    return fazla ? -1 : (long)n;
}

/* 32 baytlık rastgele mühür anahtarı üretir (işletim sisteminin CSPRNG'si). */
static int anahtar_uret(const char *yol)
{
    unsigned char k[32];
    if (!kripto_rastgele(k, sizeof k))
        return 1;
    FILE *f = fopen(yol, "wb");
    if (!f) {
        perror(yol);
        return 1;
    }
    fwrite(k, 1, sizeof k, f);
    fclose(f);
    kripto_temizle(k, sizeof k);
    printf("  32 baytlik muhur anahtari uretildi -> %s\n", taban_ad(yol));
    return 0;
}

static int hmac_hesapla(const char *manifest, const char *anahtar_yol,
                        unsigned char mac[32])
{
    static unsigned char veri[64 * 1024];
    unsigned char k[64];
    long kn = dosya_yukle(anahtar_yol, k, sizeof k);
    long vn = dosya_yukle(manifest, veri, sizeof veri);
    if (kn <= 0 || vn < 0) {
        fprintf(stderr, "  anahtar ya da manifest okunamadi\n");
        return -1;
    }
    int ok = kripto_hmac_sha256(k, (size_t)kn, veri, (size_t)vn, mac);
    kripto_temizle(k, sizeof k);
    return ok ? 0 : -1;
}

static int muhurle(const char *manifest, const char *anahtar_yol)
{
    unsigned char mac[32];
    char yol[512], hex[65];
    if (hmac_hesapla(manifest, anahtar_yol, mac) != 0)
        return 1;
    for (int i = 0; i < 32; i++)
        snprintf(hex + 2 * i, 3, "%02x", mac[i]);
    snprintf(yol, sizeof yol, "%s.hmac", manifest);
    FILE *f = fopen(yol, "w");
    if (!f) {
        perror(yol);
        return 1;
    }
    fprintf(f, "%s\n", hex);
    fclose(f);
    printf("  Manifest muhurlendi: HMAC-SHA256 = %.16s...\n", hex);
    return 0;
}

static int muhur_dogrula(const char *manifest, const char *anahtar_yol)
{
    unsigned char mac[32], beklenen[32];
    char yol[512], hex[80];
    if (hmac_hesapla(manifest, anahtar_yol, mac) != 0)
        return 2;
    snprintf(yol, sizeof yol, "%s.hmac", manifest);
    FILE *f = fopen(yol, "r");
    if (!f || !fgets(hex, sizeof hex, f)) {
        if (f)
            fclose(f);
        printf("  MUHUR YOK: manifestin HMAC dosyasi bulunamadi\n");
        return 1;
    }
    fclose(f);
    for (int i = 0; i < 32; i++) {
        unsigned int b;
        if (sscanf(hex + 2 * i, "%2x", &b) != 1) {
            printf("  MUHUR BOZUK: HMAC dosyasi okunamadi\n");
            return 1;
        }
        beklenen[i] = (unsigned char)b;
    }
    /* Sabit zamanlı karşılaştırma: ilk farklı baytta erken çıkmaz. */
    unsigned char fark = 0;
    for (int i = 0; i < 32; i++)
        fark |= (unsigned char)(mac[i] ^ beklenen[i]);
    if (fark == 0) {
        printf("  MUHUR GECERLI: manifest anahtar sahibince yazilmis\n");
        return 0;
    }
    printf("  MUHUR GECERSIZ: manifest anahtarsiz biri tarafindan\n"
           "  degistirilmis -> manifeste GUVENME\n");
    return 1;
}

int main(int argc, char **argv)
{
    demo_hazirla();
    if (argc == 3 && strcmp(argv[1], "anahtar") == 0)
        return anahtar_uret(argv[2]);
    if (argc != 4) {
        fprintf(stderr,
                "kullanim: %s olustur|dogrula <klasor> <manifest>\n"
                "          %s muhurle|muhur-dogrula <manifest> <anahtar>\n"
                "          %s anahtar <anahtar-dosyasi>\n",
                argv[0], argv[0], argv[0]);
        return 2;
    }
    if (strcmp(argv[1], "olustur") == 0)
        return olustur(argv[2], argv[3]);
    if (strcmp(argv[1], "dogrula") == 0)
        return dogrula(argv[2], argv[3]);
    if (strcmp(argv[1], "muhurle") == 0)
        return muhurle(argv[2], argv[3]);
    if (strcmp(argv[1], "muhur-dogrula") == 0)
        return muhur_dogrula(argv[2], argv[3]);
    fprintf(stderr, "bilinmeyen komut: %s\n", argv[1]);
    return 2;
}
