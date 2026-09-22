/*
 * CEN429 — Hafta 2 — Demo 07: Mini kural motoru (YARA'dan esinlenildi)
 *
 * Kullanım: bin/.../motor <kurallar.txt> <dosya>...       (dosya başına özet)
 *           bin/.../motor -a <kurallar.txt> <dosya>        (ayrıntılı döküm)
 *
 * Bir kural; adlandırılmış dizgelerden (metin ya da joker içerebilen hex
 * desen) ve bunları birleştiren bir KOŞULDAN oluşur:
 *
 *   kural Ornek {
 *     dizge $a = "metin"
 *     hex   $b = { 4d 41 ?? 49 }       (?? = herhangi bir bayt)
 *     kosul $a and ($b or #a >= 3)
 *   }
 *
 * Koşul dili: $id (en az bir kez geçti mi), #id <op> n (kaç kez geçti),
 * and, or, not, ( ), "n of them", "all of them", "any of them", true, false.
 *
 * Kural dosyası da bir GİRDİDİR: sınırlar aşılırsa ya da sözdizimi bozuksa
 * satır/kural reddedilir. Program yalnız okur; hiçbir dosyayı değiştirmez.
 * Bu bir öğretim aracıdır; gerçek YARA'nın yerini tutmaz.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include "cen429_demo.h"

#define AZAMI_KURAL 32
#define AZAMI_DIZGE 8
#define AZAMI_DESEN 64
#define AZAMI_JETON 64
#define AZAMI_BOYUT (1024 * 1024)

struct dizge {
    char id[16];                      /* '$' olmadan */
    unsigned char desen[AZAMI_DESEN];
    unsigned char joker[AZAMI_DESEN]; /* 1: bu konumda her bayt uyar */
    size_t boy;
    int say;                          /* tarama sonucu: kaç kez geçti */
};

struct kural {
    char ad[48];
    struct dizge d[AZAMI_DIZGE];
    int nd;
    char kosul[256];
};

static struct kural kurallar[AZAMI_KURAL];
static int kural_sayisi;

/* ---------------- kural dosyasını okuma ---------------- */

static char *bosluk_atla(char *s)
{
    while (*s == ' ' || *s == '\t')
        s++;
    return s;
}

/* "dizge $id = "metin"" ya da "hex $id = { .. }" satırını çözer. */
static int dizge_satiri(struct kural *k, char *s, int hex, int satir_no)
{
    if (k->nd >= AZAMI_DIZGE) {
        fprintf(stderr, "satir %d: kuralda cok fazla dizge\n", satir_no);
        return -1;
    }
    struct dizge *d = &k->d[k->nd];
    memset(d, 0, sizeof *d);
    s = bosluk_atla(s);
    if (*s != '$') {
        fprintf(stderr, "satir %d: '$id' bekleniyordu\n", satir_no);
        return -1;
    }
    s++;
    size_t n = 0;
    while ((isalnum((unsigned char)*s) || *s == '_') && n + 1 < sizeof d->id)
        d->id[n++] = *s++;
    d->id[n] = '\0';
    s = bosluk_atla(s);
    if (n == 0 || *s != '=') {
        fprintf(stderr, "satir %d: '$id =' bekleniyordu\n", satir_no);
        return -1;
    }
    s = bosluk_atla(s + 1);
    if (!hex) {
        if (*s != '"') {
            fprintf(stderr, "satir %d: tirnakli metin bekleniyordu\n",
                    satir_no);
            return -1;
        }
        char *son = strchr(s + 1, '"');
        size_t m = son ? (size_t)(son - s - 1) : 0;
        if (!son || m == 0 || m > AZAMI_DESEN) {
            fprintf(stderr, "satir %d: metin bos, uzun ya da kapanmamis\n",
                    satir_no);
            return -1;
        }
        memcpy(d->desen, s + 1, m);
        d->boy = m;
    } else {
        if (*s != '{') {
            fprintf(stderr, "satir %d: '{' bekleniyordu\n", satir_no);
            return -1;
        }
        s++;
        for (;;) {
            s = bosluk_atla(s);
            if (*s == '}')
                break;
            if (d->boy >= AZAMI_DESEN || !s[0] || !s[1]) {
                fprintf(stderr, "satir %d: hex desen bozuk/uzun\n", satir_no);
                return -1;
            }
            if (s[0] == '?' && s[1] == '?') {
                d->joker[d->boy++] = 1;
            } else if (isxdigit((unsigned char)s[0]) &&
                       isxdigit((unsigned char)s[1])) {
                char iki[3];
                iki[0] = s[0];
                iki[1] = s[1];
                iki[2] = '\0';
                d->desen[d->boy++] = (unsigned char)strtoul(iki, NULL, 16);
            } else {
                fprintf(stderr, "satir %d: gecersiz hex bayt\n", satir_no);
                return -1;
            }
            s += 2;
        }
        if (d->boy == 0) {
            fprintf(stderr, "satir %d: bos hex desen\n", satir_no);
            return -1;
        }
    }
    k->nd++;
    return 0;
}

