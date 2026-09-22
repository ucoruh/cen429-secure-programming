/*
 * CEN429 - Hafta 4 - Demo 4: kucuk belge ayristiricisinin arayuzu.
 * Ayni arayuz hem hatali (ayristir.c) hem duzeltilmis (ayristir_guvenli.c)
 * surumde uygulanir; boylece reproducer (calis.c) ve fuzzer (fuzz.c) tek
 * kaynaktan iki surumu de test edebilir.
 *
 * Donus: >=0 ayristirma sonucu, <0 gecersiz/reddedilen girdi.
 */
#ifndef CEN429_AYRISTIR_H
#define CEN429_AYRISTIR_H

#include <stddef.h>

int belge_ayristir(const unsigned char *veri, size_t n);

#endif
