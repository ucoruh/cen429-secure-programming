/*
 * CEN429 - Week 4 - Demo 4: FIXED document parser.
 *
 * Principle: never trust external input (Recipe 3.1). Before every access, check BOTH the
 * remaining input length AND the destination buffer's bound.
 */
#include "parser.h"
#include <string.h>

int parse_document(const unsigned char *data, size_t n)
{
    if (n < 2)
        return 0;                          /* need at least 2 bytes for type + length */
    unsigned char type = data[0];
    if (type == 0x42) {
        size_t length = data[1];
        unsigned char dest[16];
        if (length > sizeof(dest))         /* destination bound check */
            return -1;
        if ((size_t)2 + length > n)        /* input bound check */
            return -1;
        memcpy(dest, data + 2, length);
        return length > 0 ? dest[0] : 0;
    }
    return 0;
}
