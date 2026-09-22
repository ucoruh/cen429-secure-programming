/*
 * CEN429 — Hafta 2 — Demo 3: Erişim denetimi ve biçimsel model simülatörü
 *
 * Kullanım: bin/linux/erisim <politika.txt>
 *
 * Aynı erişim isteklerini birkaç modele göre değerlendirir ve kararları
 * yan yana gösterir:
 *   DAC       Erişim denetim matrisi (sahibinin verdiği izinler)
 *   BLP       Bell–LaPadula: GİZLİLİK (yukarı okuma yok, aşağı yazma yok)
 *   BIBA      Biba katı bütünlük (aşağı okuma yok, yukarı yazma yok)
 *   BLP+BIBA  İkisi birden (veri hem gizli hem güvenilir kalsın)
 *   BIBA-LWM  Biba düşük su işareti: okuma serbest, ama özne daha az
 *             güvenilir bir nesneyi okuyunca kendi seviyesi DÜŞER
 *   CIN       Çin Seddi (Brewer–Nash): çıkar çatışması sınıfındaki ikinci
 *             şirketin verisi, birinciyi okuyan danışmana kapanır
 *
 * Etiket = (seviye, kategori kümesi). Etiket A, B'ye BASKINDIR (A dom B)
 * ancak ve ancak seviye(A) >= seviye(B) ve kategoriler(A) ⊇ kategoriler(B).
 *   BLP : oku -> özne dom nesne (ss-özelliği); yaz -> nesne dom özne (*)
 *   BIBA: oku -> nesne dom özne;               yaz -> özne dom nesne
 *
 * Bu bir SİMÜLATÖRDÜR: hiçbir gerçek dosyaya dokunmaz, yalnız politika
 * dosyasındaki kuralları uygular ve "izin ver / reddet" der.
 *
 * Politika dosyası biçimi (satır satır; # ile yorum):
 *   MODEL   <BLP|BIBA|BLP+BIBA|BIBA-LWM|CIN>   yürürlükteki zorunlu model
 *   SEVIYE  <ad> <sayi>                  gizlilik/bütünlük seviyesi tanımı
 *   OZNE    <ad> <seviye> [kat1,kat2]    kullanıcı/süreç, seviye, kategoriler
 *   NESNE   <ad> <seviye> [kat1,kat2]    dosya/kaynak, seviye, kategoriler
 *   SIRKET  <nesne> <sirket> <sinif>     Çin Seddi: şirket ve çatışma sınıfı
 *                                        ("-" "-" = arındırılmış, herkese açık)
 *   HAK     <ozne|*> <nesne|*> <r|w|rw>  DAC matrisi hücresi (* = hepsi)
 *   ISTEK   <ozne> <oku|yaz> <nesne>     değerlendirilecek erişim
 *
 * Etkin karar = DAC VE (yürürlükteki MAC modeli). BLP'nin "ds-özelliği"
 * tam olarak budur: zorunlu kural geçse bile matris izni de gerekir.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cen429_demo.h"

#define AZAMI 64
#define AD 32

struct etiketli {
    char ad[AD];
    int sev;
    unsigned kat;            /* kategori kümesi (bit maskesi) */
    char sirket[AD], sinif[AD];
    unsigned okunan;         /* CIN: bu öznenin okuduğu nesneler (bit) */
    unsigned long long okunan_ust; /* nesne 32..63 için */
};

static struct { char ad[AD]; int sev; } seviyeler[AZAMI];
static int seviye_n;
static char kategoriler[32][AD];
static int kategori_n;
static struct etiketli ozneler[AZAMI];
static int ozne_n;
static struct etiketli nesneler[AZAMI];
static int nesne_n;

/* DAC matrisi: hak[o][n] = 1 (oku) | 2 (yaz) bitleri */
static int hak[AZAMI][AZAMI];

/* Yürürlükteki MAC modeli: bit 1 = BLP, 2 = Biba, 4 = düşük su işareti,
   8 = Çin Seddi */
static int model = 1;
static const char *model_ad = "BLP";
static int etiket_goster; /* kategori ya da şirket tanımlandıysa 1 */

static int sev_bul(const char *ad)
{
    for (int i = 0; i < seviye_n; i++)
        if (strcmp(seviyeler[i].ad, ad) == 0)
            return seviyeler[i].sev;
    return -1;
}

