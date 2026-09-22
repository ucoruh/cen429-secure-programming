/*
 * CEN429 — Hafta 2 — Demo 14: RBAC + görev ayrılığı + Clark–Wilson
 *
 * Kullanım: bin/linux/banka <senaryo.txt>     (Windows: bin\windows\banka.exe)
 *
 * Küçük bir "hesap defteri" benzetimi. Erişim kararı iki katmanda verilir:
 *   RBAC  : kullanıcı -> rol -> izin (TP). RBAC0 (atama, oturum), RBAC1
 *           (rol hiyerarşisi: KALITIR), RBAC2 (SSD statik, DSD dinamik
 *           görev ayrılığı kısıtları).
 *   Clark–Wilson: kısıtlı veri öğeleri (CDI: hesap bakiyeleri) yalnız
 *           sertifikalı dönüşüm yordamlarıyla (TP) değişir. Kuralların
 *           numaraları çıktıda görünür:
 *           E1 yalnız sertifikalı TP, kendi CDI'larına dokunur
 *           E2 (kullanıcı, TP, CDI'lar) üçlüsü izinli olmalı (burada RBAC)
 *           E3 TP çalıştıran kullanıcının kimliği doğrulanır
 *           E4 sertifika veren, TP çalıştıramaz
 *           C2 TP geçerli durumu geçerli duruma taşır (ör. bakiye >= 0)
 *           C3 görev ayrılığı (başlatan != onaylayan)
 *           C4 her TP salt-eklemeli deftere yazar
 *           C5 UDI (dış girdi) doğrulanmadan CDI'ya geçmez
 *           C1 IVP: bütünlük doğrulama yordamı tutarlılığı denetler
 *
 * Bu bir SİMÜLATÖRDÜR: dosya, ağ ya da sistem ayarı kullanmaz; yalnız
 * senaryo dosyasını okur. Gerçek para, gerçek hesap yoktur.
 *
 * Senaryo dosyası (satır satır; # ile yorum):
 *   ROL <rol>                 KALITIR <kıdemli> <genç>   (RBAC1)
 *   IZIN <rol> <TP>           SSD <rol1> <rol2>   DSD <rol1> <rol2>
 *   SSD_KALDIR <rol1> <rol2>  KULLANICI <ad>      ATA <kullanıcı> <rol>
 *   OTURUM <kullanıcı> <rol,rol>                  CDI <ad> <değer>
 *   SERTIFIKALI <TP> <cdi,cdi|->                  ONAY_ESIGI <tutar>
 *   BASLA                     (kurulum biter; sonraki satırlar izlenir)
 *   BOLUM <başlık...>         CALISTIR <kullanıcı> <TP> [arg...]
 *   SERTIFIKALA <kullanıcı> <TP> <cdi,cdi>
 *   DOGRUDAN_YAZ <kullanıcı> <cdi> <değer>   DEFTER_SIL <kullanıcı> <no>
 * TP'ler: YATIR <hesap> <tutar>, CEK <hesap> <tutar>,
 *         HAVALE <kaynak> <hedef> <tutar>, ONAYLA <no>, IVP, DEFTER_OKU,
 *         HATALI_HAVALE <kaynak> <hedef> <tutar>  (bilerek hatalı TP)
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cen429_demo.h"

#define AD 24
#define AZ 16
#define SERTIFIKACI_ROL "SERTIFIKACI"

static char rol_ad[AZ][AD];
static unsigned rol_genc[AZ]; /* rol_genc[r]: r'nin doğrudan kalıttığı roller */
static int rol_n;

static struct { int rol; char tp[AD]; } izin[64];
static int izin_n;

static struct { int a, b, dinamik; } ayrilik[AZ];
static int ayrilik_n;

static struct {
    char ad[AD];
    unsigned atanan, etkin;
    int oturum;
} kul[AZ];
static int kul_n;

static struct { char ad[AD]; long long deger; } cdi[AZ];
static int cdi_n;

static struct { char tp[AD]; char cdiler[96]; } sert[AZ];
static int sert_n;

enum { D_ACILIS, D_YATIR, D_CEK, D_HAVALE, D_TALEP };
static struct { int tur; long long tutar; char metin[80]; } defter[128];
static int defter_n;

