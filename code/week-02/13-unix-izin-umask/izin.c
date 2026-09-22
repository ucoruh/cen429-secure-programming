/*
 * CEN429 — Hafta 2 — Demo 13: Unix izinleri, umask ve setuid laboratuvarı
 *
 * Kullanım: bin/linux/izin sim      saf benzetim (Windows'ta da çalışır)
 *           bin/linux/izin gercek   gerçek dosyalarla, yalnız cikti/ altında
 *                                   (yalnız Linux/WSL; Windows'ta not basar)
 *
 * sim    : A) çekirdeğin izin denetim algoritması (sahip -> grup -> diğer,
 *             ilk eşleşen sınıf karar verir), B) umask tablosu,
 *             C) setuid kimlik geçişleri (gerçek/etkin/saklı UID) ve iki
 *             klasik tuzak, D) yapışkan (sticky) bit.
 * gercek : Aynı kuralları gerçek çekirdekte dener: umask ile dosya
 *          oluşturma, "sahip okuyamaz" paradoksu, dizinde r/x farkı,
 *          açık tanıtıcının (fd) izin değişikliğinden etkilenmemesi,
 *          sürecin Linux yetenekleri (capabilities).
 *
 * GÜVENLİK: Gerçek setuid ikili OLUŞTURULMAZ, sudo gerekmez; setuid yalnız
 * benzetimle anlatılır. Bütün dosyalar cikti/ altındadır ve program
 * sonunda izinleri geri açar ki klasör silinebilsin.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cen429_demo.h"

/* ------------------------------------------------------------------ */
/* A) Çekirdeğin izin denetimi (benzetim)                              */
/* ------------------------------------------------------------------ */

struct kisi {
    const char *ad;
    unsigned uid;
    unsigned grup[3]; /* birincil + ek gruplar; 0 = boş */
};
struct dsy {
    const char *ad;
    unsigned sahip, grup, mod;
    const char *sahip_ad, *grup_ad;
};

enum { OKU = 4, YAZ = 2, CALISTIR = 1 };

static void mod_metni(unsigned mod, char *t)
{
    const char *h = "rwxrwxrwx";
    for (int i = 0; i < 9; i++)
        t[i] = (mod & (0400u >> i)) ? h[i] : '-';
    t[9] = '\0';
}

/* 1 = izin, 0 = red; *sinif hangi sınıfın bitlerine bakıldığını söyler */
static int izin_denetle(const struct kisi *k, const struct dsy *d, int istek,
                        const char **sinif)
{
    if (k->uid == 0) {
        *sinif = "root";
        /* CAP_DAC_OVERRIDE: okuma/yazma serbest; çalıştırma için en az
           bir x biti olmalı */
        if (istek == CALISTIR)
            return (d->mod & 0111u) != 0;
        return 1;
    }
    unsigned bitler;
    if (k->uid == d->sahip) {
        *sinif = "sahip";
        bitler = (d->mod >> 6) & 7u;
    } else if (k->grup[0] == d->grup || k->grup[1] == d->grup ||
               k->grup[2] == d->grup) {
        *sinif = "grup";
        bitler = (d->mod >> 3) & 7u;
    } else {
        *sinif = "diger";
        bitler = d->mod & 7u;
    }
    return (bitler & (unsigned)istek) != 0;
}

