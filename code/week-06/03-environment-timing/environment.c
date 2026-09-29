/*
 * CEN429 - Week 6 - Demo 3: Environment detection (virtual machine / emulator) + timing
 *
 * The desktop/portable counterpart of mobile RASP's "environment detection" step. Analysis is
 * often done inside a VIRTUAL MACHINE or EMULATOR; the application tries to sense that from clues.
 * Two portable, SAFE techniques here:
 *
 *  (A) CPUID hypervisor bit + hypervisor vendor signature
 *      - CPUID leaf 1, ECX bit 31: "hypervisor present". 0 on bare metal.
 *      - CPUID leaf 0x40000000: the hypervisor returns a 12-character signature
 *        ("KVMKVMKVM", "VMwareVMware", "Microsoft Hv", "VBoxVBoxVBox"...).
 *      Just a CPU instruction; changes nothing, no network/file access.
 *
 *  (B) Timing - informational only
 *      A small operation is timed twice; single-stepping in a debugger or heavy emulation causes
 *      a large slowdown. The threshold varies by machine, so this only MEASURES and reports, it
 *      never decides on its own.
 *
 * IMPORTANT lesson: WSL2, Hyper-V and virtualization-based security (VBS) make most modern
 * Windows laptops say "a hypervisor is present" too. So the hypervisor bit ALONE does NOT mean
 * "analysis environment" - it is a weak signal. Root/emulator detection always weighs multiple
 * indicators and accepts that each one can be evaded.
 */
#include "cen429_demo.h"
#include <stdio.h>
#include <string.h>
#include <stdint.h>

#if defined(_WIN32)
#include <windows.h>
#include <intrin.h>
static void cpuid(int leaf, unsigned int reg[4])
{
    int r[4];
    __cpuid(r, leaf);
    reg[0] = (unsigned)r[0]; reg[1] = (unsigned)r[1];
    reg[2] = (unsigned)r[2]; reg[3] = (unsigned)r[3];
}
static double now_seconds(void)
{
    LARGE_INTEGER f, t;
    QueryPerformanceFrequency(&f);
    QueryPerformanceCounter(&t);
    return (double)t.QuadPart / (double)f.QuadPart;
}
#else
#include <cpuid.h>
#include <time.h>
static void cpuid(int leaf, unsigned int reg[4])
{
    unsigned int a = 0, b = 0, c = 0, d = 0;
    __get_cpuid((unsigned)leaf, &a, &b, &c, &d);
    reg[0] = a; reg[1] = b; reg[2] = c; reg[3] = d;
}
static double now_seconds(void)
{
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (double)ts.tv_sec + (double)ts.tv_nsec / 1e9;
}
#endif

/* Pure, independently testable step: ECX bit 31 of CPUID leaf 1 ("hypervisor present"). */
static int hypervisor_bit(unsigned int ecx)
{
    return (ecx >> 31) & 1u;
}

/* Pure, independently testable step: turns the three CPUID leaf 0x40000000 registers into the
 * 12-character vendor signature string, sanitizing any non-printable byte to '.' (a zero byte is
 * left as-is: it is padding, not a value to sanitize). Byte order is explicit shifts (not a
 * memcpy of the register's in-memory bytes), so this is endian-independent and callable with
 * hand-picked values in a unit test. */
static void vendor_signature(unsigned int ebx, unsigned int ecx, unsigned int edx, char out[13])
{
    unsigned int regs[3] = { ebx, ecx, edx };
    int pos = 0;
    for (int reg = 0; reg < 3; reg++) {
        for (int byte = 0; byte < 4; byte++) {
            unsigned char c = (unsigned char)((regs[reg] >> (8 * byte)) & 0xFFu);
            if (c != 0 && (c < 32 || c > 126))
                c = '.';
            out[pos++] = (char)c;
        }
    }
    out[12] = '\0';
}

/* Pure, independently testable step: is the 12-byte signature entirely zero (hidden/blank)? */
static int vendor_is_blank(const char out[12])
{
    for (int i = 0; i < 12; i++)
        if (out[i] != 0)
            return 0;
    return 1;
}

int main(void)
{
    demo_prepare();
    printf("Environment detection: virtual machine / emulator + timing\n");
    printf("(only a CPU instruction and the clock; nothing changes)\n");
    printf("--------------------------------------------------------------\n");

    unsigned int r[4];
    cpuid(1, r);
    int hv = hypervisor_bit(r[2]);         /* ECX bit 31 */
    printf("(A) CPUID.1:ECX[31] hypervisor bit    : %s\n", hv ? "PRESENT" : "absent (looks bare-metal)");

    if (hv) {
        cpuid(0x40000000, r);
        char vendor[13];
        vendor_signature(r[1], r[2], r[3], vendor);   /* EBX, ECX, EDX */
        if (vendor_is_blank(vendor))
            printf("    Hypervisor vendor signature        : (vendor signature hidden/blank)\n");
        else
            printf("    Hypervisor vendor signature        : \"%s\"\n", vendor);
    }

    /* (B) Timing: the same operation twice; heavy slowdown is a single-step/emulation signal. */
    volatile uint64_t total = 0;
    double t0 = now_seconds();
    for (int iteration = 0; iteration < 2000000; iteration++)
        total += (uint64_t)iteration * 2654435761u;
    double elapsed = now_seconds() - t0;
    printf("(B) time for 2,000,000 iterations      : %.3f ms  (checksum=%llu)\n",
           elapsed * 1000.0, (unsigned long long)(total & 0xffff));
    printf("    (the threshold varies by machine; only a MEASUREMENT is reported here)\n");

    printf("--------------------------------------------------------------\n");
    if (hv)
        printf("RESULT: a hypervisor was SEEN. But WSL2/Hyper-V/VBS also look like this;\n"
               "this ALONE does not mean 'analysis environment' - it is a weak signal.\n");
    else
        printf("RESULT: no hypervisor visible (may be bare-metal).\n");
    printf("RASP: root/emulator detection always weighs multiple indicators and\n");
    printf("accepts that each one can be evaded (Demo 8 shows the policy).\n");
    return 0;
}
