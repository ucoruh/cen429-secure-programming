/*
 * CEN429 — Hafta 2 — Demo 12: Windows ACE değerlendirme simülatörü
 *
 * Kullanım: bin/linux/ace <senaryo.txt>      (Windows: bin\windows\ace.exe)
 *
 * Windows'un bir nesneye erişim isteğini DACL'a göre nasıl karara
 * bağladığını adım adım gösterir. Metin dosyasındaki erişim belirteci
 * (token), nesne sahibi, bütünlük etiketi ve ACE listesiyle çalışır;
 * hiçbir gerçek dosyaya, kullanıcıya ya da sistem ayarına DOKUNMAZ.
 * Tamamen saf bir hesaplamadır: iki platformda da aynı sonucu verir.
 *
 * Modellenen kurallar (sadeleştirilmiş):
 *   1. Zorunlu bütünlük denetimi (MIC) DACL'dan ÖNCE yapılır: düşük
 *      bütünlüklü belirteç, yüksek etiketli nesneye yazamaz.
 *   2. SAHIPLIK_AL ayrıcalığı (SeTakeOwnershipPrivilege) SAHIP_AL hakkını
 *      DACL'a bakmadan verir.
 *   3. Nesnenin sahibine IZIN_OKU ve IZIN_YAZ (READ_CONTROL, WRITE_DAC)
 *      örtük olarak verilir; DACL'da SAHIP_HAKLARI ACE'si varsa verilmez.
 *   4. NULL DACL: her istek kabul. Boş DACL (0 ACE): her istek red.
 *   5. ACE'ler SIRAYLA gezilir; belirteçte olmayan SID atlanır. RET ACE'si
 *      henüz verilmemiş bir istenen hakkı içeriyorsa istek hemen reddedilir.
 *      IZIN ACE'leri hakları biriktirir; hepsi verilince istek kabul edilir.
 *      Liste bitince eksik hak kaldıysa red.
 *   6. "Yalnız ret" (deny-only) gruplar yalnız RET ACE'leriyle eşleşir.
 *
 * Senaryo dosyası (satır satır; # ile yorum):
 *   SENARYO <başlık...>            yeni senaryo (her şey sıfırlanır)
 *   BELIRTEC <kullanıcı> [g1,g2]   erişim belirteci: kullanıcı ve gruplar
 *   YALNIZRET <grup>               grubu "yalnız ret" yap (UAC süzgeci)
 *   BUTUNLUK <Dusuk|Orta|Yuksek|Sistem>   belirtecin bütünlük seviyesi
 *   AYRICALIK SAHIPLIK_AL          belirtece ayrıcalık ekle
 *   SAHIP <sid>                    nesnenin sahibi
 *   ETIKET <seviye> [OKUMA_YOK]    nesnenin zorunlu etiketi (yazma yok)
 *   DACL <NULL|BOS>                NULL ya da boş DACL
 *   ACE <IZIN|RET> <sid> <haklar> [MIRAS]   haklar: virgülle, bkz. hak_adi
 *   KANONIK                        ACE'leri kanonik sıraya diz
 *   KALITIM_KES <kopyala|sil>      kalıtımı kes (icacls /inheritance:d|r)
 *   ISTE <haklar>                  erişim isteğini değerlendir ve izle
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cen429_demo.h"

/* Sadeleştirilmiş erişim hakları (gerçek Windows sabiti yorumda) */
enum {
    H_OKU = 1 << 0,      /* FILE_GENERIC_READ   */
    H_YAZ = 1 << 1,      /* FILE_GENERIC_WRITE  */
    H_CALISTIR = 1 << 2, /* FILE_GENERIC_EXECUTE */
    H_SIL = 1 << 3,      /* DELETE              */
    H_IZIN_OKU = 1 << 4, /* READ_CONTROL        */
    H_IZIN_YAZ = 1 << 5, /* WRITE_DAC           */
    H_SAHIP_AL = 1 << 6  /* WRITE_OWNER         */
};
#define H_TAM 0x7F
/* MIC "yazma yok" kuralının kapsadığı haklar (sadeleştirme) */
#define H_YAZMA_TURU (H_YAZ | H_SIL | H_IZIN_YAZ | H_SAHIP_AL)

