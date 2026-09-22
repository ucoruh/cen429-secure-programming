# -*- coding: utf-8 -*-
"""Hafta 4, 5, 6, 10, 11, 12, 13, 14 görselleri (kalan 19 diyagram)."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cizim import *

KOK = None   # docs klasörü; __main__ içinde ayarlanır


def yol(hafta):
    return os.path.join(KOK, "week-%d" % hafta, "assets")


# ------------------------------------------------------------------ HAFTA 4
def h04_01(k):
    fig, ax = tuval(12.0, 5.2)
    baslik(ax, "Kapsam güdümlü fuzzing döngüsü", "rastgele değil: yeni kod yolu bulan girdiyi saklar")
    kutu(ax, 14, 62, 22, 13, "Tohum girdiler", ["(corpus)"], dolgu=COKACIK, kenar=ANA, bas_boyut=11.2, satir_boyut=9.4)
    ok(ax, 25, 62, 33, 62, renk=SOLUK)
    kutu(ax, 45, 62, 24, 13, "DEĞİŞTİR", ["bit çevir · bayt sil", "parça ekle · birleştir"],
         dolgu=MORBG, kenar=MOR, bas_boyut=11.2, satir_boyut=9.0)
    ok(ax, 57, 62, 65, 62, renk=SOLUK)
    kutu(ax, 78, 62, 26, 13, "HEDEFİ ÇALIŞTIR", ["sanitizer açık"], dolgu=KOYU, kenar=KOYU,
         bas_renk="white", bas_boyut=11.2, satir_boyut=9.4)
    kutu(ax, 78, 40, 26, 11, "Yeni kod yolu?", [], dolgu=UYARIBG, kenar=UYARI, bas_boyut=11)
    ok(ax, 78, 55.5, 78, 45.5, renk=SOLUK)
    kutu(ax, 40, 40, 26, 11, "Corpus'a EKLE", [], dolgu=IYIBG, kenar=IYI, bas_boyut=11)
    ok(ax, 65, 40, 53, 40, renk=IYI, etiket="evet", etiket_boyut=9.2)
    ax.plot([40, 40], [45.5, 55.5], color=IYI, linewidth=1.6, zorder=1)
    ok(ax, 40, 55.5, 44, 55.5, renk=IYI, kalinlik=1.6)
    kutu(ax, 82, 20, 32, 11, "ÇÖKME / sanitizer hatası", ["→ raporla, küçült"], dolgu=KOTUBG, kenar=KOTU,
         bas_boyut=10.4, satir_boyut=9.0)
    ok(ax, 91, 55.5, 91, 25.5, renk=KOTU, etiket="çökme", etiket_boyut=9.2)
    serit(ax, 8, "İyi fuzz hedefi: hızlı · deterministik · kendine yeterli · dar girdi yüzeyi.")
    return kaydet(fig, k, "h04-01-fuzzing-dongusu")


def h04_02(k):
    fig, ax = katman("Derleyici ve işletim sistemi korumaları", [
        ("Yığın kanaryası", "dönüş adresi ezilirse programı durdurur", "ana"),
        ("ASLR", "adresler her çalıştırmada değişir", "ana"),
        ("DEP / NX", "veri sayfası çalıştırılamaz", "ana"),
        ("RELRO · PIE · CFI", "GOT yazılamaz, çağrı akışı denetlenir", "ana"),
        ("MANTIK HATASI", "hiçbir koruma yakalamaz", "kotu"),
    ], alt_metin="saldırgan yukarıdan aşağı her katmanı ayrı ayrı aşmak zorunda",
        dip="Bu katmanlar sömürüyü zorlaştırır, HATAYI SİLMEZ — hatayı güvenli kodlama siler.",
        dip_renk=KOTU, y=5.2)
    return kaydet(fig, k, "h04-02-derleyici-os-korumalari")


def h04_03(k):
    fig, ax = adimlar("Güvenli derleme hattı (CI)", [
        ("1 · Değişiklik", ["pull request"], "ana"),
        ("2 · Derle", ["uyarı = hata"], "ana"),
        ("3 · Statik analiz", ["clang-tidy, cppcheck"], "ana"),
        ("4 · Birim testleri", ["ASan + UBSan"], "iyi"),
        ("5 · Kısa fuzzing", ["hedef başına 1–5 dk"], "iyi"),
        ("6 · Sürüm derlemesi", ["korumalar açık"], "mor"),
        ("7 · İkili denetimi", ["checksec / imza"], "mor"),
    ], alt_metin="her adım geçmeden bir sonrakine geçilmez", satir_basina=4,
        dip="Ucuzdan pahalıya: erken adımlar kolay hataları eler, pahalı adım yalnız kalanlara harcanır.")
    return kaydet(fig, k, "h04-03-ci-hatti")


# ------------------------------------------------------------------ HAFTA 5
def h05_01(k):
    fig, ax = iki_yol("Enjeksiyonun ortak kökü: veri ile komutun karışması",
        ("HATALI: tek kanal", ['"...WHERE x=\'" + girdi', "", "Yorumlayıcı girdiyi", "KOMUT olarak ayrıştırır", "",
                               "SQLi · komut enj. · XXE", "şablon enjeksiyonu"], "kotu"),
        ("DOĞRU: ayrı kanal", ["WHERE x = ?  (parametre)", "", "Komut SABİT kalır,", "girdi yalnız VERİ", "",
                               "enjeksiyon ailesi", "tümüyle kapanır"], "iyi"),
        alt_metin="bütün enjeksiyon türleri aynı şemanın farklı yorumlayıcılardaki hâli",
        dip="Kaçış (escaping) son çaredir; asıl çözüm komutu ve veriyi ayrı kanala koymaktır.")
    return kaydet(fig, k, "h05-01-enjeksiyon-koku")


# ------------------------------------------------------------------ HAFTA 6
def h06_01(k):
    fig, ax = tuval(12.0, 5.2)
    baslik(ax, "RASP döngüsü: algıla → savun → caydır", "koruma uygulamanın İÇİNDE çalışır")
    veri = [("ALGILA", ["bütünlük denetimi", "debugger · kanca", "ortam · root · imza"], COKACIK, ANA, YAZI, 18),
            ("SAVUN", ["fail-closed", "sırrı sil · cihaza bağla", "akış sayacı"], IYIBG, IYI, YAZI, 50),
            ("CAYDIR", ["decoy çıktı · gecikme", "telemetri", "attestation"], UYARIBG, UYARI, YAZI, 82)]
    for ad, satirlar, dolgu, kenar, yz, x in veri:
        kutu(ax, x, 52, 28, 32, ad, satirlar, dolgu=dolgu, kenar=kenar, bas_renk=yz,
             bas_boyut=14, satir_boyut=10)
    ok(ax, 32.5, 52, 35.5, 52, renk=SOLUK)
    ok(ax, 64.5, 52, 67.5, 52, renk=SOLUK)
    serit(ax, 18, "Tek denetim değil, birbirini kontrol eden ÖRTÜŞEN AĞ → tek yama yetmez.")
    return kaydet(fig, k, "h06-01-rasp-dongusu")


def h06_02(k):
    fig, ax = katman("Katmanlar birbirini korur", [
        ("Gizleme (4, 5, 9. hafta)", "denetimleri BULMAYI zorlaştırır", "ana"),
        ("Bütünlük denetimi", "denetimlerin YAMALANMASINI fark eder", "ana"),
        ("Debugger / kanca / ortam", "çalışma anı ANALİZİNİ fark eder", "ana"),
        ("Kontrol akışı sayacı", "denetimin ATLANMASINI fark eder", "iyi"),
        ("HASSAS İŞLEM", "korunan çekirdek", "koyu"),
    ], alt_metin="aynı hassas işlemi saran katmanlar",
        dip="Saldırganın hepsini aynı anda aşması gerekir; bu da saldırı potansiyelini yükseltir.", y=5.2)
    return kaydet(fig, k, "h06-02-katmanlar")


def h06_03(k):
    fig, ax = tuval(12.0, 4.6)
    baslik(ax, "Bütünlük denetimi (self-hashing)", "uygulama kendi baytlarını doğrular")
    kutu(ax, 14, 58, 24, 14, "İkili dosya", ["/ korunan bölge"], dolgu=COKACIK, kenar=ANA, bas_boyut=11.2, satir_boyut=9.4)
    ok(ax, 26.5, 58, 34, 58, renk=SOLUK)
    kutu(ax, 46, 58, 24, 14, "HMAC-SHA-256", ["gizli anahtarla"], dolgu=KOYU, kenar=KOYU,
         bas_renk="white", bas_boyut=11.2, satir_boyut=9.4)
    ok(ax, 58.5, 58, 65, 58, renk=SOLUK)
    kutu(ax, 78, 58, 26, 14, "altın değer ==", ["hesaplanan?"], dolgu=UYARIBG, kenar=UYARI, bas_boyut=11.2, satir_boyut=9.4)
    kutu(ax, 54, 28, 28, 12, "Bütünlük TAMAM", [], dolgu=IYIBG, kenar=IYI, bas_boyut=11.5)
    kutu(ax, 85, 28, 26, 12, "YAMA ALGILANDI", ["→ tepki"], dolgu=KOTUBG, kenar=KOTU, bas_boyut=11, satir_boyut=9.4)
    ok(ax, 72, 51, 60, 34.5, renk=IYI, etiket="evet", etiket_boyut=9.2)
    ok(ax, 84, 51, 85, 34.5, renk=KOTU, etiket="hayır", etiket_boyut=9.2)
    serit(ax, 10, "Tek başına yetmez: denetimin kendisi de yamalanabilir → örtüşen denetim gerekir.")
    return kaydet(fig, k, "h06-03-self-hashing")


def h06_04(k):
    fig, ax = tuval(12.0, 4.6)
    baslik(ax, "Kontrol akışı sayacı: denetim atlandı mı?", "her denetim akümülatörü ilerletir")
    xs = [11, 30, 49, 68]
    adlar = ["tohum", "kontrol 0\nacc=HMAC(acc,'0')", "kontrol 1\nacc=HMAC(acc,'1')", "kontrol 2\nacc=HMAC(acc,'2')"]
    for i, (x, ad) in enumerate(zip(xs, adlar)):
        kutu(ax, x, 60, 17, 14, ad, dolgu=COKACIK if i else ACIK, kenar=ANA, bas_boyut=9.6)
        if i < len(xs) - 1:
            ok(ax, x + 8.5, 60, xs[i + 1] - 8.5, 60, renk=SOLUK, kalinlik=1.5)
    ok(ax, 76.5, 60, 82, 60, renk=SOLUK, kalinlik=1.5)
    kutu(ax, 91, 60, 16, 14, "KRİTİK İŞLEM", ["sırrı acc ile aç"], dolgu=KOYU, kenar=KOYU,
         bas_renk="white", bas_boyut=9.6, satir_boyut=8.6)
    kutu(ax, 68, 28, 30, 12, "Gerçek sonuç", [], dolgu=IYIBG, kenar=IYI, bas_boyut=11.5)
    kutu(ax, 26, 28, 30, 12, "Decoy (sahte sonuç)", [], dolgu=KOTUBG, kenar=KOTU, bas_boyut=11)
    ok(ax, 88, 53, 76, 34, renk=IYI, etiket="zincir doğru", etiket_boyut=9)
    ok(ax, 84, 53, 38, 34, renk=KOTU, etiket="zincir yanlış", etiket_boyut=9)
    serit(ax, 10, "Tek `if` bir NOP'la atlanır; sayaç, denetimin GERÇEKTEN çalıştığını sonradan kanıtlar.")
    return kaydet(fig, k, "h06-04-akis-sayaci")


def h06_05(k):
    fig, ax = tuval(12.0, 4.8)
    baslik(ax, "RASP motoru: her kritik işlemde", "algıla → karar ver → davran")
    kutu(ax, 20, 62, 34, 16, "ALGILA", ["bütünlük + debug + ortam", "+ kanca + root"],
         dolgu=COKACIK, kenar=ANA, bas_boyut=12.5, satir_boyut=9.6)
    ok(ax, 37.5, 62, 45, 62, renk=SOLUK)
    kutu(ax, 56, 62, 18, 14, "Kurcalama?", [], dolgu=UYARIBG, kenar=UYARI, bas_boyut=11.5)
    kutu(ax, 84, 78, 28, 16, "HAYIR → normal", ["cihaz-bağlı anahtarla", "sırrı aç, kullan, SİL"],
         dolgu=IYIBG, kenar=IYI, bas_boyut=11, satir_boyut=9.2)
    kutu(ax, 84, 44, 28, 20, "EVET → tepki", ["sırrı SİL", "tamper bayrağı", "decoy döndür · bildir"],
         dolgu=KOTUBG, kenar=KOTU, bas_boyut=11, satir_boyut=9.2)
    ok(ax, 65, 66, 70, 74, renk=IYI)
    ok(ax, 65, 58, 70, 50, renk=KOTU)
    serit(ax, 16, "Tepki gecikmeli/sessiz olmalı: hemen çökmek saldırgana denetimin yerini gösterir.")
    return kaydet(fig, k, "h06-05-rasp-motoru")


# ------------------------------------------------------------------ HAFTA 10
def h10_01(k):
    fig, ax = akis([
        ("1 · ŞİFRELE", ["c = ENC(k1, m)"], "ana"),
        ("2 · MAC'LE", ["t = MAC(k2, c)"], "ana"),
        ("3 · GÖNDER", ["c || t"], "koyu"),
        ("4 · ÖNCE MAC doğrula", ["geçmezse", "ÇÖZMEDEN REDDET"], "kotu"),
        ("5 · ÇÖZ", ["m elde edilir"], "iyi"),
    ], "Encrypt-then-MAC: doğru sıra", "alıcı geçersiz metni hiç çözmez → dolgu kâhini kapanır",
        dip="Yanlış sıra (önce çöz, sonra doğrula) dolgu hatası sızdırır ve oracle açar.", dip_renk=KOTU)
    return kaydet(fig, k, "h10-01-encrypt-then-mac")


def h10_02(k):
    fig, ax = dizi("Kimliksiz Diffie–Hellman: araya girme",
        ["İSTEMCİ", "ARAYA GİREN", "SUNUCU"], [
        (0, 1, "A'nın açık değeri", "ileri"),
        (1, 2, "M'nin açık değeri (A gibi davranır)", "ileri"),
        (2, 1, "B'nin açık değeri", "geri"),
        (1, 0, "M'nin açık değeri (B gibi davranır)", "geri"),
        (0, 0, "İstemci ile araya giren arasında SIR 1", "not"),
        (2, 2, "Araya giren ile sunucu arasında SIR 2", "not"),
        (0, 0, "Her iki taraf da 'güvenli konuştuk' sanıyor — ortadaki her şeyi okuyor", "not"),
    ], alt_metin="DH kiminle anlaştığınızı SÖYLEMEZ", y=6.4,
       dip="Çözüm: DH'yi kimlik kanıtıyla bağla (sertifika / imzalı DH) — TLS 1.3 bunu yapar.")
    return kaydet(fig, k, "h10-02-dh-mitm")


def h10_03(k):
    fig, ax = tuval(12.0, 4.8)
    baslik(ax, "PKI: kim kime güvenir?", "güven kökten uca akar")
    kutu(ax, 30, 72, 34, 14, "KÖK CA", ["çevrimdışı · 20+ yıl"], dolgu=KOYU, kenar=KOYU,
         bas_renk="white", bas_boyut=12.5, satir_boyut=9.6)
    kutu(ax, 30, 46, 34, 14, "ARA CA", ["çevrimiçi · 5–10 yıl"], dolgu=ANA, kenar=ANA,
         bas_renk="white", bas_boyut=12.5, satir_boyut=9.6)
    ok(ax, 30, 65, 30, 53, renk=SOLUK, etiket="imzalar", etiket_boyut=9.4)
    kutu(ax, 63, 22, 28, 13, "Uç sertifika", ["sunucu.ornek"], dolgu=COKACIK, kenar=ANA, bas_boyut=11, satir_boyut=9.4)
    kutu(ax, 84, 46, 26, 13, "Uç sertifika", ["istemci / cihaz"], dolgu=COKACIK, kenar=ANA, bas_boyut=11, satir_boyut=9.4)
    ok(ax, 44, 42, 56, 28, renk=SOLUK, etiket="imzalar", etiket_boyut=9)
    ok(ax, 47, 46, 71, 46, renk=SOLUK, etiket="imzalar", etiket_boyut=9)
    kutu(ax, 80, 76, 30, 13, "Güven deposu", ["işletim sistemi / tarayıcı"], dolgu=IYIBG, kenar=IYI,
         bas_boyut=11, satir_boyut=9.4)
    ok(ax, 65, 76, 48, 74, renk=IYI, kesik=True, etiket="kökü içerir", etiket_boyut=9)
    serit(ax, 8, "İstemci yalnız KÖKE güvenir; zincir kökten uca kesintisiz kurulamazsa doğrulama başarısızdır.")
    return kaydet(fig, k, "h10-03-pki")


def h10_04(k):
    fig, ax = tuval(12.0, 4.8)
    baslik(ax, "Sertifika iptali: CRL · OCSP · zımbalama", "'bu sertifika hâlâ geçerli mi?'")
    kutu(ax, 50, 78, 44, 11, "Sertifika iptal edildi mi?", dolgu=KOYU, kenar=KOYU, bas_renk="white", bas_boyut=12.5)
    veriler = [(16, "CRL", ["uzun iptal listesi indir"], "büyük, gecikmeli", UYARIBG, UYARI),
               (50, "OCSP", ["tek sertifikayı sor"], "gizlilik sızdırır", UYARIBG, UYARI),
               (84, "OCSP Stapling", ["sunucu taze yanıtı sunar"], "hızlı + gizlilik dostu", IYIBG, IYI)]
    for x, ad, satirlar, not_metni, dolgu, kenar in veriler:
        ok(ax, 50, 72, x, 60, renk=SOLUK, kalinlik=1.5)
        kutu(ax, x, 50, 30, 18, ad, satirlar, dolgu=dolgu, kenar=kenar, bas_boyut=12, satir_boyut=9.4)
        ax.text(x, 36, not_metni, ha="center", fontsize=9.6,
                color=IYI if kenar == IYI else UYARI)
    kutu(ax, 50, 20, 60, 11, "FAIL-OPEN TUZAĞI: 'erişilemedi' = 'geçti' sayma!",
         dolgu=KOTUBG, kenar=KOTU, bas_boyut=11.5)
    return kaydet(fig, k, "h10-04-sertifika-iptali")


# ------------------------------------------------------------------ HAFTA 11
def h11_01(k):
    fig, ax = akis([
        ("KARA KUTU", ["yalnız giriş/çıkış", "AES kanıtı bunu varsayar"], "ana"),
        ("GRİ KUTU", ["+ yan kanal", "güç / zaman (DPA)"], "uyari"),
        ("BEYAZ KUTU", ["+ bellek, kod, ara değer", "MATE — WBC burada savaşır"], "kotu"),
    ], "Üç saldırgan modeli: ne görüyor?", "soldan sağa görünürlük artar",
        dip="WBC en zor modelde anahtar çıkarmayı GECİKTİRMEYE çalışır; imkânsız kılmaz.")
    return kaydet(fig, k, "h11-01-saldirgan-modelleri")


# ------------------------------------------------------------------ HAFTA 12
def h12_01(k):
    fig, ax = akis([
        ("HAZIRLIK", ["TOE · kapsam", "gereksinim · plan", "(adım 1–4)"], "ana"),
        ("DEĞERLENDİRME", ["kod inceleme → SAST →", "DAST → fuzzing → pentest", "+ derecelendirme"], "uyari"),
        ("SÜREKLİLİK", ["karar / sertifika", "etki analizi + delta"], "iyi"),
    ], "Değerlendirme süreci: üç aşama, 13 adım", "üretici kendi ürününü onaylayamaz",
        dip="Sertifika bir anlık fotoğraftır: her değişiklikte etki analizi ve delta değerlendirme gerekir.")
    return kaydet(fig, k, "h12-01-degerlendirme-sureci")


def h12_02(k):
    fig, ax = adimlar("Hazırlık aşaması: adım 1–4", [
        ("1 · TOE tanımı", ["sürüm, yapı, özet"], "koyu"),
        ("2 · Kapsam", ["neyi kapsar, neyi kapsamaz"], "ana"),
        ("3 · Güvenlik hedefi", ["gereksinimler (ST)"], "ana"),
        ("4 · Değerlendirme planı", ["yöntem, takvim, kanıt"], "iyi"),
    ], alt_metin="yanlış tanımlanmış TOE, tüm değerlendirmeyi geçersiz kılar", satir_basina=4,
        dip="TOE benzersiz tanımlanmazsa 'hangi sürüm sertifikalı?' sorusu yanıtsız kalır.")
    return kaydet(fig, k, "h12-02-hazirlik-adimlari")


# ------------------------------------------------------------------ HAFTA 13
def h13_01(k):
    fig, ax = tuval(12.0, 4.8)
    baslik(ax, "Gereksinimden kanıta: izlenebilirlik zinciri", "her gereksinim bir kanıta bağlanır")
    kutu(ax, 12, 60, 20, 15, "GEREKSİNİM", ["kimlik + metin"], dolgu=KOYU, kenar=KOYU,
         bas_renk="white", bas_boyut=11, satir_boyut=9.2)
    kutu(ax, 12, 28, 20, 13, "Tehdit / varlık", ["(S4, S5)"], dolgu=MORBG, kenar=MOR, bas_boyut=10.4, satir_boyut=9.0)
    ok(ax, 12, 52, 12, 35, renk=MOR, kesik=True, etiket="neden var?", etiket_boyut=9)
    kutu(ax, 38, 60, 22, 15, "Önlem kartı", ["(S7–S12)"], dolgu=COKACIK, kenar=ANA, bas_boyut=11, satir_boyut=9.2)
    ok(ax, 22.5, 60, 26.5, 60, renk=SOLUK)
    kutu(ax, 64, 76, 22, 13, "Kod", ["dosya, fonksiyon"], dolgu=COKACIK, kenar=ANA, bas_boyut=11, satir_boyut=9.0)
    kutu(ax, 64, 46, 22, 13, "Doğrulama", ["test, inceleme"], dolgu=IYIBG, kenar=IYI, bas_boyut=11, satir_boyut=9.0)
    ok(ax, 49.5, 64, 52.5, 74, renk=SOLUK)
    ok(ax, 49.5, 56, 52.5, 48, renk=SOLUK)
    kutu(ax, 88, 46, 20, 13, "KANIT", ["çıktı, rapor"], dolgu=IYIBG, kenar=IYI, bas_boyut=11, satir_boyut=9.0)
    ok(ax, 75.5, 46, 77.5, 46, renk=IYI)
    kutu(ax, 76, 20, 44, 12, "DURUM: karşılandı / devredildi / karşılanmadı",
         dolgu=UYARIBG, kenar=UYARI, bas_boyut=11)
    ok(ax, 88, 39.5, 82, 26.5, renk=UYARI)
    serit(ax, 7, "Kanıtı olmayan 'karşılandı' satırı, karşılanmamış sayılır.")
    return kaydet(fig, k, "h13-01-izlenebilirlik")


def h13_02(k):
    fig, ax = tuval(12.0, 5.2)
    baslik(ax, "Gereksinimi projeye aktarma kararı", "her gereksinim için aynı soruları sor")
    kutu(ax, 13, 70, 20, 13, "Gereksinim seti", dolgu=COKACIK, kenar=ANA, bas_boyut=11)
    ok(ax, 23.5, 70, 29, 70, renk=SOLUK)
    kutu(ax, 42, 70, 22, 13, "Uygulanır mı?", dolgu=UYARIBG, kenar=UYARI, bas_boyut=11.5)
    kutu(ax, 42, 44, 24, 11, "Gerekçe yaz", dolgu=KOTUBG, kenar=KOTU, bas_boyut=11)
    ok(ax, 42, 63.5, 42, 49.5, renk=KOTU, etiket="hayır", etiket_boyut=9.2)
    kutu(ax, 75, 70, 22, 13, "Sorumlu kim?", dolgu=UYARIBG, kenar=UYARI, bas_boyut=11.5)
    ok(ax, 53, 70, 64, 70, renk=IYI, etiket="evet", etiket_boyut=9.2)
    kutu(ax, 75, 44, 24, 11, "S14: devredilen", dolgu=MORBG, kenar=MOR, bas_boyut=11)
    ok(ax, 75, 63.5, 75, 49.5, renk=MOR, etiket="devret", etiket_boyut=9.2)
    ax.text(97, 70, "biz", fontsize=9.6, color=IYI, va="center")
    ax.plot([86, 94, 94], [70, 70, 26], color=IYI, linewidth=1.8, zorder=1)
    ax.plot([94, 8, 8], [26, 26, 26], color=IYI, linewidth=1.8, zorder=1)
    alt = [("Varlık + tehdit", "(S4, S5)", 16), ("Önlem kartı", "(S6–S13)", 40),
           ("Doğrulama", "(S16)", 64), ("Uyum matrisi", "(S17)", 88)]
    for i, (ad, alt_s, x) in enumerate(alt):
        kutu(ax, x, 26, 20, 13, ad, [alt_s], dolgu=COKACIK if i < 2 else IYIBG,
             kenar=ANA if i < 2 else IYI, bas_boyut=10.6, satir_boyut=9.2)
        if i < len(alt) - 1:
            ok(ax, x + 10, 26, alt[i + 1][2] - 10, 26, renk=SOLUK, kalinlik=1.5)
    serit(ax, 9, "Devredilen gereksinim de yazılır: kime, neden, karşı taraf nasıl karşılayacak.")
    return kaydet(fig, k, "h13-02-gereksinim-karari")


# ------------------------------------------------------------------ HAFTA 14
def h14_01(k):
    fig, ax = akis([
        ("temiz.c", ["okunur kaynak"], "ana"),
        ("TIGRESS", ["+ tohum · dönüşüm"], "koyu"),
        ("gizli.c", ["gizlenmiş kaynak"], "ana"),
        ("derle", ["+ SBOM"], "iyi"),
        ("İMZALA", ["son ikili"], "uyari"),
        ("dağıt", [], "mor"),
    ], "Kaynaktan kaynağa gizleme hattı (S15)", "imza EN SON: önce gizle, sonra imzala",
        dip="Her hattan sonra: 1) davranışı test et · 2) maliyeti ölç (boyut/hız).")
    return kaydet(fig, k, "h14-01-kaynaktan-kaynaga-hat")


ISLER = {4: [h04_01, h04_02, h04_03], 5: [h05_01],
         6: [h06_01, h06_02, h06_03, h06_04, h06_05],
         10: [h10_01, h10_02, h10_03, h10_04], 11: [h11_01],
         12: [h12_01, h12_02], 13: [h13_01, h13_02], 14: [h14_01]}

if __name__ == "__main__":
    KOK = sys.argv[1]
    for hafta, fnlar in ISLER.items():
        for fn in fnlar:
            print("  ", os.path.basename(fn(yol(hafta))))