static struct {
    char baslatan[AD];
    int kaynak, hedef, bekliyor;
    long long tutar;
} talep[AZ];
static int talep_n;

static long long onay_esigi = 5000;
static int izleme; /* BASLA'dan sonra 1 */
static int adim;

/* ---------------------------- yardımcılar ---------------------------- */

static int bul(char t[][AD], int n, const char *ad)
{
    for (int i = 0; i < n; i++)
        if (ad && strcmp(t[i], ad) == 0)
            return i;
    return -1;
}

static int kul_bul(const char *ad)
{
    for (int i = 0; i < kul_n; i++)
        if (ad && strcmp(kul[i].ad, ad) == 0)
            return i;
    return -1;
}

static int cdi_bul(const char *ad)
{
    for (int i = 0; i < cdi_n; i++)
        if (ad && strcmp(cdi[i].ad, ad) == 0)
            return i;
    return -1;
}

/* Rol kümesini hiyerarşiyle genişlet: kıdemli rol, gençlerin haklarını
   da taşır (RBAC1). */
static unsigned kapsam(unsigned m)
{
    unsigned onceki;
    do {
        onceki = m;
        for (int r = 0; r < rol_n; r++)
            if (m & (1u << r))
                m |= rol_genc[r];
    } while (m != onceki);
    return m;
}

static const char *roller_metni(unsigned m)
{
    static char t[160];
    t[0] = '\0';
    for (int r = 0; r < rol_n; r++)
        if (m & (1u << r)) {
            if (t[0])
                strcat(t, ",");
            strcat(t, rol_ad[r]);
        }
    return t[0] ? t : "-";
}

/* m kümesi bir görev ayrılığı kısıtını bozuyor mu? bozan kısıt indeksi */
static int ayrilik_bozan(unsigned m, int dinamik)
{
    for (int i = 0; i < ayrilik_n; i++)
        if (ayrilik[i].dinamik == dinamik && ayrilik[i].a >= 0 &&
            (m & (1u << ayrilik[i].a)) && (m & (1u << ayrilik[i].b)))
            return i;
    return -1;
}

static void defter_ekle(int tur, long long tutar, const char *metin)
{
    if (defter_n < 128) {
        defter[defter_n].tur = tur;
        defter[defter_n].tutar = tutar;
        snprintf(defter[defter_n].metin, 80, "%s", metin);
        defter_n++;
    }
    if (izleme)
        printf("     C4 defter #%d: %s\n", defter_n, metin);
}

/* C5: dış girdi (UDI) -> tutar. Yalnız 1..1000000 arası, işaretsiz
   ondalık rakamlar kabul edilir; başka her şey reddedilir. */
static int tutar_dogrula(const char *m, long long *v)
{
    size_t n = m ? strlen(m) : 0;
    if (n == 0) {
        printf("     C5 UDI bos -> RED\n");
        return 0;
    }
    for (size_t i = 0; i < n; i++)
        if (m[i] < '0' || m[i] > '9') {
            printf("     C5 UDI \"%s\": rakam disi karakter -> RED\n", m);
            return 0;
        }
    if (n > 7) {
        printf("     C5 UDI \"%s\": cok uzun -> RED\n", m);
        return 0;
    }
    *v = atoll(m);
    if (*v < 1 || *v > 1000000) {
        printf("     C5 UDI \"%s\": 1..1000000 disinda -> RED\n", m);
        return 0;
    }
    printf("     C5 UDI \"%s\" -> %lld gecerli\n", m, *v);
    return 1;
}

/* E1: TP, verilen CDI'lar için sertifikalı mı? */
static int sertifikali(const char *tp, const char *c1, const char *c2)
{
    for (int i = 0; i < sert_n; i++) {
        if (strcmp(sert[i].tp, tp) != 0)
            continue;
        char k[100];
        snprintf(k, sizeof k, ",%s,", sert[i].cdiler);
        char a[AD + 2], b[AD + 2];
        snprintf(a, sizeof a, ",%s,", c1 ? c1 : "");
        snprintf(b, sizeof b, ",%s,", c2 ? c2 : "");
        if ((!c1 || strstr(k, a)) && (!c2 || strstr(k, b)))
            return 1;
    }
    return 0;
}

