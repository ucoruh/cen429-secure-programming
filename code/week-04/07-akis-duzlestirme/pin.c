/*
 * CEN429 - Hafta 4 - Demo 7: Kontrol akisi duzlestirme - DUZ (normal) surum.
 *
 * Kucuk bir PIN denetimi, dogal if/dallar ile yazilmistir. Tersine muhendis
 * bunu okurken akisi (kontrol akisi grafi, CFG) kolayca cikarir. 07-akis
 * demosu ayni islevi "duzlestirilmis" haliyle (pin_duz.c) karsilastirir.
 *
 * Dogru PIN sentetiktir (uydurma) ve tek bir dize sabiti olarak DEGIL, basamak
 * karsilastirmalariyla kodlanmistir; boylece 'strings' ile de sizmaz.
 */
#include <stdio.h>
#include <string.h>
#include <time.h>
#include "cen429_demo.h"

/* PIN dogru mu? (dogru = 4-2-9-1) */
int pin_dogrula(const char *g)
{
    if (strlen(g) != 4) return 0;
    if (g[0] != '4') return 0;
    if (g[1] != '2') return 0;
    if (g[2] != '9') return 0;
    if (g[3] != '1') return 0;
    return 1;
}

int main(int argc, char **argv)
{
    demo_hazirla();
    if (argc >= 2 && strcmp(argv[1], "sure") == 0) {
        volatile int yut = 0;
        char tampon[8];
        clock_t b = clock();
        for (int i = 0; i < 20000000; i++) {
            /* her turda farkli girdi: derleyici cagriyi silmesin */
            snprintf(tampon, sizeof(tampon), "%04d", i % 10000);
            yut += pin_dogrula(tampon);
        }
        clock_t s = clock();
        double ms = 1000.0 * (double)(s - b) / CLOCKS_PER_SEC;
        printf("DUZ surum: 20M dogrulama -> %.1f ms (yut=%d)\n", ms, yut);
        return 0;
    }
    const char *p = (argc >= 2) ? argv[1] : "0000";
    printf("PIN %s -> %s\n", p, pin_dogrula(p) ? "DOGRU" : "yanlis");
    return 0;
}
