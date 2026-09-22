/*
 * CEN429 - Hafta 2 - Demo 11: Kurcalamaya dayanikli gunluk
 *                              (HMAC ozet zinciri + anahtar evrimi)
 *
 * KONU: Bir denetim gunlugu, saldirganin elindeki bir makinede tutuluyor.
 * Saldirgan makineyi ele gecirirse gecmis kayitlari FARK EDILMEDEN
 * degistiremesin ya da silemesin isteriz. Iki fikir birlestirilir:
 *
 *  1) OZET ZINCIRI: her kaydin MAC'i, bir onceki kaydin MAC'ini de
 *     kapsar:  mac_i = HMAC(K_i, mac_{i-1} || seq_i || mesaj_i).
 *     Boylece bir kaydi degistirmek, silmek ya da yeniden siralamak
 *     zinciri kirar -> dogrulama yakalar.
 *
 *  2) ANAHTAR EVRIMI (ileriye guvenli): her kayittan sonra anahtar
 *     tek yonlu ilerletilir:  K_{i+1} = HMAC(K_i, "cen429-evrim")
 *     ve K_i SILINIR. K tek yonlu turetildigi icin, saldirgan t
 *     aninda yalniz GUNCEL anahtari (K_t) ele gecirir; ondan ESKI
 *     anahtarlari (K_j, j<t) geri hesaplayamaz. Sonuc: gecmis
 *     kayitlar icin gecerli MAC uretemez (Schneier-Kelsey, 1999).
 *
 * Karsilastirma icin STATIK anahtar modu da vardir: tek sabit anahtar.
 * Statik modda ele gecirilen anahtar = ilk anahtar oldugu icin
 * saldirgan gecmisi yeniden yazabilir; EVRIM modunda yazamaz.
 *
 * GUVENLI benzetim: yalniz calisma/ altina yazar; anahtar dosyalari
 * ders icin diskte tutulur (gercekte 'dogrulayici anahtari' cevrimdisi,
 * guvenli bir yerde durur). HMAC/SHA-256 icin ortak cen429_kripto.h.
 *
 * Kullanim:
 *   uret     <dizin> <statik|evrim>          ornek gunluk + anahtarlar
 *   dogrula  <log> <k0-anahtar>              zinciri dogrula
 *   degistir <log> <seq> <yeni-mesaj>        ham kurcalama (MAC ayni)
 *   sil      <log> <seq>                     bir kaydi sil
 *   yerdeg   <log> <seqA> <seqB>             iki kaydi yer degistir
 *   sahtele  <log> <seq> <yeni> <ele-anahtar>  saldirgan MAC'i yeniler
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include "cen429_demo.h"
#include "cen429_kripto.h"

#define AZAMI_KAYIT 64
#define MSJ_BOY 96

struct kayit {
    int seq;
    char mesaj[MSJ_BOY];
    unsigned char mac[32];
};

static struct kayit g[AZAMI_KAYIT];
static int gn;
static int g_evrim;                    /* 1 = anahtar evrimi acik */

static void hex_yaz(FILE *f, const unsigned char *b, size_t n)
{
    for (size_t i = 0; i < n; i++)
        fprintf(f, "%02x", b[i]);
}

static int hex_oku(const char *s, unsigned char *b, size_t n)
{
    for (size_t i = 0; i < n; i++) {
        unsigned v;
        if (sscanf(s + 2 * i, "%02x", &v) != 1)
            return 0;
        b[i] = (unsigned char)v;
    }
    return 1;
}

/* Anahtari tek yonlu ilerlet: K' = HMAC(K, "cen429-evrim"). */
static void evrimlet(unsigned char k[32])
{
    unsigned char yeni[32];
    kripto_hmac_sha256(k, 32, "cen429-evrim", 12, yeni);
    memcpy(k, yeni, 32);
    kripto_temizle(yeni, sizeof yeni);
}

