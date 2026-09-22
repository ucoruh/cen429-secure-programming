/*
 * CEN429 - Hafta 3 - Demo 7: Veritabaninda hassas alani AES-GCM ile sifreleme
 *
 * "Beklemede veri" (data at rest): diskteki veritabani dosyasi
 * calinabilir. Cozum: hassas alanlari veritabanina yazmadan ONCE
 * uygulama katmaninda sifrelemek (alan/sutun sifreleme).
 *
 * Bu program bir SQLite veritabani olusturur ve iki musteri kaydi
 * ekler. "ad" alani ACIK, "kart_sifreli" alani AES-256-GCM ile
 * sifreli BLOB olarak saklanir (nonce + sifreli metin + etiket).
 *
 *   sqlite_alan olustur <db>   -> DB kurar, 2 kayit ekler
 *   sqlite_alan oku     <db>   -> anahtarla cozup gosterir
 *
 * Anahtar kaynak koda GOMULU DEGIL; ortam degiskeni SIM_ANAHTAR
 * (64 hex hane) ile verilir. Anahtarsiz DB dokumu yalniz sifreli
 * bayt yigini gosterir.
 *
 * SQLite: Linux'ta <sqlite3.h> + sqlite3; Windows'ta Windows SDK'nin
 * yerlesik winsqlite3 kitapligi. Kripto: ortak cen429_kripto.h.
 * Butun degerler sentetiktir (uydurma).
 */
#include "cen429_demo.h"
#include "cen429_kripto.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#ifdef _WIN32
#include <winsqlite/winsqlite3.h>
#else
#include <sqlite3.h>
#endif

#define NONCE_BOYU 12
#define ETIKET_BOYU 16
#define ANAHTAR_BOYU 32

static void hata(const char *m)
{
    fprintf(stderr, "HATA: %s\n", m);
    exit(1);
}

/* Ortam degiskeni SIM_ANAHTAR (64 hex hane) -> 32 baytlik anahtar. */
static void anahtar_al(unsigned char *anahtar)
{
    const char *h = getenv("SIM_ANAHTAR");
    if (!h || strlen(h) != 64)
        hata("SIM_ANAHTAR ortam degiskeni 64 hex hane olmali");
    for (int i = 0; i < ANAHTAR_BOYU; i++) {
        unsigned v;
        if (sscanf(h + 2 * i, "%2x", &v) != 1)
            hata("SIM_ANAHTAR hex degil");
        anahtar[i] = (unsigned char)v;
    }
}

/* duz -> [nonce|sifreli|etiket]. cik en az duz_boy+28 bayt olmali. */
static int gcm_paketle(const unsigned char *anahtar,
                       const unsigned char *duz, int duz_boy,
                       unsigned char *cik)
{
    unsigned char nonce[NONCE_BOYU], tag[ETIKET_BOYU];
    kripto_rastgele(nonce, NONCE_BOYU);
    memcpy(cik, nonce, NONCE_BOYU);
    if (!kripto_gcm_sifrele(anahtar, nonce, NONCE_BOYU, NULL, 0, duz,
                            (size_t)duz_boy, cik + NONCE_BOYU, tag))
        hata("sifreleme basarisiz");
    memcpy(cik + NONCE_BOYU + duz_boy, tag, ETIKET_BOYU);
    return NONCE_BOYU + duz_boy + ETIKET_BOYU;
}

/* [nonce|sifreli|etiket] -> duz. Dogrulama basarisizsa -1. */
static int gcm_ac(const unsigned char *anahtar, const unsigned char *ver,
                  int boy, unsigned char *duz)
{
    if (boy < NONCE_BOYU + ETIKET_BOYU)
        return -1;
    int sc = boy - NONCE_BOYU - ETIKET_BOYU;
    const unsigned char *nonce = ver;
    const unsigned char *ct = ver + NONCE_BOYU;
    const unsigned char *tag = ver + NONCE_BOYU + sc;
    if (!kripto_gcm_coz(anahtar, nonce, NONCE_BOYU, NULL, 0, ct,
                        (size_t)sc, tag, duz))
        return -1;
    return sc;
}