static long long toplam(void)
{
    long long t = 0;
    for (int i = 0; i < cdi_n; i++)
        t += cdi[i].deger;
    return t;
}

/* --------------------------- denetim zinciri -------------------------- */

/* E3 + E4 + E2 + E1. 1 = TP çalışabilir */
static int denetle(int u, const char *kullanici, const char *tp,
                   const char *c1, const char *c2)
{
    if (u < 0) {
        printf("     E3 kimlik: '%s' taninmiyor -> RED\n", kullanici);
        return 0;
    }
    if (!kul[u].oturum) {
        printf("     E3 %s icin acik oturum yok -> RED\n", kullanici);
        return 0;
    }
    int s = bul(rol_ad, rol_n, SERTIFIKACI_ROL);
    if (s >= 0 && (kul[u].atanan & (1u << s))) {
        printf("     E4 %s sertifika veriyor; TP calistiramaz -> RED\n",
               kullanici);
        return 0;
    }
    unsigned etkin = kapsam(kul[u].etkin);
    int veren = -1;
    for (int i = 0; i < izin_n; i++)
        if (strcmp(izin[i].tp, tp) == 0 && (etkin & (1u << izin[i].rol))) {
            veren = izin[i].rol;
            break;
        }
    printf("     E3 kimlik dogrulandi; etkin roller: %s\n",
           roller_metni(etkin));
    if (veren < 0) {
        printf("     E2 (%s, %s): hicbir etkin rolde yok -> RED\n",
               kullanici, tp);
        return 0;
    }
    printf("     E2 (%s, %s): VAR, rol %s\n", kullanici, tp, rol_ad[veren]);
    if (!sertifikali(tp, c1, c2)) {
        printf("     E1 %s bu CDI'lar icin sertifikali degil -> RED\n", tp);
        return 0;
    }
    printf("     E1 %s sertifikali TP; CDI'lara yalniz o dokunur\n", tp);
    return 1;
}

static void havale_yap(int k, int h, long long v, long long gelen,
                       const char *not_metni)
{
    char m[80];
    long long ek = cdi[k].deger, eh = cdi[h].deger;
    cdi[k].deger -= v;
    cdi[h].deger += gelen;
    printf("     TP: %s %lld->%lld, %s %lld->%lld\n", cdi[k].ad, ek,
           cdi[k].deger, cdi[h].ad, eh, cdi[h].deger);
    snprintf(m, sizeof m, "HAVALE %s->%s %lld%s", cdi[k].ad, cdi[h].ad, v,
             not_metni);
    defter_ekle(D_HAVALE, v, m);
}

static void ivp(void)
{
    long long beklenen = 0;
    int eksi = 0;
    for (int i = 0; i < defter_n; i++) {
        if (defter[i].tur == D_ACILIS || defter[i].tur == D_YATIR)
            beklenen += defter[i].tutar;
        else if (defter[i].tur == D_CEK)
            beklenen -= defter[i].tutar;
    }
    for (int i = 0; i < cdi_n; i++) {
        printf("     IVP %-8s = %lld%s\n", cdi[i].ad, cdi[i].deger,
               cdi[i].deger < 0 ? "  (EKSI!)" : "");
        eksi |= cdi[i].deger < 0;
    }
    long long t = toplam();
    printf("     IVP defterden beklenen toplam %lld, bulunan %lld\n",
           beklenen, t);
    if (t == beklenen && !eksi)
        printf("  => TUTARLI (C1: CDI'lar gecerli durumda)\n");
    else
        printf("  => TUTARSIZ! fark %lld: bir TP hatali ya da CDI TP "
               "disindan degisti\n", t - beklenen);
}

