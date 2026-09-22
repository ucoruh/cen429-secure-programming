/*
 * CEN429 - Hafta 3 - Demo 4: Paroladan anahtar turetme (PBKDF2)
 *
 * Parola dogrudan anahtar olamaz: kisa, tahmin edilebilir ve dusuk
 * entropilidir. Paroladan anahtar turetme fonksiyonu (KDF) iki isi
 * yapar:
 *   1) TUZ (salt): her kullaniciya rastgele tuz eklenir; ayni parola
 *      farkli tuzlarla farkli anahtar verir. Boylece onceden
 *      hesaplanmis tablolar (rainbow table) ise yaramaz.
 *   2) YAVASLIK: KDF bilerek yuzbinlerce tur calisir; bir parolayi
 *      denemek pahali olur, kaba kuvvet yavaslar.
 *
 * Bu program:
 *   - Ayni parola + AYNI tuz -> AYNI anahtar (tabloya aciklik).
 *   - Ayni parola + FARKLI tuz -> FARKLI anahtar (tuzun degeri).
 *   - Tur sayisi arttikca gecen SURE artar (maliyet ayari).
 *
 * PBKDF2 uyumluluk/FIPS icin hala kullanilir; yeni sistemlerde
 * OWASP birinci tercih olarak Argon2id onerir (demo.sh karsilastirma).
 */
#include "cen429_demo.h"
#include "cen429_kripto.h"
#include <stdio.h>
#include <string.h>

#ifdef _WIN32
#include <windows.h>
static double simdi_ms(void)
{
    LARGE_INTEGER f, t;
    QueryPerformanceFrequency(&f);
    QueryPerformanceCounter(&t);
    return (double)t.QuadPart * 1000.0 / (double)f.QuadPart;
}
#else
#include <time.h>
static double simdi_ms(void)
{
    struct timespec t;
    clock_gettime(CLOCK_MONOTONIC, &t);
    return t.tv_sec * 1000.0 + t.tv_nsec / 1e6;
}
#endif

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
    const char *parola = "kopek123";       /* zayif ornek parola */
    unsigned char tuz_a[16], tuz_b[16], anahtar[ANAHTAR_BOYU];

    memset(tuz_a, 0xA1, sizeof(tuz_a));
    memset(tuz_b, 0xB2, sizeof(tuz_b));

    printf("Parola: \"%s\"\n", parola);
    printf("==============================================================\n");
    printf("1) TUZUN ONEMI (tur = 100000)\n");
    kripto_pbkdf2_sha256((const unsigned char *)parola, strlen(parola),
                         tuz_a, sizeof(tuz_a), 100000, anahtar, ANAHTAR_BOYU);
    yaz_hex("   tuz A -> anahtar = ", anahtar, ANAHTAR_BOYU);
    kripto_pbkdf2_sha256((const unsigned char *)parola, strlen(parola),
                         tuz_a, sizeof(tuz_a), 100000, anahtar, ANAHTAR_BOYU);
    yaz_hex("   tuz A -> anahtar = ", anahtar, ANAHTAR_BOYU);
    printf("   ^ Ayni parola + AYNI tuz -> AYNI anahtar (tablo ile "
           "aranabilir)\n");
    kripto_pbkdf2_sha256((const unsigned char *)parola, strlen(parola),
                         tuz_b, sizeof(tuz_b), 100000, anahtar, ANAHTAR_BOYU);
    yaz_hex("   tuz B -> anahtar = ", anahtar, ANAHTAR_BOYU);
    printf("   ^ Ayni parola + FARKLI tuz -> FARKLI anahtar (tuz korur)\n");

    printf("==============================================================\n");
    printf("2) TUR SAYISI vs SURE (ayni parola, ayni tuz)\n");
    uint32_t turlar[] = { 1000, 10000, 100000, 600000, 2000000 };
    for (unsigned i = 0; i < sizeof(turlar) / sizeof(turlar[0]); i++) {
        double t0 = simdi_ms();
        kripto_pbkdf2_sha256((const unsigned char *)parola, strlen(parola),
                             tuz_a, sizeof(tuz_a), turlar[i], anahtar,
                             ANAHTAR_BOYU);
        double ms = simdi_ms() - t0;
        printf("   tur = %8u  ->  %8.2f ms\n", turlar[i], ms);
    }
    printf("   ^ Tur artikca her parola denemesi pahalilasir.\n");
    printf("   OWASP 2023: PBKDF2-HMAC-SHA256 icin >= 600000 tur;\n");
    printf("   mumkunse Argon2id tercih edilir (bellek de maliyet olur).\n");
    return 0;
}