static const struct { const char *ad; int bit; } hak_tablosu[] = {
    {"OKU", H_OKU},           {"YAZ", H_YAZ},
    {"CALISTIR", H_CALISTIR}, {"SIL", H_SIL},
    {"IZIN_OKU", H_IZIN_OKU}, {"IZIN_YAZ", H_IZIN_YAZ},
    {"SAHIP_AL", H_SAHIP_AL}, {"TAM", H_TAM},
};
#define HAK_N (sizeof hak_tablosu / sizeof hak_tablosu[0])

#define AZAMI_ACE 32
#define AZAMI_GRUP 16
#define AD 24

struct ace {
    int ret;   /* 1 = RET (erişim reddi), 0 = IZIN */
    int miras; /* 1 = üst klasörden kalıtımla gelmiş */
    char sid[AD];
    int maske;
};

static struct {
    char kullanici[AD];
    char grup[AZAMI_GRUP][AD];
    int yalniz_ret[AZAMI_GRUP];
    int grup_n;
    int butunluk;
    int sahiplik_al;
} blt;

static struct {
    char sahip[AD];
    int etiket;
    int okuma_yok;
    int dacl_tur; /* 0 = liste, 1 = NULL DACL, 2 = boş DACL */
    struct ace ace[AZAMI_ACE];
    int ace_n;
} nsn;

static const char *seviye_ad[] = {"Dusuk", "Orta", "Yuksek", "Sistem"};

static void sifirla(void)
{
    memset(&blt, 0, sizeof blt);
    memset(&nsn, 0, sizeof nsn);
    blt.butunluk = 1;
    nsn.etiket = 1;
    snprintf(nsn.sahip, AD, "%s", "-");
}

static int seviye_bul(const char *s)
{
    for (int i = 0; i < 4; i++)
        if (s && strcmp(s, seviye_ad[i]) == 0)
            return i;
    return -1;
}

/* "OKU,YAZ" -> bit maskesi; bilinmeyen ad varsa -1 */
static int haklari_coz(const char *metin)
{
    char kopya[128];
    int maske = 0;
    snprintf(kopya, sizeof kopya, "%s", metin ? metin : "");
    for (char *p = strtok(kopya, ","); p; p = strtok(NULL, ",")) {
        int bulundu = 0;
        for (size_t i = 0; i < HAK_N; i++)
            if (strcmp(p, hak_tablosu[i].ad) == 0) {
                maske |= hak_tablosu[i].bit;
                bulundu = 1;
            }
        if (!bulundu)
            return -1;
    }
    return maske;
}

/* bit maskesi -> "OKU,YAZ" (TAM tek sözcükle yazılır) */
static const char *hak_adi(int maske)
{
    static char tampon[4][96];
    static int sira;
    char *t = tampon[sira++ & 3];
    t[0] = '\0';
    if (maske == H_TAM)
        return strcpy(t, "TAM");
    if (maske == 0)
        return strcpy(t, "-");
    for (size_t i = 0; i + 1 < HAK_N; i++)
        if (maske & hak_tablosu[i].bit) {
            if (t[0])
                strcat(t, ",");
            strcat(t, hak_tablosu[i].ad);
        }
    return t;
}

/* ACE'nin kanonik sıra sınıfı: açık RET < açık IZIN < miras RET < miras IZIN */
static int ace_sinif(const struct ace *a)
{
    return a->miras * 2 + (a->ret ? 0 : 1);
}

static int kanonik_mi(int *bozan)
{
    for (int i = 1; i < nsn.ace_n; i++)
        if (ace_sinif(&nsn.ace[i]) < ace_sinif(&nsn.ace[i - 1])) {
            *bozan = i;
            return 0;
        }
    return 1;
}