static void calistir(char *kullanici, char *tp, char *a1, char *a2, char *a3)
{
    int u = kul_bul(kullanici);
    long long v = 0;
    int k = -1, h = -1;

    if (strcmp(tp, "YATIR") == 0 || strcmp(tp, "CEK") == 0) {
        k = cdi_bul(a1);
        if (!denetle(u, kullanici, tp, a1, NULL))
            goto red;
        if (k < 0 || !tutar_dogrula(a2, &v))
            goto red;
        char m[80];
        if (tp[0] == 'C' && cdi[k].deger < v) {
            printf("     C2 %s bakiyesi %lld < %lld: gecersiz durum "
                   "-> RED\n", cdi[k].ad, cdi[k].deger, v);
            goto red;
        }
        long long eski = cdi[k].deger;
        cdi[k].deger += tp[0] == 'Y' ? v : -v;
        printf("     TP: %s %lld->%lld\n", cdi[k].ad, eski, cdi[k].deger);
        snprintf(m, sizeof m, "%s %s %lld", tp, cdi[k].ad, v);
        defter_ekle(tp[0] == 'Y' ? D_YATIR : D_CEK, v, m);
    } else if (strcmp(tp, "HAVALE") == 0 || strcmp(tp, "HATALI_HAVALE") == 0) {
        k = cdi_bul(a1);
        h = cdi_bul(a2);
        if (!denetle(u, kullanici, tp, a1, a2))
            goto red;
        if (k < 0 || h < 0 || k == h || !tutar_dogrula(a3, &v))
            goto red;
        if (tp[0] == 'H' && tp[1] == 'A' && tp[2] == 'V' && v > onay_esigi) {
            if (talep_n >= AZ)
                goto red;
            talep[talep_n].kaynak = k;
            talep[talep_n].hedef = h;
            talep[talep_n].tutar = v;
            talep[talep_n].bekliyor = 1;
            snprintf(talep[talep_n].baslatan, AD, "%s", kullanici);
            talep_n++;
            printf("     %lld > onay esigi %lld: talep #%d acildi, "
                   "ikinci kisi onaylamali\n", v, onay_esigi, talep_n);
            char m[80];
            snprintf(m, sizeof m, "TALEP #%d %s->%s %lld (%s)", talep_n,
                     cdi[k].ad, cdi[h].ad, v, kullanici);
            defter_ekle(D_TALEP, v, m);
            printf("  => BEKLIYOR\n");
            return;
        }
        if (cdi[k].deger < v) {
            printf("     C2 %s bakiyesi yetersiz -> RED\n", cdi[k].ad);
            goto red;
        }
        if (strcmp(tp, "HATALI_HAVALE") == 0)
            havale_yap(k, h, v, v - v / 100, ""); /* %1 iz birakmadan kayip */
        else
            havale_yap(k, h, v, v, "");
    } else if (strcmp(tp, "ONAYLA") == 0) {
        int no = a1 ? atoi(a1) : 0;
        if (!denetle(u, kullanici, tp, NULL, NULL))
            goto red;
        if (no < 1 || no > talep_n || !talep[no - 1].bekliyor) {
            printf("     talep #%d yok ya da kapali -> RED\n", no);
            goto red;
        }
        if (strcmp(talep[no - 1].baslatan, kullanici) == 0) {
            printf("     C3 talebi baslatan (%s) kendi talebini "
                   "onaylayamaz -> RED\n", kullanici);
            goto red;
        }
        printf("     C3 baslatan %s, onaylayan %s: farkli kisiler\n",
               talep[no - 1].baslatan, kullanici);
        k = talep[no - 1].kaynak;
        h = talep[no - 1].hedef;
        v = talep[no - 1].tutar;
        if (cdi[k].deger < v) {
            printf("     C2 %s bakiyesi yetersiz -> RED\n", cdi[k].ad);
            goto red;
        }
        talep[no - 1].bekliyor = 0;
        char not_metni[40];
        snprintf(not_metni, sizeof not_metni, " (talep #%d, onay %s)", no,
                 kullanici);
        havale_yap(k, h, v, v, not_metni);
    } else if (strcmp(tp, "IVP") == 0) {
        if (!denetle(u, kullanici, tp, NULL, NULL))
            goto red;
        ivp();
        return;
    } else if (strcmp(tp, "DEFTER_OKU") == 0) {
        if (!denetle(u, kullanici, tp, NULL, NULL))
            goto red;
        for (int i = 0; i < defter_n; i++)
            printf("     #%-2d %s\n", i + 1, defter[i].metin);
    } else {
        printf("     bilinmeyen TP '%s' -> RED\n", tp);
        goto red;
    }
    printf("  => TAMAM\n");
    return;
red:
    printf("  => RED\n");
}

/* ------------------------------ ayrıştırıcı ---------------------------- */

