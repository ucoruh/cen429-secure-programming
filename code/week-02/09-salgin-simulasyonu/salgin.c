/*
 * CEN429 — Hafta 2 — Demo 09: Solucan salgın simülasyonu (SI modeli)
 *
 * Kullanım: bin/.../salgin
 *
 * Bir solucanın ağda yayılmasını "Duyarlı–Enfekte" (Susceptible–Infected, SI)
 * salgın modeliyle benzetir. HİÇBİR ağ işlemi yapmaz, hiçbir yere bağlanmaz;
 * yalnız bir fark denklemini çözer ve sonucu ASCII çubuk grafiğiyle basar.
 *
 * SI fark denklemi (ayrık zaman, Euler):
 *
 *     i(t+dt) = i(t) + beta * i(t) * (1 - i(t)/N) * dt
 *
 *   i(t) : o ana kadar enfekte olmuş makine sayısı
 *   N    : toplam savunmasız (duyarlı) makine sayısı
 *   beta : etkin bulaşma katsayısı (1/saniye) — bir enfekte makinenin
 *          birim zamanda kaç yeni makineye bulaştırdığının ölçüsü
 *
 * Erken (üstel) evrede ikilenme süresi = ln(2)/beta. Bu demo üç senaryoyu
 * karşılaştırır: yavaş rastgele tarama (Code Red benzeri), hızlı rastgele
 * tarama (SQL Slammer benzeri) ve aynı hızda ama "hitlist" ile başlayan
 * (yani i0 büyük) bir solucan. Rakamlar örnektir; gerçekte gözlenen
 * ikilenme süreleri ders notunda tartışılır.
 */
#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <string.h>
#include "cen429_demo.h"

#define ADIM_AZAMI 200000

/* 0..1 arası kesri genislik karakterlik bir çubuğa çevirir. */
static void cubuk(double frac, char *out, int genislik)
{
    if (frac < 0.0)
        frac = 0.0;
    if (frac > 1.0)
        frac = 1.0;
    int dolu = (int)(frac * genislik + 0.5);
    for (int i = 0; i < genislik; i++)
        out[i] = i < dolu ? '#' : '.';
    out[genislik] = '\0';
}

/* Süreyi insan okunur biçimde yazar (s / dk / sa). */
static void sure_yaz(double s, char *out, size_t boy)
{
    if (s < 90.0)
        snprintf(out, boy, "%6.0f s ", s);
    else if (s < 5400.0)
        snprintf(out, boy, "%6.1f dk", s / 60.0);
    else
        snprintf(out, boy, "%6.2f sa", s / 3600.0);
}

/*
 * Bir SI senaryosunu benzetir ve özet satırlarını basar.
 *   ad    : senaryo adı
 *   i0    : başlangıçtaki enfekte makine sayısı (hitlist için > 1)
 *   beta  : bulaşma katsayısı (1/s)
 *   N     : toplam savunmasız makine
 * Dönüş: %90 doygunluğa ulaşma süresi (saniye).
 */
static double senaryo(const char *ad, double i0, double beta, double N)
{
    double ikilenme = log(2.0) / beta;      /* erken evre ikilenme süresi */
    double dt = ikilenme / 40.0;            /* her ikilenmeyi 40 adıma böl */
    char bar[41], sbuf[16];

    /* %99 doygunluğa kadar geçen süreyi kapalı biçimle kestir. */
    double t99 = (1.0 / beta) * log((0.99 / 0.01) * ((N - i0) / i0));
    double son_t = t99 * 1.02;
    int ornek = 12;                         /* kaç satır basılacak         */

    printf("  Senaryo: %s\n", ad);
    printf("    N=%.0f savunmasiz  i0=%.0f  ikilenme=%.2f s\n", N, i0,
           ikilenme);
    printf("      %-9s %10s  %6s\n", "zaman", "enfekte", "oran");

    /* Örnekleme anları: 0'dan son_t'ye eşit aralıklı. */
    double t = 0.0, i = i0;
    int adim = 0, basildi = 0;
    double sonraki_ornek = 0.0;
    double ornek_araligi = son_t / (double)(ornek - 1);

    while (adim < ADIM_AZAMI && basildi < ornek) {
        if (t + 1e-9 >= sonraki_ornek) {
            double frac = i / N;
            cubuk(frac, bar, 30);
            sure_yaz(t, sbuf, sizeof sbuf);
            printf("      %s %10.0f  %5.1f%% |%s|\n", sbuf, i, frac * 100.0,
                   bar);
            sonraki_ornek += ornek_araligi;
            basildi++;
        }
        /* SI fark denklemi (Euler adımı) */
        i = i + beta * i * (1.0 - i / N) * dt;
        if (i > N)
            i = N;
        t += dt;
        adim++;
    }

    /* %90 doygunluk süresi (kapalı biçim). */
    double t90 = (1.0 / beta) * log((0.90 / 0.10) * ((N - i0) / i0));
    sure_yaz(t90, sbuf, sizeof sbuf);
    printf("      -> %%90 doygunluk: %s\n\n", sbuf);
    return t90;
}

int main(void)
{
    demo_hazirla();

    printf("SI (Duyarli-Enfekte) salgin modeli - yalniz hesaplama, ag yok\n");
    printf("i(t+dt) = i(t) + beta*i(t)*(1 - i(t)/N)*dt\n\n");

    /* 1) Code Red benzeri: yavaş rastgele tarama (TCP el sıkışması gerekir).
          Gözlenen ikilenme ~37 dk; beta = ln2 / (37*60). */
    double cr = senaryo("Code Red benzeri (rastgele tarama, yavas)",
                        1.0, log(2.0) / (37.0 * 60.0), 360000.0);

    /* 2) SQL Slammer benzeri: tek UDP paketi, çok hızlı.
          Gözlenen ilk dakika ikilenme ~8.5 s; beta = ln2 / 8.5. */
    double sl = senaryo("Slammer benzeri (rastgele tarama, hizli UDP)",
                        1.0, log(2.0) / 8.5, 75000.0);

    /* 3) Hitlist: aynı hız ama 10000 makinelik hazır listeyle başla (i0 buyuk).
          Yavaş açılış evresi ortadan kalkar. */
    double hl = senaryo("Hitlist (Slammer hizi, i0=10000 hazir hedef)",
                        10000.0, log(2.0) / 8.5, 75000.0);

    printf("  KARSILASTIRMA (%%90 doygunluga ulasma):\n");
    printf("    Code Red benzeri : %.0f s (~%.1f saat)\n", cr, cr / 3600.0);
    printf("    Slammer benzeri  : %.0f s (~%.1f dakika)\n", sl, sl / 60.0);
    printf("    Hitlist          : %.0f s (~%.1f dakika)\n", hl, hl / 60.0);
    printf("  Ayni beta'da hitlist, yavas acilis evresini atlayarak\n");
    printf("  doygunlugu one ceker. Yuksek beta (Slammer) ise egriyi\n");
    printf("  saatlerden dakikalara indirir.\n");
    return 0;
}
