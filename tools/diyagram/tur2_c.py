# -*- coding: utf-8 -*-
"""4. tur — Hafta 7, 8, 15, 16 (proje gösterimi ve sınav haftaları)."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cizim import *

KOK = None
def yol(h): return os.path.join(KOK, "week-%d" % h, "assets")

# ===================================================== HAFTA 7 — Ara proje gösterimi
def h07_01(k):
    fig, ax = adimlar("Gösterim günü akışı", [
        ("1 · Kurulum", ["depo klonlanır", "derlenir"], "ana"),
        ("2 · Sunum", ["10 dk: ne yaptık,", "neden böyle"], "koyu"),
        ("3 · Canlı demo", ["çalışan ürün"], "iyi"),
        ("4 · Sorular", ["her üyeye ayrı"], "uyari"),
        ("5 · Geri bildirim", ["final için yol haritası"], "mor"),
    ], alt_metin="toplam 20 dakika · takımın HER üyesi konuşur", satir_basina=5,
       dip="Yazdığınız her satırı açıklayabilmelisiniz; açıklayamadığınız kod puan getirmez.")
    return kaydet(fig, k, "h07-01-gosterim-akisi")

def h07_02(k):
    fig, ax = katman("RAP1 (vize) teslimi: ne bekleniyor?", [
        ("S2 · Ürün ve mimari", "bileşenler, arayüzler, güven sınırları", "ana"),
        ("S3 · Arayüzler", "her arayüz için doğrulama", "ana"),
        ("S4 · Tehdit modeli", "STRIDE + saldırı ağacı", "uyari"),
        ("S5 · Varlık listesi", "her varlık: konum, koruma şeması", "ana"),
        ("Temel korumalar", "AEAD, güvenli silme, girdi doğrulama", "iyi"),
    ], alt_metin="ürünün ilk yarısı + kılavuzun ilk bölümleri",
       dip="RAP1 = 0,7 · vize notu. Kalan 0,3 Quiz-1'den gelir.", y=5.0)
    return kaydet(fig, k, "h07-02-rap1")

def h07_03(k):
    fig, ax = iki_yol("Gösterimde sık yapılan hatalar",
        ("YAPMAYIN", ["slaytta kod okumak", "'çalışıyor' deyip göstermemek",
                      "tek kişinin konuşması", "kanıtsız 'güvenli' iddiası"], "kotu"),
        ("YAPIN", ["çalışan demoyu göstermek", "kararın GEREKÇESİNİ anlatmak",
                   "ölçüm/kanıt sunmak", "sınırları dürüstçe söylemek"], "iyi"),
        alt_metin="değerlendirici kanıt arar, iddia değil",
        dip="'Şunu yapamadık, nedeni şu' demek, olmayan bir şeyi var göstermekten iyidir.")
    return kaydet(fig, k, "h07-03-sik-hatalar")

def h07_04(k):
    fig, ax = akis([
        ("Kriter", ["rubrik satırı"], "ana"),
        ("Kılavuz bölümü", ["S-numarası"], "koyu"),
        ("Kanıt", ["test / çıktı / kod"], "iyi"),
        ("Puan", ["ÖÇ eşlemesi"], "mor"),
    ], "Rubrik nasıl okunur?", "her puan satırı bir kanıta bağlanır",
       dip="Kanıtı olmayan satır puanlanmaz — 13. haftanın uyum matrisi mantığı burada da geçerli.")
    return kaydet(fig, k, "h07-04-rubrik")

# ===================================================== HAFTA 8 — Quiz-1
def h08_01(k):
    fig, ax = katman("Quiz-1 kapsamı (1–6. haftalar)", [
        ("Hafta 1", "CIA, saldırgan modeli, STRIDE, saldırı ağacı", "ana"),
        ("Hafta 2", "zararlı yazılım, BLP/Biba, CWE/CVE/CVSS", "ana"),
        ("Hafta 3", "verinin üç hâli, AEAD, nonce, KDF, TLS", "koyu"),
        ("Hafta 4", "C/C++ hataları, sanitizer, derleyici korumaları", "koyu"),
        ("Hafta 5", "enjeksiyon, deserialization, ProGuard, SBOM", "ana"),
        ("Hafta 6", "RASP: algıla / savun / caydır", "ana"),
    ], alt_metin="ezber değil GEREKÇE sorulur: 'neden bu kip?', 'neyi korumaz?'",
       dip="Her haftanın 'Kendini sınama' bölümünü cevaba bakmadan çözün.", y=5.4)
    return kaydet(fig, k, "h08-01-kapsam")

def h08_02(k):
    fig, ax = akis([
        ("Çoktan seçmeli", ["kavram ayrımı"], "ana"),
        ("Doğru / yanlış", ["sık yanılgılar"], "ana"),
        ("Kısa cevap", ["'neden?' sorusu"], "uyari"),
        ("Kod okuma", ["açığı bul, düzelt"], "kotu"),
    ], "Quiz-1 soru tipleri", "dördü de 'anladın mı' diye sorar, 'ezberledin mi' diye değil",
       dip="Kod okuma sorusunda önce açığın SINIFINI (CWE) söyleyin, sonra düzeltmeyi.")
    return kaydet(fig, k, "h08-02-soru-tipleri")

def h08_03(k):
    fig, ax = tuval(11.0, 4.2)
    baslik(ax, "Vize notu nasıl hesaplanır?", "iki bileşen, tek not")
    kutu(ax, 20, 58, 30, 18, "RAP1", ["ara proje", "gösterimi"], dolgu=COKACIK, kenar=ANA,
         bas_boyut=14, satir_boyut=10.4)
    etiket(ax, 20, 40, "× 0,7", boyut=13, renk=KOYU, kalin=True)
    kutu(ax, 56, 58, 24, 18, "Quiz-1", ["8. hafta"], dolgu=UYARIBG, kenar=UYARI,
         bas_boyut=14, satir_boyut=10.4)
    etiket(ax, 56, 40, "× 0,3", boyut=13, renk=UYARI, kalin=True)
    etiket(ax, 38, 58, "+", boyut=20, renk=SOLUK, kalin=True)
    ok(ax, 69, 58, 76, 58, renk=SOLUK)
    kutu(ax, 88, 58, 20, 18, "VİZE", dolgu=KOYU, kenar=KOYU, bas_renk="white", bas_boyut=15)
    serit(ax, 22, "Başarı notu = 0,4 · Vize + 0,6 · Final. Final de aynı biçimde RAP2 ve Quiz-2'den gelir.")
    return kaydet(fig, k, "h08-03-vize-hesabi")

def h08_04(k):
    fig, ax = adimlar("Quiz öncesi çalışma planı", [
        ("1 · Kendini sınama", ["cevaba bakmadan"], "ana"),
        ("2 · Yanlışları ayır", ["neden yanlış?"], "uyari"),
        ("3 · Demoları tekrar", ["3 ve 4. hafta"], "iyi"),
        ("4 · Kuralları özetle", ["tek sayfa"], "mor"),
    ], alt_metin="ezber değil, gerekçe ezberi", satir_basina=4,
       dip="Bir kuralı 'kendi cümlelerinizle' anlatabiliyorsanız öğrenmişsinizdir.")
    return kaydet(fig, k, "h08-04-calisma-plani")

# ===================================================== HAFTA 15 — Final gösterimi
def h15_01(k):
    fig, ax = katman("RAP2 (final) teslimi: ne bekleniyor?", [
        ("Tam ürün", "C++ konsol + DLL/.so, CMake/CTest", "koyu"),
        ("S6–S15", "kimlik, veri, kripto, RASP, gizleme, hat", "ana"),
        ("S16 · SONUÇLAR", "plan değil, GÖZLENEN test sonuçları", "iyi"),
        ("S17 · Uyum matrisi", "her satır kanıtlı", "iyi"),
        ("S14 · Devredilenler", "gerekçeli, onaylı", "uyari"),
    ], alt_metin="vizedeki yapının üzerine ölçüm ve kanıt eklenir",
       dip="RAP2 = 0,7 · final notu. En sık kayıp: S16'da sonuç yerine plan yazmak.", y=5.0)
    return kaydet(fig, k, "h15-01-rap2")

def h15_02(k):
    fig, ax = ic_ice("Güvenlik kılavuzu S0–S17", [
        ("S0–S1 · Kapak, kapsam, kaynaklar", None),
        ("S2–S5 · Ürün, arayüz, tehdit, varlık", None),
        ("S6–S12 · Korumalar (kimlik, veri, kripto, RASP)", None),
        ("S13–S15 · Süreç, devredilen, derleme hattı", None),
        ("S16–S17 · Test sonuçları ve uyum matrisi", None),
    ], alt_metin="dıştan içe değil, alttan üste: her bölüm bir öncekine dayanır",
       dip="Kılavuz, sertifikasyon belgesinin küçültülmüş modelidir.")
    return kaydet(fig, k, "h15-02-kilavuz-haritasi")

def h15_03(k):
    fig, ax = akis([
        ("Ürünü göster", ["çalışan demo"], "iyi"),
        ("Kararı gerekçelendir", ["neden bu koruma?"], "ana"),
        ("Ölçümü sun", ["önce/sonra sayılar"], "koyu"),
        ("Sınırı söyle", ["kalan risk"], "uyari"),
    ], "Final gösteriminin dört adımı", "değerlendirici bu dördünü arar",
       dip="Sınırını dürüstçe söyleyen takım, her şeyi 'güvenli' diyen takımdan yüksek alır.")
    return kaydet(fig, k, "h15-03-gosterim")

def h15_04(k):
    fig, ax = iki_yol("S16: plan mı, sonuç mu?",
        ("PLAN (yetersiz)", ["'Şu testleri yapacağız'", "'Şu araçları kullanacağız'", "",
                             "→ hiçbir şey kanıtlanmadı"], "kotu"),
        ("SONUÇ (beklenen)", ["'Şu test çalıştırıldı'", "'Gözlenen çıktı şu'", "'Karar: geçti / kaldı'", "",
                              "→ kanıt var"], "iyi"),
        alt_metin="finalde S16'dan GÖZLENEN sonuç beklenir",
        dip="Test kartı: amaç · ön koşul · adımlar · beklenen · GÖZLENEN · karar · kanıt.")
    return kaydet(fig, k, "h15-04-s16")

# ===================================================== HAFTA 16 — Quiz-2
def h16_01(k):
    fig, ax = katman("Quiz-2 kapsamı (9–14. haftalar)", [
        ("Hafta 9", "gizleme: beş aile, dört ölçüt, çeşitlendirme", "ana"),
        ("Hafta 10", "kip, dolgu, imza, PKI, zincir, iptal", "koyu"),
        ("Hafta 11", "whitebox: üç model, kodlama, DCA, sınırlar", "koyu"),
        ("Hafta 12", "değerlendirme süreci, saldırı potansiyeli, CVSS", "ana"),
        ("Hafta 13", "iyi gereksinim, izlenebilirlik, CC/FIPS/MASVS", "ana"),
        ("Hafta 14", "Tigress, dönüşüm hattı, dayanıklılık ↔ maliyet", "ana"),
    ], alt_metin="ortak soru: 'bu koruma neyi korur, neyi korumaz, maliyeti ne?'",
       dip="Koruma = gecikme; güç katmandan ve ÖLÇÜMDEN gelir.", y=5.4)
    return kaydet(fig, k, "h16-01-kapsam")

def h16_02(k):
    fig, ax = tuval(11.0, 4.2)
    baslik(ax, "Final ve başarı notu", "iki aşamalı hesap")
    kutu(ax, 18, 64, 26, 15, "RAP2", ["× 0,7"], dolgu=COKACIK, kenar=ANA, bas_boyut=13, satir_boyut=10.4)
    kutu(ax, 50, 64, 24, 15, "Quiz-2", ["× 0,3"], dolgu=UYARIBG, kenar=UYARI, bas_boyut=13, satir_boyut=10.4)
    etiket(ax, 34, 64, "+", boyut=18, renk=SOLUK, kalin=True)
    ok(ax, 63, 64, 70, 64, renk=SOLUK)
    kutu(ax, 84, 64, 24, 15, "FİNAL", dolgu=KOYU, kenar=KOYU, bas_renk="white", bas_boyut=14)
    kutu(ax, 30, 34, 30, 13, "Vize × 0,4", dolgu=ACIK, kenar=ANA, bas_boyut=12)
    kutu(ax, 66, 34, 30, 13, "Final × 0,6", dolgu=ACIK, kenar=ANA, bas_boyut=12)
    etiket(ax, 48, 34, "+", boyut=16, renk=SOLUK, kalin=True)
    serit(ax, 16, "BAŞARI NOTU = 0,4 · Vize + 0,6 · Final — ağırlık finalde.")
    return kaydet(fig, k, "h16-02-final-hesabi")

def h16_03(k):
    fig, ax = akis([
        ("Kuralı hatırla", ["ne korur / korumaz"], "ana"),
        ("Maliyeti söyle", ["boyut, hız, karmaşıklık"], "uyari"),
        ("Sınırı söyle", ["neyi yakalamaz"], "kotu"),
        ("Kanıtı göster", ["ölçüm / test"], "iyi"),
    ], "Quiz-2'de beklenen cevap kalıbı", "dört parçayı da söyleyen cevap tam puan alır",
       dip="Bu kalıp aynı zamanda projenizin S9 ve S16 bölümlerinin yazım biçimidir.")
    return kaydet(fig, k, "h16-03-cevap-kalibi")

def h16_04(k):
    fig, ax = ic_ice("Dönemin tek cümlesi", [
        ("Güvenlik = katman + ölçüm", None),
        ("Koruma kırılamazlık değil, GECİKME sağlar", None),
        ("Güç birliktelikten ve çeşitlendirmeden gelir", None),
        ("Kanıtı olmayan koruma, yok sayılır", None),
    ], alt_metin="16 haftanın özeti",
       dip="Bu dört cümle, her hafta farklı bir teknikle tekrar edildi.")
    return kaydet(fig, k, "h16-04-donem-ozeti")


ISLER = {7: [h07_01, h07_02, h07_03, h07_04],
         8: [h08_01, h08_02, h08_03, h08_04],
         15:[h15_01, h15_02, h15_03, h15_04],
         16:[h16_01, h16_02, h16_03, h16_04]}

if __name__ == "__main__":
    KOK = sys.argv[1]
    n = 0
    for h, fnlar in ISLER.items():
        for fn in fnlar:
            fn(yol(h)); n += 1
    print("üretilen:", n)
    rapor()