/* Bir kaydin MAC'i: HMAC(K_i, mac_onceki(32) || seq(4 BE) || mesaj). */
static void kayit_mac(const unsigned char k[32],
                      const unsigned char onceki[32],
                      int seq, const char *mesaj, unsigned char cikti[32])
{
    unsigned char tampon[32 + 4 + MSJ_BOY];
    size_t mlen = strlen(mesaj);
    if (mlen > MSJ_BOY) mlen = MSJ_BOY;
    memcpy(tampon, onceki, 32);
    tampon[32] = (unsigned char)(seq >> 24);
    tampon[33] = (unsigned char)(seq >> 16);
    tampon[34] = (unsigned char)(seq >> 8);
    tampon[35] = (unsigned char)(seq);
    memcpy(tampon + 36, mesaj, mlen);
    kripto_hmac_sha256(k, 32, tampon, 36 + mlen, cikti);
}

/* Gunluk dosyasini oku: baslik + kayitlar. */
static int log_oku(const char *yol)
{
    FILE *f = fopen(yol, "r");
    if (!f) { perror(yol); return 0; }
    char satir[512];
    gn = 0;
    g_evrim = 0;
    if (!fgets(satir, sizeof satir, f)) { fclose(f); return 0; }
    /* Baslik: ZINCIR/1 <statik|evrim> <N> */
    char mod[16];
    int n = 0;
    if (sscanf(satir, "ZINCIR/1 %15s %d", mod, &n) != 2) {
        fclose(f); return 0;
    }
    g_evrim = (strcmp(mod, "evrim") == 0);
    while (fgets(satir, sizeof satir, f) && gn < AZAMI_KAYIT) {
        satir[strcspn(satir, "\r\n")] = '\0';
        if (satir[0] == '\0') continue;
        /* seq|mesaj|mac-hex */
        char *p1 = strchr(satir, '|');
        if (!p1) continue;
        char *p2 = strchr(p1 + 1, '|');
        if (!p2) continue;
        *p1 = '\0'; *p2 = '\0';
        struct kayit *k = &g[gn];
        k->seq = atoi(satir);
        snprintf(k->mesaj, sizeof k->mesaj, "%s", p1 + 1);
        if (!hex_oku(p2 + 1, k->mac, 32)) continue;
        gn++;
    }
    fclose(f);
    (void)n;
    return 1;
}

static int log_yaz(const char *yol)
{
    FILE *f = fopen(yol, "w");
    if (!f) { perror(yol); return 0; }
    fprintf(f, "ZINCIR/1 %s %d\n", g_evrim ? "evrim" : "statik", gn);
    for (int i = 0; i < gn; i++) {
        fprintf(f, "%d|%s|", g[i].seq, g[i].mesaj);
        hex_yaz(f, g[i].mac, 32);
        fprintf(f, "\n");
    }
    fclose(f);
    return 1;
}

static int dosya_yaz_ham(const char *yol, const unsigned char *b, size_t n)
{
    FILE *f = fopen(yol, "wb");
    if (!f) { perror(yol); return 0; }
    fwrite(b, 1, n, f);
    fclose(f);
    return 1;
}

