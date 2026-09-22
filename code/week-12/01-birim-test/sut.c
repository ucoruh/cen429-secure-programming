/*
 * CEN429 - Hafta 12 - Demo 1: Sinanan kod (System Under Test).
 * Iki kucuk guvenlik fonksiyonu; birim testleri bunlari dogrular.
 * GUVENLIK: saf hesap; dosya/ag/sistem islemi yok.
 */
#include <string.h>
#include "sut.h"

/* Beyaz liste ile girdi dogrulama: yalniz harf/rakam/alt cizgi, 1..32 uzunluk. */
int girdi_dogrula(const char *s)
{
    size_t n = strlen(s);
    if (n == 0 || n > 32) return 0;
    for (size_t i = 0; i < n; i++) {
        char c = s[i];
        int ok = (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') ||
                 (c >= '0' && c <= '9') || c == '_';
        if (!ok) return 0;
    }
    return 1;
}

/* Tamsayi tasmasini ONCEDEN yakalayan guvenli toplama (INT32-C). */
int guvenli_topla(int a, int b, int *sonuc)
{
#if defined(__GNUC__) || defined(__clang__)
    return !__builtin_add_overflow(a, b, sonuc);   /* tasarsa 0 doner */
#else
    if ((b > 0 && a > 2147483647 - b) || (b < 0 && a < (-2147483647 - 1) - b)) return 0;
    *sonuc = a + b; return 1;
#endif
}