static void bolum_a(void)
{
    static const struct kisi ayse = {"ayse", 1001, {1001, 2001, 0}};
    static const struct kisi mehmet = {"mehmet", 1002, {1002, 2001, 0}};
    static const struct kisi zeynep = {"zeynep", 1003, {1003, 0, 0}};
    static const struct kisi root = {"root", 0, {0, 0, 0}};
    static const struct dsy rapor = {"rapor.txt", 1001, 2001, 0640, "ayse",
                                     "muhasebe"};
    static const struct dsy paradoks = {"paradoks.txt", 1001, 2001, 0077,
                                        "ayse", "muhasebe"};
    static const struct dsy anahtar = {"gizli.key", 1001, 1001, 0600,
                                       "ayse", "ayse"};
    static const struct {
        const struct kisi *k;
        const struct dsy *d;
        int istek;
    } s[] = {
        {&ayse, &rapor, YAZ},      {&mehmet, &rapor, OKU},
        {&mehmet, &rapor, YAZ},    {&zeynep, &rapor, OKU},
        {&ayse, &paradoks, OKU},   {&mehmet, &paradoks, OKU},
        {&zeynep, &paradoks, OKU}, {&mehmet, &anahtar, OKU},
        {&root, &anahtar, OKU},    {&root, &rapor, CALISTIR},
    };
    printf("A) Cekirdek izin denetimi: ilk eslesen sinif karar verir\n");
    printf("   (ayse ve mehmet 'muhasebe' grubunda; zeynep degil)\n");
    printf("  %-7s %-8s %-13s %-14s %-11s %s\n", "surec", "istek", "dosya",
           "sahip:grup", "izinler", "sinif -> karar");
    for (size_t i = 0; i < sizeof s / sizeof s[0]; i++) {
        char m[10];
        const char *sinif = "";
        int ok = izin_denetle(s[i].k, s[i].d, s[i].istek, &sinif);
        mod_metni(s[i].d->mod, m);
        char sg[32];
        snprintf(sg, sizeof sg, "%s:%s", s[i].d->sahip_ad, s[i].d->grup_ad);
        printf("  %-7s %-8s %-13s %-14s %-11s %s -> %s\n", s[i].k->ad,
               s[i].istek == OKU ? "oku" : s[i].istek == YAZ ? "yaz"
                                                             : "calistir",
               s[i].d->ad, sg, m, sinif, ok ? "IZIN" : "RED");
    }
    printf("   ^ ayse paradoks.txt'yi OKUYAMAZ: sahip sinifi secildi ve\n"
           "     sahip bitleri '---'; grup/diger bitlerine hic bakilmaz.\n"
           "   ^ root okuma/yazmada izin bitlerini atlar (CAP_DAC_OVERRIDE);\n"
           "     calistirma icin yine en az bir x biti ister.\n\n");
}

/* ------------------------------------------------------------------ */
/* B) umask tablosu                                                    */
/* ------------------------------------------------------------------ */

static void bolum_b(void)
{
    const unsigned istenen[] = {0666, 0777, 0600};
    const unsigned maske[] = {000, 002, 022, 077};
    printf("B) umask: gercek izin = istenen & ~umask (Tarif 2.7)\n");
    printf("  %-9s", "istenen");
    for (int j = 0; j < 4; j++)
        printf(" umask %03o   ", maske[j]);
    printf("\n");
    for (int i = 0; i < 3; i++) {
        printf("  %04o     ", istenen[i]);
        for (int j = 0; j < 4; j++) {
            char m[10];
            mod_metni(istenen[i] & ~maske[j], m);
            printf(" %s   ", m);
        }
        printf("\n");
    }
    printf("   ^ fopen() her zaman 0666 ister: umask 000 ise dosya HERKESE\n"
           "     yazilabilir olur. Hassas dosyayi open(..., 0600) ile acin.\n\n");
}

/* ------------------------------------------------------------------ */
/* C) setuid kimlik geçişleri (Linux kuralları, benzetim)              */
/* ------------------------------------------------------------------ */

struct kimlik {
    unsigned r, e, s;      /* gerçek, etkin, saklı UID */
    unsigned gr, ge, gs;   /* gerçek, etkin, saklı GID */
};

static void kimlik_yaz(const char *adim, const struct kimlik *k, int sonuc)
{
    printf("    %-30s r/e/s=%u/%u/%u g=%u %s\n", adim, k->r, k->e, k->s,
           k->ge, sonuc ? "tamam" : "EPERM");
}

/* seteuid(u): etkin UID 0 ise her değer; değilse u, r ya da s olmalı */
static int sim_seteuid(struct kimlik *k, unsigned u)
{
    if (k->e == 0 || u == k->r || u == k->s) {
        k->e = u;
        return 1;
    }
    return 0;
}

/* setuid(u): etkin UID 0 ise ÜÇÜNÜ birden değiştirir; değilse yalnız
   etkin UID'yi (u, r ya da s ise). İşte tuzak buradadır. */
static int sim_setuid(struct kimlik *k, unsigned u)
{
    if (k->e == 0) {
        k->r = k->e = k->s = u;
        return 1;
    }
    if (u == k->r || u == k->s) {
        k->e = u;
        return 1;
    }
    return 0;
}

/* setresuid(r,e,s): ayrıcalıksız süreçte her yeni değer mevcut
   r/e/s'den biri olmalı; sonuç açıkça belli olduğu için önerilen yol */
static int sim_setresuid(struct kimlik *k, unsigned r, unsigned e, unsigned s)
{
    if (k->e != 0) {
        unsigned y[3];
        y[0] = r;
        y[1] = e;
        y[2] = s;
        for (int i = 0; i < 3; i++)
            if (y[i] != k->r && y[i] != k->e && y[i] != k->s)
                return 0;
    }
    k->r = r;
    k->e = e;
    k->s = s;
    return 1;
}

