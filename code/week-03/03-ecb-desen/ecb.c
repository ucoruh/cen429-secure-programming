/*
 * CEN429 - Hafta 3 - Demo 3: ECB kipi deseni sizdirir ("ECB pengueni")
 *
 * ECB (Electronic Codebook) her 16 baytlik blogu digerlerinden
 * BAGIMSIZ sifreler. Ayni duz metin blogu HER ZAMAN ayni sifreli
 * blogu verir. Bu yuzden verideki tekrar eden desenler sifreli
 * metinde de gorunur kalir.
 *
 * Kucuk, iki renkli bir "resim" kuruyoruz: her PIKSEL tam bir 16
 * baytlik blok. Arka plan pikseli 16 x 0x00, sekil pikseli 16 x 0xFF.
 * Boylece butun arka plan bloklari birbirinin ayni, butun sekil
 * bloklari birbirinin ayni olur.
 *
 * ECB'de: ayni bloklar ayni sifreli blogu verir -> sekil OKUNUR kalir.
 * GCM'de (CTR tabanli): her blok konuma bagli farkli anahtar akisiyla
 * sifrelenir -> desen kaybolur (gurultu).
 *
 * Cikti ASCII olarak cizilir: her blok sifreli ilk baytina gore bir
 * karaktere indirgenir. ECB ciktisinda yalniz IKI ayri karakter olur.
 */
#include "cen429_demo.h"
#include "cen429_kripto.h"
#include <stdio.h>
#include <string.h>

#define GEN 32                 /* piksel (blok) genisligi */
#define YUK 16                 /* satir sayisi */
#define BLOK 16                /* bir piksel = 16 bayt */

/* 0 = arka plan, 1 = sekil. "429" rakamlari + cerceve. */
static const char *resim[YUK] = {
    "11111111111111111111111111111111",
    "10000000000000000000000000000001",
    "10011000011110000111100001100001",
    "10011000110011001100110011100001",
    "10011000000011000000110000100001",
    "10011000000110000011100000100001",
    "10011111001100000000110000100001",
    "10000001011000001100110011100001",
    "10000001111110000011100001100001",
    "10000000000000000000000000000001",
    "10111100011110000111100011110001",
    "10000100110011001100110000010001",
    "10001000000011000000110000100001",
    "10010000011100000111000001000001",
    "10111100111111000111100010000001",
    "11111111111111111111111111111111",
};

/* Her blogu sifreli ilk baytina gore bir karaktere indirger. */
static void ciz_sifreli(const char *baslik, const unsigned char *veri)
{
    static const char ramp[] = " .:-=+*#%@";
    printf("%s\n", baslik);
    for (int y = 0; y < YUK; y++) {
        printf("  ");
        for (int x = 0; x < GEN; x++) {
            const unsigned char *blok = veri + (y * GEN + x) * BLOK;
            putchar(ramp[blok[0] * 9 / 256]);
        }
        printf("\n");
    }
}

int main(void)
{
    demo_hazirla();
    unsigned char duz[GEN * YUK * BLOK];
    for (int y = 0; y < YUK; y++)
        for (int x = 0; x < GEN; x++) {
            unsigned char v = (resim[y][x] == '1') ? 0xFF : 0x00;
            memset(duz + (y * GEN + x) * BLOK, v, BLOK);
        }

    unsigned char anahtar[16];
    memset(anahtar, 0x11, sizeof(anahtar));

    /* ECB: her 16 baytlik blogu ayri ayri sifrele. */
    unsigned char ecb[GEN * YUK * BLOK];
    for (int i = 0; i < GEN * YUK; i++)
        kripto_aes_ecb_blok(anahtar, 16, duz + i * BLOK, ecb + i * BLOK);

    /* Iyi kip (GCM = CTR tabanli): butun resmi tek nonce ile sifrele. */
    unsigned char iyi[GEN * YUK * BLOK], tag[16], k32[32], nonce[12];
    memset(k32, 0x11, sizeof(k32));
    memset(nonce, 0, sizeof(nonce));
    kripto_gcm_sifrele(k32, nonce, 12, NULL, 0, duz, GEN * YUK * BLOK, iyi,
                       tag);

    printf("Orijinal resim (duz metin):\n");
    for (int y = 0; y < YUK; y++) {
        printf("  ");
        for (int x = 0; x < GEN; x++)
            putchar(resim[y][x] == '1' ? '#' : ' ');
        printf("\n");
    }
    printf("==============================================================\n");
    ciz_sifreli("AES-128-ECB ile sifreli (her blok ilk baytina gore):",
                ecb);
    printf("  ==> Sekil hala GORUNUYOR: ECB deseni sizdirir. KULLANMAYIN.\n");
    printf("==============================================================\n");
    ciz_sifreli("AES-256-GCM (CTR tabanli) ile sifreli, ayni resim:", iyi);
    printf("  ==> Desen kayboldu: GCM/CTR her blogu farkli sifreler.\n");
    return 0;
}
