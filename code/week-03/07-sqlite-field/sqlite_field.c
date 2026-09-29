/*
 * CEN429 - Week 3 - Demo 7: encrypting a sensitive database field with AES-GCM
 *
 * "Data at rest": the database file on disk can be stolen. The fix is to
 * encrypt sensitive fields in the APPLICATION layer, before they are
 * written to the database (field/column encryption).
 *
 * This program creates a SQLite database and adds two customer records.
 * The "name" field is PLAIN; the "card_encrypted" field is stored as an
 * AES-256-GCM-encrypted BLOB (nonce + ciphertext + tag).
 *
 *   sqlite_field create <db>   -> sets up the DB, inserts 2 records
 *   sqlite_field read   <db>   -> decrypts with the key and prints
 *
 * The key is NOT embedded in the source; it is given through the SIM_KEY
 * environment variable (64 hex digits). Without the key, dumping the DB
 * only shows a ciphertext blob.
 *
 * SQLite: on Linux, <sqlite3.h> + sqlite3; on Windows, the Windows SDK's
 * built-in winsqlite3 library. Crypto: the shared cen429_crypto.h.
 * All values are synthetic (made up).
 */
#include "cen429_demo.h"
#include "cen429_crypto.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#ifdef _WIN32
#include <winsqlite/winsqlite3.h>
#else
#include <sqlite3.h>
#endif

#define NONCE_LEN 12
#define TAG_LEN 16
#define KEY_LEN 32

static void fail(const char *m)
{
    fprintf(stderr, "ERROR: %s\n", m);
    exit(1);
}

/* SIM_KEY environment variable (64 hex digits) -> a 32-byte key. */
static void get_key(unsigned char *key)
{
    const char *h = getenv("SIM_KEY");
    if (!h || strlen(h) != 64)
        fail("the SIM_KEY environment variable must be 64 hex digits");
    for (int i = 0; i < KEY_LEN; i++) {
        unsigned v;
        if (sscanf(h + 2 * i, "%2x", &v) != 1)
            fail("SIM_KEY is not hex");
        key[i] = (unsigned char)v;
    }
}

/* plain -> [nonce|ciphertext|tag]. out must hold at least plain_len+28 bytes. */
static int gcm_pack(const unsigned char *key,
                    const unsigned char *plain, int plain_len,
                    unsigned char *out)
{
    unsigned char nonce[NONCE_LEN], tag[TAG_LEN];
    crypto_random(nonce, NONCE_LEN);
    memcpy(out, nonce, NONCE_LEN);
    if (!crypto_gcm_encrypt(key, nonce, NONCE_LEN, NULL, 0, plain,
                            (size_t)plain_len, out + NONCE_LEN, tag))
        fail("encryption failed");
    memcpy(out + NONCE_LEN + plain_len, tag, TAG_LEN);
    return NONCE_LEN + plain_len + TAG_LEN;
}

/* [nonce|ciphertext|tag] -> plain. Returns -1 if verification fails. */
static int gcm_unpack(const unsigned char *key, const unsigned char *data,
                  int len, unsigned char *plain)
{
    if (len < NONCE_LEN + TAG_LEN)
        return -1;
    int ct_len = len - NONCE_LEN - TAG_LEN;
    const unsigned char *nonce = data;
    const unsigned char *ct = data + NONCE_LEN;
    const unsigned char *tag = data + NONCE_LEN + ct_len;
    if (!crypto_gcm_decrypt(key, nonce, NONCE_LEN, NULL, 0, ct,
                        (size_t)ct_len, tag, plain))
        return -1;
    return ct_len;
}

static void insert_row(sqlite3 *db, const unsigned char *key,
                 const char *name, const char *card)
{
    unsigned char ct[128];
    int ctn = gcm_pack(key, (const unsigned char *)card,
                          (int)strlen(card), ct);
    sqlite3_stmt *st;
    sqlite3_prepare_v2(db,
        "INSERT INTO customer(name, card_encrypted) VALUES(?, ?)", -1, &st,
        NULL);
    sqlite3_bind_text(st, 1, name, -1, SQLITE_TRANSIENT);
    sqlite3_bind_blob(st, 2, ct, ctn, SQLITE_TRANSIENT);
    if (sqlite3_step(st) != SQLITE_DONE)
        fail("could not insert the record");
    sqlite3_finalize(st);
}

static int create_db(const char *path)
{
    unsigned char key[KEY_LEN];
    get_key(key);
    sqlite3 *db;
    if (sqlite3_open(path, &db) != SQLITE_OK)
        fail("could not open the database");
    sqlite3_exec(db, "DROP TABLE IF EXISTS customer;", NULL, NULL, NULL);
    sqlite3_exec(db,
        "CREATE TABLE customer(id INTEGER PRIMARY KEY, name TEXT, "
        "card_encrypted BLOB);", NULL, NULL, NULL);
    insert_row(db, key, "Jane Doe", "4242-4242-4242-4242");
    insert_row(db, key, "John Smith", "5555-4444-3333-2222");
    sqlite3_close(db);
    printf("Database created: %s (2 records)\n", path);
    printf("The 'name' field is plain; 'card_encrypted' is AES-256-GCM "
           "encrypted.\n");
    crypto_wipe(key, sizeof(key));
    return 0;
}

static int read_db(const char *path)
{
    unsigned char key[KEY_LEN];
    get_key(key);
    sqlite3 *db;
    if (sqlite3_open(path, &db) != SQLITE_OK)
        fail("could not open the database");
    sqlite3_stmt *st;
    sqlite3_prepare_v2(db, "SELECT id, name, card_encrypted FROM customer;",
                       -1, &st, NULL);
    printf("id | name          | card (decrypted)\n");
    printf("---+---------------+--------------------\n");
    while (sqlite3_step(st) == SQLITE_ROW) {
        int id = sqlite3_column_int(st, 0);
        const char *name = (const char *)sqlite3_column_text(st, 1);
        const unsigned char *ct = (const unsigned char *)
            sqlite3_column_blob(st, 2);
        int ctn = sqlite3_column_bytes(st, 2);
        unsigned char plain[128];
        int pn = gcm_unpack(key, ct, ctn, plain);
        if (pn < 0)
            printf("%2d | %-13s | (COULD NOT DECRYPT - wrong key?)\n", id,
                   name);
        else {
            plain[pn] = '\0';
            printf("%2d | %-13s | %s\n", id, name, plain);
        }
    }
    sqlite3_finalize(st);
    sqlite3_close(db);
    crypto_wipe(key, sizeof(key));
    return 0;
}

int main(int argc, char **argv)
{
    demo_prepare();
    if (argc != 3) {
        fprintf(stderr, "Usage: %s <create|read> <db>\n", argv[0]);
        return 1;
    }
    if (strcmp(argv[1], "create") == 0)
        return create_db(argv[2]);
    if (strcmp(argv[1], "read") == 0)
        return read_db(argv[2]);
    fprintf(stderr, "Unknown command: %s\n", argv[1]);
    return 1;
}