/* setgid(g): etkin UID 0 değilse yalnız gerçek/saklı GID'e geçebilir */
static int sim_setgid(struct kimlik *k, unsigned g)
{
    if (k->e == 0) {
        k->gr = k->ge = k->gs = g;
        return 1;
    }
    if (g == k->gr || g == k->gs) {
        k->ge = g;
        return 1;
    }
    return 0;
}

#define AYSE 1001u
#define HIZMET 65534u

static void kimlik_ata(struct kimlik *k, unsigned r, unsigned e, unsigned s,
                       unsigned g)
{
    k->r = r;
    k->e = e;
    k->s = s;
    k->gr = k->ge = k->gs = g;
}

static void bolum_c(void)
{
    struct kimlik k;
    printf("C) setuid benzetimi: sahibi root olan setuid bir programi\n"
           "   ayse (uid 1001) calistiriyor. exec: etkin=sakli=0 olur.\n");

    printf("  C1) Gecici birakma: seteuid(1001) -> sakli UID hala 0\n");
    kimlik_ata(&k, AYSE, 0, 0, AYSE);
    kimlik_yaz("exec (setuid root)", &k, 1);
    kimlik_yaz("seteuid(1001)", &k, sim_seteuid(&k, AYSE));
    kimlik_yaz("[saldirgan kodu] seteuid(0)", &k, sim_seteuid(&k, 0));
    printf("    => TUZAK: saldirgan root'u GERI ALDI (sakli UID 0)\n");

    printf("  C2) Kalici birakma: etkin 0 iken setuid(1001)\n");
    kimlik_ata(&k, AYSE, 0, 0, AYSE);
    kimlik_yaz("exec (setuid root)", &k, 1);
    kimlik_yaz("setuid(1001)", &k, sim_setuid(&k, AYSE));
    kimlik_yaz("[saldirgan kodu] seteuid(0)", &k, sim_seteuid(&k, 0));
    printf("    => GUVENLI: uc kimlik de 1001, geri donus yok\n");

    printf("  C3) Once gecici birak, SONRA setuid(1001) dene\n");
    kimlik_ata(&k, AYSE, 0, 0, AYSE);
    kimlik_yaz("seteuid(1001)", &k, sim_seteuid(&k, AYSE));
    kimlik_yaz("setuid(1001) [ayricaliksiz]", &k, sim_setuid(&k, AYSE));
    kimlik_yaz("[saldirgan kodu] seteuid(0)", &k, sim_seteuid(&k, 0));
    printf("    => TUZAK: ayricaliksiz setuid() yalniz etkin UID'yi degistirir\n");
    kimlik_ata(&k, AYSE, 0, 0, AYSE);
    kimlik_yaz("seteuid(1001)", &k, sim_seteuid(&k, AYSE));
    kimlik_yaz("setresuid(1001,1001,1001)", &k,
               sim_setresuid(&k, AYSE, AYSE, AYSE));
    kimlik_yaz("[saldirgan kodu] seteuid(0)", &k, sim_seteuid(&k, 0));
    printf("    => DUZELTME: setresuid ile ucunu birden ve acikca ayarla\n");

    printf("  C4) root olarak baslayan hizmet 'nobody' (65534) olmak istiyor\n");
    kimlik_ata(&k, 0, 0, 0, 0);
    kimlik_yaz("baslangic (root)", &k, 1);
    kimlik_yaz("YANLIS SIRA: setuid(65534)", &k, sim_setuid(&k, HIZMET));
    kimlik_yaz("setgid(65534)", &k, sim_setgid(&k, HIZMET));
    printf("    => TUZAK: grup hala 0 (root grubu); once grup birakilmaliydi\n");
    kimlik_ata(&k, 0, 0, 0, 0);
    kimlik_yaz("DOGRU SIRA: setgroups + setgid", &k, sim_setgid(&k, HIZMET));
    kimlik_yaz("setuid(65534)", &k, sim_setuid(&k, HIZMET));
    printf("    => DOGRU: once ek gruplar ve GID, en son UID (Tarif 1.3)\n\n");
}

/* ------------------------------------------------------------------ */
/* D) Yapışkan bit                                                     */
/* ------------------------------------------------------------------ */

/* Dizindeki bir girdiyi silme/yeniden adlandırma hakkı: dizinde w+x;
   yapışkan bit varsa ayrıca dosyanın ya da dizinin sahibi olmak (root
   hariç). Dosyanın kendi izinleri SİLMEYİ belirlemez! */
