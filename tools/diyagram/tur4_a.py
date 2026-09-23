# -*- coding: utf-8 -*-
"""7. tur — derinleştirilmiş notlarda görselsiz kalan bölümler için çizimler (H1, H2)."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cizim import *

KOK = None
def yol(h): return os.path.join(KOK, "week-%d" % h, "assets")


# ===================================================== HAFTA 1
def h01_17(k):
    fig, ax = katman(
        "Neden \"güvenli programlama\"? Beş karar, kodun içinde",
        [("Girdiye güvenme", "uzunluk, tür, aralık, izin verilen karakterler — her seferinde", "ana"),
         ("Sırrı kısa tut", "işin bitince güvenle sil; bellekte bekletme", "ana"),
         ("Ortama güvenme", "ortam değişkenleri, dosya izinleri, çağrılan programlar", "ana"),
         ("Güvenli tarafta kal", "hata olursa reddet, kapat, sızdırma", "iyi"),
         ("Korumaları aç ve sına", "derleyici bayrakları, sanitizer, fuzzing", "iyi")],
        alt_metin="güvenlik duvarı hatalı yazılmış programı kurtaramaz",
        dip="Saldırgan izin verilen kapıdan girer: programın kendisinden.",
        g=11.5, y=5.4)
    return kaydet(fig, k, "h01-17-bes-karar")


def h01_18(k):
    fig, ax = tuval(12.0, 5.8)
    baslik(ax, "Saltzer ve Schroeder (1975): güvenli tasarımın omurgası",
           "elli yıl sonra hâlâ geçerli sekiz ilke")
    ilkeler = [("En az ayrıcalık", "işini yapacak kadar yetki"),
               ("Güvenli varsayılan", "varsayılan: izin YOK"),
               ("Tam aracılık", "her erişim her seferinde denetlenir"),
               ("Açık tasarım", "gizlilik anahtarda, tasarımda değil"),
               ("Mekanizma ekonomisi", "basit tasarım = az hata"),
               ("Ortak mekanizmayı azalt", "paylaşılan yol = paylaşılan risk"),
               ("Yetki ayrımı", "tek onay yetmez"),
               ("Kullanılabilirlik", "zor gelen güvenlik atlanır")]
    for i, (ad, aciklama) in enumerate(ilkeler):
        sut = i % 2
        satir = i // 2
        x = 26 + sut * 48
        y = 70 - satir * 15
        kutu(ax, x, y, 44, 11.5, ad, [aciklama], dolgu=COKACIK, kenar=ANA,
             bas_boyut=12, satir_boyut=9.4)
    serit(ax, 8, "Bu ilkeler bir denetim listesi değil, tasarım kararlarını tartarken kullanılan ölçülerdir.")
    return kaydet(fig, k, "h01-18-saltzer-schroeder")


def h01_19(k):
    fig, ax = tuval(12.0, 5.6)
    baslik(ax, "Veri akış diyagramı: dört öğe ve güven sınırı",
           "tehdit modellemenin çizim dili")
    # guven siniri
    ax.add_patch(FancyBboxPatch((44, 26), 40, 48,
                                boxstyle="round,pad=0,rounding_size=2.4",
                                linewidth=1.8, linestyle=(0, (5, 3)),
                                edgecolor=KOTU, facecolor="none", zorder=1))
    ax.text(64, 77, "GÜVEN SINIRI", ha="center", fontsize=10.5,
            color=KOTU, fontweight="bold")
    kutu(ax, 16, 62, 26, 13, "Dış varlık", ["kullanıcı, terminal", "sizin denetiminizde DEĞİL"],
         dolgu=KOTUBG, kenar=KOTU, bas_boyut=12, satir_boyut=9.2)
    kutu(ax, 60, 62, 26, 13, "Süreç", ["veri işleyen kod", "giriş modülü"],
         dolgu=COKACIK, kenar=ANA, bas_boyut=12, satir_boyut=9.2)
    kutu(ax, 60, 38, 26, 13, "Veri deposu", ["dosya, veritabanı"],
         dolgu=MORBG, kenar=MOR, bas_boyut=12, satir_boyut=9.2)
    kutu(ax, 92, 50, 13, 13, "Akış", ["ok"], dolgu=IYIBG, kenar=IYI,
         bas_boyut=11.5, satir_boyut=9.2)
    ok(ax, 29, 62, 47, 62, renk=SOLUK, etiket="veri akışı", etiket_boyut=9.5)
    ok(ax, 60, 55, 60, 45, renk=SOLUK)
    ax.text(50, 20, "Sınırı geçen her ok bir tehdit adayıdır: orada STRIDE'ın altı harfini tek tek sorun.",
            ha="center", fontsize=10.5, color=YAZI)
    serit(ax, 10, "Kural: güven sınırını çizmeden tehdit listesi çıkarılmaz.")
    return kaydet(fig, k, "h01-19-veri-akis-diyagrami")


def h01_20(k):
    fig, ax = katman(
        "Program başlarken ebeveyninden ne devralır?",
        [("Ortam değişkenleri", "PATH, LD_PRELOAD, LD_LIBRARY_PATH — hangi kod yüklenecek", "kotu"),
         ("Açık dosya tanıtıcıları", "0/1/2 kapalıysa açtığınız dosya stdin olur", "kotu"),
         ("umask ve çalışma klasörü", "oluşturduğunuz dosyanın izinleri buradan gelir", "uyari"),
         ("Sinyal düzeni ve kaynak sınırları", "yok sayılan sinyal, düşük core limiti", "uyari"),
         ("Gerçek ve etkin kullanıcı kimliği", "setuid ise ayrıcalık elinizdedir", "kotu")],
        alt_metin="main()'in ilk satırlarında yapılacak iş budur",
        dip="Hiçbirine güvenmeyin: gerekeni kendiniz kurun, gerekmeyeni kapatın.",
        dip_renk=KOTU, g=11.5, y=5.4)
    return kaydet(fig, k, "h01-20-devralinan-durum")


def h01_21(k):
    fig, ax = tuval(11.8, 5.2)
    baslik(ax, "Sır bellekten nasıl dışarı sızar?", "değişken kapsam dışına çıkar, baytlar kalır")
    kutu(ax, 50, 70, 34, 14, "Parola bellekte", ["kullanıldı, ama silinmedi"],
         dolgu=UYARIBG, kenar=UYARI, bas_boyut=13, satir_boyut=9.6)
    yollar = [(14, "Çökme dökümü", "core dump dosyası"),
              (38, "Takas / uyku", "swap, hibernation"),
              (62, "Hata ayıklayıcı", "sürece bağlanır"),
              (86, "Bellek yeniden kullanımı", "başka kod eski içeriği okur")]
    for x, ad, alt in yollar:
        kutu(ax, x, 36, 22, 14, ad, [alt], dolgu=KOTUBG, kenar=KOTU,
             bas_boyut=10.8, satir_boyut=9.0)
        ok(ax, 50, 62, x, 44, renk=KOTU, kalinlik=1.6)
    serit(ax, 15, "Çözüm: explicit_bzero / SecureZeroMemory — derleyicinin kaldıramayacağı silme.")
    return kaydet(fig, k, "h01-21-bellekten-sizma-yollari")


def h01_22(k):
    fig, ax = tuval(12.0, 5.0)
    baslik(ax, "İşaretli uzunluk hatası: aynı bitler, iki farklı sayı",
           "int işaretli, size_t işaretsiz — dönüşüm sessizdir")
    kutu(ax, 22, 66, 34, 15, "int uzunluk = -1", ["programcının niyeti:", "\"geçersiz\" işareti"],
         dolgu=COKACIK, kenar=ANA, bas_boyut=12.5, satir_boyut=9.4)
    ax.text(50, 66, "aynı bit dizisi", ha="center", va="center", fontsize=10, color=SOLUK)
    kutu(ax, 78, 66, 34, 15, "0xFFFFFFFFFFFFFFFF", ["64 bit, ikiye tümleyen"],
         dolgu=MORBG, kenar=MOR, bas_boyut=12, satir_boyut=9.4)
    ok(ax, 50, 55, 50, 46, renk=KOTU, etiket="memcpy(..., uzunluk) — size_t bekler", etiket_boyut=9.6)
    kutu(ax, 50, 33, 76, 15, "(size_t) 18.446.744.073.709.551.615",
         ["sınır denetimi \"uzunluk < 16\" ile yapılmışsa, o denetim -1'i GEÇİRİR"],
         dolgu=KOTUBG, kenar=KOTU, bas_boyut=13, satir_boyut=9.6)
    serit(ax, 13, "Kural: boyutlar baştan sona size_t tutulur; -Wsign-conversion açılır.")
    return kaydet(fig, k, "h01-22-isaretli-donusum")


def h01_23(k):
    fig, ax = tuval(12.0, 5.6)
    baslik(ax, "Bu haftanın araç kutusu", "hangi araç hangi hatayı yakalar")
    satirlar = [("-Wall -Wextra", "şüpheli kod uyarısı", "derleme", IYIBG, IYI),
                ("-Wsign-conversion", "işaretli/işaretsiz dönüşüm", "derleme", IYIBG, IYI),
                ("-D_FORTIFY_SOURCE=2", "boyutu bilinen tampon denetimi", "çalışma", COKACIK, ANA),
                ("-fsanitize=address", "sınır dışı, use-after-free", "çalışma", COKACIK, ANA),
                ("gdb / gcore", "bellek dökümü alma", "inceleme", MORBG, MOR),
                ("strings / objdump -d", "ikilideki metin ve kod", "inceleme", MORBG, MOR)]
    for i, (arac, is_, evre, dolgu, kenar) in enumerate(satirlar):
        y = 72 - i * 10.5
        kutu(ax, 26, y, 40, 8.6, arac, dolgu=dolgu, kenar=kenar, bas_boyut=11)
        ax.text(50, y, is_, ha="left", va="center", fontsize=10, color=YAZI)
        ax.text(96, y, evre, ha="right", va="center", fontsize=9.4, color=SOLUK)
    serit(ax, 7, "Derleme zamanı ucuz, çalışma zamanı kesin, inceleme araçları saldırganın da elinde.")
    return kaydet(fig, k, "h01-23-arac-kutusu")


# ===================================================== HAFTA 2
def h02_09(k):
    fig, ax = zaman(
        "Zararlı yazılımın kısa tarihi",
        [("1971", "Creeper — ilk\nkendini kopyalayan"),
         ("1986", "Brain — ilk PC\nvirüsü"),
         ("1988", "Morris solucanı —\ninternet durdu"),
         ("2003", "Slammer — 10 dk'da\nküresel"),
         ("2010", "Stuxnet — devlet\ndüzeyinde"),
         ("2017", "WannaCry —\nfidye + solucan")],
        alt_metin="şaka ve merak → suç → devlet operasyonu",
        dip="Değişen şey teknik değil, SAİK: her dönemde saldırganın amacı farklı.",
        g=12.5, y=4.8)
    return kaydet(fig, k, "h02-09-zararli-tarihce")


def h02_10(k):
    fig, ax = katman(
        "Karşı önlemler: dört katman, dört soru",
        [("İmza tabanlı", "\"bu dosyayı daha önce gördüm mü?\" — bilinen zararlıyı yakalar", "ana"),
         ("Sezgisel (heuristic)", "\"şüpheli görünüyor mu?\" — benzerini yakalar", "ana"),
         ("Davranış tabanlı", "\"ne YAPIYOR?\" — yeni zararlıyı çalışırken yakalar", "iyi"),
         ("Bütünlük izleme", "\"değişti mi?\" — beyaz liste, kurcalamayı yakalar", "iyi")],
        alt_metin="her katman ötekinin kaçırdığını yakalar",
        dip="Tek katman yetmez: imza yeniyi, davranış sessizi kaçırır.",
        g=11.5, y=5.0)
    return kaydet(fig, k, "h02-10-karsi-onlem-katmanlari")


def h02_11(k):
    fig, ax = akis(
        [("Programlama hatası", ["taşma, doğrulanmamış girdi,", "eksik yama"], "kotu"),
         ("Zararlı yazılım girer", ["solucan, fidye, arka kapı"], "kotu"),
         ("Zarar", ["veri kaybı, üretim durması,", "itibar"], "kotu"),
         ("Önlem", ["güvenli kodlama + yama +", "bütünlük izleme"], "iyi")],
        "Olay incelemelerinin ortak iskeleti",
        "Morris'ten WannaCry'a kadar aynı zincir",
        dip="Her olay incelemesinde bu dört kutuyu doldurun; ders zincirin neresinde kırıldığıdır.",
        g=12.0, y=4.6)
    return kaydet(fig, k, "h02-11-olay-iskeleti")


def h02_12(k):
    fig, ax = adimlar(
        "Saldırı ağacı nasıl kurulur?",
        [("Hedefi yaz", ["saldırganın", "kazanç tanımı"], "kotu"),
         ("Yolları listele", ["her yol bir dal"], "ana"),
         ("VE / VEYA koy", ["hepsi mi gerekli,", "biri yeter mi?"], "ana"),
         ("Yaprakları puanla", ["maliyet, beceri,", "erişim"], "mor"),
         ("En ucuz yolu bul", ["saldırgan onu seçer"], "uyari"),
         ("Oraya önlem koy", ["maliyeti yükselt"], "iyi")],
        alt_metin="niteliksel korkudan niceliksel karara",
        dip="Ağaç, \"neyi önce düzeltelim?\" sorusuna sayıyla cevap verir.",
        satir_basina=3, g=11.5, y=5.4)
    return kaydet(fig, k, "h02-12-saldiri-agaci-kurulum")


def h02_13(k):
    fig, ax = tuval(11.8, 5.2)
    baslik(ax, "Güvenlik denetim kaydı: kanıt olarak günlük",
           "olay olduktan sonra elinizde kalan tek şey")
    kutu(ax, 18, 66, 30, 14, "Ne yazılır?", ["kim, ne zaman,", "ne yaptı, sonuç"],
         dolgu=COKACIK, kenar=ANA, bas_boyut=12, satir_boyut=9.4)
    kutu(ax, 52, 66, 30, 14, "Ne YAZILMAZ?", ["parola, anahtar,", "kart no, kişisel veri"],
         dolgu=KOTUBG, kenar=KOTU, bas_boyut=12, satir_boyut=9.4)
    kutu(ax, 86, 66, 22, 14, "Nasıl korunur?", ["özet zinciri"],
         dolgu=IYIBG, kenar=IYI, bas_boyut=11.5, satir_boyut=9.4)
    for i, (x, metin) in enumerate([(20, "kayıt 1"), (40, "kayıt 2"), (60, "kayıt 3"), (80, "kayıt 4")]):
        kutu(ax, x, 34, 16, 10, metin, dolgu=MORBG, kenar=MOR, bas_boyut=10.5)
        if i:
            ok(ax, x - 20 + 8, 34, x - 8, 34, renk=MOR, kalinlik=1.6)
    ax.text(50, 23, "her kayıt bir öncekinin özetini taşır → araya ekleme ve silme fark edilir",
            ha="center", fontsize=10, color=SOLUK)
    serit(ax, 12, "Sondan kesme özet zinciriyle yakalanmaz; ayrıca uzak sunucuya kopyalayın.")
    return kaydet(fig, k, "h02-13-denetim-kaydi")


def h02_14(k):
    fig, ax = iki_yol(
        "Erişim denetimi: kim, neye, ne yapabilir?",
        ("İSTEĞE BAĞLI (DAC)", ["sahibi izinleri belirler", "Unix rwx, Windows ACL",
                                "esnek", "kullanıcı yanlış izin verebilir"], "uyari"),
        ("ZORUNLU (MAC)", ["politika merkezî", "etiket/seviye ile karar",
                           "kullanıcı gevşetemez", "kurulumu zor"], "iyi"),
        alt_metin="iki ana model, iki farklı güven varsayımı",
        dip="RBAC ikisinin arasındadır: yetkiyi kişiye değil ROLE verir.",
        g=11.5, y=5.0)
    return kaydet(fig, k, "h02-14-dac-mac")


def h02_15(k):
    fig, ax = akis(
        [("CWE", ["zayıflık TÜRÜ", "ör. CWE-787", "katalog"], "mor"),
         ("CVE", ["belirli üründeki açık", "ör. CVE-2021-44228", "tek olay"], "kotu"),
         ("CVSS", ["ciddiyet puanı", "0–10", "önceliklendirme"], "uyari"),
         ("Karar", ["önce hangisi", "yamalanacak?"], "iyi")],
        "CWE, CVE, CVSS: üç ayrı soru",
        "tür mü, olay mı, ne kadar ciddi mi?",
        dip="Karıştırmayın: CWE sınıf, CVE örnek, CVSS ölçü.",
        g=12.0, y=4.6)
    return kaydet(fig, k, "h02-15-cwe-cve-cvss")


def h02_16(k):
    fig, ax = katman(
        "OWASP Top 10 ve MASVS: ne işe yararlar?",
        [("OWASP Top 10", "en yaygın web açıkları — farkındalık listesi, denetim listesi DEĞİL", "uyari"),
         ("OWASP ASVS", "doğrulama gereksinimleri — seviyelere ayrılmış, denetlenebilir", "ana"),
         ("OWASP MASVS", "mobil uygulama güvenlik gereksinimleri — bu dersin projesine en yakını", "iyi"),
         ("MASTG", "MASVS'i nasıl test edeceğinizi anlatan rehber", "iyi")],
        alt_metin="liste ile gereksinim aynı şey değildir",
        dip="13. haftada uyum matrisini MASVS üzerinden kuracağız.",
        g=11.5, y=5.0)
    return kaydet(fig, k, "h02-16-owasp-masvs")


def h02_17(k):
    fig, ax = adimlar(
        "Bir açığın yaşam çizgisinde kim ne yapar?",
        [("Keşif", ["araştırmacı", "bulur"], "mor"),
         ("Özel ifşa", ["üreticiye", "bildirilir"], "ana"),
         ("Yama geliştirme", ["üretici", "düzeltir"], "ana"),
         ("Yama yayını", ["CVE + bülten"], "iyi"),
         ("Kamuya açılma", ["ayrıntı yayımlanır"], "uyari"),
         ("Kitlesel sömürü", ["yamasızlar vurulur"], "kotu")],
        alt_metin="en tehlikeli aralık: yama çıktı ama kurulmadı",
        dip="WannaCry'ın dersi tam burada: yama saldırıdan haftalar önce vardı.",
        satir_basina=3, g=11.5, y=5.4)
    return kaydet(fig, k, "h02-17-acik-yasam-cizgisi")


ISLER = {1: [h01_17, h01_18, h01_19, h01_20, h01_21, h01_22, h01_23],
         2: [h02_09, h02_10, h02_11, h02_12, h02_13, h02_14, h02_15, h02_16, h02_17]}

if __name__ == "__main__":
    KOK = sys.argv[1]
    n = 0
    for h, fnlar in ISLER.items():
        for fn in fnlar:
            fn(yol(h)); n += 1
    print("üretilen:", n)
    rapor()