static int idx_bul(struct etiketli *t, int n, const char *ad)
{
    for (int i = 0; i < n; i++)
        if (strcmp(t[i].ad, ad) == 0)
            return i;
    return -1;
}

static const char *sev_ad(int deger)
{
    for (int i = 0; i < seviye_n; i++)
        if (seviyeler[i].sev == deger)
            return seviyeler[i].ad;
    return "?";
}

/* "NUKLEER,AVRUPA" -> bit maskesi (yeni adlar kaydedilir) */
static unsigned kat_coz(char *metin)
{
    unsigned m = 0;
    if (!metin)
        return 0;
    for (char *p = strtok(metin, ","); p; p = strtok(NULL, ",")) {
        int i;
        for (i = 0; i < kategori_n; i++)
            if (strcmp(kategoriler[i], p) == 0)
                break;
        if (i == kategori_n && kategori_n < 32)
            snprintf(kategoriler[kategori_n++], AD, "%s", p);
        if (i < 32)
            m |= 1u << i;
    }
    etiket_goster = 1;
    return m;
}

static const char *kat_metni(unsigned m)
{
    static char t[2][160];
    static int s;
    char *b = t[s++ & 1];
    strcpy(b, "{");
    for (int i = 0; i < kategori_n; i++)
        if (m & (1u << i)) {
            if (b[1])
                strcat(b, ",");
            strcat(b, kategoriler[i]);
        }
    strcat(b, "}");
    return b;
}

/* a, b'ye baskın mı? */
static int baskin(int sa, unsigned ka, int sb, unsigned kb)
{
    return sa >= sb && (ka & kb) == kb;
}

static int okudu_mu(const struct etiketli *o, int ni)
{
    return ni < 32 ? (o->okunan >> ni) & 1u
                   : (int)((o->okunan_ust >> (ni - 32)) & 1ULL);
}

static void okundu_isaretle(struct etiketli *o, int ni)
{
    if (ni < 32)
        o->okunan |= 1u << ni;
    else
        o->okunan_ust |= 1ULL << (ni - 32);
}

static int arindirilmis(const struct etiketli *n)
{
    return strcmp(n->sinif, "-") == 0 || n->sinif[0] == '\0';
}

/* Çin Seddi kararı; neden[] çatışan şirketi yazar */
static int cin_seddi(int oi, int ni, int yaz, char *neden, size_t nb)
{
    const struct etiketli *o = &ozneler[oi], *n = &nesneler[ni];
    neden[0] = '\0';
    /* Basit güvenlik: okunmuş her nesne ya aynı şirkette ya da başka bir
       çatışma sınıfında olmalı (arındırılmış nesne her zaman serbest) */
    if (!arindirilmis(n))
        for (int j = 0; j < nesne_n; j++) {
            const struct etiketli *m = &nesneler[j];
            if (!okudu_mu(o, j) || arindirilmis(m))
                continue;
            if (strcmp(m->sinif, n->sinif) == 0 &&
                strcmp(m->sirket, n->sirket) != 0) {
                snprintf(neden, nb, "%s okundu; %s ayni sinifta (%s)",
                         m->sirket, n->sirket, n->sinif);
                return 0;
            }
        }
    if (!yaz)
        return 1;
    /* *-özelliği: özne başka bir şirketin arındırılmamış verisini okuduysa
       hiçbir yere yazamaz (bilgi duvarın öte yanına sızmasın) */
    for (int j = 0; j < nesne_n; j++) {
        const struct etiketli *m = &nesneler[j];
        if (okudu_mu(o, j) && !arindirilmis(m) &&
            strcmp(m->sirket, n->sirket) != 0) {
            snprintf(neden, nb, "%s verisi %s sizabilir", m->sirket,
                     arindirilmis(n) ? "kamuya acik nesneye"
                                     : "bu dosyadan disari");
            return 0;
        }
    }
    return 1;
}

