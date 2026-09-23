# -*- coding: utf-8 -*-
"""5. tur — ASCII şemaların yerine geçecek çizimler (H1, H2, H3, H9)."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cizim import *

KOK = None
def yol(h): return os.path.join(KOK, "week-%d" % h, "assets")


def _bayt_seridi(ax, x0, y, genislik, hucreler, etiket_alt=None, boyut=9.0):
    """Yan yana bayt hücreleri çizer. hucreler = [(metin, dolgu, kenar), ...]"""
    n = len(hucreler)
    hg = genislik / n
    for i, (metin, dolgu, kenar) in enumerate(hucreler):
        ax.add_patch(FancyBboxPatch((x0 + i * hg, y - 4), hg - 0.25, 8,
                                    boxstyle="round,pad=0,rounding_size=0.6",
                                    linewidth=1.2, edgecolor=kenar, facecolor=dolgu, zorder=2))
        ax.text(x0 + i * hg + hg / 2 - 0.12, y, metin, ha="center", va="center",
                fontsize=boyut, color=YAZI, zorder=3)
    if etiket_alt:
        ax.text(x0 + genislik / 2, y - 7.5, etiket_alt, ha="center", va="top",
                fontsize=9.4, color=SOLUK)


# ===================================================== HAFTA 1
def h01_13(k):
    fig, ax = tuval(10.5, 5.8)
    baslik(ax, "Süreç belleği: verileriniz nerede duruyor?", "yığın aşağı, öbek yukarı büyür — ortada boşluk")
    bolgeler = [("Yığın (stack)", "yerel değişkenler, dönüş adresleri", COKACIK, ANA, 66),
                ("↓  boş alan  ↑", "", "white", CIZGI, 54),
                ("Öbek (heap)", "malloc / new ile ayrılan", IYIBG, IYI, 42),
                ("BSS + Data", "global ve statik değişkenler", MORBG, MOR, 30),
                ("Kod (text)", "makine komutları — salt okunur", UYARIBG, UYARI, 18)]
    for ad, alt, dolgu, kenar, y in bolgeler:
        kutu(ax, 34, y, 44, 10, ad, dolgu=dolgu, kenar=kenar, bas_boyut=11.5,
             kalin=(ad != "↓  boş alan  ↑"))
        if alt:
            ax.text(59, y, alt, ha="left", va="center", fontsize=9.6, color=SOLUK)
    ax.text(9, 71, "yüksek adres", ha="center", fontsize=9.6, color=SOLUK)
    ax.text(9, 13, "düşük adres", ha="center", fontsize=9.6, color=SOLUK)
    ok(ax, 9, 68, 9, 16, renk=SOLUK, kalinlik=1.6)
    serit(ax, 7, "Taşmanın sonucu hangi bölgede olduğuna bağlıdır: yığında dönüş adresi, öbekte komşu blok.")
    return kaydet(fig, k, "h01-13-surec-bellegi")


def h01_14(k):
    fig, ax = tuval(12.0, 5.0)
    baslik(ax, "Yapının bellekteki hâli: taşma neyi ezer?", "ad[16] ve yonetici yan yana durur")
    ax.text(6, 72, "ÖNCE", fontsize=12, color=IYI, fontweight="bold")
    once = [(c, COKACIK, ANA) for c in list("ayse") + ["\\0"]] + \
           [(".", "white", CIZGI) for _ in range(11)]
    _bayt_seridi(ax, 18, 66, 52, once)
    _bayt_seridi(ax, 74, 66, 20, [("00", IYIBG, IYI) for _ in range(4)])
    ax.text(44, 57, "ad[16]", ha="center", fontsize=9.6, color=SOLUK)
    ax.text(84, 57, "yonetici = 0", ha="center", fontsize=9.6, color=IYI)

    ax.text(6, 36, "SONRA", fontsize=12, color=KOTU, fontweight="bold")
    sonra = [("A", KOTUBG, KOTU) for _ in range(16)]
    _bayt_seridi(ax, 18, 30, 52, sonra)
    _bayt_seridi(ax, 74, 30, 20, [("B", KOTUBG, KOTU)] + [("00", IYIBG, IYI) for _ in range(3)])
    ax.text(44, 21, "17 karakterlik \"AAAA...AAAB\" kopyalandı", ha="center", fontsize=9.6, color=KOTU)
    ax.text(84, 21, "yonetici ≠ 0  →  YETKİ YÜKSELDİ", ha="center", fontsize=9.6, color=KOTU,
            fontweight="bold")
    serit(ax, 9, "Tek bayt taşma yetkiyi değiştirdi: sınır denetimi olmayan kopya, komşu alanı ezer.")
    return kaydet(fig, k, "h01-14-yapi-bellekte")


def h01_15(k):
    fig, ax = tuval(11.0, 5.4)
    baslik(ax, "Yığında taşma adım adım", "strcpy aşağıdan yukarı yazar")
    katlar = [("tampon[0..15]", "strcpy buraya yazmaya başlar", COKACIK, ANA, 24),
              ("yetkili (int)", "16 bayttan sonrası buraya taşar", UYARIBG, UYARI, 38),
              ("kaydedilmiş çerçeve", "saved rbp", MORBG, MOR, 52),
              ("DÖNÜŞ ADRESİ", "buraya ulaşırsa akış ele geçer", KOTUBG, KOTU, 66)]
    for ad, alt, dolgu, kenar, y in katlar:
        kutu(ax, 32, y, 44, 11, ad, dolgu=dolgu, kenar=kenar, bas_boyut=11.5)
        ax.text(57, y, alt, ha="left", va="center", fontsize=9.4, color=SOLUK)
    ok(ax, 7, 20, 7, 70, renk=KOTU, kalinlik=3.0)
    ax.text(3.6, 45, "taşma yönü", rotation=90, ha="center", va="center", fontsize=9.6, color=KOTU)
    serit(ax, 9, "Kanarya, dönüş adresinden önce durur: ezilirse program sonlanır (ama yetkili zaten ezilmiştir).")
    return kaydet(fig, k, "h01-15-yiginda-tasma")


def h01_16(k):
    fig, ax = tuval(12.0, 4.6)
    baslik(ax, "Açıklık penceresi: sır ne kadar süre açık?", "aynı işi yapan iki tasarım, çok farklı risk")
    ax.text(6, 70, "KÖTÜ", fontsize=12, color=KOTU, fontweight="bold")
    ax.add_patch(FancyBboxPatch((18, 62), 74, 8, boxstyle="round,pad=0,rounding_size=1",
                                linewidth=0, facecolor=KOTU, zorder=2))
    ax.text(55, 54, "anahtar açılışta çözülür ve kapanana kadar bellekte AÇIK kalır",
            ha="center", fontsize=9.6, color=KOTU)

    ax.text(6, 34, "İYİ", fontsize=12, color=IYI, fontweight="bold")
    ax.add_patch(FancyBboxPatch((18, 26), 74, 8, boxstyle="round,pad=0,rounding_size=1",
                                linewidth=0, facecolor="#dfeedf", zorder=2))
    for x in (26, 44, 62, 80):
        ax.add_patch(FancyBboxPatch((x, 26), 5, 8, boxstyle="round,pad=0,rounding_size=0.6",
                                    linewidth=0, facecolor=IYI, zorder=3))
    ax.text(55, 18, "anahtar yalnız her işlemin birkaç milisaniyesinde açık, sonra hemen silinir",
            ha="center", fontsize=9.6, color=IYI)
    ok(ax, 18, 76, 92, 76, renk=SOLUK, kalinlik=1.6)
    ax.text(55, 80, "zaman", ha="center", fontsize=9.6, color=SOLUK)
    serit(ax, 8, "Bellek dökümü alan saldırgan için önemli olan tek şey: o anda anahtar açık mıydı?")
    return kaydet(fig, k, "h01-16-aciklik-penceresi")


# ===================================================== HAFTA 2
def h02_08(k):
    fig, ax = tuval(11.5, 4.6)
    baslik(ax, "Unix izin bitleri: -rwxr-x---", "üç grup, üçer bit")
    gruplar = [("-", "dosya türü", SOLUK, 12), ("rwx", "SAHİP: oku+yaz+çalıştır", IYI, 32),
               ("r-x", "GRUP: oku+çalıştır", UYARI, 56), ("---", "DİĞERLERİ: izin yok", KOTU, 80)]
    for metin, aciklama, renk, x in gruplar:
        kutu(ax, x, 62, 18, 14, metin, dolgu="white", kenar=renk, bas_renk=renk, bas_boyut=17)
        ok(ax, x, 54, x, 44, renk=renk, kalinlik=1.5)
        ax.text(x, 38, aciklama, ha="center", va="center", fontsize=9.6, color=renk,
                fontweight="bold")
    ax.text(50, 24, "Her grup 3 bit: r=4, w=2, x=1  →  rwx = 7, r-x = 5, --- = 0  ⇒  chmod 750",
            ha="center", fontsize=10.4, color=YAZI)
    serit(ax, 10, "En az ayrıcalık: 'diğerleri' sütununu boş bırakmak çoğu sızıntıyı baştan keser.")
    return kaydet(fig, k, "h02-08-unix-izinleri")


# ===================================================== HAFTA 3
def h03_09(k):
    fig, ax = tuval(12.0, 4.8)
    baslik(ax, "Zarflama (envelope encryption)", "veriyi DEK, DEK'i KEK şifreler")
    kutu(ax, 14, 66, 22, 13, "Veri", dolgu=COKACIK, kenar=ANA, bas_boyut=12)
    ok(ax, 25.5, 66, 36, 66, renk=SOLUK, etiket="AES-GCM(DEK)", etiket_boyut=9.2)
    kutu(ax, 60, 66, 30, 13, "Şifreli veri", dolgu=IYIBG, kenar=IYI, bas_boyut=12)
    kutu(ax, 14, 34, 22, 13, "DEK", ["veri anahtarı"], dolgu=ACIK, kenar=ANA,
         bas_boyut=12, satir_boyut=9.2)
    ok(ax, 25.5, 34, 36, 34, renk=SOLUK, etiket="AES-KW(KEK)", etiket_boyut=9.2)
    kutu(ax, 60, 34, 30, 13, "Sarılmış DEK", ["şifreli verinin yanında"], dolgu=IYIBG, kenar=IYI,
         bas_boyut=12, satir_boyut=9.2)
    kutu(ax, 90, 50, 16, 13, "KEK", ["HSM'de"], dolgu=KOYU, kenar=KOYU, bas_renk="white",
         bas_boyut=12, satir_boyut=9.2)
    ok(ax, 90, 43, 76, 38, renk=SOLUK, kesik=True, kalinlik=1.4)
    serit(ax, 12, "KEK yenilenince yalnız SARILMIŞ DEK'ler yeniden sarılır — terabaytlarca veri yerinde kalır.")
    return kaydet(fig, k, "h03-09-zarflama")


def h03_10(k):
    fig, ax = tuval(12.0, 4.4)
    baslik(ax, "Kayıt biçimi: anahtar yenilemeyi mümkün kılan alan", "sürüm alanı olmadan anahtar değiştirilemez")
    alanlar = [("biçim", "1 bayt", MORBG, MOR, 10, 12),
               ("anahtar_sürüm", "4 bayt", UYARIBG, UYARI, 26, 20),
               ("nonce", "12 bayt", COKACIK, ANA, 48, 16),
               ("şifreli metin", "n bayt", IYIBG, IYI, 70, 22),
               ("etiket", "16 bayt", ACIK, ANA, 90, 14)]
    for ad, boyut, dolgu, kenar, x, g in alanlar:
        kutu(ax, x, 58, g, 16, ad, [boyut], dolgu=dolgu, kenar=kenar, bas_boyut=10.4, satir_boyut=9.0)
    ax.plot([4, 60], [44, 44], color=UYARI, linewidth=2.2, zorder=2)
    ax.plot([4, 4], [44, 47], color=UYARI, linewidth=2.2, zorder=2)
    ax.plot([60, 60], [44, 47], color=UYARI, linewidth=2.2, zorder=2)
    ax.text(32, 38, "AAD — şifrelenmez ama DEĞİŞTİRİLEMEZ", ha="center", fontsize=10,
            color=UYARI, fontweight="bold")
    serit(ax, 16, "Okurken önce sürüme bakılır, o sürümün anahtarıyla çözülür → eski kayıtlar bozulmadan anahtar yenilenir.")
    return kaydet(fig, k, "h03-10-kayit-bicimi")


# ===================================================== HAFTA 9
def h09_12(k):
    fig, ax = tuval(11.5, 4.4)
    baslik(ax, "Kontrol akışı grafiği (CFG)", "tersine mühendisliğin ilk çıkardığı iskelet")
    kutu(ax, 12, 56, 16, 12, "giriş", dolgu=COKACIK, kenar=ANA, bas_boyut=11.5)
    ok(ax, 20.5, 56, 28, 56, renk=SOLUK)
    kutu(ax, 38, 56, 18, 12, "koşul", dolgu=UYARIBG, kenar=UYARI, bas_boyut=11.5)
    kutu(ax, 66, 72, 22, 12, "evet bloğu", dolgu=IYIBG, kenar=IYI, bas_boyut=11.5)
    kutu(ax, 66, 40, 22, 12, "hayır bloğu", dolgu=MORBG, kenar=MOR, bas_boyut=11.5)
    ok(ax, 47.5, 60, 55, 70, renk=IYI, etiket="evet", etiket_boyut=9.2)
    ok(ax, 47.5, 52, 55, 44, renk=MOR, etiket="hayır", etiket_boyut=9.2, etiket_kay=-4.4)
    kutu(ax, 92, 56, 14, 12, "çıkış", dolgu=COKACIK, kenar=ANA, bas_boyut=11.5)
    ok(ax, 77, 68, 86, 60, renk=SOLUK, kalinlik=1.5)
    ok(ax, 77, 44, 86, 52, renk=SOLUK, kalinlik=1.5)
    serit(ax, 14, "Düzleştirme bu iskeleti tek bir dağıtıcıya indirger: 'hangi blok ne zaman' bilgisi kaybolur.")
    return kaydet(fig, k, "h09-12-cfg")


ISLER = {1: [h01_13, h01_14, h01_15, h01_16], 2: [h02_08],
         3: [h03_09, h03_10], 9: [h09_12]}

if __name__ == "__main__":
    KOK = sys.argv[1]
    n = 0
    for h, fnlar in ISLER.items():
        for fn in fnlar:
            fn(yol(h)); n += 1
    print("üretilen:", n)
    rapor()