static int uret(const char *dizin, const char *mod)
{
    const char *ornek[] = {
        "cuzdan acildi",
        "kart yuklendi kart=1",
        "odeme baslatildi tutar=25",
        "odeme onaylandi",
        "kayit silindi kart=1",
        "oturum kapandi",
    };
    int N = (int)(sizeof ornek / sizeof ornek[0]);
    g_evrim = (strcmp(mod, "evrim") == 0);

    unsigned char k0[32], k[32], onceki[32];
    if (!kripto_rastgele(k0, 32)) {
        fprintf(stderr, "rastgele uretilemedi\n");
        return 1;
    }
    memcpy(k, k0, 32);
    memset(onceki, 0, 32);             /* mac_0 = sifir (baslangic) */

    gn = 0;
    for (int i = 0; i < N; i++) {
        struct kayit *r = &g[gn];
        r->seq = i + 1;
        snprintf(r->mesaj, sizeof r->mesaj, "%s", ornek[i]);
        kayit_mac(k, onceki, r->seq, r->mesaj, r->mac);
        memcpy(onceki, r->mac, 32);
        gn++;
        if (g_evrim)
            evrimlet(k);               /* K_i silinir, K_{i+1} kalir */
    }
    /* Bu noktada 'k' = ele gecirme aninda makinede kalan anahtar:
     *   evrim modunda K_N (eski anahtarlar silindi),
     *   statik modunda hala K_0 (hic degismedi).
     * Statik modda evrimlet cagrilmadigi icin k == k0. */

    char yol[512];
    snprintf(yol, sizeof yol, "%s/erisim.zdenetim", dizin);
    if (!log_yaz(yol)) return 1;
    snprintf(yol, sizeof yol, "%s/dogrulayici.anahtar", dizin);
    if (!dosya_yaz_ham(yol, k0, 32)) return 1;   /* cevrimdisi dogrulayici */
    snprintf(yol, sizeof yol, "%s/ele-gecirilen.anahtar", dizin);
    if (!dosya_yaz_ham(yol, k, 32)) return 1;    /* saldirganin gordugu */

    printf("  Gunluk (%s) yazildi: %d kayit -> %s/erisim.zdenetim\n",
           g_evrim ? "anahtar evrimi" : "statik anahtar", gn, dizin);
    printf("  Cevrimdisi dogrulayici anahtari: dogrulayici.anahtar\n");
    printf("  Ele gecirme aninda makinedeki anahtar: "
           "ele-gecirilen.anahtar\n");
    kripto_temizle(k, 32);
    kripto_temizle(k0, 32);
    return 0;
}

static int dogrula(const char *log, const char *anahtar_yol)
{
    if (!log_oku(log)) return 1;
    FILE *f = fopen(anahtar_yol, "rb");
    if (!f) { perror(anahtar_yol); return 1; }
    unsigned char k[32];
    if (fread(k, 1, 32, f) != 32) { fclose(f); return 1; }
    fclose(f);

    unsigned char onceki[32];
    memset(onceki, 0, 32);
    int hata = 0;
    int onceki_seq = 0;
    for (int i = 0; i < gn; i++) {
        unsigned char beklenen[32];
        kayit_mac(k, onceki, g[i].seq, g[i].mesaj, beklenen);
        int ok = memcmp(beklenen, g[i].mac, 32) == 0;
        int sira_ok = (g[i].seq == onceki_seq + 1);
        printf("  #%d seq=%d \"%s\"  MAC:%s%s\n", i + 1, g[i].seq,
               g[i].mesaj, ok ? "OK" : "BOZUK",
               sira_ok ? "" : "  SIRA:BOZUK");
        if (!ok || !sira_ok) hata = 1;
        memcpy(onceki, g[i].mac, 32);  /* zincir: gercek MAC uzerinden */
        onceki_seq = g[i].seq;
        if (g_evrim)
            evrimlet(k);
    }
    kripto_temizle(k, 32);
    if (hata)
        printf("  >>> SONUC: gunluk KURCALANMIS (dogrulama basarisiz).\n");
    else
        printf("  >>> SONUC: gunluk BUTUNLUKLU (tum kayitlar dogrulandi).\n");
    return hata ? 3 : 0;
}

static int idx_bul(int seq)
{
    for (int i = 0; i < gn; i++)
        if (g[i].seq == seq) return i;
    return -1;
}

static int degistir(const char *log, int seq, const char *yeni)
{
    if (!log_oku(log)) return 1;
    int i = idx_bul(seq);
    if (i < 0) { fprintf(stderr, "seq bulunamadi\n"); return 1; }
    snprintf(g[i].mesaj, sizeof g[i].mesaj, "%s", yeni);
    /* MAC ELLENMEDI: saldirgan yeni MAC hesaplayamiyor varsayimi. */
    log_yaz(log);
    printf("  seq=%d mesaji \"%s\" olarak degistirildi (MAC eski).\n",
           seq, yeni);
    return 0;
}

