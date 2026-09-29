/*
 * CEN429 — Week 2 — Demo 1: a toy antivirus scanner
 *
 * Usage: ./bin/.../scanner <method> <signatures.txt> <file>...
 *   method: digest | hash | pattern | heuristic | emulation | body16
 *
 * Shows the methods real scanners use, and their limits:
 *   hash       is the file's SHA-256 digest the same as one in the signature database?
 *   pattern    does a known byte sequence (a signature) appear in the file?
 *   heuristic  score suspicious traits (high entropy, a decoder, junk commands)
 *   emulation  run the capsule's decoder in a safe "virtual machine", then
 *              scan the decoded body again with the pattern method.
 *   body16     print the capsule body's first 16 bytes in hex (for viewing).
 *
 * SHA-256 works on both platforms: OpenSSL on Linux, BCrypt on Windows (see
 * common/cen429_crypto.h). The program only reads; it never modifies, deletes,
 * or runs any file.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include "cen429_demo.h"
#include "cen429_crypto.h"
#include "capsule.h"

#define MAX_SIZE (1024 * 1024)   /* we do not scan files bigger than 1 MB */
#define MAX_SIGNATURES 64
#define MAX_COMMANDS 32           /* the emulator's instruction limit (a timeout) */
#define ENTROPY_THRESHOLD 7.0     /* bit/byte; above this, "encrypted/compressed?" */
#define SCORE_THRESHOLD 50        /* heuristic score threshold */

enum signature_type { T_HASH, T_PATTERN };

struct signature {
    enum signature_type type;
    char name[64];
    char value[128];
};

static struct signature signatures[MAX_SIGNATURES];
static int signature_count;

/* ---------- helpers ---------- */

static int load_signatures(const char *path)
{
    FILE *f = fopen(path, "r");
    if (!f) {
        perror(path);
        return -1;
    }
    char line[256];
    while (fgets(line, sizeof line, f) && signature_count < MAX_SIGNATURES) {
        line[strcspn(line, "\r\n")] = '\0';
        if (line[0] == '#' || line[0] == '\0')
            continue;
        char type[16], name[64];
        int used = 0;
        if (sscanf(line, "%15s %63s %n", type, name, &used) != 2)
            continue;
        struct signature *sig = &signatures[signature_count];
        if (strcmp(type, "HASH") == 0)
            sig->type = T_HASH;
        else if (strcmp(type, "PATTERN") == 0)
            sig->type = T_PATTERN;
        else
            continue;
        snprintf(sig->name, sizeof sig->name, "%s", name);
        snprintf(sig->value, sizeof sig->value, "%s", line + used);
        signature_count++;
    }
    fclose(f);
    return 0;
}

static unsigned char *read_file(const char *path, size_t *len)
{
    FILE *f = fopen(path, "rb");
    if (!f)
        return NULL;
    unsigned char *v = malloc(MAX_SIZE + 1);
    size_t n = v ? fread(v, 1, MAX_SIZE + 1, f) : 0;
    fclose(f);
    if (!v || n > MAX_SIZE) { /* too large: refuse to scan */
        free(v);
        return NULL;
    }
    *len = n;
    return v;
}

static int sha256_hex(const unsigned char *v, size_t n, char hex[65])
{
    unsigned char md[32];
    if (!crypto_sha256(v, n, md))
        return -1;
    for (int i = 0; i < 32; i++)
        snprintf(hex + 2 * i, 3, "%02x", md[i]);
    hex[64] = '\0';
    return 0;
}

/* Shannon entropy: 0 (always the same byte) ... 8 (fully random) bit/byte */
static double entropy(const unsigned char *v, size_t n)
{
    size_t count[256] = { 0 };
    if (n == 0)
        return 0.0;
    for (size_t i = 0; i < n; i++)
        count[v[i]]++;
    double h = 0.0;
    for (int b = 0; b < 256; b++) {
        if (count[b] == 0)
            continue;
        double p = (double)count[b] / (double)n;
        h -= p * log2(p);
    }
    return h;
}

