/*
 * CEN429 — Hafta 2 — Demo 1: "Kapsül" biçimi (ortak başlık)
 *
 * KAPSÜL, bu demo için uydurulmuş ZARARSIZ bir veri biçimidir. Hiçbir işletim
 * sistemi onu çalıştıramaz; yalnız bizim tarayıcımız onu okur. Gerçek
 * şifreli/polimorfik virüslerin yapısını taklit eder:
 *
 *   1. satır : "KAPSUL/1"                       (sihirli başlık)
 *   2. satır : komutlar — ya "GOVDE ..." (düz gövde) ya da bir "çözücü"
 *   geri kalan: gövde baytları (düz ya da şifreli)
 *
 * Çözücü komutları (oyuncak bir komut kümesi):
 *   COZUCU:        yalnız etiket, bir şey yapmaz
 *   BOS            hiçbir şey yapmaz (çöp komut)
 *   ALGO=xs32      XOR + xorshift32 anahtar akışı
 *   ALGO=lcg8      toplama + doğrusal eşlik üreteci (LCG) anahtar akışı
 *   TOHUM=<hex>    anahtar akışının başlangıç değeri
 *   UZUNLUK=<n>    çözülecek gövde uzunluğu
 *   COZ            gövdeyi çöz
 *
 * Bu anahtar akışları KRİPTOGRAFİK DEĞİLDİR; yalnız "aynı içerik, her kopyada
 * farklı baytlar" fikrini göstermek için kullanılır.
 */
#ifndef KAPSUL_H
#define KAPSUL_H

#include <stddef.h>
#include <stdint.h>

#define KAPSUL_SIHIR "KAPSUL/1\n"

/* xorshift32: şifreleme ve çözme aynı işlemdir (XOR) */
static inline void xs32_uygula(unsigned char *b, size_t n, uint32_t tohum)
{
    uint32_t s = tohum ? tohum : 0x9e3779b9u;
    for (size_t i = 0; i < n; i++) {
        s ^= s << 13;
        s ^= s >> 17;
        s ^= s << 5;
        b[i] ^= (unsigned char)(s & 0xffu);
    }
}

/* lcg8: şifrelerken anahtar baytı eklenir, çözerken çıkarılır */
static inline void lcg8_uygula(unsigned char *b, size_t n, uint32_t tohum,
                               int sifrele)
{
    uint32_t s = tohum;
    for (size_t i = 0; i < n; i++) {
        s = s * 1664525u + 1013904223u;
        unsigned char k = (unsigned char)(s >> 24);
        b[i] = sifrele ? (unsigned char)(b[i] + k) : (unsigned char)(b[i] - k);
    }
}

#endif
