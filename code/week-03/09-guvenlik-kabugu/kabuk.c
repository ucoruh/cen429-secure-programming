/*
 * CEN429 - Hafta 3 - Demo 9: Guvenlik kabuklari (katmanli veri korumasi)
 *
 * Derinlemesine savunmanin somut hali: bir sirri (odeme anahtari) TEK
 * bir korumaya birakmak yerine, ic ice gecmis KABUKLARLA sararsiniz.
 * Saldirganin sirra ulasmasi icin butun kabuklari SIRAYLA acmasi gerekir.
 *
 * Bu demo bir anahtari dort kabukla sarar (en ic -> en dis):
 *   Kabuk 1 - Cihaz baglama: anahtar, cihaz parmak izinden HKDF ile
 *             turetilen bir anahtarla AES-GCM'lenir. Baska cihazda
 *             (farkli parmak izi) acilamaz.
 *   Kabuk 2 - Depolama (beklemede): cuzdan anahtariyla AES-GCM.
 *   Kabuk 3 - Oturum (uygulama katmani): oturum anahtariyla AES-GCM.
 *   Kabuk 4 - Kanal (TLS benzeri): kanal anahtariyla AES-GCM.
 *
 * Sarma disaridan ice, ACMA icten disa yapilir. Herhangi bir kabugun
 * anahtari yanlissa ya da veri kurcalanmissa GCM etiketi tutmaz ve
 * acma o katmanda REDDEDILIR. "Yanlis cihaz" senaryosu Kabuk 1'i
 * kirilmaz kilar.
 *
 * Bu bir OGRETIM benzetimidir; gercek urunlerde ic kabuk cogu zaman
 * whitebox kripto olur (Hafta 11). Butun degerler sentetiktir.
 */
#include "cen429_demo.h"
#include "cen429_kripto.h"
#include <stdio.h>
#include <string.h>

#define NONCE_BOYU 12
#define ETIKET_BOYU 16
#define ANAHTAR_BOYU 32

/* Bir GCM kabugu: [nonce|sifreli|etiket]. Donen: cikti uzunlugu. */
static int sar(const unsigned char *k, const unsigned char *duz,
               int duz_boy, unsigned char *cik)
{
    unsigned char nonce[NONCE_BOYU], tag[ETIKET_BOYU];
    kripto_rastgele(nonce, NONCE_BOYU);
    memcpy(cik, nonce, NONCE_BOYU);
    kripto_gcm_sifrele(k, nonce, NONCE_BOYU, NULL, 0, duz, (size_t)duz_boy,
                       cik + NONCE_BOYU, tag);
    memcpy(cik + NONCE_BOYU + duz_boy, tag, ETIKET_BOYU);
    return NONCE_BOYU + duz_boy + ETIKET_BOYU;
}

/* Bir GCM kabugunu acar. Donen: duz uzunlugu, dogrulama basarisizsa -1. */
static int ac(const unsigned char *k, const unsigned char *ver, int boy,
              unsigned char *duz)
{
    if (boy < NONCE_BOYU + ETIKET_BOYU)
        return -1;
    int sc = boy - NONCE_BOYU - ETIKET_BOYU;
    const unsigned char *nonce = ver;
    const unsigned char *ct = ver + NONCE_BOYU;
    const unsigned char *tag = ver + NONCE_BOYU + sc;
    if (!kripto_gcm_coz(k, nonce, NONCE_BOYU, NULL, 0, ct, (size_t)sc, tag,
                        duz))
        return -1;
    return sc;
}

/* Cihaz parmak izinden HKDF ile Kabuk-1 anahtarini turetir. */
static void cihaz_anahtari(const char *parmak_izi, unsigned char *k)
{
    unsigned char tuz[8] = { 'c', 'e', 'n', '4', '2', '9', 'k', '1' };
    kripto_hkdf_sha256((const unsigned char *)parmak_izi,
                       strlen(parmak_izi), tuz, sizeof(tuz),
                       (const unsigned char *)"cihaz baglama", 13, k,
                       ANAHTAR_BOYU);
}

