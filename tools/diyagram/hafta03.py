# -*- coding: utf-8 -*-
"""Hafta 3 — Veri güvenliği: aktarımda, beklemede, kullanımda."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cizim import *


def d01(k):
    fig, ax = akis([
        ("SUNUCU", ["güvenilir", "veri kaynağı"], "iyi"),
        ("AKTARIMDA", ["ağ üzerinde", "TLS 1.3 + mesaj AEAD"], "ana"),
        ("BEKLEMEDE", ["cihazda şifreli", "dosya / veritabanı"], "uyari"),
        ("KULLANIMDA", ["RAM'de açık", "kısa ömür + güvenli silme"], "kotu"),
    ], "Verinin üç hâli", "sunucudan çıkıp kullanıcının GÜVENİLMEZ cihazına gider",
        dip="Her hâlin tehdidi ve savunması farklıdır; üçü birden korunmazsa zincir kopar.")
    return kaydet(fig, k, "h03-01-verinin-uc-hali")


def d02(k):
    fig, ax = tuval(12.0, 5.2)
    baslik(ax, "AEAD (AES-256-GCM): girdiler ve çıktılar", "tek işlemde gizlilik + bütünlük")
    girdiler = [("Anahtar", "32 bayt · gizli", 72), ("Nonce", "12 bayt · BENZERSİZ", 58),
                ("Düz metin", "korunacak veri", 44), ("İlişkili veri (AAD)", "şifrelenmez, doğrulanır", 30)]
    for ad, alt, y in girdiler:
        kutu(ax, 17, y, 30, 11, ad, [alt], dolgu=COKACIK, kenar=ANA, bas_boyut=11, satir_boyut=9.4)
        ok(ax, 32.5, y, 40, 51, renk=SOLUK, kalinlik=1.5)
    kutu(ax, 52, 51, 20, 22, "AES-256", ["GCM"], dolgu=KOYU, kenar=KOYU, bas_renk="white", bas_boyut=14, satir_boyut=12)
    ok(ax, 62.5, 56, 72, 62, renk=IYI, kalinlik=1.8)
    ok(ax, 62.5, 46, 72, 40, renk=IYI, kalinlik=1.8)
    kutu(ax, 85, 62, 26, 12, "Şifreli metin", [], dolgu=IYIBG, kenar=IYI, bas_boyut=11.5)
    kutu(ax, 85, 40, 26, 12, "Etiket (16 bayt)", ["bütünlük kanıtı"], dolgu=IYIBG, kenar=IYI,
         bas_boyut=11.5, satir_boyut=9.4)
    serit(ax, 14, "Nonce aynı anahtarla İKİ KEZ kullanılırsa gizlilik ve bütünlük birlikte çöker.")
    return kaydet(fig, k, "h03-02-aead")


def d03(k):
    fig, ax = tuval(12.0, 4.8)
    baslik(ax, "HKDF: bir ana sırdan birçok anahtar", "Extract (topla) → Expand (amaca göre böl)")
    kutu(ax, 12, 58, 20, 13, "Ana sır", [], dolgu=COKACIK, kenar=ANA, bas_boyut=12)
    ok(ax, 22.5, 58, 30, 58, renk=SOLUK)
    kutu(ax, 41, 58, 22, 13, "HKDF-Extract", ["+ tuz"], dolgu=KOYU, kenar=KOYU, bas_renk="white",
         bas_boyut=11.5, satir_boyut=9.6)
    ok(ax, 52.5, 58, 59, 58, renk=SOLUK)
    kutu(ax, 68, 58, 16, 13, "PRK", [], dolgu=ACIK, kenar=ANA, bas_boyut=12)
    hedefler = [("Şifreleme anahtarı", "info='sifreleme'", 76), ("MAC anahtarı", "info='mac'", 50),
                ("Oturum-42 anahtarı", "info='oturum-42'", 24)]
    for ad, info, y in hedefler:
        ok(ax, 76, 58, 82, y, renk=IYI, kalinlik=1.6)
        kutu(ax, 90, y, 20, 12, ad, [info], dolgu=IYIBG, kenar=IYI, bas_boyut=9.8, satir_boyut=8.6)
    serit(ax, 10, "Farklı `info` → farklı anahtar. Aynı sırdan üretilseler de biri sızarsa diğerleri güvende kalır.")
    return kaydet(fig, k, "h03-03-hkdf")


def d04(k):
    fig, ax = tuval(12.0, 5.2)
    baslik(ax, "Bir anahtarın hayatı", "üretimden imhaya — her geçiş kayıt altında")
    ana = [("Üretildi", "CSPRNG / KDF", 11), ("Dağıtıldı", "sarılı (wrapped)", 31),
           ("ETKİN", "kullanımda", 51), ("Pasif", "yalnız çözme", 71), ("İmha", "silindi", 91)]
    for i, (ad, alt, x) in enumerate(ana):
        renk = ("koyu" if ad == "ETKİN" else "ana")
        dolgu, kenar, yz = ((KOYU, KOYU, "white") if renk == "koyu" else (COKACIK, ANA, YAZI))
        kutu(ax, x, 58, 17, 14, ad, [alt], dolgu=dolgu, kenar=kenar, bas_renk=yz,
             bas_boyut=11.2, satir_boyut=9.2)
        if i < len(ana) - 1:
            ok(ax, x + 8.5, 58, ana[i + 1][2] - 8.5, 58, renk=SOLUK, kalinlik=1.6)
    kutu(ax, 40, 32, 22, 11, "Askıda", ["şüphe / geçici durdurma"], dolgu=UYARIBG, kenar=UYARI,
         bas_boyut=10.6, satir_boyut=9.0)
    ok(ax, 47, 51, 43, 37.5, renk=UYARI, kalinlik=1.5)
    ok(ax, 50, 37.5, 54, 51, renk=UYARI, kalinlik=1.5)
    kutu(ax, 76, 32, 24, 11, "ELE GEÇİRİLDİ", ["iptal + yeni anahtar"], dolgu=KOTUBG, kenar=KOTU,
         bas_boyut=10.6, satir_boyut=9.0)
    ok(ax, 57, 52, 68, 37.5, renk=KOTU, kesik=True, etiket="sızıntı", etiket_boyut=9)
    ok(ax, 84, 36, 90, 51, renk=KOTU, kesik=True, etiket="iptal", etiket_boyut=9)
    serit(ax, 12, "Kripto-periyodu dolan anahtar HEMEN silinmez: eski veri yeniden şifrelenene dek yalnız çözmede kalır.")
    return kaydet(fig, k, "h03-04-anahtar-yasam-dongusu")


def d05(k):
    fig, ax = tuval(12.0, 5.4)
    baslik(ax, "Anahtar hiyerarşisi: her işe ayrı anahtar", "yukarıdakiler nadiren, aşağıdakiler sık kullanılır")
    kutu(ax, 50, 76, 46, 12, "Kök / ana anahtar", ["HSM'de, neredeyse hiç kullanılmaz"],
         dolgu=KOYU, kenar=KOYU, bas_renk="white", bas_boyut=12, satir_boyut=9.6)
    kutu(ax, 26, 54, 40, 12, "Anahtar şifreleme anahtarı (KEK)", ["müşteri / cihaz başına"],
         dolgu=ACIK, kenar=ANA, bas_boyut=10.6, satir_boyut=9.2)
    kutu(ax, 76, 54, 34, 12, "İmza anahtarı", ["güncelleme paketleri"],
         dolgu=ACIK, kenar=ANA, bas_boyut=11, satir_boyut=9.2)
    ok(ax, 42, 70, 30, 60, renk=SOLUK, kalinlik=1.5)
    ok(ax, 58, 70, 72, 60, renk=SOLUK, kalinlik=1.5)
    kutu(ax, 14, 32, 26, 12, "Veri anahtarı (DEK)", ["dosya / kayıt başına"],
         dolgu=COKACIK, kenar=ANA, bas_boyut=10.2, satir_boyut=9.0)
    kutu(ax, 46, 32, 26, 12, "Oturum anahtarı", ["dakikalar"],
         dolgu=COKACIK, kenar=ANA, bas_boyut=10.6, satir_boyut=9.0)
    ok(ax, 20, 48, 16, 38, renk=SOLUK, kalinlik=1.4)
    ok(ax, 32, 48, 42, 38, renk=SOLUK, kalinlik=1.4)
    kutu(ax, 46, 12, 30, 11, "Tek kullanımlık anahtar", ["işlem başına"],
         dolgu=IYIBG, kenar=IYI, bas_boyut=10.4, satir_boyut=9.0)
    ok(ax, 46, 26, 46, 17.5, renk=SOLUK, kalinlik=1.4)
    ax.text(88, 32, "Üstteki sızarsa\naltındakilerin hepsi\nyenilenir.", ha="center", va="center",
            fontsize=9.8, color=KOTU)
    return kaydet(fig, k, "h03-05-anahtar-hiyerarsisi")


def d06(k):
    fig, ax = dizi("TLS 1.3 el sıkışması", ["İSTEMCİ", "SUNUCU"], [
        (0, 1, "ClientHello (+ anahtar payları, şifre takımları)", "ileri"),
        (1, 0, "ServerHello (+ anahtar payı)", "geri"),
        (0, 0, "Ortak sır (ECDHE) — her oturuma yeni: İLERİ GİZLİLİK", "not"),
        (1, 0, "{Sertifika} (şifreli)", "geri"),
        (1, 0, "{CertificateVerify} (özel anahtarla imza)", "geri"),
        (1, 0, "{Finished}", "geri"),
        (0, 0, "Sertifikayı DOĞRULA: zincir + süre + SAN + iptal", "not"),
        (0, 1, "{Finished} → uygulama verisi", "ileri"),
    ], alt_metin="tek gidiş-dönüşte anahtar anlaşması ve kimlik doğrulama", y=6.8,
       dip="Doğrulama adımı atlanırsa şifreli ama KİMİN olduğu belirsiz bir kanal kurulur.")
    return kaydet(fig, k, "h03-06-tls13")


def d07(k):
    fig, ax = dizi("Tokenizasyon: gerçek değeri kasada tut",
        ["UYGULAMA", "BELİRTEÇ KASASI", "VERİTABANI"], [
        (0, 1, "kart numarası", "ileri"),
        (1, 0, "belirteç (tok_7f3a...)", "geri"),
        (0, 2, "yalnız BELİRTECİ sakla", "ileri"),
        (2, 2, "Veritabanı çalınsa bile kart numarası YOK", "not"),
        (0, 1, "ödeme anında belirteç", "ileri"),
        (1, 0, "yetkili işlem (ya da işlemi kasa yapar)", "geri"),
    ], alt_metin="PCI DSS denetim kapsamı kasaya daralır", y=6.0,
       dip="Gerçek veri tek bir korunan yerde; sistemin geri kalanı anlamsız belirteç taşır.")
    return kaydet(fig, k, "h03-07-tokenizasyon")


def d08(k):
    fig, ax = ic_ice("Güvenlik kabukları: derinlemesine savunma", [
        ("Kabuk 4 — Kanal: TLS 1.3 + sertifika sabitleme", None),
        ("Kabuk 3 — Oturum: mesaj AEAD + MAC", None),
        ("Kabuk 2 — Depolama: AES-GCM (beklemede)", None),
        ("Kabuk 1 — Cihaz bağlama: HKDF + AEAD", None),
        ("SIR", None),
    ], alt_metin="sırra ulaşmak için dört kabuğu da kırmak gerekir",
       dip="Bir kabuk delinse bile sır hâlâ diğerlerinin altındadır.")
    return kaydet(fig, k, "h03-08-guvenlik-kabuklari")


if __name__ == "__main__":
    klasor = sys.argv[1]
    for f in (d01, d02, d03, d04, d05, d06, d07, d08):
        print("  ", os.path.basename(f(klasor)))
