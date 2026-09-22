/*
 * CEN429 - Hafta 2 - Demo 10: Gunluk (log) enjeksiyonu ve kacislama
 *
 * KONU: CWE-117 (Improper Output Neutralization for Logs / "log
 * forging"). Bir denetim gunlugu, disaridan gelen bir alani (burada
 * kullanici adi) DENETLEMEDEN gunluk satirina yazarsa, saldirgan
 * alanina satir sonu (CR/LF) ve kontrol karakterleri koyarak SAHTE
 * gunluk satirlari uretebilir; analisti yaniltir, olayin izini bozar.
 *
 * Bu demo GUVENLI bir benzetimdir:
 *   - Yalniz kendi klasorundeki calisma/ altina yazar.
 *   - Gercek bir kimlik dogrulama yapmaz; yalniz "su kullanici giris
 *     denedi" bicimli bir denetim satiri uretir.
 *   - Kullanici adini bir DOSYADAN ham bayt olarak okur; boylece
 *     satir sonu ve kontrol karakterleri argumandan gecirmeye gerek
 *     kalmadan dogal olarak temsil edilir.
 *
 * Kullanim:
 *   gunluk uret   <dizin>                  ornek girdi dosyalari yaz
 *   gunluk yaz    <mod> <girdi> <log>      bir denetim satiri ekle
 *                 mod = guvensiz | guvenli
 *   gunluk say    <log>                    satir/sahte-satir sayimi
 *
 * Not (CWE-134): Bir baska klasik tuzak, kullanici verisini bicim
 * dizgesi (format string) olarak kullanmaktir: fprintf(f, ad).
 * Bu kodda HER ZAMAN sabit bicim dizgesi + argum kullanilir:
 * fprintf(f, "%s", ad). Boylece format-string acigi bastan kapalidir.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include "cen429_demo.h"

#define AZAMI_AD 4096

/* Sabit, deterministik bir zaman damgasi (demo ciktisi tekrarlanabilir
 * olsun diye gercek saat yerine sabit bir dizge kullaniyoruz). */
static const char *ZAMAN = "2026-09-25 09:15:42";

/* Ham baytlari dosyadan oku; okunan uzunlugu dondur (<0 hata). */
static long dosya_oku(const char *yol, unsigned char *tmp, size_t azami)
{
    FILE *f = fopen(yol, "rb");
    if (!f)
        return -1;
    size_t n = fread(tmp, 1, azami, f);
    fclose(f);
    return (long)n;
}

/* GUVENSIZ: kullanici adini oldugu gibi (ham) gunluge yazar. */
static void yaz_guvensiz(const char *log, const unsigned char *ad,
                         size_t alen)
{
    FILE *f = fopen(log, "ab");
    if (!f) {
        perror(log);
        return;
    }
    /* Sabit bicim dizgesi; ama alan icerigi HIC denetlenmiyor. */
    fprintf(f, "%s DENETIM giris kullanici=", ZAMAN);
    fwrite(ad, 1, alen, f);            /* ham: CR/LF buraya sizar */
    fprintf(f, " sonuc=BASARISIZ\n");
    fclose(f);
}

/* Kontrol karakterlerini ve satir sonlarini kacislar; uzunlugu sinirlar.
 * Yazdirilabilir ASCII (0x20-0x7E) disindaki her bayti \xNN yapar;
 * boylece CR/LF, ANSI kacis dizileri ve gomulu NUL etkisiz kalir. */
static void kacisla(const unsigned char *ad, size_t alen,
                    char *cikti, size_t azami)
{
    size_t j = 0;
    const size_t SINIR = 64;          /* alan basi azami mantiksal uzunluk */
    size_t say = (alen < SINIR) ? alen : SINIR;
    for (size_t i = 0; i < say && j + 5 < azami; i++) {
        unsigned char c = ad[i];
        if (c >= 0x20 && c <= 0x7E && c != '\\') {
            cikti[j++] = (char)c;
        } else if (c == '\\') {
            cikti[j++] = '\\';
            cikti[j++] = '\\';
        } else {
            j += (size_t)snprintf(cikti + j, azami - j, "\\x%02X", c);
        }
    }
    if (alen > SINIR && j + 3 < azami) {
        cikti[j++] = '.';
        cikti[j++] = '.';
        cikti[j++] = '.';
    }
    cikti[j] = '\0';
}

