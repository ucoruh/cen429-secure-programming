/* Unit tests for week-03/07-sqlite-field/sqlite_field.c.
 *
 * gcm_pack()/gcm_unpack() are tested directly (pure, in-memory, no SQLite dependency). The
 * create_db()/read_db() integration is also exercised in-process: SIM_KEY is set with the
 * platform's own setenv before calling them, so get_key()'s fail()/exit() path is never hit here
 * (a missing/malformed SIM_KEY is intentionally NOT tested in-process, same reasoning as the
 * other demos' fail()-calling paths).
 */
#define main program_main
#include "../sqlite_field.c"
#undef main
#include "../../../common/test_check.h"

#ifdef _WIN32
#include <direct.h>
static void set_env(const char *name, const char *value) { _putenv_s(name, value); }
static void mkdir_bin(void) { _mkdir("bin"); }
#else
#include <sys/stat.h>
static void set_env(const char *name, const char *value) { setenv(name, value, 1); }
static void mkdir_bin(void) { mkdir("bin", 0755); }
#endif

int main(void)
{
    mkdir_bin();
    unsigned char key[KEY_LEN]; memset(key, 0x42, KEY_LEN);

    /* --- gcm_pack()/gcm_unpack(): round trip for several sizes ------------------------------ */
    {
        const unsigned char msg[] = "4242-4242-4242-4242";
        unsigned char packed[64], back[64];
        int n = gcm_pack(key, msg, (int)strlen((const char *)msg), packed);
        CHECK_EQ_INT(n, NONCE_LEN + (int)strlen((const char *)msg) + TAG_LEN);
        int m = gcm_unpack(key, packed, n, back);
        CHECK_EQ_INT(m, (int)strlen((const char *)msg));
        CHECK_MEM(back, msg, strlen((const char *)msg));
    }
    {
        unsigned char packed[64], back[8];
        int n = gcm_pack(key, (const unsigned char *)"", 0, packed);
        CHECK_EQ_INT(n, NONCE_LEN + TAG_LEN);
        CHECK_EQ_INT(gcm_unpack(key, packed, n, back), 0);
    }

    /* --- tamper detection: ciphertext byte, tag byte, wrong key ---------------------------- */
    {
        const unsigned char msg[] = "5555-4444-3333-2222";
        unsigned char packed[64], back[64];
        int n = gcm_pack(key, msg, (int)strlen((const char *)msg), packed);
        packed[NONCE_LEN + 2] ^= 0x01;
        CHECK_EQ_INT(gcm_unpack(key, packed, n, back), -1);
    }
    {
        const unsigned char msg[] = "5555-4444-3333-2222";
        unsigned char packed[64], back[64];
        int n = gcm_pack(key, msg, (int)strlen((const char *)msg), packed);
        packed[n - 1] ^= 0x01;
        CHECK_EQ_INT(gcm_unpack(key, packed, n, back), -1);
    }
    {
        const unsigned char msg[] = "5555-4444-3333-2222";
        unsigned char wrong_key[KEY_LEN]; memset(wrong_key, 0x99, KEY_LEN);
        unsigned char packed[64], back[64];
        int n = gcm_pack(key, msg, (int)strlen((const char *)msg), packed);
        CHECK_EQ_INT(gcm_unpack(wrong_key, packed, n, back), -1);
    }
    /* gcm_unpack() rejects a too-short blob instead of reading out of bounds */
    {
        unsigned char tiny[NONCE_LEN + TAG_LEN - 1]; memset(tiny, 0, sizeof(tiny));
        unsigned char back[8];
        CHECK_EQ_INT(gcm_unpack(key, tiny, sizeof(tiny), back), -1);
    }

    /* --- in-process SQLite integration: create_db() + direct verification queries ---------- */
    set_env("SIM_KEY", "4242424242424242424242424242424242424242424242424242424242424242");
    /* 64 hex digits -> 32 bytes of 0x42, matching `key` above (get_key() requires exactly 64). */
    CHECK_EQ_INT(create_db("bin/test-customers.db"), 0);

    {
        unsigned char sim_key[KEY_LEN]; memset(sim_key, 0x42, KEY_LEN);
        sqlite3 *db;
        CHECK_EQ_INT(sqlite3_open("bin/test-customers.db", &db), SQLITE_OK);
        sqlite3_stmt *st;
        sqlite3_prepare_v2(db, "SELECT id, name, card_encrypted FROM customer ORDER BY id;", -1, &st, NULL);
        int rows = 0;
        const char *expect_name[2] = { "Jane Doe", "John Smith" };
        const char *expect_card[2] = { "4242-4242-4242-4242", "5555-4444-3333-2222" };
        while (sqlite3_step(st) == SQLITE_ROW) {
            const char *name = (const char *)sqlite3_column_text(st, 1);
            const unsigned char *ct = (const unsigned char *)sqlite3_column_blob(st, 2);
            int ctn = sqlite3_column_bytes(st, 2);
            unsigned char plain[64];
            int pn = gcm_unpack(sim_key, ct, ctn, plain);
            CHECK(pn > 0);
            plain[pn] = '\0';
            if (rows < 2) {
                CHECK_EQ_STR(name, expect_name[rows]);
                CHECK_EQ_STR((const char *)plain, expect_card[rows]);
            }
            rows++;
        }
        CHECK_EQ_INT(rows, 2);
        sqlite3_finalize(st);
        sqlite3_close(db);
    }

    /* read_db() itself must run cleanly with the right key ... */
    CHECK_EQ_INT(read_db("bin/test-customers.db"), 0);
    /* ... and must NOT crash or fail() even with the WRONG key (each row just fails to decrypt) */
    set_env("SIM_KEY", "9999999999999999999999999999999999999999999999999999999999999999");
    CHECK_EQ_INT(read_db("bin/test-customers.db"), 0);

    TEST_SUMMARY();
}
