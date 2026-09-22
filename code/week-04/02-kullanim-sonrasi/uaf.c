/*
 * CEN429 - Hafta 4 - Demo 2: Serbest birakilmis bellek (use-after-free) ve
 * cift serbest birakma (double-free)  (HATALI SURUM)
 *
 * "Oturum" nesnesi yiginda degil, YIGINDA (heap) tutulur ve icinde bir
 * fonksiyon isaretcisi (eylem) vardir. Nesne free() ile birakildiktan sonra
 * isaretci hala kullanilirsa (askida/dangling), saldirgan ayni boyutta yeni
 * bir blok ayirip o yere kendi verisini koyabilir; artik "askidaki" isaretci
 * saldirganin verisini gosterir. Boylece rol 'user' iken 'admin' olur ve
 * fonksiyon isaretcisi baska bir islevi cagirir.
 *
 * Kip:
 *   uaf   : kullan-sonra-serbest istismari (yetki yukseltme)
 *   cift  : ayni blogu iki kez serbest birakma (double-free)
 *
 * ETIK: butun eylemler bu programin kendi islevlerini cagirir; disariya kod
 * enjekte edilmez. Cokebilecek adimlar Linux'ta prlimit+timeout, Windows'ta
 * demo_hazirla() ile sinirlidir.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cen429_demo.h"

struct oturum {
    void (*eylem)(void);
    char  rol[16];
};

static void normal_panel(void)   { printf("   -> Normal kullanici paneli.\n"); }
static void yonetici_panel(void) { printf("   -> >>> YONETICI paneli acildi! <<<\n"); }

static int kip_uaf(void)
{
    struct oturum *o = malloc(sizeof *o);
    if (!o) return 1;
    o->eylem = normal_panel;
    strcpy(o->rol, "user");
    printf("1) Oturum acildi: rol=%s\n", o->rol);

    free(o);                 /* o artik askida (dangling), NULL yapilmadi */
    printf("2) Oturum serbest birakildi (ama isaretci hala elde).\n");

    /* Saldirgan ayni boyutta blok ayirir; ayirici cogu zaman ayni yeri verir */
    struct oturum *sahte = malloc(sizeof *o);
    if (!sahte) return 1;
    sahte->eylem = yonetici_panel;
    strcpy(sahte->rol, "admin");

    /* HATA: serbest birakilmis 'o' kullaniliyor (use-after-free) */
    printf("3) Askidaki isaretciden rol: %s\n", o->rol);
    printf("4) Askidaki isaretciden eylem cagriliyor:\n");
    o->eylem();

    free(sahte);
    return 0;
}

static int kip_cift(void)
{
    char *tampon = malloc(32);
    if (!tampon) return 1;
    strcpy(tampon, "ornek veri");
    printf("1) Blok ayrildi ve dolduruldu.\n");
    free(tampon);
    printf("2) Blok serbest birakildi.\n");
    printf("3) Ayni blok TEKRAR serbest birakiliyor (double-free)...\n");
    free(tampon);            /* HATA: cift serbest birakma */
    printf("4) Buraya ulasildiysa ayirici bozulmayi fark etmedi.\n");
    return 0;
}

int main(int argc, char **argv)
{
    demo_hazirla();
    const char *kip = (argc >= 2) ? argv[1] : "uaf";
    if (strcmp(kip, "uaf") == 0)  return kip_uaf();
    if (strcmp(kip, "cift") == 0) return kip_cift();
    fprintf(stderr, "Kullanim: %s <uaf|cift>\n", argv[0]);
    return 2;
}
