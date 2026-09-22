/*
 * CEN429 - Hafta 4 - Demo 2: use-after-free / double-free (GUVENLI SURUM)
 *
 * Iki basit kural, iki hata sinifini birden kapatir:
 *  1) Sahiplik ve "serbest birakinca NULL yap": free()'den hemen sonra isaretci
 *     NULL yapilir. Askida isaretci kalmaz; kullanmadan once NULL denetimi
 *     yapilir (use-after-free biter).
 *  2) Tek noktadan serbest birakma: guvenli_serbest() hem free eder hem NULL'a
 *     ceker; ikinci cagri hicbir sey yapmaz (double-free biter).
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cen429_demo.h"

struct oturum {
    void (*eylem)(void);
    char  rol[16];
};

static void normal_panel(void) { printf("   -> Normal kullanici paneli.\n"); }

/* free eder ve isaretciyi NULL yapar (cift serbest birakmayi imkansiz kilar) */
static void guvenli_serbest(void **p)
{
    if (p && *p) {
        free(*p);
        *p = NULL;
    }
}

static int kip_uaf(void)
{
    struct oturum *o = malloc(sizeof *o);
    if (!o) return 1;
    o->eylem = normal_panel;
    strcpy(o->rol, "user");
    printf("1) Oturum acildi: rol=%s\n", o->rol);

    guvenli_serbest((void **)&o);   /* free + NULL */
    printf("2) Oturum kapatildi; isaretci NULL yapildi.\n");

    if (o == NULL) {
        printf("3) Kullanim oncesi NULL denetimi: oturum yok, islem reddedildi.\n");
        return 0;
    }
    o->eylem();                     /* buraya asla gelinmez */
    return 0;
}

static int kip_cift(void)
{
    char *tampon = malloc(32);
    if (!tampon) return 1;
    strcpy(tampon, "ornek veri");
    printf("1) Blok ayrildi.\n");
    guvenli_serbest((void **)&tampon);
    printf("2) guvenli_serbest: free + NULL.\n");
    guvenli_serbest((void **)&tampon);
    printf("3) Ikinci guvenli_serbest hicbir sey yapmadi (NULL): double-free yok.\n");
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
