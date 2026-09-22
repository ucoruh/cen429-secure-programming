# -*- coding: utf-8 -*-
"""Hafta 1 — Giriş ve uygulama koruma planı görselleri."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cizim import *


def d01(k):
    fig, ax = iliski("Tehdit · zafiyet · varlık · karşı önlem",
        {"T": (14, 64, "TEHDİT|saldırgan", "kotu", 22, 14),
         "Z": (50, 64, "ZAFİYET|hatalı kod", "uyari", 22, 14),
         "V": (86, 64, "VARLIK|veri · anahtar", "koyu", 22, 14),
         "K": (50, 30, "KARŞI ÖNLEM|denetim · şifreleme", "iyi", 30, 14)},
        [("T", "Z", "kullanır", False, "kotu"), ("Z", "V", "zarar verir", False, "kotu"),
         ("K", "Z", "kapatır", True, "iyi")],
        alt_metin="risk = olasılık × etki",
        dip="Zafiyet olmadan tehdit zarar veremez; karşı önlem zafiyeti kapatır.")
    return kaydet(fig, k, "h01-01-tehdit-zafiyet-varlik")


def d02(k):
    fig, ax = akis([
        ("UZAK saldırgan", ["yalnız ağ mesajları", "görür"], "ana"),
        ("YEREL kullanıcı", ["+ dosyalar, ortam", "başka süreçler"], "uyari"),
        ("BEYAZ KUTU (MATE)", ["+ bellek, yazmaçlar", "ikili kod, debugger"], "kotu"),
    ], "Saldırgan modelleri: ne görebiliyor?",
        "soldan sağa görünürlük artar → savunma zorlaşır",
        dip="Bu derste varsayılan model BEYAZ KUTU'dur: saldırgan cihazın sahibidir.",
        dip_renk=KOTU)
    return kaydet(fig, k, "h01-02-saldirgan-modelleri")


def d03(k):
    fig, ax = katman("Yedi koruma katmanı", [
        ("7 · Güvence", "gereksinim, test, sertifikasyon (12–13. hafta)", "mor"),
        ("6 · Kriptografik koruma", "AES, RSA, PKI, whitebox (3, 10, 11. hafta)", "ana"),
        ("5 · Çalışma zamanı öz koruması", "RASP (6. hafta)", "ana"),
        ("4 · Kod gizleme ve çeşitlendirme", "(4, 5, 9, 14. hafta)", "ana"),
        ("3 · Derleyici ve OS korumaları", "kanarya, ASLR, DEP/NX (4. hafta)", "ana"),
        ("2 · Güvenli kodlama kuralları", "CERT, girdi doğrulama (1, 4, 5. hafta)", "iyi"),
        ("1 · Güvenli tasarım ve tehdit modeli", "TEMEL — burası yanlışsa üstü kurtarmaz", "koyu"),
    ], alt_metin="aşağıdan yukarı: her katman bir öncekinin üzerine kurulur",
        dip="Bir katman aşılsa bile diğerleri durdurur — derinlemesine savunma.",
        g=11.5, y=6.2)
    return kaydet(fig, k, "h01-03-yedi-katman")


def d04(k):
    fig, ax = adimlar("Uygulama koruma planı: yedi adım", [
        ("1 · Kapsam", ["neyi koruyoruz?"], "ana"),
        ("2 · Mimari ve arayüzler", ["bileşenler, sınırlar"], "ana"),
        ("3 · Varlıklar", ["anahtar, veri, kod"], "ana"),
        ("4 · Tehdit modeli", ["STRIDE, saldırı ağacı"], "uyari"),
        ("5 · Karşı önlemler", ["hangi katman?"], "iyi"),
        ("6 · Doğrulama", ["test + kanıt"], "iyi"),
        ("7 · Kalan risk", ["yazılı, onaylı"], "mor"),
    ], alt_metin="1–3 TANIMLA · 4–7 KORU ve KANITLA", satir_basina=4,
        dip="Bu yedi adım dönem projesinin de iskeletidir (S2–S17).")
    return kaydet(fig, k, "h01-04-koruma-plani")


def d05(k):
    fig, ax = tuval(12.5, 5.8)
    baslik(ax, "Mobil ödeme: mimari ve arayüzler", "kırmızı kutu = güvenilmez ortam (saldırgan burada)")
    ax.add_patch(FancyBboxPatch((3, 26), 46, 54, boxstyle="round,pad=0,rounding_size=2",
                                linewidth=2, edgecolor=KOTU, facecolor="#fff7f7", zorder=1))
    ax.text(26, 84, "Kullanıcının telefonu — GÜVENİLMEZ", ha="center", va="center",
            fontsize=11.5, color=KOTU, fontweight="bold", zorder=3)
    kutu(ax, 26, 72, 36, 9, "Mobil uygulama", dolgu="white", kenar=ANA, bas_boyut=11)
    kutu(ax, 26, 58, 36, 9, "Güvenlik kütüphanesi — Java", dolgu=COKACIK, kenar=ANA, bas_boyut=10.6)
    kutu(ax, 26, 44, 36, 9, "Güvenlik kütüphanesi — native C/C++", dolgu=ACIK, kenar=ANA, bas_boyut=10.2)
    kutu(ax, 26, 32, 36, 8, "Yerel veritabanı (şifreli)", dolgu="white", kenar=SOLUK, bas_boyut=10.4, kalin=False)
    for y1, y2, et in ((67.5, 62.5, "A"), (53.5, 48.5, "B"), (39.5, 36, "C")):
        ok(ax, 26, y1, 26, y2, renk=SOLUK, kalinlik=1.6)
        ax.text(29.5, (y1 + y2) / 2, et, fontsize=9.5, color=SOLUK, va="center")
    ax.add_patch(FancyBboxPatch((62, 46), 35, 30, boxstyle="round,pad=0,rounding_size=2",
                                linewidth=2, edgecolor=IYI, facecolor=IYIBG, zorder=1))
    ax.text(79.5, 80, "Hizmet sağlayıcı — GÜVENİLİR", ha="center", va="center",
            fontsize=11.5, color=IYI, fontweight="bold", zorder=3)
    kutu(ax, 79.5, 66, 28, 9, "Arka uç sunucu", dolgu="white", kenar=IYI, bas_boyut=11)
    kutu(ax, 79.5, 53, 28, 9, "HSM (anahtar kasası)", dolgu="white", kenar=IYI, bas_boyut=10.6)
    ok(ax, 79.5, 61.5, 79.5, 57.5, renk=IYI, kalinlik=1.6)
    kutu(ax, 79.5, 33, 28, 9, "Ödeme terminali (POS)", dolgu=UYARIBG, kenar=UYARI, bas_boyut=10.6)
    ok(ax, 44, 58, 65, 66, renk=ANA, etiket="D: TLS + mesaj şifreleme", etiket_boyut=9)
    ok(ax, 44, 44, 65, 35, renk=UYARI, etiket="E: NFC", etiket_boyut=9, etiket_kay=-5)
    serit(ax, 17, "Her arayüz (A–E) ayrı bir saldırı yüzeyidir: her biri için önlem ve kanıt yazılır.")
    return kaydet(fig, k, "h01-05-mimari-arayuzler")


def d06(k):
    fig, ax = agac("Saldırı ağacı: ödeme anahtarını ele geçir",
        "HEDEF: Ödeme anahtarını ele geçir", [
        ("Yerel veritabanını\nkopyala ve çöz", "VE", ["Root yetkisi al", "DB anahtarını bul"]),
        ("Kullanım anında\nbellekten oku", "VEYA", ["Debugger bağla", "Bellek dökümü al", "Fonksiyona kanca at"]),
        ("Sunucu ile telefon\narasında dinle", "VE", ["TLS'i kır / sahte\nsertifika kabul ettir", "Mesaj şifrelemesini kır"]),
    ], alt_metin="VEYA = tek dal yeter · VE = tüm dallar gerekir",
       dip="Savunma, saldırganı VE düğümlerine zorlar: birini kesmek saldırıyı durdurur.")
    return kaydet(fig, k, "h01-06-saldiri-agaci")


def d07(k):
    fig, ax = tuval(12.5, 5.2)
    baslik(ax, "Parola kasası: bileşenler ve arayüzler", "her ok bir arayüz — her arayüz doğrulanır")
    kutu(ax, 10, 60, 14, 12, "Kullanıcı", dolgu="white", kenar=SOLUK, bas_boyut=11)
    ax.add_patch(FancyBboxPatch((22, 26), 44, 48, boxstyle="round,pad=0,rounding_size=2",
                                linewidth=1.8, edgecolor=ANA, facecolor=COKACIK, zorder=1))
    ax.text(44, 78, "Kullanıcının bilgisayarı", ha="center", fontsize=11.5, color=KOYU, fontweight="bold")
    kutu(ax, 33, 62, 18, 10, "Arayüz", dolgu="white", kenar=ANA, bas_boyut=11)
    kutu(ax, 33, 44, 18, 10, "Çekirdek\nkütüphane", dolgu="white", kenar=ANA, bas_boyut=10.4)
    kutu(ax, 56, 58, 16, 9, "Kasa dosyası", dolgu="white", kenar=SOLUK, bas_boyut=10, kalin=False)
    kutu(ax, 56, 38, 16, 9, "Pano", dolgu="white", kenar=SOLUK, bas_boyut=10, kalin=False)
    ax.add_patch(FancyBboxPatch((70, 30), 27, 40, boxstyle="round,pad=0,rounding_size=2",
                                linewidth=1.8, edgecolor=KOTU, facecolor="#fff7f7", zorder=1))
    ax.text(83.5, 74, "İnternet — GÜVENİLMEZ", ha="center", fontsize=11, color=KOTU, fontweight="bold")
    kutu(ax, 83.5, 58, 22, 10, "Yedekleme sunucusu", dolgu="white", kenar=KOTU, bas_boyut=10)
    kutu(ax, 83.5, 40, 22, 10, "Güncelleme sunucusu", dolgu="white", kenar=KOTU, bas_boyut=10)
    ok(ax, 17, 60, 24, 62, renk=SOLUK, etiket="A: klavye", etiket_boyut=8.6)
    ok(ax, 33, 57, 33, 49, renk=SOLUK, etiket="B: çağrı", etiket_boyut=8.6, etiket_kay=0.6)
    ok(ax, 42, 45, 48, 55, renk=SOLUK, etiket="C: dosya", etiket_boyut=8.6)
    ok(ax, 42, 42, 48, 38, renk=SOLUK, etiket="D: pano", etiket_boyut=8.6, etiket_kay=-4)
    ok(ax, 64, 56, 72, 57, renk=KOTU, etiket="E: TLS", etiket_boyut=8.6)
    ok(ax, 42, 63, 72, 42, renk=KOTU, etiket="F: TLS + imza", etiket_boyut=8.6)
    serit(ax, 14, "Güvenilmez tarafa giden her ok (E, F) kimlik doğrulama ve bütünlük ister.")
    return kaydet(fig, k, "h01-07-kasa-mimari")


def d08(k):
    fig, ax = akis([
        ('system("date")', ["kabuk çağrılır"], "ana"),
        ("/bin/sh date", ["PATH'te arar"], "ana"),
        ("PATH[0] = sahte klasör", ["date VAR → ÇALIŞTIRIR", "saldırganın programı"], "kotu"),
        ("PATH[1] = /usr/bin", ["hiç bakılmaz"], "uyari"),
    ], "PATH ile kandırma: neden system() tehlikeli?",
        "kabuk, programı adına göre PATH sırasıyla arar",
        dip="Düzeltme: mutlak yol (/bin/date) · kabuksuz çalıştırma (execve) · temiz ortam.",
        dip_renk=KOTU)
    return kaydet(fig, k, "h01-08-path-kandirma")


def d09(k):
    fig, ax = adimlar("Belleğin dört ömrü ve her adımın CWE'si", [
        ("1 · AYIR", ["malloc / new"], "ana"),
        ("2 · DENETLE", ["NULL mı?", "CWE-476"], "uyari"),
        ("3 · KULLAN", ["sınır içinde", "CWE-787"], "ana"),
        ("4 · SİL", ["sırrı temizle", "CWE-226"], "iyi"),
        ("5 · SERBEST BIRAK", ["bir kez", "CWE-415"], "iyi"),
        ("6 · İŞARETÇİYİ UNUT", ["p = NULL", "CWE-416"], "mor"),
    ], alt_metin="her adımın atlanması ayrı bir zafiyet sınıfı üretir", satir_basina=3,
        dip="Altı adımın hepsi yapılmazsa bellek hatası kaçınılmazdır.")
    return kaydet(fig, k, "h01-09-bellek-omru")


def d10(k):
    fig, ax = iki_yol("Bölümleme: güvenilir hesaplama tabanını küçült",
        ("GENEL BÖLGE", ["büyük · hızlı değişir", "", "Arayüz", "İş mantığı", "", "hata olasılığı YÜKSEK"], "uyari"),
        ("KORUNAN ÇEKİRDEK", ["küçük · seyrek değişir", "", "Dar arayüz (tutamaçlar)", "Kripto ve anahtar yönetimi",
                              "Bütünlük / RASP denetimleri", "incelenebilir, kanıtlanabilir"], "iyi"),
        alt_metin="aralarından yalnız tutamaç ve şifreli veri geçer",
        dip="Güvenlik kritik kod ne kadar küçükse, doğruluğunu kanıtlamak o kadar kolaydır.")
    return kaydet(fig, k, "h01-10-bolumleme")


def d11(k):
    fig, ax = adimlar("Değişiklik yönetimi: yedi adım", [
        ("1 · Temel çizgi", ["onaylı sürüm"], "koyu"),
        ("2 · Değişiklik talebi", [], "ana"),
        ("3 · Sınıflandırma", ["öncelik, kategori"], "ana"),
        ("4 · Onay ve planlama", [], "uyari"),
        ("5 · Geliştirme ve test", [], "ana"),
        ("6 · Yayın", ["imzalı sürüm"], "iyi"),
        ("7 · Doğrulama", ["gözden geçirme"], "iyi"),
    ], alt_metin="her değişiklik izlenebilir ve geri alınabilir olmalı", satir_basina=4,
        dongu="7 → yeni temel çizgi → 1",
        dip="Sertifikasyonda 'hangi sürüm onaylandı?' sorusunun cevabı bu döngüdür (12. hafta).")
    return kaydet(fig, k, "h01-11-degisiklik-yonetimi")


if __name__ == "__main__":
    klasor = sys.argv[1]
    for f in (d01, d02, d03, d04, d05, d06, d07, d08, d09, d10, d11):
        print("  ", os.path.basename(f(klasor)))