/* Bir isteği modellere göre değerlendirip tek satır basar */
static void degerlendir(const char *o_ad, int yaz, const char *n_ad)
{
    int oi = idx_bul(ozneler, ozne_n, o_ad);
    int ni = idx_bul(nesneler, nesne_n, n_ad);
    if (oi < 0 || ni < 0) {
        printf("  %-8s %-3s %-10s  ! tanimsiz ozne/nesne\n", o_ad,
               yaz ? "YAZ" : "OKU", n_ad);
        return;
    }
    struct etiketli *o = &ozneler[oi];
    const struct etiketli *n = &nesneler[ni];
    int os = o->sev, ns = n->sev;
    unsigned ok_ = o->kat, nk = n->kat;

    /* DAC: matriste ilgili bit var mı? (BLP'nin ds-özelliği) */
    int dac = (hak[oi][ni] & (yaz ? 2 : 1)) != 0;

    /* BLP (gizlilik): oku -> özne dom nesne (ss-özelliği)
                       yaz -> nesne dom özne (*-özelliği) */
    int blp = yaz ? baskin(ns, nk, os, ok_) : baskin(os, ok_, ns, nk);

    /* Biba (bütünlük): oku -> nesne dom özne (aşağı okuma yok)
                        yaz -> özne dom nesne (yukarı yazma yok) */
    int biba = yaz ? baskin(os, ok_, ns, nk) : baskin(ns, nk, os, ok_);
    if ((model & 4) && !yaz)
        biba = 1; /* düşük su işareti: okuma serbest, seviye düşecek */

    char neden[96] = "";
    int cw = (model & 8) ? cin_seddi(oi, ni, yaz, neden, sizeof neden) : 1;

    /* Yürürlükteki modele göre MAC kararı */
    int mac = 1;
    if (model & 1)
        mac = mac && blp;
    if (model & 2)
        mac = mac && biba;
    if (model & 8)
        mac = mac && cw;
    int hepsi = dac && mac;

    if (model & 8)
        printf("  %-10s %-3s %-12s  DAC:%-3s CW:%-3s  => %s%s%s\n", o_ad,
               yaz ? "YAZ" : "OKU", n_ad, dac ? "VAR" : "yok",
               cw ? "OK" : "RED", hepsi ? "IZIN" : "RED",
               neden[0] ? "\n     ^ " : "", neden);
    else
        printf("  %-7s(%-4.4s) %-3s %-12s(%-4.4s) DAC:%-3s BLP:%-3s "
               "BIBA:%-3s  => %s\n",
               o_ad, sev_ad(os), yaz ? "YAZ" : "OKU", n_ad, sev_ad(ns),
               dac ? "VAR" : "yok", blp ? "OK" : "RED", biba ? "OK" : "RED",
               hepsi ? "IZIN" : "RED");

    if (!hepsi)
        return;
    /* Düşük su işareti: okunan nesne daha az güvenilirse öznenin
       etiketi en büyük alt sınıra (seviye min, kategori kesişimi) iner */
    if ((model & 4) && !yaz && !baskin(ns, nk, os, ok_)) {
        int yeni = os < ns ? os : ns;
        printf("     ^ dusuk su isareti: %s butunlugu %s -> %s\n", o_ad,
               sev_ad(os), sev_ad(yeni));
        o->sev = yeni;
        o->kat = ok_ & nk;
    }
    if ((model & 8) && !yaz)
        okundu_isaretle(o, ni);
}

static void etiketleri_yaz(void)
{
    printf("  Etiketler (seviye ve kategori kumesi):\n");
    for (int i = 0; i < ozne_n; i++)
        printf("    ozne  %-12s (%s, %s)\n", ozneler[i].ad,
               sev_ad(ozneler[i].sev), kat_metni(ozneler[i].kat));
    for (int i = 0; i < nesne_n; i++) {
        if (model & 8)
            printf("    nesne %-12s sirket=%s sinif=%s\n", nesneler[i].ad,
                   nesneler[i].sirket, nesneler[i].sinif);
        else
            printf("    nesne %-12s (%s, %s)\n", nesneler[i].ad,
                   sev_ad(nesneler[i].sev), kat_metni(nesneler[i].kat));
    }
}

