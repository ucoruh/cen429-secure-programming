/*
 * CEN429 - Hafta 4 - Demo 7: Kontrol akisi DUZLESTIRILMIS surum.
 *
 * pin.c ile AYNI islev, ama el ile "duzlestirilmis": butun adimlar tek bir
 * sonsuz dongu icindeki switch-dagiticiya konur. Bir "durum" degiskeni siradaki
 * adimin hangisi oldugunu tutar. Cikti aynidir; ama kontrol akisi grafi (CFG)
 * artik dogal if-zinciri gibi degildir: her blok dagiticidan gecer, komsuluk
 * kaybolur. Tigress'in --Transform=Flatten donusumunun elle karsiligidir.
 *
 * Maliyet: dagitici dongusu ek is yapar; demo bunu sure olcumuyle gosterir.
 */
#include <stdio.h>
#include <string.h>
#include <time.h>
#include "cen429_demo.h"

int pin_dogrula(const char *g)
{
    int durum = 0;
    int ok = 0;
    for (;;) {
        switch (durum) {
        case 0:  durum = (strlen(g) != 4) ? 99 : 1; break;
        case 1:  durum = (g[0] != '4')    ? 99 : 2; break;
        case 2:  durum = (g[1] != '2')    ? 99 : 3; break;
        case 3:  durum = (g[2] != '9')    ? 99 : 4; break;
        case 4:  durum = (g[3] != '1')    ? 99 : 5; break;
        case 5:  ok = 1; durum = 99;                break;
        case 99: return ok;
        default: return 0;
        }
    }
}

int main(int argc, char **argv)
{
    demo_hazirla();
    if (argc >= 2 && strcmp(argv[1], "sure") == 0) {
        volatile int yut = 0;
        char tampon[8];
        clock_t b = clock();
        for (int i = 0; i < 20000000; i++) {
            snprintf(tampon, sizeof(tampon), "%04d", i % 10000);
            yut += pin_dogrula(tampon);
        }
        clock_t s = clock();
        double ms = 1000.0 * (double)(s - b) / CLOCKS_PER_SEC;
        printf("DUZLESTIRILMIS surum: 20M dogrulama -> %.1f ms (yut=%d)\n", ms, yut);
        return 0;
    }
    const char *p = (argc >= 2) ? argv[1] : "0000";
    printf("PIN %s -> %s\n", p, pin_dogrula(p) ? "DOGRU" : "yanlis");
    return 0;
}
