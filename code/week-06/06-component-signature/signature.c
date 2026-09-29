/*
 * CEN429 - Week 6 - Demo 6: Component / package signature and digest verification
 *
 * On Android, an application verifies its APK signature against repackaging (APK Signature
 * Scheme v2/v3). This is the general case of "is the party that loaded/is calling this component
 * the expected, unmodified version?" (catalog K2/K3/K6).
 *
 * Here we show the same mechanism in a PORTABLE C setting: a "plugin module" file (module.dat) is
 * verified with a detached signature (module.sig) BEFORE it is loaded. The signature is the
 * module's HMAC-SHA-256. If the module changes by even one byte (repackaging), the HMAC no longer
 * matches and loading is REJECTED.
 *
 *   signature generate <module> <signature>   -> writes the module's HMAC (a build-time step)
 *   signature verify   <module> <signature>   -> verifies it before loading
 *
 * Important difference (discussed in the notes): APK v2/v3 uses a PUBLIC-KEY (asymmetric)
 * signature, so the verifier never needs the signing key (only the public key). Here we use a
 * SHARED-key HMAC for teaching purposes; an asymmetric signature (Ed25519 / RSA-PSS) comes in
 * Week 10. The principle is the same: integrity + provenance before loading.
 *
 * Security: it only reads/writes files inside the demo's own folder; no system access.
 */
#include "cen429_demo.h"
#include "cen429_crypto.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* Synthetic signing key (protected/asymmetric in a real product). */
static const unsigned char SIGNING_KEY[32] = {
    0x43, 0x45, 0x4e, 0x34, 0x32, 0x39, 0x2d, 0x63, 0x6f, 0x6d, 0x70, 0x6f,
    0x6e, 0x65, 0x6e, 0x74, 0x2d, 0x73, 0x69, 0x67, 0x2d, 0x6b, 0x65, 0x79,
    0x2d, 0x76, 0x31, 0x00, 0x00, 0x00, 0x00, 0x00
};

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
    *size = fread(b, 1, (size_t)n, f);
    fclose(f);
    *data = b;
    return 1;
}

static void write_hex(FILE *f, const unsigned char *b, size_t n)
{
    for (size_t i = 0; i < n; i++)
        fprintf(f, "%02x", b[i]);
}

int main(int argc, char **argv)
{
    demo_prepare();
    if (argc < 4) {
        printf("Usage: %s generate|verify <module_file> <signature_file>\n", argv[0]);
        return 1;
    }
    const char *command = argv[1], *module = argv[2], *sig_path = argv[3];

    unsigned char *data = NULL;
    size_t size = 0;
    if (!read_file(module, &data, &size)) {
        fprintf(stderr, "Could not read module: %s\n", module);
        return 2;
    }
    unsigned char mac[32];
    crypto_hmac_sha256(SIGNING_KEY, sizeof(SIGNING_KEY), data, size, mac);
    free(data);

    if (strcmp(command, "generate") == 0) {
        FILE *f = fopen(sig_path, "w");
        if (!f) { fprintf(stderr, "Could not write signature.\n"); return 2; }
        write_hex(f, mac, 32);
        fprintf(f, "\n");
        fclose(f);
        printf("Module signed (%zu bytes).\n", size);
        printf("  signature (HMAC): "); write_hex(stdout, mac, 32); printf("\n  -> %s\n", sig_path);
        return 0;
    }

    if (strcmp(command, "verify") == 0) {
        FILE *f = fopen(sig_path, "r");
        if (!f) { fprintf(stderr, "No signature file.\n"); return 2; }
        char line[128] = {0};
        if (!fgets(line, sizeof(line), f)) { fclose(f); return 2; }
        fclose(f);
        unsigned char expected[32];
        for (int i = 0; i < 32; i++) {
            unsigned int v = 0;
            if (sscanf(line + i * 2, "%02x", &v) != 1) { fprintf(stderr, "Signature is corrupt.\n"); return 2; }
            expected[i] = (unsigned char)v;
        }
        unsigned char diff = 0;
        for (int i = 0; i < 32; i++)
            diff |= (unsigned char)(expected[i] ^ mac[i]);
        if (diff == 0) {
            printf("Module signature HELD -> safe to load.\n");
            return 0;
        }
        printf("Module signature DID NOT HOLD -> REPACKAGED/modified.\n");
        printf("Loading REJECTED.\n");
        return 3;
    }

    printf("Unknown command: %s\n", command);
    return 1;
}
