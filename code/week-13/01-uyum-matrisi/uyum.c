/*
 * CEN429 - Hafta 13 - Demo 1: Uyum matrisi dogrulayici (S17).
 * Her gereksinim satiri:  ID | DURUM | BOLUM | KANIT
 *   DURUM: karsilandi | devredildi | karsilanmadi
 * Kurallar (degerlendirici gozuyle):
 *   * "karsilandi" ama KANIT bos  -> BULGU (karsilanmamis sayilir).
 *   * "devredildi" ama KANIT bos  -> BULGU (kime/neden/nasil yazilmali).
 *   * "karsilanmadi"              -> kalan risk (bilgi).
 * Cikis kodu = bulgu sayisi.
 *
 * Kullanim: uyum [gereksinimler.txt]   (dosya verilmezse GOMULU ornek kullanilir)
 * GUVENLIK: yalniz verilen metin dosyasini OKUR; yazma/ag/sistem islemi yok.
 */
#include <stdio.h>
#include <string.h>

/* Gomulu ornek matris (dosya verilmezse). Ikinci satir bilerek KANITSIZ (bulgu). */
static const char *GOMULU =
    "CEN429-DR-01|karsilandi|S8|T-05 test ciktisi\n"
    "CEN429-CR-02|karsilandi|S8|\n"                       /* <- kanitsiz: BULGU */
    "CEN429-DT-03|karsilandi|S11|T-11 test\n"
    "CEN429-AP-04|devredildi|S14|MPA imzali guncelleme saglar\n"
    "CEN429-AS-05|karsilanmadi|S12|kalan risk: kokli cihaz\n";

static void kirp(char *s)  /* bastaki/sondaki bosluklari at */
{
    size_t n = strlen(s);
    while (n && (s[n-1]==' '||s[n-1]=='\r'||s[n-1]=='\n'||s[n-1]=='\t')) s[--n]='\0';
    size_t i = 0; while (s[i]==' '||s[i]=='\t') i++;
    if (i) memmove(s, s+i, strlen(s+i)+1);
}

static int satir_isle(char *satir, int *say_k, int *say_d, int *say_n)
{
    char *alan[4] = {0}; int a = 0; char *sp = NULL;
    for (char *p = strtok_r(satir, "|", &sp); p && a < 4; p = strtok_r(NULL, "|", &sp)) alan[a++] = p;
    if (a < 3) return 0;                 /* bicim disi satir -> atla */
    char *id = alan[0], *durum = alan[1], *kanit = (a >= 4) ? alan[3] : (char*)"";
    kirp(id); kirp(durum); kirp(kanit);
    int bulgu = 0;
    if (strcmp(durum, "karsilandi") == 0) {
        (*say_k)++;
        if (kanit[0] == '\0') { printf("  [BULGU] %-14s 'karsilandi' ama KANIT yok -> karsilanmamis sayilir\n", id); bulgu = 1; }
        else                   printf("  [OK]    %-14s karsilandi  (kanit: %s)\n", id, kanit);
    } else if (strcmp(durum, "devredildi") == 0) {
        (*say_d)++;
        if (kanit[0] == '\0') { printf("  [BULGU] %-14s 'devredildi' ama kime/neden/nasil yok\n", id); bulgu = 1; }
        else                   printf("  [OK]    %-14s devredildi  (%s)\n", id, kanit);
    } else if (strcmp(durum, "karsilanmadi") == 0) {
        (*say_n)++;
        printf("  [RISK]  %-14s karsilanmadi -> kalan riske yazilmali (%s)\n", id, kanit);
    } else {
        printf("  [BULGU] %-14s bilinmeyen durum '%s'\n", id, durum);
        return 1;
    }
    return bulgu;
}

int main(int argc, char **argv)
{
    char satir[512];
    int bulgu = 0, k = 0, d = 0, n = 0;
    printf("=== Uyum matrisi dogrulama (S17) ===\n");

    if (argc > 1) {
        FILE *f = fopen(argv[1], "r");
        if (!f) { fprintf(stderr, "Dosya acilamadi: %s\n", argv[1]); return 2; }
        while (fgets(satir, sizeof satir, f)) if (satir[0] != '\n') bulgu += satir_isle(satir, &k, &d, &n);
        fclose(f);
    } else {
        char kopya[1024]; strncpy(kopya, GOMULU, sizeof kopya - 1); kopya[sizeof kopya - 1] = '\0';
        for (char *s = strtok(kopya, "\n"); s; s = strtok(NULL, "\n"))
            { strncpy(satir, s, sizeof satir - 1); satir[sizeof satir - 1] = '\0'; bulgu += satir_isle(satir, &k, &d, &n); }
    }

    printf("\nOzet: %d karsilandi, %d devredildi, %d karsilanmadi | %d BULGU\n", k, d, n, bulgu);
    if (bulgu) printf("Kanitsiz 'karsilandi' satirlari degerlendiricide ilk bulgudur.\n");
    return bulgu;
}
