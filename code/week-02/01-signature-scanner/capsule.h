/*
 * CEN429 — Week 2 — Demo 1: the "capsule" format (shared header)
 *
 * CAPSULE is a HARMLESS data format made up for this demo. No operating system
 * can run it; only our own scanner reads it. It imitates the structure of a real
 * encrypted/polymorphic virus:
 *
 *   line 1  : "CAPSULE/1"                       (magic header)
 *   line 2  : commands — either "BODY ..." (plain body) or a "decoder"
 *   the rest: body bytes (plain or encrypted)
 *
 * Decoder commands (a toy instruction set):
 *   DECODER:       just a label, does nothing
 *   NOP            does nothing (a junk instruction)
 *   ALGO=xs32      XOR + xorshift32 keystream
 *   ALGO=lcg8      addition + linear congruential generator (LCG) keystream
 *   SEED=<hex>     the keystream's starting value
 *   LEN=<n>        the length of the body to decode
 *   DECODE         decode the body
 *
 * These keystreams are NOT CRYPTOGRAPHIC; they only illustrate the idea of
 * "the same content, different bytes in every copy."
 */
#ifndef CAPSULE_H
#define CAPSULE_H

#include <stddef.h>
#include <stdint.h>

#define CAPSULE_MAGIC "CAPSULE/1\n"

/* xorshift32: encryption and decryption are the same operation (XOR) */
static inline void xs32_apply(unsigned char *b, size_t n, uint32_t seed)
{
    uint32_t s = seed ? seed : 0x9e3779b9u;
    for (size_t i = 0; i < n; i++) {
        s ^= s << 13;
        s ^= s >> 17;
        s ^= s << 5;
        b[i] ^= (unsigned char)(s & 0xffu);
    }
}

/* lcg8: the key byte is added while encrypting, subtracted while decoding */
static inline void lcg8_apply(unsigned char *b, size_t n, uint32_t seed,
                              int encrypt)
{
    uint32_t s = seed;
    for (size_t i = 0; i < n; i++) {
        s = s * 1664525u + 1013904223u;
        unsigned char k = (unsigned char)(s >> 24);
        b[i] = encrypt ? (unsigned char)(b[i] + k) : (unsigned char)(b[i] - k);
    }
}

#endif