static int contains(const unsigned char *v, size_t n, const char *pattern)
{
    size_t m = strlen(pattern);
    if (m == 0 || m > n)
        return 0;
    for (size_t i = 0; i + m <= n; i++)
        if (memcmp(v + i, pattern, m) == 0)
            return 1;
    return 0;
}

/* Returns the name of the first matching pattern signature (NULL if none). */
static const char *find_pattern(const unsigned char *v, size_t n)
{
    for (int i = 0; i < signature_count; i++)
        if (signatures[i].type == T_PATTERN && contains(v, n, signatures[i].value))
            return signatures[i].name;
    return NULL;
}

struct capsule {
    char command[256];
    unsigned char *body;
    size_t body_len;
};

/* Returns 0 if this is not a capsule. If it is, splits off line 2 and the body. */
static int split_capsule(unsigned char *v, size_t n, struct capsule *cap)
{
    size_t s = strlen(CAPSULE_MAGIC);
    if (n < s || memcmp(v, CAPSULE_MAGIC, s) != 0)
        return 0;
    unsigned char *start = v + s;
    unsigned char *end = memchr(start, '\n', n - s);
    if (!end || (size_t)(end - start) >= sizeof cap->command)
        return 0;
    memcpy(cap->command, start, (size_t)(end - start));
    cap->command[end - start] = '\0';
    cap->body = end + 1;
    cap->body_len = n - (size_t)(cap->body - v);
    return 1;
}

/* ---------- emulator: "runs" decoder commands safely ---------- */

/* Returns 0 on success, with the body decoded in place. The file is never
   trusted: an unknown command, too many commands, or a LEN longer than the
   body -> rejected. */
static int emulate(struct capsule *cap, char *note, size_t note_len)
{
    char copy[256];
    snprintf(copy, sizeof copy, "%s", cap->command);
    int algo = 0, step = 0, junk = 0;
    unsigned long seed = 0, length = 0;
    for (char *t = strtok(copy, " "); t; t = strtok(NULL, " ")) {
        if (++step > MAX_COMMANDS) {
            snprintf(note, note_len, "command limit exceeded");
            return -1;
        }
        if (strcmp(t, "BODY") == 0 || strcmp(t, "DECODER:") == 0) {
            /* label */
        } else if (strcmp(t, "NOP") == 0) {
            junk++;
        } else if (strcmp(t, "ALGO=xs32") == 0) {
            algo = 1;
        } else if (strcmp(t, "ALGO=lcg8") == 0) {
            algo = 2;
        } else if (strncmp(t, "SEED=", 5) == 0) {
            seed = strtoul(t + 5, NULL, 16);
        } else if (strncmp(t, "LEN=", 4) == 0) {
            length = strtoul(t + 4, NULL, 10);
        } else if (strcmp(t, "DECODE") == 0) {
            if (length > cap->body_len) {
                snprintf(note, note_len, "LEN is larger than the body");
                return -1;
            }
            if (algo == 1)
                xs32_apply(cap->body, length, (uint32_t)seed);
            else if (algo == 2)
                lcg8_apply(cap->body, length, (uint32_t)seed, 0);
            else {
                snprintf(note, note_len, "no algorithm");
                return -1;
            }
            snprintf(note, note_len, "%d commands, %d NOP, %s", step, junk,
                     algo == 1 ? "xs32" : "lcg8");
            return 0;
        } else {
            snprintf(note, note_len, "unknown command");
            return -1;
        }
    }
    snprintf(note, note_len, "no decoder (plain body)");
    return 0;
}

/* ---------- methods ---------- */

/* Show only the file name on screen (so the folder path doesn't widen the line) */
static const char *short_name(const char *path)
{
    const char *s1 = strrchr(path, '/');
    const char *s2 = strrchr(path, '\\');
    const char *s = s1 > s2 ? s1 : s2;
    return s ? s + 1 : path;
}

