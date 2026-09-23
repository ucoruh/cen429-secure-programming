# -*- coding: utf-8 -*-
"""2. tur görseller — Hafta 5, 9, 11, 14 (zengin görselleştirme)."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cizim import *

KOK = None
def yol(h): return os.path.join(KOK, "week-%d" % h, "assets")

# ============================================================ HAFTA 5
def h05_02(k):
    fig, ax = iki_yol("Yönetilen dil neyi çözer, neyi çözmez?",
        ("ÇÖZER (dil düzeyinde)", ["tampon taşması", "use-after-free", "çift serbest bırakma",
                                   "ilklendirilmemiş değişken", "", "→ bellek güvenliği"], "iyi"),
        ("ÇÖZMEZ", ["enjeksiyon (SQL, komut, XML)", "güvensiz deserialization",
                    "koda gömülü sırlar", "zafiyetli bağımlılıklar", "mantık/yetki hataları"], "kotu"),
        alt_metin="Java/Kotlin/C# çöp toplayıcı + sınır denetimi",
        dip="Dil bir hata SINIFINI kaldırır; kalan sınıflar için hâlâ siz sorumlusunuz.")
    return kaydet(fig, k, "h05-02-yonetilen-dil")

def h05_03(k):
    fig, ax = akis([
        ("Girdi", ["' OR '1'='1"], "kotu"),
        ("Dize birleştirme", ["\"...WHERE ad='\" + girdi"], "kotu"),
        ("Motora giden SQL", ["WHERE ad='' OR '1'='1'"], "uyari"),
        ("Koşul HEP doğru", ["TÜM satırlar döner"], "kotu"),
    ], "SQL enjeksiyonu adım adım", "girdi tırnağı kapatıp kendi mantığını ekliyor",
       dip="Parametreli sorguda motor komutu ÖNCE derler; girdi artık mantık değiştiremez.", dip_renk=KOTU)
    return kaydet(fig, k, "h05-03-sql-enjeksiyon")

def h05_04(k):
    fig, ax = iki_yol("Komut çalıştırma: kabuk var mı yok mu?",
        ("Kabuklu (tehlikeli)", ["Runtime.exec(\"sh -c ...\")", "",
                                 "kabuk ; | && > yorumlar", "girdi KOMUT olur"], "kotu"),
        ("ProcessBuilder (güvenli)", ["new ProcessBuilder(", "  \"prog\", arg1, arg2)", "",
                                      "argümanlar AYRI geçer", "kabuk hiç çalışmaz"], "iyi"),
        alt_metin="komut enjeksiyonunun tek kaynağı: araya giren kabuk",
        dip="Yine de argüman enjeksiyonuna dikkat: '--' ile seçenek/değer sınırını işaretleyin.")
    return kaydet(fig, k, "h05-04-komut-enjeksiyon")

def h05_05(k):
    fig, ax = akis([
        ("Ham yol", ["../../etc/passwd", "%2e%2e%2f ..."], "kotu"),
        ("1· KANONİKLEŞTİR", ["realpath / normalize", "tek doğru yazım"], "ana"),
        ("2· KÖK İÇİNDE Mİ?", ["izinli klasörle", "karşılaştır"], "uyari"),
        ("Kabul / RED", ["kök dışındaysa reddet"], "iyi"),
    ], "Yol geçişini kapatan iki adım", "sıra önemli: önce kanonikleştir, SONRA denetle",
       dip="Ham dize üzerinde yapılan denetim kodlanmış biçimlerle atlatılır.")
    return kaydet(fig, k, "h05-05-yol-gecisi")

def h05_06(k):
    fig, ax = akis([
        ("Saldırganın bayt akışı", ["nesne grafiği"], "kotu"),
        ("readObject()", ["nesneleri KURAR"], "uyari"),
        ("Gadget zinciri", ["sınıf yolundaki", "yan etkili metotlar"], "kotu"),
        ("Komut çalıştırma", ["RCE"], "kotu"),
    ], "Güvensiz seri durumdan çıkarma", "saldırgan kod yazmaz — VAR OLAN sınıfları zincirler",
       dip="Savunma: ObjectInputFilter ile izin listesi ve sonda '!*' (varsayılan-reddet).", dip_renk=KOTU)
    return kaydet(fig, k, "h05-06-deserialization")

def h05_07(k):
    fig, ax = akis([
        ("XML girdisi", ["<!DOCTYPE ... SYSTEM", "\"file:///etc/passwd\">"], "kotu"),
        ("Ayrıştırıcı", ["dış varlığı ÇÖZER"], "uyari"),
        ("Dosya okunur", ["sunucudan veri sızar"], "kotu"),
        ("Kapatan ayar", ["disallow-doctype-decl", "external entities = false"], "iyi"),
    ], "XXE: XML dış varlık saldırısı", "ayrıştırıcının 'yardımsever' varsayılanı",
       dip="Kural: XML/YAML/şablon ayrıştırıcılarında gereksiz yetenekleri KAPATIN.")
    return kaydet(fig, k, "h05-07-xxe")

def h05_08(k):
    fig, ax = iki_yol("Bayt kod neden makine kodundan kolay okunur?",
        ("Java bayt kodu", ["sınıf/metot/alan ADLARI durur", "tipler durur",
                            "yapı korunur", "", "decompiler ≈ kaynağı verir"], "kotu"),
        ("C/C++ makine kodu", ["adlar atılır", "tipler kaybolur",
                               "optimizasyon yapıyı bozar", "", "disassembler ≈ ham komut"], "iyi"),
        alt_metin="bu yüzden Java'da gizleme (ProGuard/R8) daha kritik",
        dip="Gizleme hatayı düzeltmez; yalnız 'kolayca okunma' avantajını geri alır.")
    return kaydet(fig, k, "h05-08-bayt-kod")

def h05_09(k):
    fig, ax = iki_yol("-keep dengesi",
        ("ÇOK keep", ["reflection, serileştirme,", "tüm public API korunur", "",
                      "→ adlar değişmez", "→ gizleme ANLAMSIZ"], "kotu"),
        ("AZ keep", ["yalnız dış giriş noktaları", "",
                     "→ adlar kısalır", "→ ama reflection KIRILIR", "(çalışma anı hatası)"], "uyari"),
        alt_metin="doğrusu: yalnız dışarıdan erişilen giriş noktalarını keep et",
        dip="Her -keep kuralı bir gizleme boşluğudur; en dar kuralı yazın ve test edin.")
    return kaydet(fig, k, "h05-09-keep-dengesi")

def h05_10(k):
    fig, ax = akis([
        ("Projeniz", ["doğrudan bağımlılıklar"], "ana"),
        ("Geçişli bağımlılıklar", ["bağımlılığın bağımlılığı"], "uyari"),
        ("SBOM", ["CycloneDX / SPDX", "tam envanter"], "koyu"),
        ("Tarama + VEX", ["CVE eşle →", "gerçekten etkileniyor muyum?"], "iyi"),
    ], "Tedarik zinciri: SBOM neden gerekli?", "Log4Shell'de asıl sorun 'bende var mı?' sorusuydu",
       dip="Sürümleri sabitleyin: yeniden üretilebilir derleme + beklenmedik güncellemeye karşı koruma.")
    return kaydet(fig, k, "h05-10-sbom")

# ============================================================ HAFTA 9
def h09_03(k):
    fig, ax = iki_yol("MATE: saldırgan cihazın sahibi",
        ("Ağ saldırganı", ["yalnız mesajları görür", "TLS onu durdurur", "",
                           "klasik güvenlik dersleri", "bunu varsayar"], "ana"),
        ("MATE (uçtaki insan)", ["ikiliyi açar, belleği okur", "debugger bağlar, yamalar",
                                 "istediği kadar dener", "", "kripto TEK BAŞINA yetmez"], "kotu"),
        alt_metin="mobil ödeme, DRM, lisanslama: kod kullanıcının elinde çalışır",
        dip="Gizleme burada devreye girer: kırılamazlık değil, MALİYET yükseltme.")
    return kaydet(fig, k, "h09-03-mate")

def h09_04(k):
    fig, ax = iki_yol("Kontrol akışı düzleştirme: CFG önce ve sonra",
        ("ÖNCE: okunur akış", ["giriş → koşul → dallar", "döngü yapısı görünür", "",
                               "analizci mantığı", "doğrudan okur"], "kotu"),
        ("SONRA: düzleştirilmiş", ["tek switch (dağıtıcı)", "bloklar durum değişkeniyle",
                                   "sırası gizli", "", "yapı bilgisi KAYBOLUR"], "iyi"),
        alt_metin="aynı program, aynı sonuç — farklı iskelet",
        dip="Tek başına zayıf: dağıtıcı deseni tanınır → opak yüklem + durum şifreleme ekleyin.")
    return kaydet(fig, k, "h09-04-duzlestirme")

def h09_05(k):
    fig, ax = iki_yol("Sahte işlem ≠ ölü dal",
        ("SAHTE İŞLEM (bogus op)", ["ÇALIŞIR", "sonucu kullanılmaz", "",
                                    "analizciyi ve aracı yorar", "maliyet: hafif yavaşlama"], "uyari"),
        ("ÖLÜ DAL (dead branch)", ["HİÇ ÇALIŞMAZ", "opak yüklemle korunur", "",
                                   "analizde gerçek görünür", "maliyet: boyut"], "mor"),
        alt_metin="ikisi de sahte iş üretir ama farklı biçimde",
        dip="Sınav sorusu: hangisi çalışır? → Sahte işlem çalışır, ölü dal çalışmaz.")
    return kaydet(fig, k, "h09-05-sahte-olu")

def h09_06(k):
    fig, ax = akis([
        ("Orijinal fonksiyon", ["makine kodu"], "ana"),
        ("Bytecode'a çevir", ["özel komut kümesi"], "koyu"),
        ("VM (yorumlayıcı)", ["bytecode'u çalıştırır"], "koyu"),
        ("Sonuç aynı", ["ama makine kodu yok"], "iyi"),
    ], "Sanallaştırma: en güçlü, en pahalı", "analizci artık sizin uydurduğunuz makineyi çözmek zorunda",
       dip="Maliyet: onlarca kat yavaşlama + boyut → yalnız küçük ve kritik fonksiyonlara.", dip_renk=KOTU)
    return kaydet(fig, k, "h09-06-sanallastirma")

def h09_07(k):
    fig, ax = tuval(11.5, 4.8)
    baslik(ax, "Çeşitlendirme: tek kırık her yeri açmasın", "aynı kaynak, farklı tohum, farklı ikili")
    kutu(ax, 16, 62, 24, 14, "temiz.c", ["tek kaynak"], dolgu=COKACIK, kenar=ANA, bas_boyut=11.5, satir_boyut=9.6)
    for i, (t_, y, renk) in enumerate((("tohum A", 78, ACIK), ("tohum B", 58, "#6ec6c8"), ("tohum C", 38, ANA))):
        ok(ax, 29, 62, 40, y, renk=SOLUK, kalinlik=1.4)
        kutu(ax, 52, y, 20, 11, t_, dolgu=renk, kenar=ANA, bas_boyut=10.6,
             bas_renk="white" if renk == ANA else YAZI)
        ok(ax, 63, y, 72, y, renk=SOLUK, kalinlik=1.4)
        kutu(ax, 86, y, 24, 11, f"ikili {chr(65+i)}", ["yapı farklı"], dolgu=IYIBG, kenar=IYI,
             bas_boyut=10.6, satir_boyut=9.0)
    serit(ax, 16, "Davranış birebir aynı; bir kopyaya yazılan yama diğerlerinde ÇALIŞMAZ.")
    return kaydet(fig, k, "h09-07-cesitlendirme")

def h09_08(k):
    fig, ax = katman("Gizlemeyi ölçen dört boyut", [
        ("GÜÇ (potency)", "insan analizciyi ne kadar zorlaştırır", "ana"),
        ("DAYANIKLILIK (resilience)", "otomatik araçlara direnç", "ana"),
        ("GİZLİLİK (stealth)", "gizlemenin fark edilmezliği", "uyari"),
        ("MALİYET (cost)", "boyut + hız cezası", "kotu"),
    ], alt_metin="bir koruma kararı bu dördüyle birlikte gerekçelendirilir",
       dip="Ödünleşim: dayanıklılık ↔ maliyet, güç ↔ gizlilik. Ölçmeden 'güçlendirdim' denmez.", y=4.8)
    return kaydet(fig, k, "h09-08-dort-olcut")

def h09_09(k):
    fig, ax = akis([
        ("Gizlenmiş ikili", [], "koyu"),
        ("Disassembler / decompiler", ["yapıyı geri kurmaya çalışır"], "uyari"),
        ("Sembolik yürütme (KLEE)", ["yolları otomatik çözer", "opak yüklemi kırabilir"], "kotu"),
        ("Dayanıklı yüklem", ["girdi bağımlı, yol patlatan", "→ araç tıkanır"], "iyi"),
    ], "Karşı tarafın araçları", "dayanıklılık, bu araçlara karşı ölçülür",
       dip="Klasik kalıplar kütüphanelerde tanınır → tohumla çeşitlendirin (14. hafta).")
    return kaydet(fig, k, "h09-09-deobfuscation")

def h09_10(k):
    fig, ax = adimlar("\"Koruma kuralı\" şablonu", [
        ("1 · Neyi korur?", ["hangi varlık"], "ana"),
        ("2 · Hangi tehdide", ["karşı?"], "uyari"),
        ("3 · Nasıl?", ["hangi dönüşüm"], "ana"),
        ("4 · Maliyet", ["boyut / hız"], "kotu"),
        ("5 · Sınır", ["neyi korumaz"], "kotu"),
        ("6 · Ölçüm", ["önce/sonra sayı"], "iyi"),
    ], alt_metin="her teknik bu altı satırla yazılır — S9'a böyle gider", satir_basina=3,
       dip="'Ölçüm' satırı olmayan kural, gerekçelendirilmemiş sayılır.")
    return kaydet(fig, k, "h09-10-koruma-kurali")

# ============================================================ HAFTA 11
def h11_02(k):
    fig, ax = adimlar("Naif tablo anahtarı nasıl sızdırır?", [
        ("1 · Tabloyu oku", ["T[0x00] = 0xEB"], "kotu"),
        ("2 · S-box'ı ters çevir", ["S⁻¹[0xEB] = 0x3C"], "uyari"),
        ("3 · Anahtarı çöz", ["k = 0x00 ⊕ 0x3C", "= 0x3C"], "kotu"),
    ], alt_metin="T[x] = S-box[x ⊕ k] — tek girdi yeter, 256 deneme bile gerekmez", satir_basina=3,
       dip="'Anahtar kodda görünmüyor' demek, 'anahtar korunuyor' demek DEĞİLDİR.", dip_renk=KOTU)
    return kaydet(fig, k, "h11-02-anahtar-sizmasi")

def h11_03(k):
    fig, ax = iki_yol("İç kodlama ne değiştirir?",
        ("Kodlamasız tablo", ["T[x] = S-box[x ⊕ k]", "",
                              "S⁻¹ uygulanabilir", "→ k geri hesaplanır"], "kotu"),
        ("İç kodlamalı tablo", ["T'[x] = G( S-box[x ⊕ k] )", "",
                                "G bilinmeden S⁻¹ yok", "→ adım 2 kırılır"], "iyi"),
        alt_metin="gizli bijeksiyon G, ara değeri maskeler",
        dip="Ardışık tabloların kodlamaları birbirini götürür: sonuç doğru, ara değer karışık.")
    return kaydet(fig, k, "h11-03-ic-kodlama")

def h11_04(k):
    fig, ax = akis([
        ("Girdi", [], "ana"),
        ("F⁻¹ (dış kodlama)", ["uygulamaya bağlar"], "uyari"),
        ("Kodlanmış tablo ağı", ["AES turları"], "koyu"),
        ("G (dış kodlama)", [], "uyari"),
        ("Çıktı", ["G ∘ AES ∘ F⁻¹"], "kotu"),
    ], "Dış kodlama: en güçlü koruma, en büyük sınır", "çıktı artık STANDART AES değildir",
       dip="Karşı taraf F ve G'yi bilmeden sonuç anlamsız → yalnız iki ucu da sizin olduğu protokolde.",
       dip_renk=KOTU)
    return kaydet(fig, k, "h11-04-dis-kodlama")

def h11_05(k):
    fig, ax = akis([
        ("Programı çalıştır", ["bellek erişim izini kaydet"], "ana"),
        ("Çok sayıda girdi", ["izleri topla"], "ana"),
        ("İstatistiksel korelasyon", ["tahmin edilen ara değerle"], "uyari"),
        ("ANAHTAR", ["kodlamayı bilmeden"], "kotu"),
    ], "DCA: donanım yan kanalının yazılım hâli", "güç izi yerine YAZILIM izi kullanılır",
       dip="Klasik DPA'nın kardeşi. İç kodlama zayıfsa korelasyon kodlamayı aşar.", dip_renk=KOTU)
    return kaydet(fig, k, "h11-05-dca")

def h11_06(k):
    fig, ax = iki_yol("Code lifting: anahtarı hiç çıkarmadan",
        ("Saldırı", ["whitebox rutinini/tablosunu", "olduğu gibi KOPYALA", "",
                     "kendi programında kullan", "anahtar hiç bilinmez"], "kotu"),
        ("Önlem", ["dış kodlama (F, G)", "cihaz bağlama", "sunucu tarafı denetim", "",
                   "taşınan rutin işe yaramaz"], "iyi"),
        alt_metin="WBC'nin en sinsi saldırısı: anahtar gizli kalsa bile işlev çalınır",
        dip="Bu yüzden WBC tek başına değil, bağlama ve sunucu denetimiyle birlikte kullanılır.")
    return kaydet(fig, k, "h11-06-code-lifting")

def h11_07(k):
    fig, ax = katman("Anahtar koruma seçenekleri", [
        ("HSM / donanım", "anahtar hiç çıkmaz — en güçlü, en pahalı", "koyu"),
        ("TEE / Güvenli öğe (SE)", "yalıtılmış işlemci bölgesi", "iyi"),
        ("WBC + bağlama + yenileme", "geciktirir, tek başına değil", "uyari"),
        ("Saf yazılım WBC", "yayımlananların hepsi kırıldı", "uyari"),
        ("Düz gömülü anahtar", "koruma DEĞİL", "kotu"),
    ], alt_metin="yukarıdan aşağı: güç azalır, maliyet de azalır",
       dip="Seçim varlığın değerine göre gerekçelendirilir ve S8'e yazılır.", y=5.2)
    return kaydet(fig, k, "h11-07-anahtar-koruma")

def h11_08(k):
    fig, ax = zaman("Whitebox kriptografi: kırılma tarihi", [
        ("1883", "Kerckhoffs:\ngüvenlik anahtarda"),
        ("2002", "Chow vd.\nWB-AES / WB-DES"),
        ("2004", "BGE saldırısı\nilkini kırar"),
        ("2016", "DCA (Bos vd.)\notomatik kırma"),
        ("2017-24", "WhibOx: tüm\nadaylar kırıldı"),
    ], alt_metin="yayımlanmış hiçbir saf-yazılım tasarım ayakta kalmadı",
       dip="Sonuç: WBC bir GECİKTİRME katmanıdır; mümkünse donanım tercih edilir.")
    return kaydet(fig, k, "h11-08-tarihce")

def h11_09(k):
    fig, ax = akis([
        ("WBC tablosu", ["anahtarı geciktirir"], "uyari"),
        ("+ Cihaz bağlama", ["başka cihazda çalışmaz"], "ana"),
        ("+ Anahtar yenileme", ["kısa kripto-periyot"], "ana"),
        ("+ Sunucu denetimi", ["anormal kullanımı görür"], "iyi"),
    ], "WBC'yi tek başına bırakmayın", "her katman saldırganın kazanç penceresini daraltır",
       dip="Tek başına WBC = zaman kazandırır; katmanlı WBC = saldırıyı ölçeklenemez kılar.")
    return kaydet(fig, k, "h11-09-katmanli-wbc")

# ============================================================ HAFTA 14
def h14_02(k):
    fig, ax = iki_yol("El ile gizleme vs araçla gizleme",
        ("EL İLE", ["her sürümde tekrar yaz", "kaynak okunamaz hale gelir",
                    "hata riski yüksek", "çeşitlendirilemez"], "kotu"),
        ("ARAÇLA (Tigress)", ["her derlemede otomatik", "kaynak TEMİZ kalır",
                              "tutarlı ve ölçekli", "tohumla çeşitlendirilir"], "iyi"),
        alt_metin="9. haftada el ile yaptığımızı 14. haftada araç yapıyor",
        dip="Kaynağı siz korursunuz; gizleme derleme hattının bir adımıdır.")
    return kaydet(fig, k, "h14-02-el-ile-vs-arac")

def h14_03(k):
    fig, ax = katman("Tigress dönüşümleri ↔ 9. hafta kuralları", [
        ("Flatten", "K-04 kontrol akışı düzleştirme", "ana"),
        ("AddOpaque / InitOpaque", "K-01 opak yüklem · K-03 ölü dal", "ana"),
        ("EncodeArithmetic", "K-02 aritmetik kodlama", "ana"),
        ("EncodeLiterals", "K-07 sabit / dize gizleme", "ana"),
        ("Virtualize", "K-10 sanallaştırma (en pahalı)", "koyu"),
    ], alt_metin="araç yeni bir şey icat etmiyor — aynı kuralları otomatikleştiriyor",
       dip="Hangi dönüşümü seçtiğinizi S9'da kuralla eşleyerek gerekçelendirin.", y=5.0)
    return kaydet(fig, k, "h14-03-donusum-esleme")

def h14_04(k):
    fig, ax = akis([
        ("EncodeLiterals", ["sabitleri gizle"], "ana"),
        ("EncodeArithmetic", ["işlemleri karmaşıklaştır"], "ana"),
        ("Flatten", ["akışı düzleştir"], "ana"),
        ("AddOpaque", ["sahte dal ekle"], "uyari"),
    ], "Dönüşüm hattı: sıra önemlidir", "her dönüşüm bir öncekinin çıktısı üzerinde çalışır",
       dip="Yanlış sıra bazı dönüşümleri etkisizleştirir ya da maliyeti gereksiz artırır.")
    return kaydet(fig, k, "h14-04-donusum-hatti")

def h14_05(k):
    fig, ax = iki_yol("Uzayda ve zamanda çeşitlendirme",
        ("UZAYDA", ["her kullanıcı/kopya farklı", "",
                    "bir kırık TEK kopyayı açar", "ölçeklenemez saldırı"], "iyi"),
        ("ZAMANDA", ["her sürüm farklı", "",
                     "bir kırık KALICI olmaz", "saldırgan tekrar başlar"], "iyi"),
        alt_metin="ikisi birlikte saldırının yeniden kullanımını kırar",
        dip="Çeşitlendirme tek kopyanın gücünü artırmaz; saldırının ÖLÇEKLENMESİNİ engeller.")
    return kaydet(fig, k, "h14-05-cesitlendirme-turleri")

def h14_06(k):
    fig, ax = akis([
        ("Gizle", ["Tigress hattı"], "koyu"),
        ("1· DAVRANIŞI TEST ET", ["birim testleri", "geçmeli"], "iyi"),
        ("2· MALİYETİ ÖLÇ", ["boyut · hız", "komut/dal sayısı"], "uyari"),
        ("Karar", ["kabul / geri al"], "mor"),
    ], "Her hattan sonra mutlaka iki şey", "ölçmeden 'güçlendirdim' denemez",
       dip="Örnek ölçüm: erisim_ver 28 komut/3 dal → 51 komut/6 dal.")
    return kaydet(fig, k, "h14-06-test-ve-olcum")

def h14_07(k):
    fig, ax = adimlar("S15: derleme ve dağıtım hattı", [
        ("1 · Kaynak", ["git, sürüm kimliği"], "ana"),
        ("2 · Statik analiz", [], "ana"),
        ("3 · Gizle", ["yalnız hassas fonksiyonlar"], "koyu"),
        ("4 · Çeşitlendir", ["tohum"], "koyu"),
        ("5 · Derle + SBOM", [], "ana"),
        ("6 · İMZALA", ["en son!"], "uyari"),
        ("7 · Dağıt", ["özet değerini kaydet"], "iyi"),
    ], alt_metin="imza en sonda: önce gizle, sonra imzala", satir_basina=4,
       dip="Sıra bozulursa imza geçersizleşir; TOE kimliği (12. hafta) buradan çıkar.")
    return kaydet(fig, k, "h14-07-s15-hatti")

def h14_08(k):
    fig, ax = iki_yol("Banescu'nun kuralı: dayanıklılık ↔ maliyet",
        ("Güçlü dönüşüm", ["Virtualize, çok katman", "",
                           "dayanıklılık YÜKSEK", "performans/boyut CEZASI yüksek"], "uyari"),
        ("Hafif dönüşüm", ["EncodeLiterals, opak yüklem", "",
                           "dayanıklılık düşük", "maliyet düşük"], "ana"),
        alt_metin="KLEE ile ölçülen deneysel sonuç",
        dip="Koruma, varlığın değeriyle ORANTILI seçilir — her şey en güçlüyle gizlenmez.")
    return kaydet(fig, k, "h14-08-dayaniklilik-maliyet")


ISLER = {5: [h05_02, h05_03, h05_04, h05_05, h05_06, h05_07, h05_08, h05_09, h05_10],
         9: [h09_03, h09_04, h09_05, h09_06, h09_07, h09_08, h09_09, h09_10],
         11:[h11_02, h11_03, h11_04, h11_05, h11_06, h11_07, h11_08, h11_09],
         14:[h14_02, h14_03, h14_04, h14_05, h14_06, h14_07, h14_08]}

if __name__ == "__main__":
    KOK = sys.argv[1]
    n = 0
    for h, fnlar in ISLER.items():
        for fn in fnlar:
            fn(yol(h)); n += 1
    print("üretilen:", n)
    rapor()
