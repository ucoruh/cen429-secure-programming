/*
 * CEN429 - Week 2 - Demo 11: a tamper-evident log
 *                            (an HMAC digest chain + key evolution)
 *
 * TOPIC: An audit log is kept on a machine that is in the attacker's
 * hands. If the attacker takes over the machine, we want them to be
 * unable to change or delete past records WITHOUT IT BEING NOTICED.
 * Two ideas are combined:
 *
 *  1) DIGEST CHAIN: every record's MAC also covers the PREVIOUS
 *     record's MAC:  mac_i = HMAC(K_i, mac_{i-1} || seq_i || message_i).
 *     So modifying, deleting, or reordering a record breaks the
 *     chain -> verification catches it.
 *
 *  2) KEY EVOLUTION (forward security): after every record, the key
 *     is advanced one-way:  K_{i+1} = HMAC(K_i, "cen429-evolve")
 *     and K_i is WIPED. Because K is derived one-way, an attacker who
 *     takes over at time t only gets the CURRENT key (K_t); they
 *     cannot compute the OLD keys (K_j, j<t) backwards from it. The
 *     result: they cannot produce a valid MAC for past records
 *     (Schneier-Kelsey, 1999).
 *
 * For comparison, there is also a STATIC key mode: a single fixed key.
 * In static mode, the captured key = the very first key, so the
 * attacker CAN rewrite history; in EVOLVE mode they cannot.
 *
 * A SAFE simulation: it only writes under work/; the key files are kept
 * on disk for teaching purposes (in reality the "verifier's key" would
 * sit offline, somewhere secure). HMAC/SHA-256 come from the shared
 * cen429_crypto.h.
 *
 * Usage:
 *   generate <dir> <static|evolve>              a sample log + keys
 *   verify   <log> <k0-key>                      verify the chain
 *   modify   <log> <seq> <new-message>          raw tampering (MAC unchanged)
 *   delete   <log> <seq>                         delete a record
 *   swap     <log> <seqA> <seqB>                 swap two records
 *   forge    <log> <seq> <new> <stolen-key>      the attacker renews the MACs
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include "cen429_demo.h"
#include "cen429_crypto.h"

#define MAX_RECORDS 64
#define MSG_LEN 96

struct record {
    int seq;
    char message[MSG_LEN];
    unsigned char mac[32];
};

static struct record records[MAX_RECORDS];
static int record_count;
static int chain_evolve;                /* 1 = key evolution is on */

static void write_hex(FILE *f, const unsigned char *b, size_t n)
{
    for (size_t i = 0; i < n; i++)
        fprintf(f, "%02x", b[i]);
}

static int read_hex(const char *s, unsigned char *b, size_t n)
{
    for (size_t i = 0; i < n; i++) {
        unsigned v;
        if (sscanf(s + 2 * i, "%02x", &v) != 1)
            return 0;
        b[i] = (unsigned char)v;
    }
    return 1;
}

/* Advances the key one-way: K' = HMAC(K, "cen429-evolve"). */
static void evolve_key(unsigned char k[32])
{
    unsigned char next[32];
    crypto_hmac_sha256(k, 32, "cen429-evolve", 13, next);
    memcpy(k, next, 32);
    crypto_wipe(next, sizeof next);
}

/* A record's MAC: HMAC(K_i, prev_mac(32) || seq(4 BE) || message). */
static void record_mac(const unsigned char k[32],
                       const unsigned char prev[32],
                       int seq, const char *message, unsigned char out[32])
{
    unsigned char buffer[32 + 4 + MSG_LEN];
    size_t mlen = strlen(message);
    if (mlen > MSG_LEN) mlen = MSG_LEN;
    memcpy(buffer, prev, 32);
    buffer[32] = (unsigned char)(seq >> 24);
    buffer[33] = (unsigned char)(seq >> 16);
    buffer[34] = (unsigned char)(seq >> 8);
    buffer[35] = (unsigned char)(seq);
    memcpy(buffer + 36, message, mlen);
    crypto_hmac_sha256(k, 32, buffer, 36 + mlen, out);
}