static int silebilir(unsigned kim, unsigned dizin_mod, unsigned dizin_sahip,
                     unsigned dosya_sahip)
{
    if (kim == 0)
        return 1;
    if ((dizin_mod & 03u) != 03u) /* "diğer" için w ve x (benzetim) */
        return 0;
    if ((dizin_mod & 01000u) && kim != dosya_sahip && kim != dizin_sahip)
        return 0;
    return 1;
}

static void bolum_d(void)
{
    printf("D) Yapiskan bit: paylasilan dizinde baskasinin dosyasini silmek\n");
    const struct {
        unsigned mod;
        const char *metin;
        unsigned kim;
        const char *olay;
    } s[] = {
        {0777, "drwxrwxrwx", 1003, "zeynep, ayse'nin dosyasini siler"},
        {01777, "drwxrwxrwt", 1003, "zeynep, ayse'nin dosyasini siler"},
        {01777, "drwxrwxrwt", 1001, "ayse, kendi dosyasini siler"},
    };
    for (int i = 0; i < 3; i++)
        printf("  ortak/ (%s)  %-34s -> %s\n", s[i].metin, s[i].olay,
               silebilir(s[i].kim, s[i].mod, 0, 1001) ? "IZIN" : "RED");
    printf("   ^ Silme, DOSYANIN degil DIZININ iznidir; /tmp bu yuzden 1777.\n");
}

static int benzetim(void)
{
    bolum_a();
    bolum_b();
    bolum_c();
    bolum_d();
    return 0;
}

/* ------------------------------------------------------------------ */
/* Gerçek çekirdekte deneme (yalnız POSIX)                             */
/* ------------------------------------------------------------------ */
#ifdef _WIN32
static int gercek(void)
{
    printf("Bu adim POSIX dosya API'si ister (umask, chmod, fstat).\n"
           "Windows'ta umask yoktur: yeni dosyanin izni ust klasorden\n"
           "KALITIMLA gelir. demo.ps1 bunu icacls ile gosterir; ayni\n"
           "adimi WSL icinde 'sh demo.sh' ile gercek cekirdekte deneyin.\n");
    return 0;
}
#else
#include <errno.h>
#include <fcntl.h>
#include <unistd.h>
#include <dirent.h>
#include <sys/stat.h>
#include <sys/types.h>

#define DIZIN "cikti"

static void mod_yaz(const char *yol)
{
    struct stat st;
    char m[10];
    if (stat(yol, &st) != 0) {
        printf("    %-26s (stat: %s)\n", yol, strerror(errno));
        return;
    }
    mod_metni((unsigned)st.st_mode & 0777u, m);
    printf("    %-26s %s (%04o)\n", yol, m, (unsigned)st.st_mode & 0777u);
}

static void dosya_yarat(const char *yol, mode_t mod)
{
    unlink(yol);
    int fd = open(yol, O_WRONLY | O_CREAT | O_EXCL, mod);
    if (fd < 0) {
        printf("    %s: %s\n", yol, strerror(errno));
        return;
    }
    if (write(fd, "demo verisi\n", 12) != 12)
        printf("    %s: yazma eksik\n", yol);
    close(fd);
}

static void okumayi_dene(const char *etiket, const char *yol)
{
    int fd = open(yol, O_RDONLY);
    if (fd < 0) {
        printf("    %-38s -> RED (%s)\n", etiket, strerror(errno));
        return;
    }
    close(fd);
    printf("    %-38s -> IZIN\n", etiket);
}

static void yetenekleri_yaz(void)
{
    static const struct { int bit; const char *ad; } y[] = {
        {0, "CAP_CHOWN"},        {1, "CAP_DAC_OVERRIDE"},
        {2, "CAP_DAC_READ_SEARCH"}, {3, "CAP_FOWNER"},
        {7, "CAP_SETUID"},       {10, "CAP_NET_BIND_SERVICE"},
        {21, "CAP_SYS_ADMIN"},
    };
    FILE *f = fopen("/proc/self/status", "r");
    char satir[256];
    unsigned long long cap = 0;
    int bulundu = 0;
    if (!f) {
        printf("    /proc/self/status okunamadi\n");
        return;
    }
    while (fgets(satir, sizeof satir, f))
        if (strncmp(satir, "CapEff:", 7) == 0) {
            cap = strtoull(satir + 7, NULL, 16);
            bulundu = 1;
        }
    fclose(f);
    if (!bulundu)
        return;
    printf("    CapEff = %016llx  (etkin yetenekler)\n", cap);
    for (size_t i = 0; i < sizeof y / sizeof y[0]; i++)
        printf("      %-22s %s\n", y[i].ad,
               (cap >> y[i].bit) & 1ULL ? "VAR" : "yok");
}

