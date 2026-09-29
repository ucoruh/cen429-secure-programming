/*
 * CEN429 - Week 6 - Demo 1: Runtime integrity check (self-hashing)
 *
 * RASP's first step is DETECTION: the application notices at runtime whether its own binary (or a
 * protected module) has been PATCHED. The textbook (Viega & Messier, Recipe 12.2 "Detecting
 * Modification") does this with CRC32; CRC is not cryptographic (an attacker can easily produce a
 * patch with the same CRC), so here we use HMAC-SHA-256 instead (cen429_crypto.h).
 *
 * The program computes the HMAC of a target (default: its OWN binary):
 *   integrity save   <target|self> <signature_file>   -> writes the golden value
 *   integrity verify <target|self> <signature_file>   -> recomputes it and compares
 * The "self" target means the program's own running executable.
 *
 * Security: it only READS a file and compares; it changes nothing and touches no system setting.
 * demo.sh patches a COPY of the binary, inside the program's own bin/ folder.
 *
 * Important limits of this lesson (discussed in the notes):
 *   - The HMAC key lives inside the binary itself; that alone is not enough. An attacker could patch
 *     the checking code too. Real RASP therefore combines (1) multiple/overlapping checkers, (2)
 *     turning the result into a DATA DEPENDENCY (see Demo 5), (3) server-side attestation.
 */
#include "cen429_demo.h"
#include "cen429_crypto.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#ifdef _WIN32
#include <windows.h>
#else
#include <unistd.h>
#include <limits.h>
#endif

/* Synthetic integrity key (derived/protected differently in a real product). */
static const unsigned char RASP_KEY[32] = {
    0x43, 0x45, 0x4e, 0x34, 0x32, 0x39, 0x2d, 0x52, 0x41, 0x53, 0x50, 0x2d,
    0x69, 0x6e, 0x74, 0x65, 0x67, 0x72, 0x69, 0x74, 0x79, 0x2d, 0x6b, 0x65,
    0x79, 0x2d, 0x76, 0x31, 0x00, 0x00, 0x00, 0x00
};

static int self_path(char *buffer, size_t size)
{
#ifdef _WIN32
    DWORD n = GetModuleFileNameA(NULL, buffer, (DWORD)size);
    return (n > 0 && n < size);
#else
    ssize_t n = readlink("/proc/self/exe", buffer, size - 1);
    if (n <= 0)
        return 0;
    buffer[n] = '\0';
    return 1;
#endif
}

/* Reads the whole file into memory; the caller frees it. Success: 1. */
static int read_file(const char *path, unsigned char **data, size_t *size)
{
    FILE *f = fopen(path, "rb");
    if (!f)
        return 0;
    fseek(f, 0, SEEK_END);
    long n = ftell(f);
    fseek(f, 0, SEEK_SET);
    if (n < 0) { fclose(f); return 0; }
    unsigned char *b = (unsigned char *)malloc((size_t)n + 1);
    if (!b) { fclose(f); return 0; }
    size_t read_bytes = fread(b, 1, (size_t)n, f);
    fclose(f);
    *data = b;
    *size = read_bytes;
    return 1;
}

static void write_hex(FILE *f, const unsigned char *b, size_t n)
{
    for (size_t i = 0; i < n; i++)
        fprintf(f, "%02x", b[i]);
}

static int target_hmac(const char *target, unsigned char digest[32], char *path_out, size_t path_size)
{
    char path[4096];
    if (strcmp(target, "self") == 0) {
        if (!self_path(path, sizeof(path))) {
            fprintf(stderr, "Could not find own path.\n");
            return 0;
        }
    } else {
        snprintf(path, sizeof(path), "%s", target);
    }
    if (path_out)
        snprintf(path_out, path_size, "%s", path);

    unsigned char *data = NULL;
    size_t size = 0;
    if (!read_file(path, &data, &size)) {
        fprintf(stderr, "Could not read target: %s\n", path);
        return 0;
    }
    int ok = crypto_hmac_sha256(RASP_KEY, sizeof(RASP_KEY), data, size, digest);
    free(data);
    return ok;
}

int main(int argc, char **argv)
{
    demo_prepare();
    if (argc < 4) {
        printf("Usage: %s save|verify <target|self> <signature_file>\n", argv[0]);
        return 1;
    }
    const char *command = argv[1];
    const char *target = argv[2];
    const char *sig_path = argv[3];

    unsigned char digest[32];
    char path[4096] = {0};
    if (!target_hmac(target, digest, path, sizeof(path)))
        return 2;

    if (strcmp(command, "save") == 0) {
        FILE *f = fopen(sig_path, "w");
        if (!f) { fprintf(stderr, "Could not write signature file.\n"); return 2; }
        write_hex(f, digest, 32);
        fprintf(f, "\n");
        fclose(f);
        printf("Golden integrity value saved.\n");
        printf("  target : %s\n", path);
        printf("  HMAC   : ");
        write_hex(stdout, digest, 32);
        printf("\n  -> %s\n", sig_path);
        return 0;
    }

    if (strcmp(command, "verify") == 0) {
        FILE *f = fopen(sig_path, "r");
        if (!f) { fprintf(stderr, "No golden value yet, run 'save' first.\n"); return 2; }
        char line[128] = {0};
        if (!fgets(line, sizeof(line), f)) { fclose(f); return 2; }
        fclose(f);
        unsigned char expected[32];
        for (int i = 0; i < 32; i++) {
            unsigned int v = 0;
            if (sscanf(line + i * 2, "%02x", &v) != 1) {
                fprintf(stderr, "Golden value is corrupt.\n");
                return 2;
            }
            expected[i] = (unsigned char)v;
        }
        printf("Target     : %s\n", path);
        printf("Expected   : "); write_hex(stdout, expected, 32); printf("\n");
        printf("Computed   : "); write_hex(stdout, digest, 32); printf("\n");
        /* Constant-time comparison (avoids a timing leak). */
        unsigned char diff = 0;
        for (int i = 0; i < 32; i++)
            diff |= (unsigned char)(expected[i] ^ digest[i]);
        if (diff == 0) {
            printf("RESULT: INTEGRITY OK - target unchanged.\n");
            return 0;
        }
        printf("RESULT: PATCH DETECTED - target was modified! (tamper)\n");
        return 3;
    }

    printf("Unknown command: %s\n", command);
    return 1;
}