/* GUVENLI: kacisla + sabit bicim dizgesi + tek satir garantisi. */
static void yaz_guvenli(const char *log, const unsigned char *ad,
                        size_t alen)
{
    char temiz[256];
    kacisla(ad, alen, temiz, sizeof temiz);
    FILE *f = fopen(log, "ab");
    if (!f) {
        perror(log);
        return;
    }
    fprintf(f, "%s DENETIM giris kullanici=%s sonuc=BASARISIZ\n",
            ZAMAN, temiz);
    fclose(f);
}

/* Ornek girdi dosyalari: normal, enjeksiyon, kontrol karakteri, uzun. */
static int uret(const char *dizin)
{
    char yol[512];
    /* 1) Normal kullanici adi. */
    snprintf(yol, sizeof yol, "%s/01-normal.bin", dizin);
    FILE *f = fopen(yol, "wb");
    if (!f) { perror(yol); return 1; }
    fputs("ayse", f);
    fclose(f);

    /* 2) Enjeksiyon: satir sonu + sahte "admin BASARILI" satiri. */
    snprintf(yol, sizeof yol, "%s/02-enjeksiyon.bin", dizin);
    f = fopen(yol, "wb");
    if (!f) { perror(yol); return 1; }
    fputs("kayra\n", f);
    fprintf(f, "%s DENETIM giris kullanici=admin sonuc=BASARILI", ZAMAN);
    fclose(f);

    /* 3) Kontrol karakteri: ANSI 'satiri temizle' + geri sil. */
    snprintf(yol, sizeof yol, "%s/03-kontrol.bin", dizin);
    f = fopen(yol, "wb");
    if (!f) { perror(yol); return 1; }
    fputs("deniz", f);
    fputc(0x1b, f); fputs("[2K", f);   /* ESC [2K : satiri sil (terminal) */
    fputc('\r', f);
    fputs("gizli", f);
    fclose(f);

    /* 4) Cok uzun alan (5000 bayt): sinir denetimi icin. */
    snprintf(yol, sizeof yol, "%s/04-cok-uzun.bin", dizin);
    f = fopen(yol, "wb");
    if (!f) { perror(yol); return 1; }
    for (int i = 0; i < 5000; i++)
        fputc('A', f);
    fclose(f);

    printf("  Ornek girdi dosyalari yazildi: %s/01..04\n", dizin);
    return 0;
}

/* Gunlukteki toplam satir ve "sahte admin BASARILI" satir sayimi. */
static int say(const char *log)
{
    FILE *f = fopen(log, "rb");
    if (!f) { perror(log); return 1; }
    char satir[8192];
    int toplam = 0, sahte = 0;
    while (fgets(satir, sizeof satir, f)) {
        toplam++;
        if (strstr(satir, "kullanici=admin sonuc=BASARILI"))
            sahte++;
    }
    fclose(f);
    printf("  Gunluk: %d satir; sahte 'admin BASARILI' satiri: %d\n",
           toplam, sahte);
    if (sahte > 0)
        printf("   ^ DIKKAT: hic olmayan bir admin girisi enjekte "
               "edilmis olabilir.\n");
    return 0;
}

int main(int argc, char **argv)
{
    demo_hazirla();
    (void)ZAMAN;
    if (argc >= 2 && strcmp(argv[1], "uret") == 0 && argc == 3)
        return uret(argv[2]);
    if (argc >= 2 && strcmp(argv[1], "say") == 0 && argc == 3)
        return say(argv[2]);
    if (argc == 5 && strcmp(argv[1], "yaz") == 0) {
        unsigned char tmp[AZAMI_AD];
        long n = dosya_oku(argv[3], tmp, sizeof tmp);
        if (n < 0) { perror(argv[3]); return 1; }
        if (strcmp(argv[2], "guvensiz") == 0)
            yaz_guvensiz(argv[4], tmp, (size_t)n);
        else if (strcmp(argv[2], "guvenli") == 0)
            yaz_guvenli(argv[4], tmp, (size_t)n);
        else { fprintf(stderr, "mod: guvensiz|guvenli\n"); return 2; }
        return 0;
    }
    fprintf(stderr,
        "kullanim:\n"
        "  %s uret <dizin>\n"
        "  %s yaz <guvensiz|guvenli> <girdi> <log>\n"
        "  %s say <log>\n", argv[0], argv[0], argv[0]);
    return 2;
}
