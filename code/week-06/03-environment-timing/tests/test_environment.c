/* Unit tests for week-06/03-environment-timing/environment.c.
 *
 * hypervisor_bit(), vendor_signature() and vendor_is_blank() are pure functions of their
 * arguments (no CPUID call, no file/clock access), so every expected value below is a literal,
 * hand-picked independently of the function under test.
 */
#define main program_main
#include "../environment.c"
#undef main
#include "../../../common/test_check.h"

/* Builds a little-endian-style register value from 4 explicit bytes, the inverse of
 * vendor_signature()'s own byte extraction -- used only to construct test INPUT, never to check
 * its output. */
static unsigned int reg(unsigned char b0, unsigned char b1, unsigned char b2, unsigned char b3)
{
    return (unsigned int)b0 | ((unsigned int)b1 << 8) | ((unsigned int)b2 << 16) | ((unsigned int)b3 << 24);
}

int main(void)
{
    /* --- hypervisor_bit(): boundary values of ECX bit 31 ------------------------------------ */
    CHECK_EQ_INT(hypervisor_bit(0x00000000u), 0);   /* bare metal: bit clear */
    CHECK_EQ_INT(hypervisor_bit(0x7FFFFFFFu), 0);   /* every other bit set, bit 31 clear */
    CHECK_EQ_INT(hypervisor_bit(0x80000000u), 1);   /* only bit 31 set */
    CHECK_EQ_INT(hypervisor_bit(0xFFFFFFFFu), 1);   /* all bits set */
    CHECK_EQ_INT(hypervisor_bit(0x80000001u), 1);   /* bit 31 plus bit 0 */

    /* --- vendor_signature(): known vendor string "KVMKVMKVM" + 3 zero-byte padding ---------- */
    {
        unsigned int ebx = reg('K', 'V', 'M', 'K');
        unsigned int ecx = reg('V', 'M', 'K', 'V');
        unsigned int edx = reg('M', 0, 0, 0);
        char out[13];
        vendor_signature(ebx, ecx, edx, out);
        CHECK_MEM(out, "KVMKVMKVM\0\0\0", 13);       /* full 12 bytes + the function's own NUL */
        CHECK_EQ_STR(out, "KVMKVMKVM");               /* %s printing stops at the first NUL, as main() uses it */
    }

    /* --- vendor_signature(): all-zero registers -> 12 zero bytes (blank, not sanitized) ------ */
    {
        char out[13];
        vendor_signature(0, 0, 0, out);
        unsigned char zeros[13] = {0};
        CHECK_MEM(out, zeros, 13);
    }

    /* --- vendor_signature(): non-printable/printable boundary sanitization ------------------- */
    {
        /* byte 0x01 (control, < 32) -> '.' */
        char out[13];
        vendor_signature(reg(0x01, 'A', 'A', 'A'), reg('A', 'A', 'A', 'A'), reg('A', 'A', 'A', 'A'), out);
        CHECK_EQ_INT(out[0], '.');
    }
    {
        /* byte 0x1F (31, still < 32) -> '.' : upper edge of the control range */
        char out[13];
        vendor_signature(reg(0x1F, 'A', 'A', 'A'), reg('A', 'A', 'A', 'A'), reg('A', 'A', 'A', 'A'), out);
        CHECK_EQ_INT(out[0], '.');
    }
    {
        /* byte 0x20 (32, space) -> kept as-is: lower edge of the printable range */
        char out[13];
        vendor_signature(reg(0x20, 'A', 'A', 'A'), reg('A', 'A', 'A', 'A'), reg('A', 'A', 'A', 'A'), out);
        CHECK_EQ_INT(out[0], ' ');
    }
    {
        /* byte 0x7E ('~', 126) -> kept as-is: upper edge of the printable range */
        char out[13];
        vendor_signature(reg(0x7E, 'A', 'A', 'A'), reg('A', 'A', 'A', 'A'), reg('A', 'A', 'A', 'A'), out);
        CHECK_EQ_INT(out[0], '~');
    }
    {
        /* byte 0x7F (127, DEL) -> '.' : just past the printable range */
        char out[13];
        vendor_signature(reg(0x7F, 'A', 'A', 'A'), reg('A', 'A', 'A', 'A'), reg('A', 'A', 'A', 'A'), out);
        CHECK_EQ_INT(out[0], '.');
    }
    {
        /* byte 0xFF (255, well past printable) -> '.' */
        char out[13];
        vendor_signature(reg(0xFF, 'A', 'A', 'A'), reg('A', 'A', 'A', 'A'), reg('A', 'A', 'A', 'A'), out);
        CHECK_EQ_INT(out[0], '.');
    }
    {
        /* zero byte in the middle is left as a real NUL (padding), not sanitized to '.' */
        char out[13];
        vendor_signature(reg('K', 'V', 'M', 0), reg(0, 0, 0, 0), reg(0, 0, 0, 0), out);
        CHECK_EQ_INT(out[3], 0);
        CHECK_EQ_INT(out[4], 0);
        CHECK_EQ_STR(out, "KVM");
    }

    /* --- vendor_is_blank(): all-zero vs. a real signature ------------------------------------ */
    {
        char zero_out[13];
        vendor_signature(0, 0, 0, zero_out);
        CHECK(vendor_is_blank(zero_out));
    }
    {
        char kvm_out[13];
        vendor_signature(reg('K', 'V', 'M', 'K'), reg('V', 'M', 'K', 'V'), reg('M', 0, 0, 0), kvm_out);
        CHECK(!vendor_is_blank(kvm_out));
    }
    {
        /* one non-zero byte among eleven zero bytes is still "not blank". */
        char almost_zero[12] = {0};
        almost_zero[11] = 1;
        CHECK(!vendor_is_blank(almost_zero));
    }

    TEST_SUMMARY();
}
