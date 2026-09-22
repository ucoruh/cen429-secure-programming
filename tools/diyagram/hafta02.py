# -*- coding: utf-8 -*-
"""Hafta 2 — Bilgisayar virüsleri ve güvenlik modelleri görselleri."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cizim import *


def d01(k):
    fig, ax = akis([
        ("TEHDİT tarafı", ["zararlı yazılım türleri", "ve gizlenmesi"], "kotu"),
        ("SAVUNMA tarafı", ["güvenlik modelleri", "erişim denetimi"], "iyi"),
        ("ORTAK DİL", ["CWE · CVE · CVSS", "OWASP · MASVS"], "mor"),
    ], "Bu haftanın üç parçası", "tehdidi tanı → savun → ortak dille adlandır",
        ok_etiketleri=["neye karşı\nsavunuyoruz?", "kalan açığı\nnasıl adlandırırız?"],
        dip="Üçü birlikte: ne olduğunu bilmeden savunamazsın, adlandırmadan yönetemezsin.")
    return kaydet(fig, k, "h02-01-haftanin-resmi")


def d02(k):
    fig, ax = tuval(12.0, 5.0)
    baslik(ax, "Bir virüsün üç parçası", "bulaştırıcı · tetikleyici · yük")
    kutu(ax, 13, 62, 22, 13, "Taşıyıcı program", ["(temiz)"], dolgu="white", kenar=SOLUK, bas_boyut=11.5)
    ok(ax, 24.5, 62, 31, 62, renk=KOTU)
    kutu(ax, 42, 62, 22, 13, "BULAŞTIRICI", ["kendini ekler"], dolgu=KOTUBG, kenar=KOTU, bas_boyut=11.5)
    ok(ax, 53.5, 62, 60, 62, renk=KOTU)
    kutu(ax, 71, 62, 22, 13, "Virüslü program", [], dolgu=UYARIBG, kenar=UYARI, bas_boyut=11.5)
    ok(ax, 71, 55, 71, 48, renk=SOLUK)
    kutu(ax, 71, 41, 30, 12, "TETİKLEYİCİ", ["koşul sağlandı mı?"], dolgu=MORBG, kenar=MOR, bas_boyut=11.5)
    ok(ax, 56, 41, 40, 41, renk=IYI, etiket="hayır", etiket_boyut=9.5)
    kutu(ax, 25, 41, 28, 12, "Yalnız yayıl", ["başka dosyalara"], dolgu=IYIBG, kenar=IYI, bas_boyut=11.5)
    ok(ax, 71, 35, 71, 27, renk=KOTU, etiket="evet", etiket_boyut=9.5, etiket_kay=0.5)
    kutu(ax, 71, 20, 30, 12, "YÜK çalışır", ["asıl zarar"], dolgu=KOTUBG, kenar=KOTU, bas_boyut=11.5)
    serit(ax, 7, "'Ne zaman?' sorusuna TETİKLEYİCİ bakar; koşula bağlı patlayana mantık bombası denir.")
    return kaydet(fig, k, "h02-02-virus-uc-parca")


def d03(k):
    fig, ax = akis([
        ("1 · AÇILIŞ", ["birkaç makine", "sessiz, fark edilmez"], "ana"),
        ("2 · PATLAMA", ["ikiye katlanma", "saniyeler–dakikalar"], "kotu"),
        ("3 · DOYGUNLUK", ["savunmasız makine", "kalmadı"], "uyari"),
    ], "Solucan salgını: SI modeli", "yayılma üstel — insan müdahalesi yetişemez",
        dip="Morris (1988) ve Slammer (2003): dakikalar içinde internetin büyük kısmı etkilendi.",
        dip_renk=KOTU)
    return kaydet(fig, k, "h02-03-salgin-modeli")


def d04(k):
    fig, ax = tuval(12.0, 5.6)
    baslik(ax, "Polimorfik virüs neden imzayla yakalanmaz?", "her kopyada baytlar değişir, açılan gövde aynı kalır")
    ax.add_patch(FancyBboxPatch((4, 24), 56, 50, boxstyle="round,pad=0,rounding_size=2",
                                linewidth=1.8, edgecolor=KOTU, facecolor="#fff7f7", zorder=1))
    ax.text(32, 78, "Şifreli / polimorfik virüs", ha="center", fontsize=11.5, color=KOTU, fontweight="bold")
    kutu(ax, 32, 65, 48, 12, "Çözücü kod", ["her kopyada FARKLI"], dolgu="white", kenar=KOTU,
         bas_boyut=11, satir_boyut=9.6)
    ok(ax, 32, 58.5, 32, 53.5, renk=SOLUK)
    kutu(ax, 32, 47, 48, 12, "Şifreli gövde", ["her kopyada FARKLI baytlar"], dolgu="white", kenar=KOTU,
         bas_boyut=11, satir_boyut=9.6)
    ok(ax, 32, 40.5, 32, 35.5, renk=SOLUK)
    ax.text(35.5, 38, "çöz", fontsize=9.4, color=SOLUK, va="center")
    kutu(ax, 32, 29, 48, 12, "Açık gövde", ["HER ZAMAN AYNI"], dolgu=IYIBG, kenar=IYI,
         bas_boyut=11, satir_boyut=9.6)
    ok(ax, 57, 31, 72, 46, renk=IYI)
    ax.text(66, 34, "emülasyon çözünce", fontsize=9.2, color=IYI, ha="center")
    kutu(ax, 85, 52, 26, 14, "İmza eşleşmesi", ["burada yakalanır"], dolgu=IYIBG, kenar=IYI, bas_boyut=11.2)
    serit(ax, 12, "Bu yüzden emülasyon kullanılır: virüsü yalıtılmış ortamda çalıştırıp AÇIK gövdeyi imzalar.")
    return kaydet(fig, k, "h02-04-polimorfik")


def d05(k):
    fig, ax = tuval(12.0, 5.4)
    baslik(ax, "Bell–LaPadula ↔ Biba: ters yönler", "BLP gizliliği, Biba bütünlüğü korur")
    for x0, ad, renk, bg in ((6, "Bell–LaPadula (GİZLİLİK)", KOYU, COKACIK),
                             (54, "Biba (BÜTÜNLÜK)", UYARI, UYARIBG)):
        ax.add_patch(FancyBboxPatch((x0, 22), 40, 54, boxstyle="round,pad=0,rounding_size=2",
                                    linewidth=1.8, edgecolor=renk, facecolor=bg, zorder=1))
        ax.text(x0 + 20, 80, ad, ha="center", fontsize=12.5, color=renk, fontweight="bold")
    for i, (ad, y) in enumerate((("Çok Gizli", 66), ("Gizli", 49), ("Genel", 32))):
        kutu(ax, 26, y, 26, 10, ad, dolgu="white", kenar=KOYU, bas_boyut=11)
    for i, (ad, y) in enumerate((("Çekirdek", 66), ("Uygulama", 49), ("Dış", 32))):
        kutu(ax, 74, y, 26, 10, ad, dolgu="white", kenar=UYARI, bas_boyut=11)
    ok(ax, 11, 37, 11, 61, renk=KOTU, kesik=True)
    ax.text(8.5, 49, "yukarı OKUMA yok", rotation=90, ha="center", va="center", fontsize=9.4, color=KOTU)
    ok(ax, 42, 61, 42, 37, renk=KOTU, kesik=True)
    ax.text(44.5, 49, "aşağı YAZMA yok", rotation=90, ha="center", va="center", fontsize=9.4, color=KOTU)
    ok(ax, 59, 61, 59, 37, renk=KOTU, kesik=True)
    ax.text(56.5, 49, "aşağı OKUMA yok", rotation=90, ha="center", va="center", fontsize=9.4, color=KOTU)
    ok(ax, 90, 37, 90, 61, renk=KOTU, kesik=True)
    ax.text(92.5, 49, "yukarı YAZMA yok", rotation=90, ha="center", va="center", fontsize=9.4, color=KOTU)
    serit(ax, 12, "Aynı kafes, ters kurallar: biri sırrın aşağı sızmasını, diğeri çöpün yukarı çıkmasını engeller.")
    return kaydet(fig, k, "h02-05-blp-biba")


def d06(k):
    fig, ax = adimlar("Zafiyet yaşam döngüsü ve sorumlu ifşa", [
        ("1 · Keşif", ["araştırmacı / saldırgan"], "uyari"),
        ("2 · Özel ifşa", ["satıcıya bildirim"], "ana"),
        ("3 · Düzeltme", ["yama geliştirilir"], "ana"),
        ("4 · Yama yayını", [], "iyi"),
        ("5 · Kamuya açıklama", ["CVE + ayrıntı"], "mor"),
        ("6 · Yama uygulanması", ["kullanıcılar günceller"], "iyi"),
    ], alt_metin="doğru yol: önce satıcıya bildir, yama çıksın, sonra açıkla", satir_basina=3,
        dip="Kötüye giderse: yama yokken saldırı = ZERO-DAY. Bu yüzden ifşa sırası önemlidir.",
        dip_renk=KOTU)
    return kaydet(fig, k, "h02-06-zafiyet-yasam-dongusu")


def d07(k):
    fig, ax = agac("Saldırı ağacı: başkasının hesabından ödeme",
        "VEYA: Başkasının hesabından ödeme yap  (maliyet 3)", [
        ("Çalıntı cihazla\nödeme  (11)", "VE", ["Ekran kilidini aş · 6", "Uygulama PIN'ini aş · 5"]),
        ("Oturum anahtarını\nkopyala ve taşı  (10)", "VE", ["Anahtarı elde et · 4", "Cihaz bağlamayı aş · 6"]),
        ("Ağda araya\ngir  (6)", "VE", ["TLS'i kır · 3", "Mesaj şifrelemesi · 3"]),
        ("Sunucu API'sini\nkötüye kullan  (3)", "VE", ["Yetki hatası bul · 3"]),
    ], alt_metin="parantez içindeki sayı = saldırganın maliyeti (düşük = kolay)",
       dip="En ucuz dal (3) önce kapatılır: savunma bütçesi en olası yola harcanır.")
    return kaydet(fig, k, "h02-07-saldiri-agaci")


if __name__ == "__main__":
    klasor = sys.argv[1]
    for f in (d01, d02, d03, d04, d05, d06, d07):
        print("  ", os.path.basename(f(klasor)))
