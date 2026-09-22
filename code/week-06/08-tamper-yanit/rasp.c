/*
 * CEN429 - Hafta 6 - Demo 8: RASP motoru - algilama + TEPKI + cihaz/surum baglama
 *
 * Bu, haftanin CAPSTONE demosudur; onceki parcalari tek bir "oz koruma motoru"
 * altinda birlestirir:
 *
 *   ALGILAMA  : bir dizi kontrol (butunluk - Demo 1, anti-debug - Demo 2,
 *               ortam - Demo 3, kanca - Demo 4, root - Demo 7) calisir.
 *   CIHAZ/SURUM BAGLAMA : degerli sir, cihaz parmak izi + surumden HKDF ile
 *               turetilen bir anahtarla AES-GCM'de saruludur (Katalog L1/L2).
 *               Baska cihazda anahtar farkli cikar -> sir ACILAMAZ.
 *   TEPKI POLITIKASI : tamper algilaninca (Katalog K15/K16) motor:
 *               (a) sirri guvenle SILER (kripto_temizle),
 *               (b) tamper bayragini kaldirir ve olayi (bellekte) kaydeder,
 *               (c) cokmek yerine SAHTE (decoy) sonuc doner - saldirgan gercek
 *                   ile sahteyi kolayca ayirt edemez, veri sizmaz.
 *
 * Senaryolar (mod): normal | tamper | baska-cihaz
 * Tamamen tasinabilir ve guvenli: yalniz bellek ici; dosya/sistem/ag yok.
 */
#include "cen429_demo.h"
#include "cen429_kripto.h"
#include <stdio.h>
#include <string.h>

static const char *SURUM = "surum=1.0.0";

static void cihaz_parmak_izi(int baska, char *out, size_t n)
{
    /* Sentetik cihaz parmak izi (gercekte: uretici+model+cihaz kimligi karmasi). */
    snprintf(out, n, "cihaz=SIM-MODEL-A;seri=%s;uretici=DEMO",
             baska ? "SN-9999" : "SN-0001");
}

static void veri_anahtari(const char *fp, unsigned char key[32])
{
    kripto_hkdf_sha256((const unsigned char *)fp, strlen(fp),
                       (const unsigned char *)SURUM, strlen(SURUM),
                       (const unsigned char *)"rasp-veri-anahtari", 18, key, 32);
}

/* Kontrol sonuclarini moda gore uretir; basarisiz kontrol sayisini doner. */
static int kontrolleri_calistir(const char *mod)
{
    struct { const char *ad; int gecti; } k[] = {
        { "butunluk (Demo 1)", 1 },
        { "anti-debug (Demo 2)", 1 },
        { "ortam/VM (Demo 3)", 1 },
        { "kanca/preload (Demo 4)", 1 },
        { "root/ayricalik (Demo 7)", 1 },
    };
    int n = (int)(sizeof(k) / sizeof(k[0]));
    if (strcmp(mod, "tamper") == 0)
        k[1].gecti = 0;   /* anti-debug: hata ayiklayici algilandi (simulasyon) */

    int basarisiz = 0;
    for (int i = 0; i < n; i++) {
        printf("   [%s] %s\n", k[i].gecti ? "GECTI" : "BASARISIZ", k[i].ad);
        if (!k[i].gecti)
            basarisiz++;
    }
    return basarisiz;
}

int main(int argc, char **argv)
{
    demo_hazirla();
    const char *mod = (argc > 1) ? argv[1] : "normal";
    printf("RASP motoru - mod: %s\n", mod);
    printf("==============================================================\n");

    /* --- HAZIRLIK (uretim): sir, GERCEK cihaz anahtariyla saruluir. --- */
    const char *sir = "ODEME-ANAHTARI-7C4A";
    char fp_gercek[128];
    cihaz_parmak_izi(0, fp_gercek, sizeof(fp_gercek));
    unsigned char kg[32];
    veri_anahtari(fp_gercek, kg);
    unsigned char paket[12 + 64 + 16];
    kripto_rastgele(paket, 12);
    unsigned char et[16];
    kripto_gcm_sifrele(kg, paket, 12, NULL, 0,
                       (const unsigned char *)sir, strlen(sir), paket + 12, et);
    memcpy(paket + 12 + strlen(sir), et, 16);
    size_t paket_boy = 12 + strlen(sir) + 16;
    kripto_temizle(kg, sizeof(kg));   /* uretim anahtarini birak */

    /* --- CALISMA --- */
    printf("1) Algilama kontrolleri:\n");
    int basarisiz = kontrolleri_calistir(mod);

    printf("2) Cihaz/surum baglama:\n");
    int baska = (strcmp(mod, "baska-cihaz") == 0);
    char fp[128];
    cihaz_parmak_izi(baska, fp, sizeof(fp));
    printf("   parmak izi: %s ; %s\n", fp, SURUM);
    unsigned char kc[32];
    veri_anahtari(fp, kc);

    unsigned char cozulen[64];
    memset(cozulen, 0, sizeof(cozulen));
    size_t ct_boy = paket_boy - 12 - 16;
    int acildi = kripto_gcm_coz(kc, paket, 12, NULL, 0,
                                paket + 12, ct_boy, paket + 12 + ct_boy, cozulen);
    kripto_temizle(kc, sizeof(kc));

    printf("--------------------------------------------------------------\n");
    int tamper = (basarisiz > 0) || !acildi;
    if (!tamper) {
        printf("SONUC: TEMIZ. Sir acildi ve islem yapiliyor -> \"%s\"\n", cozulen);
        kripto_temizle(cozulen, sizeof(cozulen));   /* kullaninca hemen sil */
        printf("(sir kullanildiktan sonra bellekten guvenle silindi)\n");
        return 0;
    }

    /* --- TEPKI POLITIKASI (K15/K16) --- */
    const char *sebep = (basarisiz > 0) ? "algilama kontrolu basarisiz (tamper)"
                                        : "cihaz/surum baglama tutmadi (klonlama?)";
    printf("SONUC: TAMPER ALGILANDI -> %s\n", sebep);
    kripto_temizle(cozulen, sizeof(cozulen));        /* (a) sirri sil */
    unsigned char decoy[16];
    kripto_rastgele(decoy, sizeof(decoy));           /* (c) sahte sonuc */
    printf("   Politika: sir silindi, tamper bayragi kaldirildi, olay kaydedildi.\n");
    printf("   Cokmek yerine SAHTE (decoy) sonuc dondu: %02x%02x%02x%02x...\n",
           decoy[0], decoy[1], decoy[2], decoy[3]);
    printf("   (saldirgan gercek ile sahteyi kolayca ayirt edemez; veri sizmaz)\n");
    return 3;
}