/* Reads the log file: a header + records. */
static int read_log(const char *path)
{
    FILE *f = fopen(path, "r");
    if (!f) { perror(path); return 0; }
    char line[512];
    record_count = 0;
    chain_evolve = 0;
    if (!fgets(line, sizeof line, f)) { fclose(f); return 0; }
    /* Header: CHAIN/1 <static|evolve> <N> */
    char mode[16];
    int n = 0;
    if (sscanf(line, "CHAIN/1 %15s %d", mode, &n) != 2) {
        fclose(f); return 0;
    }
    chain_evolve = (strcmp(mode, "evolve") == 0);
    while (fgets(line, sizeof line, f) && record_count < MAX_RECORDS) {
        line[strcspn(line, "\r\n")] = '\0';
        if (line[0] == '\0') continue;
        /* seq|message|mac-hex */
        char *p1 = strchr(line, '|');
        if (!p1) continue;
        char *p2 = strchr(p1 + 1, '|');
        if (!p2) continue;
        *p1 = '\0'; *p2 = '\0';
        struct record *k = &records[record_count];
        k->seq = atoi(line);
        snprintf(k->message, sizeof k->message, "%s", p1 + 1);
        if (!read_hex(p2 + 1, k->mac, 32)) continue;
        record_count++;
    }
    fclose(f);
    (void)n;
    return 1;
}

static int write_log(const char *path)
{
    FILE *f = fopen(path, "w");
    if (!f) { perror(path); return 0; }
    fprintf(f, "CHAIN/1 %s %d\n", chain_evolve ? "evolve" : "static", record_count);
    for (int i = 0; i < record_count; i++) {
        fprintf(f, "%d|%s|", records[i].seq, records[i].message);
        write_hex(f, records[i].mac, 32);
        fprintf(f, "\n");
    }
    fclose(f);
    return 1;
}

static int write_raw_file(const char *path, const unsigned char *b, size_t n)
{
    FILE *f = fopen(path, "wb");
    if (!f) { perror(path); return 0; }
    fwrite(b, 1, n, f);
    fclose(f);
    return 1;
}

static int generate(const char *dir, const char *mode)
{
    const char *samples[] = {
        "wallet opened",
        "card loaded card=1",
        "payment started amount=25",
        "payment approved",
        "record deleted card=1",
        "session closed",
    };
    int N = (int)(sizeof samples / sizeof samples[0]);
    chain_evolve = (strcmp(mode, "evolve") == 0);

    unsigned char k0[32], k[32], prev[32];
    if (!crypto_random(k0, 32)) {
        fprintf(stderr, "could not generate randomness\n");
        return 1;
    }
    memcpy(k, k0, 32);
    memset(prev, 0, 32);               /* mac_0 = zero (the starting point) */

    record_count = 0;
    for (int i = 0; i < N; i++) {
        struct record *r = &records[record_count];
        r->seq = i + 1;
        snprintf(r->message, sizeof r->message, "%s", samples[i]);
        record_mac(k, prev, r->seq, r->message, r->mac);
        memcpy(prev, r->mac, 32);
        record_count++;
        if (chain_evolve)
            evolve_key(k);               /* K_i is wiped, K_{i+1} remains */
    }
    /* At this point 'k' = the key left on the machine at the moment of
     * capture:
     *   in evolve mode, K_N (the old keys have been wiped),
     *   in static mode, still K_0 (it never changed).
     * In static mode evolve_key is never called, so k == k0. */

    char path[512];
    snprintf(path, sizeof path, "%s/access.auditlog", dir);
    if (!write_log(path)) return 1;
    snprintf(path, sizeof path, "%s/verifier.key", dir);
    if (!write_raw_file(path, k0, 32)) return 1;   /* the offline verifier's key */
    snprintf(path, sizeof path, "%s/stolen.key", dir);
    if (!write_raw_file(path, k, 32)) return 1;    /* what the attacker sees */

    printf("  Log (%s) written: %d record(s) -> %s/access.auditlog\n",
           chain_evolve ? "key evolution" : "static key", record_count, dir);
    printf("  Offline verifier's key: verifier.key\n");
    printf("  The key on the machine at the moment of capture: "
           "stolen.key\n");
    crypto_wipe(k, 32);
    crypto_wipe(k0, 32);
    return 0;
}

static int verify(const char *log, const char *key_path)
{
    if (!read_log(log)) return 1;
    FILE *f = fopen(key_path, "rb");
    if (!f) { perror(key_path); return 1; }
    unsigned char k[32];
    if (fread(k, 1, 32, f) != 32) { fclose(f); return 1; }
    fclose(f);

    unsigned char prev[32];
    memset(prev, 0, 32);
    int error = 0;
    int prev_seq = 0;
    for (int i = 0; i < record_count; i++) {
        unsigned char expected[32];
        record_mac(k, prev, records[i].seq, records[i].message, expected);
        int ok = memcmp(expected, records[i].mac, 32) == 0;
        int order_ok = (records[i].seq == prev_seq + 1);
        printf("  #%d seq=%d \"%s\"  MAC:%s%s\n", i + 1, records[i].seq,
               records[i].message, ok ? "OK" : "BROKEN",
               order_ok ? "" : "  ORDER:BROKEN");
        if (!ok || !order_ok) error = 1;
        memcpy(prev, records[i].mac, 32);  /* the chain follows the actual MAC */
        prev_seq = records[i].seq;
        if (chain_evolve)
            evolve_key(k);
    }
    crypto_wipe(k, 32);
    if (error)
        printf("  >>> RESULT: the log has been TAMPERED WITH (verification failed).\n");
    else
        printf("  >>> RESULT: the log is INTACT (every record verified).\n");
    return error ? 3 : 0;
}