static void scan(const char *method, const char *path)
{
    const char *name = short_name(path);
    size_t n = 0;
    unsigned char *v = read_file(path, &n);
    if (!v) {
        printf("  %-18s %-10s %s\n", name, "ERROR", "unreadable/too large");
        return;
    }
    char hex[65] = "";
    char detail[128] = "";
    const char *result = "CLEAN";

    if (strcmp(method, "digest") == 0) {
        sha256_hex(v, n, hex);
        printf("  %s (%zu bytes, entropy %.2f)\n    sha256=%s\n", name, n,
               entropy(v, n), hex);
        free(v);
        return;
    } else if (strcmp(method, "body16") == 0) {
        struct capsule cap;
        if (split_capsule(v, n, &cap)) {
            char h[64] = "";
            size_t m = cap.body_len < 16 ? cap.body_len : 16;
            for (size_t i = 0; i < m; i++)
                snprintf(h + 3 * i, 4, "%02x ", cap.body[i]);
            if (m > 0)
                h[3 * m - 1] = '\0';        /* drop the trailing space */
            printf("  %-11s body[0..15]: %s\n", name, h);
        } else {
            printf("  %-12s (not a capsule)\n", name);
        }
        free(v);
        return;
    } else if (strcmp(method, "hash") == 0) {
        sha256_hex(v, n, hex);
        for (int i = 0; i < signature_count; i++)
            if (signatures[i].type == T_HASH &&
                strcmp(signatures[i].value, hex) == 0) {
                result = "CAUGHT";
                snprintf(detail, sizeof detail, "%s", signatures[i].name);
            }
        if (strcmp(result, "CLEAN") == 0)
            snprintf(detail, sizeof detail, "sha256=%.16s...", hex);
    } else if (strcmp(method, "pattern") == 0) {
        const char *name_hit = find_pattern(v, n);
        if (name_hit) {
            result = "CAUGHT";
            snprintf(detail, sizeof detail, "%s", name_hit);
        }
    } else if (strcmp(method, "heuristic") == 0) {
        int score = 0;
        double h = entropy(v, n);
        struct capsule cap;
        char reason[80] = "";
        if (h > ENTROPY_THRESHOLD) {
            score += 50;
            strcat(reason, "entropy ");
        }
        if (split_capsule(v, n, &cap)) {
            if (strncmp(cap.command, "BODY", 4) != 0) {
                score += 30; /* code runs before the body: a decoder */
                strcat(reason, "decoder ");
            }
            if (strstr(cap.command, "NOP")) {
                score += 20; /* meaningless commands: junk code */
                strcat(reason, "junk-code ");
            }
        }
        if (score >= SCORE_THRESHOLD)
            result = "SUSPICIOUS";
        snprintf(detail, sizeof detail, "score=%3d H=%.2f %s", score, h,
                 reason);
    } else if (strcmp(method, "emulation") == 0) {
        struct capsule cap;
        char note[64] = "not a capsule";
        const char *name_hit = NULL;
        if (split_capsule(v, n, &cap)) {
            if (emulate(&cap, note, sizeof note) == 0)
                name_hit = find_pattern(cap.body, cap.body_len);
            else
                result = "SUSPICIOUS"; /* a capsule we could not decode: be cautious */
        } else {
            name_hit = find_pattern(v, n);
        }
        if (name_hit)
            result = "CAUGHT";
        snprintf(detail, sizeof detail, "%s%s%s", name_hit ? name_hit : "",
                 name_hit ? " | " : "", note);
    } else {
        fprintf(stderr, "unknown method: %s\n", method);
        free(v);
        exit(2);
    }
    size_t m = strlen(detail);
    while (m > 0 && detail[m - 1] == ' ') /* drop trailing spaces */
        detail[--m] = '\0';
    if (m == 0)
        printf("  %-18s %s\n", name, result);
    else
        printf("  %-18s %-10s %s\n", name, result, detail);
    free(v);
}

int main(int argc, char **argv)
{
    demo_prepare();
    if (argc < 4) {
        fprintf(stderr, "usage: %s digest|hash|pattern|heuristic|emulation|"
                        "body16 <signatures.txt> <file>...\n", argv[0]);
        return 2;
    }
    if (load_signatures(argv[2]) != 0)
        return 1;
    for (int i = 3; i < argc; i++)
        scan(argv[1], argv[i]);
    return 0;
}
