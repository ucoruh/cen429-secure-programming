/*
 * CEN429 — Week 2 — Demo 08: integrity monitoring (a SHA-256 manifest)
 *
 * Usage: bin/.../integrity_monitor create <folder> <manifest>
 *        bin/.../integrity_monitor verify <folder> <manifest>
 *
 * Shows the core idea behind integrity monitors like Tripwire / AIDE, and
 * application allowlisting:
 *   1. While the folder is in a "known good" state, every file's SHA-256
 *      digest is written into a manifest (the baseline).
 *   2. Later, the digests are recomputed and compared against the manifest:
 *      OK / CHANGED / DELETED / NEW.
 *
 * Only looks at regular files at the TOP level of the given folder (it does
 * not descend into subfolders, and does not follow links). It never modifies
 * any file; it only writes the manifest (with the create command). SHA-256:
 * OpenSSL on Linux, BCrypt on Windows (common/cen429_crypto.h).
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cen429_demo.h"
#include "cen429_crypto.h"

#ifdef _WIN32
#include <windows.h>
#else
#include <dirent.h>
#include <sys/stat.h>
#endif

#define MAX_FILES 256
#define NAME_LEN 128
#define READ_BLOCK 4096

struct entry {
    char name[NAME_LEN];
    char digest[65];
    long long size;
    int matched;             /* did verification find its counterpart? */
};

static int compare_names(const void *a, const void *b)
{
    return strcmp(((const struct entry *)a)->name,
                  ((const struct entry *)b)->name);
}

/* Computes a file's SHA-256 digest piece by piece (incrementally). */
static int file_digest(const char *path, char hex[65], long long *size)
{
    FILE *f = fopen(path, "rb");
    if (!f)
        return -1;
    crypto_sha256_ctx c;
    if (!crypto_sha256_init(&c)) {
        fclose(f);
        return -1;
    }
    unsigned char block[READ_BLOCK], md[32];
    size_t n;
    long long total = 0;
    int ok = 1;
    while ((n = fread(block, 1, sizeof block, f)) > 0) {
        if (!crypto_sha256_update(&c, block, n))
            ok = 0;
        total += (long long)n;
    }
    fclose(f);
    if (!crypto_sha256_final(&c, md) || !ok)
        return -1;
    for (int i = 0; i < 32; i++)
        snprintf(hex + 2 * i, 3, "%02x", md[i]);
    hex[64] = '\0';
    *size = total;
    return 0;
}

/* Collects the names of the top-level regular files in a folder (sorted).
   The manifest itself (skip) is left out of the list. */
static int list_folder(const char *folder, const char *skip,
                       struct entry *k, int cap)
{
    int count = 0;
#ifdef _WIN32
    char pattern[512];
    snprintf(pattern, sizeof pattern, "%s\\*", folder);
    WIN32_FIND_DATAA fd;
    HANDLE h = FindFirstFileA(pattern, &fd);
    if (h == INVALID_HANDLE_VALUE)
        return -1;
    do {
        if (fd.dwFileAttributes & (FILE_ATTRIBUTE_DIRECTORY |
                                   FILE_ATTRIBUTE_REPARSE_POINT))
            continue;                       /* no folders, no links */
        if (strlen(fd.cFileName) >= NAME_LEN || strcmp(fd.cFileName, skip) == 0)
            continue;
        if (count < cap)
            snprintf(k[count++].name, NAME_LEN, "%s", fd.cFileName);
    } while (FindNextFileA(h, &fd));
    FindClose(h);
#else
    DIR *d = opendir(folder);
    if (!d)
        return -1;
    struct dirent *e;
    while ((e = readdir(d)) != NULL) {
        char path[512];
        struct stat st;
        size_t L = strlen(e->d_name);
        if (L >= NAME_LEN || strcmp(e->d_name, skip) == 0)
            continue;
        snprintf(path, sizeof path, "%s/%s", folder, e->d_name);
        if (lstat(path, &st) != 0 || !S_ISREG(st.st_mode))
            continue;                       /* regular files only */
        if (count < cap)
            memcpy(k[count++].name, e->d_name, L + 1);   /* L < NAME_LEN */
    }
    closedir(d);
#endif
    qsort(k, (size_t)count, sizeof *k, compare_names);
    return count;
}