static int find_index(int seq)
{
    for (int i = 0; i < record_count; i++)
        if (records[i].seq == seq) return i;
    return -1;
}

static int modify(const char *log, int seq, const char *new_message)
{
    if (!read_log(log)) return 1;
    int i = find_index(seq);
    if (i < 0) { fprintf(stderr, "seq not found\n"); return 1; }
    snprintf(records[i].message, sizeof records[i].message, "%s", new_message);
    /* THE MAC WAS NOT TOUCHED: we assume the attacker cannot compute a new one. */
    write_log(log);
    printf("  seq=%d message changed to \"%s\" (MAC left stale).\n",
           seq, new_message);
    return 0;
}

static int delete_record(const char *log, int seq)
{
    if (!read_log(log)) return 1;
    int i = find_index(seq);
    if (i < 0) { fprintf(stderr, "seq not found\n"); return 1; }
    for (int j = i; j < record_count - 1; j++)
        records[j] = records[j + 1];
    record_count--;
    write_log(log);
    printf("  seq=%d record deleted (%d record(s) remain).\n", seq, record_count);
    return 0;
}

static int swap(const char *log, int a, int b)
{
    if (!read_log(log)) return 1;
    int ia = find_index(a), ib = find_index(b);
    if (ia < 0 || ib < 0) { fprintf(stderr, "seq not found\n"); return 1; }
    struct record t = records[ia]; records[ia] = records[ib]; records[ib] = t;
    write_log(log);
    printf("  seq=%d and seq=%d swapped.\n", a, b);
    return 0;
}

/* The attacker: changes record seq and recomputes all MACs from seq
 * onward with the key THEY HAVE. Since they only have one key, they
 * apply the SAME key to every record. In evolve mode, the verifier
 * expects a different key for every record -> caught. In static mode
 * the single key is correct -> not caught. */
static int forge(const char *log, int seq, const char *new_message,
                 const char *stolen_path)
{
    if (!read_log(log)) return 1;
    int i = find_index(seq);
    if (i < 0) { fprintf(stderr, "seq not found\n"); return 1; }
    FILE *f = fopen(stolen_path, "rb");
    if (!f) { perror(stolen_path); return 1; }
    unsigned char k[32];
    if (fread(k, 1, 32, f) != 32) { fclose(f); return 1; }
    fclose(f);

    snprintf(records[i].message, sizeof records[i].message, "%s", new_message);
    unsigned char prev[32];
    if (i == 0) memset(prev, 0, 32);
    else memcpy(prev, records[i - 1].mac, 32);
    for (int j = i; j < record_count; j++) {
        record_mac(k, prev, records[j].seq, records[j].message, records[j].mac);
        memcpy(prev, records[j].mac, 32);
    }
    crypto_wipe(k, 32);
    write_log(log);
    printf("  Attack: seq=%d \"%s\" was written, and with the stolen key\n"
           "  the MACs for seq=%d..%d were recomputed.\n",
           seq, new_message, seq, records[record_count - 1].seq);
    return 0;
}

int main(int argc, char **argv)
{
    demo_prepare();
    if (argc == 4 && strcmp(argv[1], "generate") == 0)
        return generate(argv[2], argv[3]);
    if (argc == 4 && strcmp(argv[1], "verify") == 0)
        return verify(argv[2], argv[3]);
    if (argc == 5 && strcmp(argv[1], "modify") == 0)
        return modify(argv[2], atoi(argv[3]), argv[4]);
    if (argc == 4 && strcmp(argv[1], "delete") == 0)
        return delete_record(argv[2], atoi(argv[3]));
    if (argc == 5 && strcmp(argv[1], "swap") == 0)
        return swap(argv[2], atoi(argv[3]), atoi(argv[4]));
    if (argc == 6 && strcmp(argv[1], "forge") == 0)
        return forge(argv[2], atoi(argv[3]), argv[4], argv[5]);
    fprintf(stderr,
        "usage:\n"
        "  %s generate <dir> <static|evolve>\n"
        "  %s verify <log> <k0-key>\n"
        "  %s modify <log> <seq> <new-message>\n"
        "  %s delete <log> <seq>\n"
        "  %s swap <log> <seqA> <seqB>\n"
        "  %s forge <log> <seq> <new> <stolen-key>\n",
        argv[0], argv[0], argv[0], argv[0], argv[0], argv[0]);
    return 2;
}