static int kurallari_yukle(const char *yol)
{
    FILE *f = fopen(yol, "r");
    if (!f) {
        perror(yol);
        return -1;
    }
    char satir[512];
    int no = 0, icinde = 0, hata = 0;
    struct kural *k = NULL;
    while (fgets(satir, sizeof satir, f)) {
        no++;
        satir[strcspn(satir, "\r\n")] = '\0';
        char *s = bosluk_atla(satir);
        if (*s == '\0' || *s == '#')
            continue;
        if (!icinde && strncmp(s, "kural ", 6) == 0) {
            if (kural_sayisi >= AZAMI_KURAL) {
                fprintf(stderr, "satir %d: cok fazla kural\n", no);
                hata = 1;
                break;
            }
            k = &kurallar[kural_sayisi];
            memset(k, 0, sizeof *k);
            if (sscanf(s + 6, "%47[A-Za-z0-9_]", k->ad) != 1) {
                fprintf(stderr, "satir %d: kural adi bozuk\n", no);
                hata = 1;
                break;
            }
            icinde = 1;
        } else if (icinde && strncmp(s, "dizge ", 6) == 0) {
            if (dizge_satiri(k, s + 6, 0, no) != 0)
                hata = 1;
        } else if (icinde && strncmp(s, "hex ", 4) == 0) {
            if (dizge_satiri(k, s + 4, 1, no) != 0)
                hata = 1;
        } else if (icinde && strncmp(s, "kosul ", 6) == 0) {
            snprintf(k->kosul, sizeof k->kosul, "%s", s + 6);
        } else if (icinde && *s == '}') {
            if (k->kosul[0] == '\0') {
                fprintf(stderr, "satir %d: kosulsuz kural\n", no);
                hata = 1;
            } else if (!hata) {
                kural_sayisi++;
            }
            icinde = 0;
        } else {
            fprintf(stderr, "satir %d: anlasilmayan satir\n", no);
            hata = 1;
        }
        if (hata)
            break;
    }
    fclose(f);
    if (hata || icinde) {
        fprintf(stderr, "kural dosyasi REDDEDILDI (hatali ya da eksik)\n");
        return -1;
    }
    return 0;
}

/* ---------------- tarama ---------------- */

static int uyar_mi(const unsigned char *v, const struct dizge *d)
{
    for (size_t j = 0; j < d->boy; j++)
        if (!d->joker[j] && v[j] != d->desen[j])
            return 0;
    return 1;
}

/* Dizgenin dosyada kaç kez geçtiğini sayar (örtüşenler dahil). */
static int say(const unsigned char *v, size_t n, const struct dizge *d)
{
    int c = 0;
    if (d->boy > n)
        return 0;
    for (size_t i = 0; i + d->boy <= n; i++)
        if (uyar_mi(v + i, d))
            c++;
    return c;
}

/* ---------------- koşul değerlendirici (özyinelemeli iniş) ---------------- */

struct cozumleyici {
    char *t[AZAMI_JETON];
    int n, i, hata;
    const struct kural *k;
};

static const char *bak(struct cozumleyici *c)
{
    return c->i < c->n ? c->t[c->i] : "";
}

static const char *al(struct cozumleyici *c)
{
    return c->i < c->n ? c->t[c->i++] : "";
}

static int dizge_indisi(const struct kural *k, const char *id)
{
    for (int i = 0; i < k->nd; i++)
        if (strcmp(k->d[i].id, id) == 0)
            return i;
    return -1;
}

static int ifade(struct cozumleyici *c);

static int birincil(struct cozumleyici *c)
{
    const char *t = al(c);
    const struct kural *k = c->k;
    if (strcmp(t, "(") == 0) {
        int v = ifade(c);
        if (strcmp(al(c), ")") != 0)
            c->hata = 1;
        return v;
    }
    if (strcmp(t, "true") == 0)
        return 1;
    if (strcmp(t, "false") == 0)
        return 0;
    if (strcmp(t, "all") == 0 || strcmp(t, "any") == 0 ||
        isdigit((unsigned char)t[0])) {
        int gereken = t[0] == 'a' && t[1] == 'l' ? k->nd
                    : t[0] == 'a' ? 1 : atoi(t);
        if (strcmp(al(c), "of") != 0 || strcmp(al(c), "them") != 0) {
            c->hata = 1;
            return 0;
        }
        int var = 0;
        for (int i = 0; i < k->nd; i++)
            var += k->d[i].say > 0;
        return var >= gereken;
    }
    if (t[0] == '$' || t[0] == '#') {
        int x = dizge_indisi(k, t + 1);
        if (x < 0) {
            c->hata = 1;
            return 0;
        }
        if (t[0] == '$')
            return k->d[x].say > 0;
        const char *op = al(c);
        const char *sayi = al(c);
        if (!isdigit((unsigned char)sayi[0])) {
            c->hata = 1;
            return 0;
        }
        int s = k->d[x].say, m = atoi(sayi);
        if (strcmp(op, ">=") == 0) return s >= m;
        if (strcmp(op, ">") == 0)  return s > m;
        if (strcmp(op, "<=") == 0) return s <= m;
        if (strcmp(op, "<") == 0)  return s < m;
        if (strcmp(op, "==") == 0) return s == m;
        c->hata = 1;
        return 0;
    }
    c->hata = 1;
    return 0;
}

