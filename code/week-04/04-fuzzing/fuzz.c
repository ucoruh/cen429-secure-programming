/*
 * CEN429 - Hafta 4 - Demo 4: libFuzzer giris noktasi.
 * libFuzzer main()'i kendisi saglar; biz yalnizca "tek bir girdiyi test et"
 * islevini yaziyoruz. Fuzzer, kod kapsamini olcup girdiyi otomatik mutasyona
 * ugratarak cokerten girdiyi saniyeler icinde bulur.
 *
 * Derleme: clang -fsanitize=fuzzer,address (Linux) / cl /fsanitize=fuzzer
 * (MSVC). Calistirma her zaman SURE SINIRLIDIR (-max_total_time), boylece
 * demo takilmaz.
 */
#include <stddef.h>
#include <stdint.h>
#include "ayristir.h"

int LLVMFuzzerTestOneInput(const uint8_t *veri, size_t boy)
{
    belge_ayristir((const unsigned char *)veri, boy);
    return 0;
}