static const char *base_name(const char *path)
{
    const char *s1 = strrchr(path, '/');
    const char *s2 = strrchr(path, '\\');
    const char *s = s1 > s2 ? s1 : s2;
    return s ? s + 1 : path;
}

/* Computes the folder's current state (name + digest + size). */
static int compute_state(const char *folder, const char *manifest,
                         struct entry *k)
{
    int n = list_folder(folder, base_name(manifest), k, MAX_FILES);
    if (n < 0) {
        fprintf(stderr, "could not read folder: %s\n", folder);
        return -1;
    }
    for (int i = 0; i < n; i++) {
        char path[512];
        snprintf(path, sizeof path, "%s/%s", folder, k[i].name);
        if (file_digest(path, k[i].digest, &k[i].size) != 0) {
            fprintf(stderr, "could not digest: %s\n", k[i].name);
            return -1;
        }
        k[i].matched = 0;
    }
    return n;
}

static int create_baseline(const char *folder, const char *manifest)
{
    static struct entry k[MAX_FILES];
    int n = compute_state(folder, manifest, k);
    if (n < 0)
        return 1;
    FILE *f = fopen(manifest, "w");
    if (!f) {
        perror(manifest);
        return 1;
    }
    fprintf(f, "# CEN429 integrity manifest: sha256  size  name\n");
    for (int i = 0; i < n; i++)
        fprintf(f, "%s %lld %s\n", k[i].digest, k[i].size, k[i].name);
    fclose(f);
    printf("  Baseline written: %d file(s) -> %s\n", n, base_name(manifest));
    for (int i = 0; i < n; i++)
        printf("    %.16s...  %6lld  %s\n", k[i].digest, k[i].size, k[i].name);
    return 0;
}

static int verify(const char *folder, const char *manifest)
{
    static struct entry old[MAX_FILES], cur[MAX_FILES];
    int nold = 0;
    FILE *f = fopen(manifest, "r");
    if (!f) {
        perror(manifest);
        return 2;
    }
    char line[512];
    while (fgets(line, sizeof line, f) && nold < MAX_FILES) {
        line[strcspn(line, "\r\n")] = '\0';
        if (line[0] == '#' || line[0] == '\0')
            continue;
        struct entry *e = &old[nold];
        /* The manifest is an input too: a malformed line is rejected. */
        if (sscanf(line, "%64s %lld %127s", e->digest, &e->size, e->name) != 3
            || strlen(e->digest) != 64) {
            fprintf(stderr, "  skipped a malformed manifest line\n");
            continue;
        }
        e->matched = 0;
        nold++;
    }
    fclose(f);

    int ncur = compute_state(folder, manifest, cur);
    if (ncur < 0)
        return 2;

    int issues = 0;
    for (int i = 0; i < nold; i++) {
        int found = -1;
        for (int j = 0; j < ncur; j++)
            if (strcmp(old[i].name, cur[j].name) == 0) {
                found = j;
                break;
            }
        if (found < 0) {
            printf("  DELETED  %-16s (in the manifest, not in the folder)\n",
                   old[i].name);
            issues++;
            continue;
        }
        cur[found].matched = 1;
        if (strcmp(old[i].digest, cur[found].digest) == 0) {
            printf("  OK       %-16s %.16s...\n", old[i].name, old[i].digest);
        } else {
            printf("  CHANGED  %-16s %.12s... -> %.12s... (%lld->%lld B)\n",
                   old[i].name, old[i].digest, cur[found].digest,
                   old[i].size, cur[found].size);
            issues++;
        }
    }
    for (int j = 0; j < ncur; j++)
        if (!cur[j].matched) {
            printf("  NEW      %-16s %.16s... (not in the baseline)\n",
                   cur[j].name, cur[j].digest);
            issues++;
        }
    if (issues == 0)
        printf("  RESULT: integrity preserved (%d file(s))\n", nold);
    else
        printf("  RESULT: %d deviation(s) found -> investigate!\n", issues);
    return issues ? 1 : 0;
}

/* ---------- protecting the manifest itself: an HMAC-SHA256 seal ---------- */