static void satir_isle(char *satir)
{
    satir[strcspn(satir, "\r\n")] = '\0';
    char *yorum = strchr(satir, '#');
    if (yorum)
        *yorum = '\0';
    char *k = strtok(satir, " \t");
    if (!k)
        return;

    if (strcmp(k, "MODEL") == 0) {
        char *m = strtok(NULL, " \t");
        if (m && strcmp(m, "BLP") == 0) { model = 1; model_ad = "BLP"; }
        else if (m && strcmp(m, "BIBA") == 0) { model = 2; model_ad = "Biba"; }
        else if (m && strcmp(m, "BLP+BIBA") == 0) {
            model = 3;
            model_ad = "BLP+Biba";
        } else if (m && strcmp(m, "BIBA-LWM") == 0) {
            model = 2 | 4;
            model_ad = "Biba dusuk su isareti";
        } else if (m && strcmp(m, "CIN") == 0) {
            model = 8;
            model_ad = "Cin Seddi (Brewer-Nash)";
        }
    } else if (strcmp(k, "SEVIYE") == 0) {
        char *ad = strtok(NULL, " \t"), *s = strtok(NULL, " \t");
        if (ad && s && seviye_n < AZAMI) {
            snprintf(seviyeler[seviye_n].ad, AD, "%s", ad);
            seviyeler[seviye_n].sev = atoi(s);
            seviye_n++;
        }
    } else if (strcmp(k, "OZNE") == 0 || strcmp(k, "NESNE") == 0) {
        char *ad = strtok(NULL, " \t"), *sv = strtok(NULL, " \t");
        char *kt = strtok(NULL, " \t");
        int deger = sv ? sev_bul(sv) : -1;
        struct etiketli *t = (k[0] == 'O') ? ozneler : nesneler;
        int *n = (k[0] == 'O') ? &ozne_n : &nesne_n;
        if (ad && deger >= 0 && *n < AZAMI) {
            memset(&t[*n], 0, sizeof t[*n]);
            snprintf(t[*n].ad, AD, "%s", ad);
            t[*n].sev = deger;
            t[*n].kat = kt ? kat_coz(kt) : 0;
            (*n)++;
        } else {
            fprintf(stderr, "  uyari: tanimsiz seviye '%s'\n", sv ? sv : "");
        }
    } else if (strcmp(k, "SIRKET") == 0) {
        char *n = strtok(NULL, " \t"), *s = strtok(NULL, " \t");
        char *c = strtok(NULL, " \t");
        int ni = n ? idx_bul(nesneler, nesne_n, n) : -1;
        if (ni >= 0 && s && c) {
            snprintf(nesneler[ni].sirket, AD, "%s", s);
            snprintf(nesneler[ni].sinif, AD, "%s", c);
            etiket_goster = 1;
        }
    } else if (strcmp(k, "HAK") == 0) {
        char *o = strtok(NULL, " \t"), *n = strtok(NULL, " \t");
        char *h = strtok(NULL, " \t");
        if (!o || !n || !h)
            return;
        int bit = (strchr(h, 'r') ? 1 : 0) | (strchr(h, 'w') ? 2 : 0);
        for (int i = 0; i < ozne_n; i++)
            for (int j = 0; j < nesne_n; j++)
                if ((strcmp(o, "*") == 0 || strcmp(o, ozneler[i].ad) == 0) &&
                    (strcmp(n, "*") == 0 || strcmp(n, nesneler[j].ad) == 0))
                    hak[i][j] |= bit;
    } else if (strcmp(k, "ISTEK") == 0) {
        char *o = strtok(NULL, " \t"), *e = strtok(NULL, " \t");
        char *n = strtok(NULL, " \t");
        if (o && e && n)
            degerlendir(o, strcmp(e, "yaz") == 0, n);
    }
}

int main(int argc, char **argv)
{
    demo_hazirla();
    if (argc != 2) {
        fprintf(stderr, "kullanim: %s <politika.txt>\n", argv[0]);
        return 2;
    }
    FILE *f = fopen(argv[1], "r");
    if (!f) {
        perror(argv[1]);
        return 1;
    }
    char satir[256];
    /* Önce tanımlar, sonra istekler işlensin diye dosyayı iki kez okuruz:
       1. geçiş SEVIYE/OZNE/NESNE/HAK; 2. geçiş yalnız ISTEK (sırayla,
       çünkü düşük su işareti ve Çin Seddi GEÇMİŞE bağlıdır). */
    while (fgets(satir, sizeof satir, f))
        if (strncmp(satir, "ISTEK", 5) != 0)
            satir_isle(satir);
    rewind(f);
    printf("  Yururlukteki zorunlu (MAC) model: %s\n", model_ad);
    if (etiket_goster)
        etiketleri_yaz();
    if (model & 8)
        printf("  ozne       islem nesne         kararlar (etkin=DAC ve CW)\n");
    else
        printf("  ozne(seviye)   islem nesne(seviye)       kararlar "
               "(etkin=DAC ve MAC)\n");
    printf("  -------------------------------------------------------------\n");
    while (fgets(satir, sizeof satir, f))
        if (strncmp(satir, "ISTEK", 5) == 0)
            satir_isle(satir);
    fclose(f);
    return 0;
}
