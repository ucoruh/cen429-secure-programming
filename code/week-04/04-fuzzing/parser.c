/*
 * CEN429 - Week 4 - Demo 4: BUGGY document parser.
 *
 * Format:  [type][length][data...]   (a simple length-prefixed record)
 * If type == 0x42 ('B'): the second byte gives the length, then that many bytes are copied into a
 * local buffer. There are two classic bugs:
 *   1) data[1] is read without checking n>=2 (out-of-bounds read on a short input).
 *   2) length is checked against neither the remaining input nor the 16-byte destination
 *      (out-of-bounds read + stack buffer overflow).
 * These bugs trigger within seconds on random input — that is exactly the fuzzer's job.
 */
#include "parser.h"

int parse_document(const unsigned char *data, size_t n)
{
    if (n < 1)
        return 0;
    unsigned char type = data[0];
    if (type == 0x42) {
        unsigned char length = data[1];       /* BUG 1: n>=2 was never checked */
        unsigned char dest[16];
        for (unsigned i = 0; i < length; i++)
            dest[i] = data[2 + i];            /* BUG 2: out-of-bounds + overflow */
        return dest[0];
    }
    return 0;
}