static int gercek(void)
{
    int root = geteuid() == 0;
    mkdir(DIZIN, 0700);
    printf("Gercek cekirdek, surec uid=%u gid=%u%s\n", (unsigned)getuid(),
           (unsigned)getgid(), root ? "  (ROOT!)" : "");
    if (root)
        printf("  NOT: root olarak calisiyorsunuz. Cekirdek root icin izin\n"
               "  bitlerini atlar (CAP_DAC_OVERRIDE); asagidaki RED'ler IZIN\n"
               "  olur. Normal kullaniciyla deneyin: en az ayricalik budur.\n");

    printf("\nR1) umask gercekte: open(..., 0666) ve open(..., 0600)\n");
    const struct { mode_t maske; mode_t istek; const char *ad; } u[] = {
        {022, 0666, DIZIN "/umask022-0666.txt"},
        {077, 0666, DIZIN "/umask077-0666.txt"},
        {000, 0666, DIZIN "/umask000-0666.txt"},
        {000, 0600, DIZIN "/umask000-0600.txt"},
    };
    mode_t eski = umask(022);
    for (size_t i = 0; i < sizeof u / sizeof u[0]; i++) {
        umask(u[i].maske);
        dosya_yarat(u[i].ad, u[i].istek);
        mod_yaz(u[i].ad);
    }
    umask(eski);
    printf("   ^ umask 000 + 0666 = herkese yazilabilir; acik 0600 ise\n"
           "     umask ne olursa olsun yalniz sahibe acik kalir.\n");

    printf("\nR2) Sahip okuyamaz paradoksu: chmod 0077 (----rwxrwx)\n");
    const char *p = DIZIN "/paradoks.txt";
    dosya_yarat(p, 0600);
    chmod(p, 0077);
    mod_yaz(p);
    okumayi_dene("sahip olarak open(O_RDONLY)", p);
    chmod(p, 0600);

    printf("\nR3) Dizinde r ve x farki (x = icine girme, r = listeleme)\n");
    const char *d = DIZIN "/kilitli";
    mkdir(d, 0700);
    dosya_yarat(DIZIN "/kilitli/not.txt", 0600);
    chmod(d, 0600); /* rw- : listeler ama giremez */
    mod_yaz(d);
    DIR *dp = opendir(d);
    printf("    %-38s -> %s\n", "listele (opendir/readdir)",
           dp ? "IZIN" : "RED");
    if (dp)
        closedir(dp);
    okumayi_dene("kilitli/not.txt'yi ac", DIZIN "/kilitli/not.txt");
    chmod(d, 0300); /* -wx : giremez listeleyemez, adi bilinen acilir */
    mod_yaz(d);
    dp = opendir(d);
    printf("    %-38s -> %s\n", "listele (opendir/readdir)",
           dp ? "IZIN" : "RED");
    if (dp)
        closedir(dp);
    okumayi_dene("kilitli/not.txt'yi ac (adi biliniyor)",
                 DIZIN "/kilitli/not.txt");
    chmod(d, 0700);

    printf("\nR4) Acik tanitici bir yetenektir: izin open() aninda denetlenir\n");
    const char *t = DIZIN "/tanitici.txt";
    dosya_yarat(t, 0600);
    int fd = open(t, O_RDONLY);
    chmod(t, 0000);
    mod_yaz(t);
    okumayi_dene("yeni open(O_RDONLY)", t);
    char tampon[32] = {0};
    ssize_t n = fd >= 0 ? read(fd, tampon, sizeof tampon - 1) : -1;
    printf("    %-38s -> %s\n", "ONCEDEN acilmis fd'den read()",
           n > 0 ? "IZIN (veri okundu)" : "RED");
    if (fd >= 0)
        close(fd);
    chmod(t, 0600);
    printf("   ^ chmod, acik taniticiyi geri almaz: yetki gecici degil,\n"
           "     tanitici yasadikca surer (tam aracilik icin dikkat).\n");

    printf("\nR5) Bu surecin Linux yetenekleri (capabilities)\n");
    yetenekleri_yaz();
    return 0;
}
#endif

int main(int argc, char **argv)
{
    demo_hazirla();
    if (argc == 2 && strcmp(argv[1], "sim") == 0)
        return benzetim();
    if (argc == 2 && strcmp(argv[1], "gercek") == 0)
        return gercek();
    fprintf(stderr, "kullanim: %s sim|gercek\n", argv[0]);
    return 2;
}