static void kanonik_diz(void)
{
    /* Kararlı ekleme sıralaması: aynı sınıftaki ACE'lerin sırası korunur */
    for (int i = 1; i < nsn.ace_n; i++) {
        struct ace a = nsn.ace[i];
        int j = i - 1;
        while (j >= 0 && ace_sinif(&nsn.ace[j]) > ace_sinif(&a)) {
            nsn.ace[j + 1] = nsn.ace[j];
            j--;
        }
        nsn.ace[j + 1] = a;
    }
}

static int sahip_haklari_ace_var(void)
{
    for (int i = 0; i < nsn.ace_n; i++)
        if (strcmp(nsn.ace[i].sid, "SAHIP_HAKLARI") == 0)
            return 1;
    return 0;
}

static int belirtec_sahip_mi(void)
{
    if (strcmp(blt.kullanici, nsn.sahip) == 0)
        return 1;
    for (int i = 0; i < blt.grup_n; i++)
        if (!blt.yalniz_ret[i] && strcmp(blt.grup[i], nsn.sahip) == 0)
            return 1;
    return 0;
}

/* ACE'deki SID belirteçte var mı? 0 = yok, 1 = var,
   2 = yalnız ret olarak var (yalnız RET ACE'leriyle eşleşir) */
static int sid_eslesir(const char *sid)
{
    if (strcmp(sid, "Herkes") == 0 || strcmp(sid, blt.kullanici) == 0)
        return 1;
    if (strcmp(sid, "SAHIP_HAKLARI") == 0)
        return belirtec_sahip_mi();
    for (int i = 0; i < blt.grup_n; i++)
        if (strcmp(sid, blt.grup[i]) == 0)
            return blt.yalniz_ret[i] ? 2 : 1;
    return 0;
}

static void ace_yaz(int no, const struct ace *a)
{
    printf("    %d. %-4s %-14s %s%s\n", no, a->ret ? "RET" : "IZIN",
           a->sid, hak_adi(a->maske), a->miras ? "  (miras)" : "");
}

static void durum_yaz(void)
{
    printf("  Belirtec: %s  gruplar: Herkes", blt.kullanici);
    for (int i = 0; i < blt.grup_n; i++)
        printf(", %s%s", blt.grup[i], blt.yalniz_ret[i] ? "(yalniz-ret)" : "");
    printf("\n            butunluk: %s%s\n", seviye_ad[blt.butunluk],
           blt.sahiplik_al ? "  ayricalik: SAHIPLIK_AL" : "");
    printf("  Nesne   : sahip=%s  etiket=%s%s  ", nsn.sahip,
           seviye_ad[nsn.etiket], nsn.okuma_yok ? "+okuma-yok" : "");
    if (nsn.dacl_tur == 1) {
        printf("DACL: NULL (hic DACL yok)\n");
    } else if (nsn.dacl_tur == 2 || nsn.ace_n == 0) {
        printf("DACL: BOS (0 ACE)\n");
    } else {
        int bozan = 0;
        int k = kanonik_mi(&bozan);
        printf("DACL: %d ACE", nsn.ace_n);
        if (k)
            printf(" (kanonik: EVET)\n");
        else
            printf(" (kanonik: HAYIR, %d. ACE)\n", bozan + 1);
        for (int i = 0; i < nsn.ace_n; i++)
            ace_yaz(i + 1, &nsn.ace[i]);
    }
}

