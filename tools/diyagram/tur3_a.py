# -*- coding: utf-8 -*-
"""6. tur — slaytlarda kalan ASCII şemaların yerine geçecek çizimler."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cizim import *

KOK = None
def yol(h): return os.path.join(KOK, "week-%d" % h, "assets")


# ===================================================== HAFTA 3
def h03_11(k):
    fig, ax = tuval(11.5, 5.0)
    baslik(ax, "İleri gizlilik: eski anahtarlar geri hesaplanamaz",
           "zincirin her halkası bir öncekinden tek yönlü türetilir")
    adlar = ["K1", "K2", "K3", "K4"]
    xler = [16, 38, 60, 82]
    for i, (ad, x) in enumerate(zip(adlar, xler)):
        son = (i == len(adlar) - 1)
        kutu(ax, x, 56, 16, 16, ad,
             ["oturum %d" % (i + 1)] + (["ELDE OLAN"] if son else ["silindi"]),
             dolgu=IYIBG if son else COKACIK, kenar=IYI if son else CIZGI,
             bas_boyut=15, satir_boyut=9.4)
        if not son:
            ok(ax, x + 8.5, 56, xler[i + 1] - 8.5, 56, renk=SOLUK,
               etiket="KDF", etiket_boyut=9.5)
    ok(ax, 82, 44, 16, 44, renk=KOTU, kalinlik=2.0, kesik=True)
    ax.text(49, 38.5, "✗  K4'ten K3, K2, K1 GERİ HESAPLANAMAZ (tek yönlü)",
            ha="center", va="center", fontsize=11.5, color=KOTU, fontweight="bold")
    serit(ax, 22, "Bugün anahtar çalınsa bile dünkü trafik çözülemez — ileri gizliliğin tanımı budur.")
    return kaydet(fig, k, "h03-11-ileri-gizlilik")


# ===================================================== HAFTA 4
def h04_14(k):
    fig, ax = akis(
        [("KAYNAK (source)", ["recv(sock, buf, ...)", "ağdan gelen veri", "güvenilmez"], "kotu"),
         ("TAŞIMA", ["len = buf[1]<<8 | buf[2]", "doğrulama YOK", "kirlilik korunur"], "uyari"),
         ("HEDEF (sink)", ["memcpy(out, buf+3, len)", "sınır denetimi yok", "CWE-787"], "kotu")],
        "Kirli veri takibi: kaynaktan hedefe",
        "saldırganın yazdığı bir değer, denetlenmeden tehlikeli bir çağrıya ulaşıyor",
        dip="Bulgu kuralı: kaynak ile hedef arasında doğrulama yoksa, o yol bir zafiyettir.",
        dip_renk=KOTU, g=12.0, y=4.8)
    return kaydet(fig, k, "h04-14-kirli-veri")


# ===================================================== HAFTA 9
def h09_13(k):
    fig, ax = akis(
        [("kaynak.c", ["insan okur", "değişken adları,", "yorumlar, yapı"], "iyi"),
         ("derleyici", ["çevirir ve", "iyileştirir", "adları atar"], "ana"),
         ("program (ikili)", ["makine çalıştırır", "yalnız komutlar", "ad/yorum yok"], "mor")],
        "Derleyici ne yapar: kaynaktan ikiliye",
        "gizleme işte bu iki uçtan birinde devreye girer",
        dip="Saldırganın elinde yalnız sağdaki kutu vardır; tersine mühendislik soldakini geri kurmaya çalışır.",
        g=12.0, y=4.8)
    return kaydet(fig, k, "h09-13-derleme-zinciri")


# ===================================================== HAFTA 10
def h10_13(k):
    fig, ax = tuval(11.5, 5.0)
    baslik(ax, "En zayıf halka kuralı", "sistemin gücü, en güçlü parçası kadar değildir")
    kutu(ax, 26, 58, 34, 22, "RSA-2048", ["asimetrik katman", "≈ 112 bit güvenlik"],
         dolgu=KOTUBG, kenar=KOTU, bas_boyut=14)
    ax.text(50, 58, "+", ha="center", va="center", fontsize=20, color=SOLUK)
    kutu(ax, 74, 58, 34, 22, "AES-256", ["simetrik katman", "256 bit güvenlik"],
         dolgu=IYIBG, kenar=IYI, bas_boyut=14)
    ok(ax, 50, 45, 50, 35, renk=SOLUK)
    kutu(ax, 50, 26, 58, 14, "SİSTEMİN GÜVENLİĞİ ≈ 112 BİT",
         ["zayıf halka belirler — 256 bitlik AES bunu yükseltmez"],
         dolgu=UYARIBG, kenar=UYARI, bas_boyut=13.5, satir_boyut=10)
    serit(ax, 11, "Katmanları ayrı ayrı değil, en düşük güvenlik seviyesine göre değerlendirin.")
    return kaydet(fig, k, "h10-13-en-zayif-halka")


# ===================================================== HAFTA 11
def h11_10(k):
    fig, ax = tuval(11.5, 4.8)
    baslik(ax, "Şifreleme nedir? İki yönlü, anahtara bağlı dönüşüm",
           "aynı anahtar hem kilitler hem açar (simetrik şifreleme)")
    kutu(ax, 20, 60, 30, 18, "açık metin", ["okunabilir veri"],
         dolgu=IYIBG, kenar=IYI, bas_boyut=13.5)
    kutu(ax, 80, 60, 30, 18, "şifreli metin", ["gürültüden ayırt edilemez"],
         dolgu=MORBG, kenar=MOR, bas_boyut=13.5)
    ok(ax, 36, 65, 64, 65, renk=ANA, etiket="anahtar ile ŞİFRELE", etiket_boyut=10)
    ok(ax, 64, 53, 36, 53, renk=ANA, etiket="anahtar ile ÇÖZ", etiket_boyut=10, etiket_kay=-4.2)
    kutu(ax, 50, 30, 40, 13, "ANAHTAR", ["gizli olan tek şey budur"],
         dolgu=COKACIK, kenar=KOYU, bas_boyut=13, satir_boyut=9.8)
    serit(ax, 13, "Kerckhoffs ilkesi: algoritma herkesçe bilinebilir; güvenlik yalnız anahtarın gizliliğindedir.")
    return kaydet(fig, k, "h11-10-sifreleme-temel")


# ===================================================== HAFTA 14
def h14_09(k):
    fig, ax = tuval(11.8, 5.8)
    baslik(ax, "Hangi koda ne kadar gizleme? Karar akışı",
           "önce hassas mı, sonra değeri ne kadar")
    kutu(ax, 50, 70, 34, 12, "Hassas mı?", dolgu=COKACIK, kenar=KOYU, bas_boyut=13.5)
    kutu(ax, 17, 48, 26, 11, "gizleme yok", dolgu=IYIBG, kenar=IYI, bas_boyut=12)
    kutu(ax, 62, 48, 26, 11, "Değeri?", dolgu=COKACIK, kenar=KOYU, bas_boyut=12.5)
    ok(ax, 42, 64, 24, 54.5, renk=SOLUK)
    ok(ax, 58, 64, 60, 54.5, renk=SOLUK)
    ax.text(29, 61, "hayır", ha="center", va="center", fontsize=10, color=SOLUK)
    ax.text(64, 60, "evet", ha="center", va="center", fontsize=10, color=SOLUK)
    kutu(ax, 31, 28, 40, 15, "ORTA",
         ["EncodeLiterals + Arithmetic", "+ Flatten + AddOpaque"],
         dolgu=UYARIBG, kenar=UYARI, bas_boyut=12, satir_boyut=9.4)
    kutu(ax, 78, 28, 38, 15, "YÜKSEK ve küçük",
         ["yukarıdakilerin hepsi", "+ Virtualize"],
         dolgu=KOTUBG, kenar=KOTU, bas_boyut=12, satir_boyut=9.4)
    ok(ax, 56, 42.5, 40, 36.5, renk=SOLUK)
    ok(ax, 68, 42.5, 76, 36.5, renk=SOLUK)
    serit(ax, 13, "Her durumda: çeşitlendir · ölç · testle · S9 ve S15 kayıtlarına yaz.")
    return kaydet(fig, k, "h14-09-karar-akisi")


def h14_10(k):
    fig, ax = iki_yol(
        "Kontrol akışı: düzleştirmeden önce ve sonra",
        ("ÖNCE — okunur", ["[hesapla] → [karşılaştır]", "→ [geç] / [red]",
                           "birkaç blok", "akış gözle izlenir"], "iyi"),
        ("SONRA — düzleştirilmiş", ["[switch] ⇄ {çok sayıda case}",
                                    "+ sahte durumlar", "çok blok",
                                    "sıra durum değişkeninde saklı"], "kotu"),
        alt_metin="aynı sonucu üreten iki program, çok farklı iki grafik",
        dip="Amaç: blok sayısını ve dallanmayı artırıp statik okumayı pahalı kılmak.",
        g=11.5, y=5.2)
    return kaydet(fig, k, "h14-10-cfg-once-sonra")


ISLER = {3: [h03_11], 4: [h04_14], 9: [h09_13], 10: [h10_13],
         11: [h11_10], 14: [h14_09, h14_10]}

if __name__ == "__main__":
    KOK = sys.argv[1]
    n = 0
    for h, fnlar in ISLER.items():
        for fn in fnlar:
            fn(yol(h)); n += 1
    print("üretilen:", n)
    rapor()
