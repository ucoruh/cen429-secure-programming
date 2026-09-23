# -*- coding: utf-8 -*-
"""7. tur (b) — görselsiz kalan bölümler için çizimler (H3, H9, H10, H12, H13, H14)."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cizim import *

KOK = None
def yol(h): return os.path.join(KOK, "week-%d" % h, "assets")


# ===================================================== HAFTA 3
def h03_12(k):
    fig, ax = tuval(12.0, 5.4)
    baslik(ax, "Kriptografinin dört ailesi: hangi araç neyi korur?",
           "tek bir \"şifreleme\" yoktur; hedefe göre araç seçilir")
    aileler = [("Simetrik şifreleme", "GİZLİLİK", "AES-GCM, ChaCha20", COKACIK, ANA),
               ("Özet (hash)", "PARMAK İZİ", "SHA-256 — anahtar yok", MORBG, MOR),
               ("MAC", "BÜTÜNLÜK + KİMLİK", "HMAC — paylaşılan anahtar", IYIBG, IYI),
               ("Dijital imza", "BÜTÜNLÜK + İNKÂR EDİLEMEZLİK", "Ed25519 — özel anahtar", UYARIBG, UYARI)]
    for i, (ad, saglar, ornek, dolgu, kenar) in enumerate(aileler):
        y = 70 - i * 15
        kutu(ax, 24, y, 40, 11.5, ad, dolgu=dolgu, kenar=kenar, bas_boyut=12)
        ax.text(48, y + 2.2, saglar, ha="left", va="center", fontsize=10.2,
                color=kenar, fontweight="bold")
        ax.text(48, y - 2.4, ornek, ha="left", va="center", fontsize=9.4, color=SOLUK)
    serit(ax, 8, "En sık hata: gizlilik ile bütünlüğü karıştırmak. Şifreleme tek başına bütünlük vermez.")
    return kaydet(fig, k, "h03-12-kripto-aileleri")


def h03_13(k):
    fig, ax = katman(
        "Üç tür \"rastgele\": hangisi nerede kullanılır?",
        [("Sözde rastgele (PRNG)", "rand(), Math.random() — hızlı, tahmin edilebilir; ASLA güvenlikte", "kotu"),
         ("Kriptografik (CSPRNG)", "getrandom(), BCryptGenRandom — anahtar, IV, nonce, tuz için", "iyi"),
         ("Gerçek rastgelelik (TRNG)", "donanım gürültüsü — işletim sisteminin havuzunu besler", "ana")],
        alt_metin="anahtar tahmin edilebilirse algoritmanın gücü anlamsızdır",
        dip="Kural: güvenlikle ilgili her değer CSPRNG'den gelir; kendi üretecinizi yazmayın.",
        g=11.5, y=4.6)
    return kaydet(fig, k, "h03-13-rastgelelik-turleri")


def h03_14(k):
    fig, ax = tuval(12.0, 5.4)
    baslik(ax, "Tuz, IV ve nonce: üçü de gizli değil, üçü de farklı iş yapar",
           "karıştırmak en sık yapılan kripto hatasıdır")
    kavramlar = [("TUZ (salt)", "paroladan anahtar türetmede", "her kayıt için RASTGELE",
                  "önhesaplı tablolar işe yarar", MORBG, MOR),
                 ("IV", "CBC gibi kiplerde", "öngörülemez olmalı",
                  "aynı düz metin aynı görünür", COKACIK, ANA),
                 ("NONCE", "GCM gibi AEAD kiplerinde", "anahtar başına BİR KEZ",
                  "gizlilik VE bütünlük çöker", KOTUBG, KOTU)]
    for i, (ad, nerede, kural, bozulursa, dolgu, kenar) in enumerate(kavramlar):
        y = 68 - i * 19
        kutu(ax, 16, y, 26, 15, ad, [nerede], dolgu=dolgu, kenar=kenar,
             bas_boyut=12, satir_boyut=9.0)
        ax.text(33, y + 3, "kural: " + kural, ha="left", va="center", fontsize=9.8, color=YAZI)
        ax.text(33, y - 3, "bozulursa: " + bozulursa, ha="left", va="center",
                fontsize=9.8, color=KOTU)
    serit(ax, 8, "Üçü de açıkça saklanabilir; güvenlik gizliliklerinden değil, TEKRARLANMAMALARINDAN gelir.")
    return kaydet(fig, k, "h03-14-tuz-iv-nonce")


def h03_15(k):
    fig, ax = akis(
        [("Parola", ["kısa, düşük entropi", "tahmin edilebilir"], "kotu"),
         ("+ TUZ", ["her kayda rastgele", "aynı parola ≠ aynı anahtar"], "ana"),
         ("+ MALİYET", ["yüz binlerce tur", "bellek + zaman"], "ana"),
         ("Anahtar", ["32 bayt", "kaba kuvvet pahalı"], "iyi")],
        "Paroladan anahtar türetme: iki ek, iki fayda",
        "Argon2id / scrypt / PBKDF2",
        dip="Tuz önhesaplı tabloyu, maliyet ise deneme hızını öldürür. Biri eksikse KDF işe yaramaz.",
        g=12.0, y=4.6)
    return kaydet(fig, k, "h03-15-kdf-iki-ek")


def h03_16(k):
    fig, ax = adimlar(
        "TLS istemcisini doğru kurmanın adımları",
        [("Güncel kütüphane", ["TLS 1.3 / 1.2", "eski sürümü kapat"], "ana"),
         ("Kök deposu", ["sistem deposunu kullan"], "ana"),
         ("Zinciri doğrula", ["imza + süre + amaç"], "iyi"),
         ("Ana makine adı", ["sertifika bu sunucuya mı ait?"], "iyi"),
         ("İptal denetimi", ["OCSP / CRL"], "mor"),
         ("Sabitleme (isteğe bağlı)", ["yedek pin + son kullanma"], "uyari")],
        alt_metin="tek bir adım atlanırsa MITM açık kalır",
        dip="En sık hata: zincir doğrulanır ama ana makine adı denetlenmez — sertifika geçerli, sunucu yanlış.",
        satir_basina=3, g=11.5, y=5.4)
    return kaydet(fig, k, "h03-16-tls-istemci-adimlari")


def h03_17(k):
    fig, ax = iki_yol(
        "Beklemede veri: iki düzey, iki tehdit modeli",
        ("TÜM DİSK / DOSYA", ["LUKS, BitLocker, XTS-AES", "cihaz kapalıyken korur",
                              "açıkken her şey okunur", "yedek çalınırsa yeter"], "uyari"),
        ("ALAN / SÜTUN", ["yalnız hassas alan AEAD ile", "uygulama açıkken bile korur",
                          "anahtar yönetimi gerekir", "arama/indeks zorlaşır"], "iyi"),
        alt_metin="hangi tehdide karşı koruduğunuzu önce yazın",
        dip="Kayıp telefon → disk şifreleme yeter. Ele geçirilen sunucu → alan şifreleme şart.",
        g=11.5, y=5.0)
    return kaydet(fig, k, "h03-17-beklemede-iki-duzey")


def h03_18(k):
    fig, ax = katman(
        "Kullanımda veri: açılma penceresini daraltan katmanlar",
        [("Kısa ömür", "anahtarı işin hemen öncesinde aç, bitince sil (explicit_bzero)", "iyi"),
         ("Bellek kilidi", "mlock / VirtualLock — takas alanına yazılmasını engeller", "ana"),
         ("Döküm kapatma", "core dump ve hata raporu devre dışı", "ana"),
         ("Cihaz bağlama", "anahtar cihazın kimliğine bağlanır; kopyalanırsa açılmaz", "mor"),
         ("Donanım (TEE/SE)", "anahtar hiç uygulamaya girmez — en güçlü katman", "iyi")],
        alt_metin="sır kullanılmak için bir an açılır; o an yönetilir",
        dip="Hiçbiri pencereyi sıfırlamaz; amaç saldırganın o ana yetişmesini pahalı kılmaktır.",
        g=11.5, y=5.4)
    return kaydet(fig, k, "h03-18-kullanimda-veri-katmanlari")


def h03_19(k):
    fig, ax = akis(
        [("Sorun", ["anahtar kullanıldığı an", "bellekte AÇIK durur"], "kotu"),
         ("Kısmi çözüm", ["güvenli silme +", "bellek kilidi"], "uyari"),
         ("Kalan açık", ["pencere daraldı,", "kapanmadı"], "uyari"),
         ("Whitebox", ["anahtar tablolara gömülür,", "hiç açık var olmaz"], "mor")],
        "Whitebox kriptografiye neden ihtiyaç duyuldu?",
        "11. haftanın kapısı burada açılıyor",
        dip="Whitebox sihir değildir: anahtar çıkarmayı geciktirir, diğer katmanlarla anlam kazanır.",
        g=12.0, y=4.6)
    return kaydet(fig, k, "h03-19-whitebox-motivasyon")


def h03_20(k):
    import textwrap
    fig, ax = tuval(12.0, 5.6)
    baslik(ax, "Dört yaygın yanlış anlama", "her biri sahada gerçek bir açığa dönüşmüştür")
    yanlislar = [("\"Şifreledim, güvendeyim.\"",
                  "Şifreleme yalnız GİZLİLİK verir; bütünlük için AEAD gerekir."),
                 ("\"TLS var, MITM imkânsız.\"",
                  "Doğrulama yapılmazsa TLS kandırılır (Demo 6)."),
                 ("\"Kendi algoritmam daha güvenli.\"",
                  "Açık tasarım ilkesi: gizlilik anahtarda, algoritmada değil."),
                 ("\"Anahtarı koda gömdüm, bulunmaz.\"",
                  "strings ve entropi taraması saniyeler içinde bulur.")]
    for i, (iddia, gercek) in enumerate(yanlislar):
        y = 70 - i * 16
        kutu(ax, 26, y, 44, 12, iddia, dolgu=KOTUBG, kenar=KOTU, bas_boyut=11.2)
        ok(ax, 49, y, 54, y, renk=SOLUK, kalinlik=1.6)
        satirlar = textwrap.wrap(gercek, 40)
        for j, s in enumerate(satirlar):
            ax.text(56, y + (len(satirlar) - 1) * 2.2 - j * 4.4, s,
                    ha="left", va="center", fontsize=9.6, color=IYI)
    serit(ax, 8, "Dördünün ortak kökü aynı: güvenliği bir ÜRÜN sanmak, oysa o bir KARAR zinciridir.")
    return kaydet(fig, k, "h03-20-yanlis-anlamalar")


# ===================================================== HAFTA 9
def h09_14(k):
    fig, ax = iki_yol(
        "Gizleme ne verir, ne vermez?",
        ("VERMEZ", ["gizlilik (kriptonun işi)", "matematiksel güvence",
                    "kalıcı koruma", "kötü tasarımı kurtarma"], "kotu"),
        ("VERİR", ["saldırgana ZAMAN kaybettirir", "otomatik araçları zorlaştırır",
                   "toplu kırılmayı engeller", "tespit için süre kazandırır"], "iyi"),
        alt_metin="gizleme bir maliyet kuralıdır, bir güvence değil",
        dip="\"Ne kadar sürer?\" sorusuna cevap verir; \"kırılamaz mı?\" sorusuna değil.",
        g=11.5, y=5.0)
    return kaydet(fig, k, "h09-14-ne-verir-ne-vermez")


def h09_15(k):
    fig, ax = katman(
        "Veri gizleme kuralları (K-07 – K-09)",
        [("K-07 Dize kodlama", "sabit metinler şifreli saklanır, kullanım anında çözülür", "ana"),
         ("K-08 Opak boolean", "karar değeri hesaplanır, sabit karşılaştırma yapılmaz", "ana"),
         ("K-09 Değişken bölme", "bir değer birden çok parçada tutulur, geç birleştirilir", "mor")],
        alt_metin="amaç: statik okumada anlamlı veri bırakmamak",
        dip="Ortak tuzak: çözülen değeri gereğinden uzun süre bellekte tutmak — kazancı siler.",
        g=11.5, y=4.6)
    return kaydet(fig, k, "h09-15-veri-gizleme-kurallari")


def h09_16(k):
    fig, ax = ic_ice(
        "Katmanlı savunmada gizlemenin yeri",
        [("Süreç ve gereksinim (13. hafta)", "ana"),
         ("Kriptografi ve anahtar yönetimi (3., 10. hafta)", "iyi"),
         ("Çalışma zamanı koruması / RASP (6. hafta)", "mor"),
         ("GİZLEME (9., 14. hafta)", "uyari")],
        alt_metin="gizleme en dıştaki kabuk değil, diğerlerini örten bir katmandır",
        dip="Tek başına gizleme bir güvenlik mimarisi değildir; diğer katmanların ömrünü uzatır.",
        g=11.0, y=6.0)
    return kaydet(fig, k, "h09-16-katmanli-savunmada-yer")


# ===================================================== HAFTA 10
def h10_14(k):
    fig, ax = dizi(
        "PKCS#11 ile imzalama: anahtar hiç dışarı çıkmaz",
        ["Uygulama", "PKCS#11 kütüphanesi", "HSM / SoftHSM"],
        [(0, 1, "C_OpenSession", "ileri"),
         (0, 1, "C_Login (PIN)", "ileri"),
         (1, 2, "oturum + kimlik", "ileri"),
         (0, 1, "C_SignInit (anahtar tutamacı)", "ileri"),
         (1, 2, "imzala: veri", "ileri"),
         (2, 1, "imza", "geri"),
         (1, 0, "imza", "geri"),
         (2, 2, "özel anahtar HSM'den ÇIKMAZ (CKA_EXTRACTABLE = false)", "not")],
        alt_metin="uygulama anahtarı değil, anahtarın TUTAMACINI görür",
        dip="Anahtar çalınamaz; ama HSM'e erişimi olan imzalatabilir — erişim denetimi yine şarttır.",
        g=12.0, y=6.0)
    return kaydet(fig, k, "h10-14-pkcs11-imzalama")


def h10_15(k):
    fig, ax = iki_yol(
        "Kuantum sonrası: neyi değiştiriyor, neyi değiştirmiyor?",
        ("TEHDİT ALTINDA", ["RSA, DH, ECDH, ECDSA", "\"şimdi topla, sonra çöz\"",
                            "bugünkü trafik ileride çözülebilir", "geçiş bugün planlanır"], "kotu"),
        ("BÜYÜK ÖLÇÜDE GÜVENLİ", ["AES-256 (anahtar boyu yeter)", "SHA-384 / SHA-3",
                                   "simetrik dünya ayakta", "yalnız anahtar boyu artar"], "iyi"),
        alt_metin="NIST seçimi: ML-KEM (Kyber) ve ML-DSA (Dilithium)",
        dip="Uzun ömürlü sırlarınız varsa hibrit anahtar değişimine geçiş bugünün kararıdır.",
        g=11.5, y=5.0)
    return kaydet(fig, k, "h10-15-kuantum-sonrasi")


# ===================================================== HAFTA 12
def h12_12(k):
    fig, ax = katman(
        "Raporlama: aynı bulgu, üç farklı okuyucu",
        [("Yönetici özeti", "kaç bulgu, en yüksek risk, karar gerektiren tek cümle", "ana"),
         ("Teknik bulgu kayıtları", "kanıt, yeniden üretim adımları, CVSS + saldırı potansiyeli", "mor"),
         ("Düzeltme önerileri", "somut, önceliklendirilmiş, sahibi belli", "iyi"),
         ("Kalan risk", "kabul edilen riskler ve gerekçesi — imzalanır", "uyari")],
        alt_metin="rapor bir liste değil, bir karar belgesidir",
        dip="Kanıtı olmayan bulgu iddiadır; sahibi olmayan öneri hiç yapılmaz.",
        g=11.5, y=5.0)
    return kaydet(fig, k, "h12-12-raporlama")


# ===================================================== HAFTA 13
def h13_11(k):
    fig, ax = tuval(12.0, 5.6)
    baslik(ax, "Dersin gereksinim aileleri", "her gereksinim bir aileye, her aile bir varlığa bağlanır")
    aileler = [("DR", "Beklemede veri", MORBG, MOR), ("DT", "Aktarımda veri", MORBG, MOR),
               ("DU", "Kullanımda veri", MORBG, MOR), ("ID", "Kimlik ve oturum", COKACIK, ANA),
               ("AP", "Uygulama bütünlüğü", COKACIK, ANA), ("AS", "Varlık ve anahtar", IYIBG, IYI),
               ("CR", "Kriptografi", IYIBG, IYI), ("LG", "Günlük ve kanıt", UYARIBG, UYARI),
               ("PR", "Süreç ve doğrulama", UYARIBG, UYARI)]
    for i, (kod, ad, dolgu, kenar) in enumerate(aileler):
        sut = i % 3; satir = i // 3
        x = 18 + sut * 32
        y = 68 - satir * 17
        kutu(ax, x, y, 29, 13, "CEN429-" + kod, [ad], dolgu=dolgu, kenar=kenar,
             bas_boyut=12, satir_boyut=9.6)
    serit(ax, 10, "Kimlik numarası olmayan gereksinim izlenemez; izlenemeyen gereksinim denetlenemez.")
    return kaydet(fig, k, "h13-11-gereksinim-aileleri")


# ===================================================== HAFTA 14
def h14_11(k):
    fig, ax = adimlar(
        "Bir denetimi adım adım güçlendirmek",
        [("Temiz kod", ["ölçüm alınır:", "komut / dal"], "iyi"),
         ("+ EncodeLiterals", ["sabitler gizlenir"], "ana"),
         ("+ EncodeArithmetic", ["hesap MBA'ya döner"], "ana"),
         ("+ Flatten", ["akış düzleşir"], "mor"),
         ("+ AddOpaque", ["sahte dallar eklenir"], "mor"),
         ("Ölç ve karar ver", ["kazanç maliyeti", "haklı çıkarıyor mu?"], "uyari")],
        alt_metin="her adımdan sonra ÖLÇ; körlemesine üst üste yığma",
        dip="Maliyet katlanarak artar; kazanç bir noktadan sonra düzleşir. Durma noktasını ölçüm söyler.",
        satir_basina=3, g=11.5, y=5.4)
    return kaydet(fig, k, "h14-11-adim-adim-guclendirme")


def h14_12(k):
    fig, ax = adimlar(
        "Sınıf içi akış: gizle, karşılaştır, ölç, çeşitlendir",
        [("Gizle", ["tigress-hatti.sh", "çalıştırılır"], "ana"),
         ("Davranışı doğrula", ["çıktı değişmedi mi?", "testler geçti mi?"], "iyi"),
         ("CFG karşılaştır", ["önce / sonra", "düğüm + kenar"], "mor"),
         ("Maliyet ölç", ["boyut, süre,", "komut sayısı"], "uyari"),
         ("Tohum değiştir", ["ikinci ikiliyi üret"], "ana"),
         ("Farkı kaydet", ["S9 / S15'e yaz"], "iyi")],
        alt_metin="ölçmediğiniz korumayı savunamazsınız",
        dip="Davranış doğrulaması atlanırsa gizleme sessizce programı bozar — en sık yapılan hata budur.",
        satir_basina=3, g=11.5, y=5.4)
    return kaydet(fig, k, "h14-12-sinif-ici-akis")


ISLER = {3: [h03_12, h03_13, h03_14, h03_15, h03_16, h03_17, h03_18, h03_19, h03_20],
         9: [h09_14, h09_15, h09_16],
         10: [h10_14, h10_15],
         12: [h12_12],
         13: [h13_11],
         14: [h14_11, h14_12]}

if __name__ == "__main__":
    KOK = sys.argv[1]
    n = 0
    for h, fnlar in ISLER.items():
        for fn in fnlar:
            fn(yol(h)); n += 1
    print("üretilen:", n)
    rapor()