static int sil(const char *log, int seq)
{
    if (!log_oku(log)) return 1;
    int i = idx_bul(seq);
    if (i < 0) { fprintf(stderr, "seq bulunamadi\n"); return 1; }
    for (int j = i; j < gn - 1; j++)
        g[j] = g[j + 1];
    gn--;
    log_yaz(log);
    printf("  seq=%d kaydi silindi (%d kayit kaldi).\n", seq, gn);
    return 0;
}

static int yerdeg(const char *log, int a, int b)
{
    if (!log_oku(log)) return 1;
    int ia = idx_bul(a), ib = idx_bul(b);
    if (ia < 0 || ib < 0) { fprintf(stderr, "seq bulunamadi\n"); return 1; }
    struct kayit t = g[ia]; g[ia] = g[ib]; g[ib] = t;
    log_yaz(log);
    printf("  seq=%d ile seq=%d yer degistirdi.\n", a, b);
    return 0;
}

/* Saldirgan: seq kaydini degistirir ve ELINDEKI anahtarla seq'ten
 * itibaren tum MAC'leri yeniden hesaplar. Elindeki tek anahtar
 * oldugu icin her kayda AYNI anahtari uygular. Evrim modunda
 * dogrulayici her kayitta farkli anahtar bekler -> yakalanir.
 * Statik modda tek anahtar dogru -> yakalanmaz. */
static int sahtele(const char *log, int seq, const char *yeni,
                   const char *ele_yol)
{
    if (!log_oku(log)) return 1;
    int i = idx_bul(seq);
    if (i < 0) { fprintf(stderr, "seq bulunamadi\n"); return 1; }
    FILE *f = fopen(ele_yol, "rb");
    if (!f) { perror(ele_yol); return 1; }
    unsigned char k[32];
    if (fread(k, 1, 32, f) != 32) { fclose(f); return 1; }
    fclose(f);

    snprintf(g[i].mesaj, sizeof g[i].mesaj, "%s", yeni);
    unsigned char onceki[32];
    if (i == 0) memset(onceki, 0, 32);
    else memcpy(onceki, g[i - 1].mac, 32);
    for (int j = i; j < gn; j++) {
        kayit_mac(k, onceki, g[j].seq, g[j].mesaj, g[j].mac);
        memcpy(onceki, g[j].mac, 32);
    }
    kripto_temizle(k, 32);
    log_yaz(log);
    printf("  Saldiri: seq=%d \"%s\" yapildi ve ele gecirilen anahtarla\n"
           "  seq=%d..%d MAC'leri yeniden hesaplandi.\n",
           seq, yeni, seq, g[gn - 1].seq);
    return 0;
}

int main(int argc, char **argv)
{
    demo_hazirla();
    if (argc == 4 && strcmp(argv[1], "uret") == 0)
        return uret(argv[2], argv[3]);
    if (argc == 4 && strcmp(argv[1], "dogrula") == 0)
        return dogrula(argv[2], argv[3]);
    if (argc == 5 && strcmp(argv[1], "degistir") == 0)
        return degistir(argv[2], atoi(argv[3]), argv[4]);
    if (argc == 4 && strcmp(argv[1], "sil") == 0)
        return sil(argv[2], atoi(argv[3]));
    if (argc == 5 && strcmp(argv[1], "yerdeg") == 0)
        return yerdeg(argv[2], atoi(argv[3]), atoi(argv[4]));
    if (argc == 6 && strcmp(argv[1], "sahtele") == 0)
        return sahtele(argv[2], atoi(argv[3]), argv[4], argv[5]);
    fprintf(stderr,
        "kullanim:\n"
        "  %s uret <dizin> <statik|evrim>\n"
        "  %s dogrula <log> <k0-anahtar>\n"
        "  %s degistir <log> <seq> <yeni-mesaj>\n"
        "  %s sil <log> <seq>\n"
        "  %s yerdeg <log> <seqA> <seqB>\n"
        "  %s sahtele <log> <seq> <yeni> <ele-anahtar>\n",
        argv[0], argv[0], argv[0], argv[0], argv[0], argv[0]);
    return 2;
}