/* Erişim isteğini değerlendirir; her adımı yazar. 1 = izin, 0 = red */
static int degerlendir(int istek)
{
    int verilen = 0;
    printf("  Istek %s:\n", hak_adi(istek));

    /* 1. Zorunlu bütünlük denetimi (MIC) — DACL'dan önce */
    if (blt.butunluk < nsn.etiket) {
        int yasak = H_YAZMA_TURU | (nsn.okuma_yok ? H_OKU | H_CALISTIR : 0);
        if (istek & yasak) {
            printf("    MIC: belirtec %s < nesne %s; %s yasak\n",
                   seviye_ad[blt.butunluk], seviye_ad[nsn.etiket],
                   hak_adi(istek & yasak));
            printf("  => RED  (MIC: DACL'a hic bakilmadi)\n");
            return 0;
        }
        printf("    MIC: belirtec %s < nesne %s; istenen hak "
               "yazma turu degil, gecer\n",
               seviye_ad[blt.butunluk], seviye_ad[nsn.etiket]);
    }

    /* 2. Ayrıcalık: SeTakeOwnershipPrivilege */
    if ((istek & H_SAHIP_AL) && blt.sahiplik_al) {
        verilen |= H_SAHIP_AL;
        printf("    Ayricalik SAHIPLIK_AL: SAHIP_AL DACL'siz verildi\n");
    }

    /* 3. Sahibin örtük hakları */
    if (belirtec_sahip_mi()) {
        if (sahip_haklari_ace_var()) {
            printf("    Sahip: SAHIP_HAKLARI ACE'si var; ortuk hak YOK\n");
        } else if (istek & (H_IZIN_OKU | H_IZIN_YAZ)) {
            verilen |= istek & (H_IZIN_OKU | H_IZIN_YAZ);
            printf("    Sahip: ortuk %s verildi\n",
                   hak_adi(istek & (H_IZIN_OKU | H_IZIN_YAZ)));
        }
    }
    if (verilen == istek) {
        printf("  => IZIN  (DACL'a gerek kalmadi)\n");
        return 1;
    }

    /* 4. NULL ve boş DACL */
    if (nsn.dacl_tur == 1) {
        printf("    DACL NULL: nesnede hic DACL yok -> herkese her hak\n");
        printf("  => IZIN  (TEHLIKE: SAHIP_AL ve IZIN_YAZ dahil!)\n");
        return 1;
    }
    if (nsn.dacl_tur == 2 || nsn.ace_n == 0) {
        printf("    DACL BOS: hic ACE yok -> hic kimseye hak yok\n");
        printf("  => RED  (eksik: %s)\n", hak_adi(istek & ~verilen));
        return 0;
    }

    /* 5. ACE'leri sırayla gez */
    for (int i = 0; i < nsn.ace_n; i++) {
        const struct ace *a = &nsn.ace[i];
        int e = sid_eslesir(a->sid);
        printf("    ACE %d %-4s %-14s-> ", i + 1, a->ret ? "RET" : "IZIN",
               a->sid);
        if (e == 0) {
            printf("SID belirtecte yok, atla\n");
            continue;
        }
        if (e == 2 && !a->ret) {
            printf("grup yalniz-ret; IZIN ACE'si sayilmaz\n");
            continue;
        }
        if (a->ret) {
            int red = a->maske & istek & ~verilen;
            if (red) {
                printf("eslesti; %s reddedildi\n", hak_adi(red));
                printf("  => RED  (ACE %d: sonraki ACE'lere bakilmaz)\n",
                       i + 1);
                return 0;
            }
            printf("eslesti; istenen hakka dokunmuyor\n");
            continue;
        }
        int yeni = a->maske & istek & ~verilen;
        verilen |= a->maske & istek;
        if (yeni)
            printf("verildi %s (eksik: %s)\n", hak_adi(yeni),
                   hak_adi(istek & ~verilen));
        else
            printf("eslesti; yeni hak yok\n");
        if (verilen == istek) {
            printf("  => IZIN  (tum istenen haklar verildi)\n");
            return 1;
        }
    }
    printf("  => RED  (liste bitti; eksik: %s)\n", hak_adi(istek & ~verilen));
    return 0;
}