/* Reads a small file into memory (at most cap bytes). */
static long load_file(const char *path, unsigned char *v, size_t cap)
{
    FILE *f = fopen(path, "rb");
    if (!f)
        return -1;
    size_t n = fread(v, 1, cap, f);
    int extra = fgetc(f) != EOF;
    fclose(f);
    return extra ? -1 : (long)n;
}

/* Generates a random 32-byte seal key (the operating system's CSPRNG). */
static int generate_key(const char *path)
{
    unsigned char k[32];
    if (!crypto_random(k, sizeof k))
        return 1;
    FILE *f = fopen(path, "wb");
    if (!f) {
        perror(path);
        return 1;
    }
    fwrite(k, 1, sizeof k, f);
    fclose(f);
    crypto_wipe(k, sizeof k);
    printf("  32-byte seal key generated -> %s\n", base_name(path));
    return 0;
}

static int compute_hmac(const char *manifest, const char *key_path,
                        unsigned char mac[32])
{
    static unsigned char data[64 * 1024];
    unsigned char k[64];
    long kn = load_file(key_path, k, sizeof k);
    long vn = load_file(manifest, data, sizeof data);
    if (kn <= 0 || vn < 0) {
        fprintf(stderr, "  could not read the key or the manifest\n");
        return -1;
    }
    int ok = crypto_hmac_sha256(k, (size_t)kn, data, (size_t)vn, mac);
    crypto_wipe(k, sizeof k);
    return ok ? 0 : -1;
}

static int seal(const char *manifest, const char *key_path)
{
    unsigned char mac[32];
    char path[512], hex[65];
    if (compute_hmac(manifest, key_path, mac) != 0)
        return 1;
    for (int i = 0; i < 32; i++)
        snprintf(hex + 2 * i, 3, "%02x", mac[i]);
    snprintf(path, sizeof path, "%s.hmac", manifest);
    FILE *f = fopen(path, "w");
    if (!f) {
        perror(path);
        return 1;
    }
    fprintf(f, "%s\n", hex);
    fclose(f);
    printf("  Manifest sealed: HMAC-SHA256 = %.16s...\n", hex);
    return 0;
}

static int verify_seal(const char *manifest, const char *key_path)
{
    unsigned char mac[32], expected[32];
    char path[512], hex[80];
    if (compute_hmac(manifest, key_path, mac) != 0)
        return 2;
    snprintf(path, sizeof path, "%s.hmac", manifest);
    FILE *f = fopen(path, "r");
    if (!f || !fgets(hex, sizeof hex, f)) {
        if (f)
            fclose(f);
        printf("  NO SEAL: the manifest's HMAC file was not found\n");
        return 1;
    }
    fclose(f);
    for (int i = 0; i < 32; i++) {
        unsigned int b;
        if (sscanf(hex + 2 * i, "%2x", &b) != 1) {
            printf("  SEAL BROKEN: could not read the HMAC file\n");
            return 1;
        }
        expected[i] = (unsigned char)b;
    }
    /* Constant-time comparison: it does not exit early on the first mismatch. */
    unsigned char diff = 0;
    for (int i = 0; i < 32; i++)
        diff |= (unsigned char)(mac[i] ^ expected[i]);
    if (diff == 0) {
        printf("  SEAL VALID: the manifest was written by the key's owner\n");
        return 0;
    }
    printf("  SEAL INVALID: the manifest was changed by someone without\n"
           "  the key -> DO NOT TRUST the manifest\n");
    return 1;
}

int main(int argc, char **argv)
{
    demo_prepare();
    if (argc == 3 && strcmp(argv[1], "key") == 0)
        return generate_key(argv[2]);
    if (argc != 4) {
        fprintf(stderr,
                "usage: %s create|verify <folder> <manifest>\n"
                "       %s seal|verify-seal <manifest> <key>\n"
                "       %s key <key-file>\n",
                argv[0], argv[0], argv[0]);
        return 2;
    }
    if (strcmp(argv[1], "create") == 0)
        return create_baseline(argv[2], argv[3]);
    if (strcmp(argv[1], "verify") == 0)
        return verify(argv[2], argv[3]);
    if (strcmp(argv[1], "seal") == 0)
        return seal(argv[2], argv[3]);
    if (strcmp(argv[1], "verify-seal") == 0)
        return verify_seal(argv[2], argv[3]);
    fprintf(stderr, "unknown command: %s\n", argv[1]);
    return 2;
}
