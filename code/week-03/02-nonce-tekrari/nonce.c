/*
 * CEN429 - Hafta 3 - Demo 2: Nonce (IV) yeniden kullaniminin tehlikesi
 *
 * AES-GCM gizliligi bir "sayac kipi" (CTR) akisiyla saglar: anahtardan
 * ve nonce'dan bir "anahtar akisi" (keystream) uretilir ve duz metinle
 * XOR'lanir:  C = P XOR AA(anahtar, nonce)
 *
 * AYNI anahtar + AYNI nonce ile iki farkli mesaj sifrelenirse iki
 * mesajda da AYNI anahtar akisi kullanilir. O zaman:
 *     C1 XOR C2 = (P1 XOR AA) XOR (P2 XOR AA) = P1 XOR P2
 * Anahtar akisi yok olur; saldirgan iki duz metnin XOR'unu ele
 * gecirir. Bir mesaji biliyorsa digerini tamamen cozer. (GCM'de nonce
 * tekrari ayrica kimlik dogrulamayi da tumden cokertir.)
 *
 * Program once AYNI nonce ile, sonra FARKLI nonce ile GCM sifreler ve
 * sifreli metinlerin XOR'unu duz metinlerin XOR'uyla karsilastirir.
 *
 * ONEMLI: Bu bir SALDIRI gosterimidir; nonce ASLA tekrar edilmemeli.
 */
#include "cen429_demo.h"
#include "cen429_kripto.h"
#include <stdio.h>
#include <string.h>

#define NONCE_BOYU 12

static void xor_diz(const unsigned char *a, const unsigned char *b,
                    unsigned char *cik, int boy)
{
    for (int i = 0; i < boy; i++)
        cik[i] = (unsigned char)(a[i] ^ b[i]);
}

static void yaz_hex(const char *etiket, const unsigned char *b, int boy)
{
    printf("%s", etiket);
    for (int i = 0; i < boy; i++)
        printf("%02x", b[i]);
    printf("\n");
}

static void yaz_metin(const char *etiket, const unsigned char *b, int boy)
{
    printf("%s\"", etiket);
    for (int i = 0; i < boy; i++)
        putchar((b[i] >= 32 && b[i] < 127) ? b[i] : '.');
    printf("\"\n");
}

int main(void)
{
    demo_hazirla();
    unsigned char anahtar[32];
    memset(anahtar, 0x2b, sizeof(anahtar));   /* sabit demo anahtari */

    const char *m1 = "Saldiri safagi 06:00'da baslasin!!";
    const char *m2 = "Toplam bakiye 45000 TL, sifre 1234";
    int boy = (int)strlen(m1);                 /* iki mesaj esit boyda */

    unsigned char p1[64], p2[64], c1[80], c2[80], tag[16];
    unsigned char pxor[64], cxor[64];
    memcpy(p1, m1, boy);
    memcpy(p2, m2, boy);
    xor_diz(p1, p2, pxor, boy);

    printf("Duz metin 1: \"%s\"\n", m1);
    printf("Duz metin 2: \"%s\"\n", m2);
    printf("==============================================================\n");

    /* --- KOTU: ayni nonce iki mesajda da --- */
    unsigned char iv_ayni[NONCE_BOYU];
    memset(iv_ayni, 0x00, NONCE_BOYU);
    kripto_gcm_sifrele(anahtar, iv_ayni, NONCE_BOYU, NULL, 0, p1,
                       (size_t)boy, c1, tag);
    kripto_gcm_sifrele(anahtar, iv_ayni, NONCE_BOYU, NULL, 0, p2,
                       (size_t)boy, c2, tag);
    xor_diz(c1, c2, cxor, boy);

    printf("KOTU DURUM - iki mesajda da AYNI nonce:\n");
    yaz_hex("  C1        = ", c1, boy);
    yaz_hex("  C2        = ", c2, boy);
    yaz_hex("  C1 xor C2 = ", cxor, boy);
    yaz_hex("  P1 xor P2 = ", pxor, boy);
    if (memcmp(cxor, pxor, boy) == 0)
        printf("  ==> C1 xor C2 == P1 xor P2 : anahtar akisi SIZDI!\n");
    else
        printf("  ==> esit degil\n");

    /* Saldirgan P1'i biliyorsa: P2 = (C1 xor C2) xor P1. */
    unsigned char p2_bulunan[64];
    xor_diz(cxor, p1, p2_bulunan, boy);
    yaz_metin("  Saldirgan P1'i biliyorsa P2 = (C1 xor C2) xor P1 = ",
              p2_bulunan, boy);

    printf("==============================================================\n");

    /* --- IYI: her mesaja farkli nonce --- */
    unsigned char iv_a[NONCE_BOYU], iv_b[NONCE_BOYU];
    memset(iv_a, 0x00, NONCE_BOYU);
    memset(iv_b, 0x00, NONCE_BOYU);
    iv_b[NONCE_BOYU - 1] = 0x01;                /* farkli nonce */
    kripto_gcm_sifrele(anahtar, iv_a, NONCE_BOYU, NULL, 0, p1,
                       (size_t)boy, c1, tag);
    kripto_gcm_sifrele(anahtar, iv_b, NONCE_BOYU, NULL, 0, p2,
                       (size_t)boy, c2, tag);
    xor_diz(c1, c2, cxor, boy);

    printf("IYI DURUM - her mesaja FARKLI nonce:\n");
    yaz_hex("  C1 xor C2 = ", cxor, boy);
    yaz_hex("  P1 xor P2 = ", pxor, boy);
    if (memcmp(cxor, pxor, boy) == 0)
        printf("  ==> hala sizdi (olmamali)\n");
    else
        printf("  ==> C1 xor C2 != P1 xor P2 : sizinti YOK.\n");

    return 0;
}
