/* Unit tests for week-11/02-embedded-key/embedded_key.c.
 *
 * search_bytes() and key_checksum() are pure and safe to call in-process. Every expected value is
 * computed independently, by hand: search offsets are counted by hand in the literal haystack
 * strings below, and the checksum is re-summed from the KEY bytes spelled out again in this file
 * (not by reading the module's KEY[] array back), so a bug in the module cannot also corrupt the
 * expected value.
 */
#define main program_main
#include "../embedded_key.c"
#undef main
#include "../../../common/test_check.h"

int main(void)
{
    /* --- normal: needle found in the middle of a longer haystack --------------------------- */
    {
        const unsigned char h[] = "the-quick-brown-fox-jumps";     /* 25 bytes + NUL, index 0..25 */
        const unsigned char n[] = "brown";
        CHECK_EQ_INT(search_bytes(h, 25, n, 5), 10);                /* "brown" starts at index 10 */
    }

    /* --- boundary: needle at the very start -------------------------------------------------- */
    {
        const unsigned char h[] = "ABCDEF";
        const unsigned char n[] = "ABC";
        CHECK_EQ_INT(search_bytes(h, 6, n, 3), 0);
    }

    /* --- boundary: needle at the very end ---------------------------------------------------- */
    {
        const unsigned char h[] = "ABCDEF";
        const unsigned char n[] = "DEF";
        CHECK_EQ_INT(search_bytes(h, 6, n, 3), 3);
    }

    /* --- boundary: needle == whole haystack -------------------------------------------------- */
    {
        const unsigned char h[] = "ABCDEF";
        CHECK_EQ_INT(search_bytes(h, 6, h, 6), 0);
    }

    /* --- normal: not found -------------------------------------------------------------------- */
    {
        const unsigned char h[] = "ABCDEF";
        const unsigned char n[] = "XYZ";
        CHECK_EQ_INT(search_bytes(h, 6, n, 3), -1);
    }

    /* --- too long: needle longer than haystack -> -1 ------------------------------------------ */
    {
        const unsigned char h[] = "AB";
        const unsigned char n[] = "ABCDEF";
        CHECK_EQ_INT(search_bytes(h, 2, n, 6), -1);
    }

    /* --- edge: empty haystack (hn = 0) -> -1 --------------------------------------------------- */
    {
        const unsigned char n[] = "A";
        CHECK_EQ_INT(search_bytes(n /* unused as haystack content */, 0, n, 1), -1);
    }

    /* --- edge: empty needle (nn = 0) -> -1 (the degenerate case search_bytes() guards against) - */
    {
        const unsigned char h[] = "ABCDEF";
        CHECK_EQ_INT(search_bytes(h, 6, h, 0), -1);
    }

    /* --- invalid: negative needle length -> -1 -------------------------------------------------- */
    {
        const unsigned char h[] = "ABCDEF";
        CHECK_EQ_INT(search_bytes(h, 6, h, -3), -1);
    }

    /* --- repeated pattern: search_bytes() must return the FIRST match, not a later one --------- */
    {
        const unsigned char h[] = "ababab";
        const unsigned char n[] = "ab";
        CHECK_EQ_INT(search_bytes(h, 6, n, 2), 0);
    }

    /* --- the real 16-byte KEY, found inside a larger synthetic buffer (mirrors the real scan) -- */
    {
        unsigned char buf[40];
        for (int i = 0; i < 40; i++) buf[i] = (unsigned char)(0x11 * i);   /* filler, not KEY-like */
        memcpy(buf + 12, KEY, 16);                                         /* plant KEY at offset 12 */
        CHECK_EQ_INT(search_bytes(buf, 40, KEY, 16), 12);
    }

    /* --- key_checksum(): re-summed by hand from the 16 KEY bytes, spelled out again here -------
       0xC3+0x9A+0x71+0x2E+0x55+0xF0+0x18+0xBD+0x4C+0xA6+0x37+0xE9+0x02+0x8F+0xD1+0x64
       = 195+154+113+46+85+240+24+189+76+166+55+233+2+143+209+100 = 2030; 2030 mod 256 = 238 = 0xEE */
    CHECK_EQ_INT(key_checksum(), 0xEE);

    TEST_SUMMARY();
}