static void satir_isle(char *satir, int satir_no)
{
    satir[strcspn(satir, "\r\n")] = '\0';
    char *yorum = strchr(satir, '#');
    if (yorum)
        *yorum = '\0';
    char *k = strtok(satir, " \t");
    if (!k)
        return;
    char *a1 = strtok(NULL, " \t");
    char *a2 = strtok(NULL, " \t");
    char *a3 = strtok(NULL, " \t");
    char *a4 = strtok(NULL, " \t");

    if (strcmp(k, "SENARYO") == 0) {
        sifirla();
        printf("\n== SENARYO:");
        /* başlığın geri kalanını yazdır (strtok sonrası parçalar) */
        if (a1)
            printf(" %s", a1);
        if (a2)
            printf(" %s", a2);
        if (a3)
            printf(" %s", a3);
        if (a4)
            printf(" %s", a4);
        for (char *p = strtok(NULL, " \t"); p; p = strtok(NULL, " \t"))
            printf(" %s", p);
        printf(" ==\n");
    } else if (strcmp(k, "BELIRTEC") == 0 && a1) {
        snprintf(blt.kullanici, AD, "%s", a1);
        blt.grup_n = 0;
        if (a2)
            for (char *p = strtok(a2, ","); p && blt.grup_n < AZAMI_GRUP;
                 p = strtok(NULL, ",")) {
                snprintf(blt.grup[blt.grup_n], AD, "%s", p);
                blt.yalniz_ret[blt.grup_n++] = 0;
            }
    } else if (strcmp(k, "YALNIZRET") == 0 && a1) {
        for (int i = 0; i < blt.grup_n; i++)
            if (strcmp(blt.grup[i], a1) == 0)
                blt.yalniz_ret[i] = 1;
    } else if (strcmp(k, "BUTUNLUK") == 0 && seviye_bul(a1) >= 0) {
        blt.butunluk = seviye_bul(a1);
    } else if (strcmp(k, "AYRICALIK") == 0 && a1 &&
               strcmp(a1, "SAHIPLIK_AL") == 0) {
        blt.sahiplik_al = 1;
    } else if (strcmp(k, "SAHIP") == 0 && a1) {
        snprintf(nsn.sahip, AD, "%s", a1);
    } else if (strcmp(k, "ETIKET") == 0 && seviye_bul(a1) >= 0) {
        nsn.etiket = seviye_bul(a1);
        nsn.okuma_yok = a2 && strcmp(a2, "OKUMA_YOK") == 0;
    } else if (strcmp(k, "DACL") == 0 && a1) {
        nsn.dacl_tur = strcmp(a1, "NULL") == 0 ? 1 : 2;
        nsn.ace_n = 0;
    } else if (strcmp(k, "ACE") == 0 && a1 && a2 && a3) {
        int m = haklari_coz(a3);
        if (m < 0 || nsn.ace_n >= AZAMI_ACE ||
            (strcmp(a1, "IZIN") != 0 && strcmp(a1, "RET") != 0)) {
            fprintf(stderr, "  satir %d: gecersiz ACE\n", satir_no);
            return;
        }
        struct ace *y = &nsn.ace[nsn.ace_n++];
        y->ret = strcmp(a1, "RET") == 0;
        y->miras = a4 && strcmp(a4, "MIRAS") == 0;
        snprintf(y->sid, AD, "%s", a2);
        y->maske = m;
        nsn.dacl_tur = 0;
    } else if (strcmp(k, "KANONIK") == 0) {
        kanonik_diz();
        printf("  -- ACE'ler kanonik siraya dizildi --\n");
    } else if (strcmp(k, "KALITIM_KES") == 0 && a1) {
        int kopyala = strcmp(a1, "kopyala") == 0, n = 0;
        for (int i = 0; i < nsn.ace_n; i++) {
            if (nsn.ace[i].miras && !kopyala)
                continue;
            nsn.ace[n] = nsn.ace[i];
            nsn.ace[n++].miras = 0;
        }
        printf("  -- kalitim kesildi: miras ACE'ler %s --\n",
               kopyala ? "acik ACE'ye cevrildi" : "silindi");
        nsn.ace_n = n;
    } else if (strcmp(k, "ISTE") == 0 && a1) {
        int m = haklari_coz(a1);
        if (m <= 0) {
            fprintf(stderr, "  satir %d: gecersiz hak '%s'\n", satir_no, a1);
            return;
        }
        durum_yaz();
        degerlendir(m);
    } else {
        fprintf(stderr, "  satir %d: anlasilamadi: %s\n", satir_no, k);
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
    int no = 0;
    sifirla();
    while (fgets(satir, sizeof satir, f))
        satir_isle(satir, ++no);
    fclose(f);
    return 0;
}