static void satir_isle(char *satir)
{
    satir[strcspn(satir, "\r\n")] = '\0';
    char *yorum = strchr(satir, '#');
    if (yorum)
        *yorum = '\0';
    char *t[16] = {0};
    int n = 0;
    for (char *p = strtok(satir, " \t"); p && n < 16; p = strtok(NULL, " \t"))
        t[n++] = p;
    if (n == 0)
        return;
    char *k = t[0];

    if (strcmp(k, "BOLUM") == 0) {
        printf("\n==");
        for (int i = 1; i < n; i++)
            printf(" %s", t[i]);
        printf(" ==\n");
        return;
    }
    if (strcmp(k, "BASLA") == 0) {
        izleme = 1;
        printf("Kurulum: %d rol, %d kullanici, %d CDI, %d sertifikali TP, "
               "onay esigi %lld\n", rol_n, kul_n, cdi_n, sert_n, onay_esigi);
        for (int i = 0; i < kul_n; i++)
            printf("  %-7s atanan roller: %s\n", kul[i].ad,
                   roller_metni(kul[i].atanan));
        printf("  CDI toplami (acilis): %lld\n", toplam());
        defter_ekle(D_ACILIS, toplam(), "ACILIS toplam");
        return;
    }
    if (izleme) {
        /* CALISTIR satırı "kullanıcı TP arg..." olarak, öteki komutlar
           olduğu gibi yazılır */
        printf("[%02d]", ++adim);
        for (int i = strcmp(k, "CALISTIR") == 0 ? 1 : 0; i < n; i++)
            printf(" %s", t[i]);
        printf("\n");
    }

    if (strcmp(k, "ROL") == 0 && n >= 2 && rol_n < AZ) {
        snprintf(rol_ad[rol_n++], AD, "%s", t[1]);
    } else if (strcmp(k, "KALITIR") == 0 && n >= 3) {
        int a = bul(rol_ad, rol_n, t[1]), b = bul(rol_ad, rol_n, t[2]);
        if (a >= 0 && b >= 0)
            rol_genc[a] |= 1u << b;
    } else if (strcmp(k, "IZIN") == 0 && n >= 3 && izin_n < 64) {
        int r = bul(rol_ad, rol_n, t[1]);
        if (r >= 0) {
            izin[izin_n].rol = r;
            snprintf(izin[izin_n++].tp, AD, "%s", t[2]);
            if (izleme)
                printf("     yonetici: %s rolune %s izni verildi\n", t[1],
                       t[2]);
        }
    } else if ((strcmp(k, "SSD") == 0 || strcmp(k, "DSD") == 0) && n >= 3 &&
               ayrilik_n < AZ) {
        ayrilik[ayrilik_n].a = bul(rol_ad, rol_n, t[1]);
        ayrilik[ayrilik_n].b = bul(rol_ad, rol_n, t[2]);
        ayrilik[ayrilik_n++].dinamik = k[0] == 'D';
    } else if (strcmp(k, "SSD_KALDIR") == 0 && n >= 3) {
        int a = bul(rol_ad, rol_n, t[1]), b = bul(rol_ad, rol_n, t[2]);
        for (int i = 0; i < ayrilik_n; i++)
            if (!ayrilik[i].dinamik && ((ayrilik[i].a == a &&
                ayrilik[i].b == b) || (ayrilik[i].a == b &&
                ayrilik[i].b == a)))
                ayrilik[i].a = -1;
        printf("     yonetici: SSD(%s,%s) kaldirildi (yanlis yapilandirma)\n",
               t[1], t[2]);
    } else if (strcmp(k, "KULLANICI") == 0 && n >= 2 && kul_n < AZ) {
        snprintf(kul[kul_n++].ad, AD, "%s", t[1]);
    } else if (strcmp(k, "ATA") == 0 && n >= 3) {
        int u = kul_bul(t[1]), r = bul(rol_ad, rol_n, t[2]);
        if (u < 0 || r < 0) {
            printf("     tanimsiz kullanici/rol -> RED\n");
            return;
        }
        unsigned yeni = kapsam(kul[u].atanan | (1u << r));
        int b = ayrilik_bozan(yeni, 0);
        if (b >= 0) {
            if (izleme)
                printf("     SSD(%s,%s): %s ikisini birden tasiyamaz"
                       " -> RED\n  => RED\n", rol_ad[ayrilik[b].a],
                       rol_ad[ayrilik[b].b], t[1]);
            return;
        }
        kul[u].atanan |= 1u << r;
        if (izleme)
            printf("     UA: %s artik %s\n  => TAMAM\n", t[1],
                   roller_metni(kul[u].atanan));
    } else if (strcmp(k, "OTURUM") == 0 && n >= 3) {
        int u = kul_bul(t[1]);
        if (u < 0) {
            printf("     E3 kimlik: '%s' taninmiyor -> RED\n  => RED\n",
                   t[1]);
            return;
        }
        unsigned m = 0;
        for (char *p = strtok(t[2], ","); p; p = strtok(NULL, ",")) {
            int r = bul(rol_ad, rol_n, p);
            if (r < 0 || !(kapsam(kul[u].atanan) & (1u << r))) {
                printf("     %s rolu %s'e atanmamis -> RED\n  => RED\n", p,
                       t[1]);
                return;
            }
            m |= 1u << r;
        }
        int b = ayrilik_bozan(kapsam(m), 1);
        if (b >= 0) {
            printf("     DSD(%s,%s): ayni oturumda ikisi birden etkin "
                   "olamaz -> RED\n  => RED\n", rol_ad[ayrilik[b].a],
                   rol_ad[ayrilik[b].b]);
            return;
        }
        kul[u].etkin = m;
        kul[u].oturum = 1;
        printf("     oturum acildi; etkin: %s\n  => TAMAM\n",
               roller_metni(kapsam(m)));
    } else if (strcmp(k, "CDI") == 0 && n >= 3 && cdi_n < AZ) {
        snprintf(cdi[cdi_n].ad, AD, "%s", t[1]);
        cdi[cdi_n++].deger = atoll(t[2]);
    } else if ((strcmp(k, "SERTIFIKALI") == 0 && n >= 3) ||
               (strcmp(k, "SERTIFIKALA") == 0 && n >= 4)) {
        int yontem = k[10] == 'A'; /* SERTIFIKALA: çalışma anında */
        const char *tp = yontem ? t[2] : t[1];
        const char *c = yontem ? t[3] : t[2];
        if (yontem) {
            int u = kul_bul(t[1]), s = bul(rol_ad, rol_n, SERTIFIKACI_ROL);
            if (u < 0 || s < 0 || !(kul[u].atanan & (1u << s))) {
                printf("     C2 yalniz sertifikaci TP onaylar -> RED\n"
                       "  => RED\n");
                return;
            }
            printf("     C2 %s, %s TP'sini {%s} icin sertifikaladi\n",
                   t[1], tp, c);
        }
        if (sert_n < AZ) {
            snprintf(sert[sert_n].tp, AD, "%s", tp);
            snprintf(sert[sert_n++].cdiler, 96, "%s", c);
        }
        if (yontem)
            printf("  => TAMAM\n");
    } else if (strcmp(k, "ONAY_ESIGI") == 0 && n >= 2) {
        onay_esigi = atoll(t[1]);
    } else if (strcmp(k, "DOGRUDAN_YAZ") == 0 && n >= 4) {
        printf("     E1 CDI '%s' yalniz sertifikali TP ile degisir"
               " -> RED\n  => RED\n", t[2]);
    } else if (strcmp(k, "DEFTER_SIL") == 0 && n >= 3) {
        printf("     C4 defter salt-eklemelidir; hicbir TP kayit silmez"
               "\n  => RED\n");
    } else if (strcmp(k, "CALISTIR") == 0 && n >= 3) {
        calistir(t[1], t[2], t[3], t[4], t[5]);
    } else {
        fprintf(stderr, "  anlasilamadi: %s\n", k);
    }
}

int main(int argc, char **argv)
{
    demo_hazirla();
    if (argc != 2) {
        fprintf(stderr, "kullanim: %s <senaryo.txt>\n", argv[0]);
        return 2;
    }
    FILE *f = fopen(argv[1], "r");
    if (!f) {
        perror(argv[1]);
        return 1;
    }
    char satir[256];
    while (fgets(satir, sizeof satir, f))
        satir_isle(satir);
    fclose(f);
    return 0;
}
