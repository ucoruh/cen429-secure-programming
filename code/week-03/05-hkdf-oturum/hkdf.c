/*
 * CEN429 - Hafta 3 - Demo 5: HKDF ile oturum anahtarlari ve ileri gizlilik
 *
 * Tek bir uzun omurlu "ana sir" (master secret) genelde dogrudan
 * kullanilmaz. Ondan, HKDF (RFC 5869) ile her amac/oturum icin AYRI
 * anahtarlar turetilir. HKDF iki asamalidir:
 *   - Extract: ana sir + tuz -> tekduze bir ara anahtar (PRK)
 *   - Expand : PRK + "info" etiketi -> istenen boyda anahtar
 * Farkli "info" etiketi -> baska bir anahtar. Bir anahtari bilmek
 * digerini ele vermez (tek yonluluk).
 *
 * Bu program iki sey gosterir:
 *   1) Ayni ana sirdan farkli info'larla FARKLI oturum anahtarlari.
 *   2) ILERI GIZLILIK (forward secrecy) zinciri: K0 = ana sir;
 *      Ki = HKDF(Ki-1). Her oturumda Ki kullanilir, sonra Ki-1 SILINIR.
 *      Saldirgan bugunku Kn'i ele gecirse bile, tek yonlu zincirden
 *      geriye gidip eski K1..Kn-1'i (ve o oturumlarin verisini) bulamaz.
 *
 * HKDF ortak baslikta HMAC ustune tasinabilir yazilmistir (RFC 5869).
 */
#include "cen429_demo.h"
#include "cen429_kripto.h"
#include <stdio.h>
#include <string.h>

#define ANAHTAR_BOYU 32

static void yaz_hex(const char *etiket, const unsigned char *b, int boy)
{
    printf("%s", etiket);
    for (int i = 0; i < boy; i++)
        printf("%02x", b[i]);
    printf("\n");
}

int main(void)
{
    demo_hazirla();
    unsigned char ana_sir[32];
    memset(ana_sir, 0x5a, sizeof(ana_sir));   /* sabit demo ana sir */
    unsigned char tuz[16];
    memset(tuz, 0x00, sizeof(tuz));

    printf("Tek ana sirdan amaca gore ayri anahtarlar:\n");
    printf("==============================================================\n");
    unsigned char k_sifre[ANAHTAR_BOYU], k_mac[ANAHTAR_BOYU];
    kripto_hkdf_sha256(ana_sir, 32, tuz, 16,
        (const unsigned char *)"cen429 sifreleme anahtari v1", 28,
        k_sifre, ANAHTAR_BOYU);
    kripto_hkdf_sha256(ana_sir, 32, tuz, 16,
        (const unsigned char *)"cen429 MAC anahtari v1", 22,
        k_mac, ANAHTAR_BOYU);
    yaz_hex("  info='...sifreleme...' -> ", k_sifre, ANAHTAR_BOYU);
    yaz_hex("  info='...MAC...'       -> ", k_mac, ANAHTAR_BOYU);
    printf("  ^ Ayni sir, farkli info -> farkli anahtar. Bir amac icin\n");
    printf("    uretilen anahtar baska amaca kullanilmaz.\n");

    printf("==============================================================\n");
    printf("ILERI GIZLILIK zinciri: Ki = HKDF(Ki-1), Ki-1 silinir\n");
    unsigned char k[ANAHTAR_BOYU];
    memcpy(k, ana_sir, ANAHTAR_BOYU);          /* K0 = ana sir */
    for (int i = 1; i <= 4; i++) {
        unsigned char yeni[ANAHTAR_BOYU];
        kripto_hkdf_sha256(k, ANAHTAR_BOYU, tuz, 16,
            (const unsigned char *)"zincir ilerleme", 15, yeni,
            ANAHTAR_BOYU);
        /* Eski anahtari guvenle sil, ilerle. */
        kripto_temizle(k, ANAHTAR_BOYU);
        memcpy(k, yeni, ANAHTAR_BOYU);
        kripto_temizle(yeni, ANAHTAR_BOYU);
        char et[32];
        snprintf(et, sizeof(et), "  K%d (oturum %d) = ", i, i);
        yaz_hex(et, k, 8);                       /* ilk 8 bayti yeter */
    }
    printf("  ^ Elimizde yalniz K4 var. Zincir TEK YONLU oldugu icin\n");
    printf("    K4'ten K3, K2, K1 geri hesaplanamaz: eski oturumlar\n");
    printf("    bugunku anahtar sizsa bile guvende kalir.\n");
    kripto_temizle(k, ANAHTAR_BOYU);
    return 0;
}