static int degil(struct cozumleyici *c)
{
    if (strcmp(bak(c), "not") == 0) {
        al(c);
        return !degil(c);
    }
    return birincil(c);
}

static int ve(struct cozumleyici *c)
{
    int v = degil(c);
    while (strcmp(bak(c), "and") == 0) {
        al(c);
        int r = degil(c);             /* ikisini de çöz: sözdizimi denetlensin */
        v = v && r;
    }
    return v;
}

static int ifade(struct cozumleyici *c)
{
    int v = ve(c);
    while (strcmp(bak(c), "or") == 0) {
        al(c);
        int r = ve(c);
        v = v || r;
    }
    return v;
}

/* Koşulu değerlendirir: 1 eşleşti, 0 eşleşmedi, -1 sözdizimi hatası. */
static int kosul_degerlendir(const struct kural *k)
{
    char kopya[600];
    size_t j = 0;
    /* Parantezlerin etrafına boşluk koy ki jetonlara ayrılabilsin */
    for (const char *s = k->kosul; *s && j + 4 < sizeof kopya; s++) {
        if (*s == '(' || *s == ')') {
            kopya[j++] = ' ';
            kopya[j++] = *s;
            kopya[j++] = ' ';
        } else {
            kopya[j++] = *s;
        }
    }
    kopya[j] = '\0';
    struct cozumleyici c;
    memset(&c, 0, sizeof c);
    c.k = k;
    for (char *t = strtok(kopya, " \t"); t; t = strtok(NULL, " \t")) {
        if (c.n >= AZAMI_JETON)
            return -1;
        c.t[c.n++] = t;
    }
    int v = ifade(&c);
    if (c.hata || c.i != c.n)
        return -1;
    return v;
}

/* ---------------- ana akış ---------------- */

static unsigned char *dosya_oku(const char *yol, size_t *boy)
{
    FILE *f = fopen(yol, "rb");
    if (!f)
        return NULL;
    unsigned char *v = malloc(AZAMI_BOYUT + 1);
    size_t n = v ? fread(v, 1, AZAMI_BOYUT + 1, f) : 0;
    fclose(f);
    if (!v || n > AZAMI_BOYUT) {
        free(v);
        return NULL;
    }
    *boy = n;
    return v;
}

static const char *kisa_ad(const char *yol)
{
    const char *s1 = strrchr(yol, '/');
    const char *s2 = strrchr(yol, '\\');
    const char *s = s1 > s2 ? s1 : s2;
    return s ? s + 1 : yol;
}

static void tara(const char *yol, int ayrinti)
{
    size_t n = 0;
    unsigned char *v = dosya_oku(yol, &n);
    if (!v) {
        printf("  %-13s HATA  okunamadi/buyuk\n", kisa_ad(yol));
        return;
    }
    char liste[512] = "";
    int eslesen = 0;
    if (ayrinti)
        printf("  %s (%zu bayt)\n", kisa_ad(yol), n);
    for (int r = 0; r < kural_sayisi; r++) {
        struct kural *k = &kurallar[r];
        for (int i = 0; i < k->nd; i++)
            k->d[i].say = say(v, n, &k->d[i]);
        int sonuc = kosul_degerlendir(k);
        if (ayrinti) {
            printf("    %-22s ", k->ad);
            for (int i = 0; i < k->nd; i++)
                printf("$%s=%d ", k->d[i].id, k->d[i].say);
            printf("-> %s\n", sonuc < 0 ? "KOSUL HATASI"
                              : sonuc ? "ESLESTI" : "-");
        }
        if (sonuc == 1) {
            size_t L = strlen(liste);     /* taşmasız ekleme */
            snprintf(liste + L, sizeof liste - L, "%s%.47s",
                     eslesen++ ? ", " : "", k->ad);
        }
    }
    if (!ayrinti)
        printf("  %-13s %s\n", kisa_ad(yol), eslesen ? liste : "(eslesme yok)");
    free(v);
}

int main(int argc, char **argv)
{
    demo_hazirla();
    int ayrinti = argc > 1 && strcmp(argv[1], "-a") == 0;
    int ilk = ayrinti ? 2 : 1;
    if (argc - ilk < 2) {
        fprintf(stderr, "kullanim: %s [-a] <kurallar.txt> <dosya>...\n",
                argv[0]);
        return 2;
    }
    if (kurallari_yukle(argv[ilk]) != 0)
        return 1;
    if (!ayrinti)
        printf("  %d kural yuklendi\n", kural_sayisi);
    for (int i = ilk + 1; i < argc; i++)
        tara(argv[i], ayrinti);
    return 0;
}