static void ekle(sqlite3 *db, const unsigned char *anahtar,
                 const char *ad, const char *kart)
{
    unsigned char sc[128];
    int scn = gcm_paketle(anahtar, (const unsigned char *)kart,
                          (int)strlen(kart), sc);
    sqlite3_stmt *st;
    sqlite3_prepare_v2(db,
        "INSERT INTO musteri(ad, kart_sifreli) VALUES(?, ?)", -1, &st,
        NULL);
    sqlite3_bind_text(st, 1, ad, -1, SQLITE_TRANSIENT);
    sqlite3_bind_blob(st, 2, sc, scn, SQLITE_TRANSIENT);
    if (sqlite3_step(st) != SQLITE_DONE)
        hata("kayit eklenemedi");
    sqlite3_finalize(st);
}

static int olustur(const char *yol)
{
    unsigned char anahtar[ANAHTAR_BOYU];
    anahtar_al(anahtar);
    sqlite3 *db;
    if (sqlite3_open(yol, &db) != SQLITE_OK)
        hata("veritabani acilamadi");
    sqlite3_exec(db, "DROP TABLE IF EXISTS musteri;", NULL, NULL, NULL);
    sqlite3_exec(db,
        "CREATE TABLE musteri(id INTEGER PRIMARY KEY, ad TEXT, "
        "kart_sifreli BLOB);", NULL, NULL, NULL);
    ekle(db, anahtar, "Ayse Yilmaz", "4242-4242-4242-4242");
    ekle(db, anahtar, "Mehmet Kaya", "5555-4444-3333-2222");
    sqlite3_close(db);
    printf("Veritabani kuruldu: %s (2 kayit)\n", yol);
    printf("'ad' alani acik, 'kart_sifreli' alani AES-256-GCM ile "
           "sifreli.\n");
    kripto_temizle(anahtar, sizeof(anahtar));
    return 0;
}

static int oku(const char *yol)
{
    unsigned char anahtar[ANAHTAR_BOYU];
    anahtar_al(anahtar);
    sqlite3 *db;
    if (sqlite3_open(yol, &db) != SQLITE_OK)
        hata("veritabani acilamadi");
    sqlite3_stmt *st;
    sqlite3_prepare_v2(db, "SELECT id, ad, kart_sifreli FROM musteri;",
                       -1, &st, NULL);
    printf("id | ad            | kart (cozulmus)\n");
    printf("---+---------------+--------------------\n");
    while (sqlite3_step(st) == SQLITE_ROW) {
        int id = sqlite3_column_int(st, 0);
        const char *ad = (const char *)sqlite3_column_text(st, 1);
        const unsigned char *sc = (const unsigned char *)
            sqlite3_column_blob(st, 2);
        int scn = sqlite3_column_bytes(st, 2);
        unsigned char duz[128];
        int dn = gcm_ac(anahtar, sc, scn, duz);
        if (dn < 0)
            printf("%2d | %-13s | (COZULEMEDI - anahtar yanlis?)\n", id,
                   ad);
        else {
            duz[dn] = '\0';
            printf("%2d | %-13s | %s\n", id, ad, duz);
        }
    }
    sqlite3_finalize(st);
    sqlite3_close(db);
    kripto_temizle(anahtar, sizeof(anahtar));
    return 0;
}

int main(int argc, char **argv)
{
    demo_hazirla();
    if (argc != 3) {
        fprintf(stderr, "Kullanim: %s <olustur|oku> <db>\n", argv[0]);
        return 1;
    }
    if (strcmp(argv[1], "olustur") == 0)
        return olustur(argv[2]);
    if (strcmp(argv[1], "oku") == 0)
        return oku(argv[2]);
    fprintf(stderr, "Bilinmeyen komut: %s\n", argv[1]);
    return 1;
}