int main(void)
{
    demo_hazirla();
    /* Korunacak sir (sentetik odeme anahtari). */
    unsigned char sir[16] = {
        0xDE, 0xAD, 0xBE, 0xEF, 0x01, 0x23, 0x45, 0x67,
        0x89, 0xAB, 0xCD, 0xEF, 0xFE, 0xDC, 0xBA, 0x98 };

    unsigned char k_cihaz[ANAHTAR_BOYU];
    unsigned char k_cuzdan[ANAHTAR_BOYU], k_oturum[ANAHTAR_BOYU];
    unsigned char k_kanal[ANAHTAR_BOYU];
    cihaz_anahtari("uretici=RTEU;model=DEMO;seri=SN-0001", k_cihaz);
    memset(k_cuzdan, 0x11, ANAHTAR_BOYU);
    memset(k_oturum, 0x22, ANAHTAR_BOYU);
    memset(k_kanal, 0x33, ANAHTAR_BOYU);

    unsigned char t1[128], t2[192], t3[256], t4[320];
    int n1, n2, n3, n4;

    printf("SIR (16 bayt): ");
    for (int i = 0; i < 16; i++) printf("%02x", sir[i]);
    printf("\n==============================================================\n");
    printf("SARMA (dis dunyaya dogru): sir -> K1 -> K2 -> K3 -> K4\n");
    n1 = sar(k_cihaz, sir, 16, t1);
    printf("  Kabuk 1 (cihaz baglama)     : %3d bayt\n", n1);
    n2 = sar(k_cuzdan, t1, n1, t2);
    printf("  Kabuk 2 (depolama/cuzdan)   : %3d bayt\n", n2);
    n3 = sar(k_oturum, t2, n2, t3);
    printf("  Kabuk 3 (oturum/uygulama)   : %3d bayt\n", n3);
    n4 = sar(k_kanal, t3, n3, t4);
    printf("  Kabuk 4 (kanal/TLS benzeri) : %3d bayt  <- aktarilan paket\n",
           n4);

    printf("==============================================================\n");
    printf("ACMA (ice dogru): K4 -> K3 -> K2 -> K1 -> sir\n");
    unsigned char a3[256], a2[192], a1[128], acik[64];
    int m;
    m = ac(k_kanal, t4, n4, a3);
    printf("  Kabuk 4 acildi: %s\n", m > 0 ? "TAMAM" : "RED");
    m = ac(k_oturum, a3, m, a2);
    printf("  Kabuk 3 acildi: %s\n", m > 0 ? "TAMAM" : "RED");
    m = ac(k_cuzdan, a2, m, a1);
    printf("  Kabuk 2 acildi: %s\n", m > 0 ? "TAMAM" : "RED");
    m = ac(k_cihaz, a1, m, acik);
    printf("  Kabuk 1 acildi: %s\n", m > 0 ? "TAMAM" : "RED");
    printf("  Cozulen SIR : ");
    for (int i = 0; i < m; i++) printf("%02x", acik[i]);
    printf("  -> %s\n", (m == 16 && memcmp(acik, sir, 16) == 0)
           ? "sir DOGRU" : "HATA");

    printf("==============================================================\n");
    printf("SALDIRI 1 - Paketin bir biti kurcalanirsa (Kabuk 4):\n");
    unsigned char bozuk[320];
    memcpy(bozuk, t4, n4);
    bozuk[NONCE_BOYU + 3] ^= 0x01;
    m = ac(k_kanal, bozuk, n4, a3);
    printf("  Kabuk 4 acildi: %s  (GCM etiketi tutmadi)\n",
           m > 0 ? "TAMAM" : "RED");

    printf("==============================================================\n");
    printf("SALDIRI 2 - Paket BASKA cihaza kopyalanirsa (yanlis parmak "
           "izi):\n");
    unsigned char k_baska[ANAHTAR_BOYU];
    cihaz_anahtari("uretici=RTEU;model=DEMO;seri=SN-9999", k_baska);
    /* Dis uc kabuk acilir (anahtarlar tasinabilir), ic kabuk cihaza bagli. */
    int mm = ac(k_kanal, t4, n4, a3);
    mm = ac(k_oturum, a3, mm, a2);
    mm = ac(k_cuzdan, a2, mm, a1);
    printf("  Dis 3 kabuk acildi: %s\n", mm > 0 ? "TAMAM" : "RED");
    int son = ac(k_baska, a1, mm, acik);
    printf("  Kabuk 1 (cihaz baglama) BASKA cihazda acildi: %s\n",
           son > 0 ? "TAMAM" : "RED");
    printf("  ^ Anahtarlar kopyalansa bile sir baska cihazda ACILAMAZ.\n");

    kripto_temizle(acik, sizeof(acik));
    kripto_temizle(k_cihaz, sizeof(k_cihaz));
    return 0;
}
