/*
 * CEN429 - Hafta 6 - Demo 5: Kontrol akisi sayaci (control-flow integrity)
 *
 * Tek bir "if (guvenli) ..." kontrolu KOLAY atlatilir: saldirgan ilgili
 * kosullu atlamayi (je -> jmp) yamalar ve kontrolu es gecer (Demo 1'de
 * anlatilan yama). Savunma (Katalog K17): guvenlik kontrollerini bir kontrol
 * akisi SAYACINA / TOKEN'ina baglamak. Kritik islem, dogru sonucu ancak butun
 * kontrol noktalarindan SIRAYLA gecilmisse uretebilir.
 *
 * Burada bunu bir VERI BAGIMLILIGI ile kuruyoruz: her kontrol noktasi bir
 * anahtar zincirini bir adim ilerletir (acc = HMAC(acc, "asama-i")). Kritik
 * islem bu zincirden turetilen anahtarla bir sirri AES-GCM ile ACAR. Kontrol
 * noktalari atlanir ya da sirasi bozulursa zincir farkli olur, anahtar yanlis
 * cikar ve GCM cozme REDDEDILIR -> saldirgan gercek sonucu alamaz, sahte
 * (decoy) sonuc doner. "Atlama" davranisi boylece ise yaramaz.
 *
 * Tamamen tasinabilir ve guvenli: yalniz bellek ici hesap; dosya/sistem yok.
 */
#include "cen429_demo.h"
#include "cen429_kripto.h"
#include <stdio.h>
#include <string.h>

#define ASAMA 3

/* Kontrol akisi durumu: anahtar zinciri (acc) + sayac + gecilen asamalarin izi. */
typedef struct {
    unsigned char acc[32];
    int sayac;
    unsigned int iz;     /* her asama bir bit; sirali gecis kontrolu icin */
} akis_t;

static void akis_basla(akis_t *a)
{
    static const unsigned char tohum[32] = "CEN429-akis-tohum-v1------------";
    memcpy(a->acc, tohum, 32);
    a->sayac = 0;
    a->iz = 0;
}

/* Kontrol noktasi i: guvenlik kontrolunu yapar VE zinciri ilerletir. */
static void kontrol_noktasi(akis_t *a, int i, const char *ad)
{
    char etiket[32];
    snprintf(etiket, sizeof(etiket), "asama-%d", i);
    unsigned char yeni[32];
    kripto_hmac_sha256(a->acc, 32, etiket, strlen(etiket), yeni);
    memcpy(a->acc, yeni, 32);
    a->sayac++;
    a->iz |= (1u << i);
    printf("   [gecildi] kontrol noktasi %d (%s)\n", i, ad);
}

/* Kritik islem: zincirden turetilen anahtarla sirri acar. */
static int kritik_islem(akis_t *a, const unsigned char *paket, size_t paket_boy,
                        unsigned char *sonuc, size_t sonuc_boy)
{
    /* Cift kontrol: sayac ve iz beklenen degerde mi? (K17 cift/ortusen sayac) */
    unsigned int beklenen_iz = (1u << ASAMA) - 1;   /* 0b111 */
    if (a->sayac != ASAMA || a->iz != beklenen_iz)
        printf("   (uyari: sayac=%d iz=0x%X beklenen=%d/0x%X)\n",
               a->sayac, a->iz, ASAMA, beklenen_iz);

    /* Anahtar zincirden turetilir; dogru sonuc icin zincir DOGRU olmali. */
    unsigned char nonce[12];
    memcpy(nonce, paket, 12);
    unsigned char etiket[16];
    memcpy(etiket, paket + paket_boy - 16, 16);
    size_t ct_boy = paket_boy - 12 - 16;
    if (ct_boy > sonuc_boy)
        return 0;
    return kripto_gcm_coz(a->acc, nonce, 12, NULL, 0,
                          paket + 12, ct_boy, etiket, sonuc);
}

int main(int argc, char **argv)
{
    demo_hazirla();
    const char *mod = (argc > 1) ? argv[1] : "normal";
    printf("Kontrol akisi sayaci - mod: %s\n", mod);
    printf("--------------------------------------------------------------\n");

    /* HAZIRLIK: dogru zinciri bir kez calistirip sirri o anahtarla sararak
       "urun icine gomuyoruz". (Gercekte bu, uretim adiminda yapilir.) */
    const char *sir = "ODEME-ONAYI-TOKEN-4242";
    akis_t h;
    akis_basla(&h);
    for (int i = 0; i < ASAMA; i++)
        kontrol_noktasi(&h, i, "hazirlik");
    unsigned char paket[12 + 64 + 16];
    kripto_rastgele(paket, 12);
    unsigned char etiket[16];
    kripto_gcm_sifrele(h.acc, paket, 12, NULL, 0,
                       (const unsigned char *)sir, strlen(sir), paket + 12, etiket);
    memcpy(paket + 12 + strlen(sir), etiket, 16);
    size_t paket_boy = 12 + strlen(sir) + 16;
    printf("   (sir dogru zincir anahtariyla saruldi: %zu bayt paket)\n\n", paket_boy);

    /* CALISMA: kontrol noktalarini moda gore calistir, sonra kritik islem. */
    akis_t a;
    akis_basla(&a);
    if (strcmp(mod, "normal") == 0) {
        printf("Normal akis: butun kontrol noktalari SIRAYLA calisir\n");
        kontrol_noktasi(&a, 0, "butunluk (Demo 1)");
        kontrol_noktasi(&a, 1, "anti-debug (Demo 2)");
        kontrol_noktasi(&a, 2, "ortam (Demo 3)");
    } else if (strcmp(mod, "atlat") == 0) {
        printf("Saldiri: saldirgan kontrolleri ES GECIP dogrudan kritik isleme atlar\n");
        printf("   [ATLANDI] hicbir kontrol noktasi calismadi\n");
    } else if (strcmp(mod, "kismi") == 0) {
        printf("Saldiri: yalniz ilk kontrol calisir (kismi atlama)\n");
        kontrol_noktasi(&a, 0, "butunluk");
    } else if (strcmp(mod, "sirasiz") == 0) {
        printf("Saldiri: kontroller YANLIS SIRADA calisir\n");
        kontrol_noktasi(&a, 2, "ortam");
        kontrol_noktasi(&a, 0, "butunluk");
        kontrol_noktasi(&a, 1, "anti-debug");
    }

    unsigned char sonuc[64] = {0};
    printf("\nKritik islem calisiyor (odeme onayi)...\n");
    int ok = kritik_islem(&a, paket, paket_boy, sonuc, sizeof(sonuc));
    if (ok) {
        printf("SONUC: ODEME ONAYLANDI -> \"%s\"\n", sonuc);
        printf("(zincir dogru: butun kontrollerden sirayla gecildi)\n");
    } else {
        unsigned char decoy[8];
        kripto_rastgele(decoy, 8);
        printf("SONUC: ODEME REDDEDILDI (zincir anahtari yanlis).\n");
        printf("Kritik islem gercek sonucu URETEMEDI; sahte (decoy) doner: %02x%02x...\n",
               decoy[0], decoy[1]);
        printf("(kontroller atlandi/sirasi bozuldu -> tek 'jmp' yamasi ise yaramaz)\n");
    }
    return ok ? 0 : 3;
}
