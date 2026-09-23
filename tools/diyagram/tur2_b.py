# -*- coding: utf-8 -*-
"""3. tur görseller — Hafta 4, 6, 10, 12, 13."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cizim import *

KOK = None
def yol(h): return os.path.join(KOK, "week-%d" % h, "assets")

# ============================================================ HAFTA 4
def h04_05(k):
    fig, ax = katman("Kod sağlamlaştırmanın üç katmanı", [
        ("3 · Kod gizleme", "anlamayı zorlaştırır — hatayı SİLMEZ", "uyari"),
        ("2 · Derleyici / OS korumaları", "sömürüyü zorlaştırır — hatayı SİLMEZ", "ana"),
        ("1 · Güvenli kodlama", "hatayı GERÇEKTEN ortadan kaldırır", "iyi"),
    ], alt_metin="yalnız en alttaki katman hatayı yok eder",
       dip="Sıra: önce doğru yaz, sonra derleyiciyle sertleştir, en son gizle.", y=4.4)
    return kaydet(fig, k, "h04-05-uc-katman")

def h04_06(k):
    fig, ax = akis([
        ("Dış girdi", ["kullanıcı · dosya · ağ"], "kotu"),
        ("1· Tip ve uzunluk", ["sınırı denetle"], "ana"),
        ("2· Kanonikleştir", ["tek doğru yazım"], "ana"),
        ("3· İzin listesi", ["beklenen değerler"], "ana"),
        ("Güvenli kullanım", ["yoksa REDDET"], "iyi"),
    ], "Güven sınırında girdi doğrulama", "her dış girdi bu kapıdan geçer",
       dip="Kara liste değil İZİN listesi: neyin yasak olduğunu değil, neyin serbest olduğunu yazın.")
    return kaydet(fig, k, "h04-06-girdi-dogrulama")

def h04_07(k):
    fig, ax = iki_yol("Biçim dizisi açığı",
        ("printf(girdi)", ["girdi BİÇİM DİZGESİ sayılır", "",
                           "%x → yığını okur", "%n → belleğe YAZAR", "→ bilgi sızıntısı, kod akışı"], "kotu"),
        ("printf(\"%s\", girdi)", ["biçim dizgesi SABİT", "",
                                   "girdi yalnız VERİ", "", "güvenli"], "iyi"),
        alt_metin="tek fark: biçim dizgesini kim belirliyor",
        dip="En tehlikelisi %n: yazdığı bayt sayısını belleğe yazar → seçili adrese yazma.")
    return kaydet(fig, k, "h04-07-bicim-dizisi")

def h04_08(k):
    fig, ax = akis([
        ("malloc", ["blok ayrıldı"], "ana"),
        ("kullan", ["geçerli"], "iyi"),
        ("free(p)", ["blok geri verildi"], "uyari"),
        ("p SARKAN", ["eski adresi gösteriyor"], "kotu"),
        ("*p → UAF", ["CWE-416"], "kotu"),
    ], "Use-after-free zinciri", "ASan raporundaki üç iz bu zincirin üç noktasıdır",
       dip="Düzeltme free ile use ARASINDADIR: p = NULL ve tek sahiplik kuralı.", dip_renk=KOTU)
    return kaydet(fig, k, "h04-08-uaf")

def h04_09(k):
    fig, ax = akis([
        ("int uzunluk = -1", ["işaretli"], "kotu"),
        ("size_t'ye dönüşür", ["işaretsiz"], "uyari"),
        ("SIZE_MAX olur", ["18 446 744 073 709 551 615"], "kotu"),
        ("memcpy devasa kopya", ["çökme / taşma"], "kotu"),
    ], "-1 ne zaman dev olur?", "işaretli → işaretsiz dönüşümü sessizce gerçekleşir",
       dip="Kural: uzunlukları size_t ile tutun; dışarıdan gelen sayıyı hem alt hem üst sınırla denetleyin.",
       dip_renk=KOTU)
    return kaydet(fig, k, "h04-09-tamsayi")

def h04_10(k):
    fig, ax = iki_yol("Statik analiz ↔ dinamik analiz",
        ("STATİK (çalıştırmadan)", ["tüm kod yollarına bakar", "hiç çalışmayan yolu da görür", "",
                                    "yanlış pozitif ÇOK", "bağlamı bilmez"], "ana"),
        ("DİNAMİK (çalıştırarak)", ["yalnız yürütülen yol", "gerçek hatayı KESİN görür", "",
                                    "yanlış pozitif AZ", "kapsam girdiye bağlı"], "iyi"),
        alt_metin="biri diğerinin yerine geçmez — ikisi birden kullanılır",
        dip="Fuzzing üçüncü ayaktır: dinamik analizin göreceği YENİ yolları üretir.")
    return kaydet(fig, k, "h04-10-statik-dinamik")

def h04_11(k):
    fig, ax = tuval(11.5, 4.4)
    baslik(ax, "AddressSanitizer neyi yakalar, neyi kaçırır?", "nesneler arasına 'zehirli bölge' (redzone) koyar")
    kutu(ax, 20, 62, 22, 12, "nesne A", dolgu=COKACIK, kenar=ANA, bas_boyut=11)
    kutu(ax, 40, 62, 12, 12, "REDZONE", dolgu=KOTUBG, kenar=KOTU, bas_boyut=9.4)
    kutu(ax, 62, 62, 22, 12, "nesne B", dolgu=COKACIK, kenar=ANA, bas_boyut=11)
    ok(ax, 31, 68, 46, 68, renk=KOTU, etiket="taşma → YAKALANIR", etiket_boyut=9.4)
    kutu(ax, 88, 62, 20, 12, "alan1 | alan2", ["aynı struct içinde"], dolgu=UYARIBG, kenar=UYARI,
         bas_boyut=9.6, satir_boyut=8.6)
    ax.text(88, 44, "aralarında redzone YOK\n→ KAÇIRILIR", ha="center", fontsize=9.8, color=KOTU)
    serit(ax, 20, "ASan ayrıca hiç çalışmayan kod yolunu da göremez — fuzzing bu yüzden gerekir.")
    return kaydet(fig, k, "h04-11-asan")

def h04_12(k):
    fig, ax = iki_yol("Sinyal işleyicide ne yapılır?",
        ("YANLIŞ", ["printf, malloc, free", "kilit alan her şey", "",
                    "yeniden girişte iç yapı bozulur", "→ kilitlenme / çökme"], "kotu"),
        ("DOĞRU", ["yalnız bayrak kur:", "volatile sig_atomic_t", "",
                   "asıl işi ana döngü yapar", "(write() gibi güvenli çağrılar)"], "iyi"),
        alt_metin="sinyal, kesilen kodun ortasında gelebilir",
        dip="Async-signal-safe olmayan fonksiyon çağırmak tanımsız davranıştır.")
    return kaydet(fig, k, "h04-12-sinyal")

def h04_13(k):
    fig, ax = iki_yol("Yığın (stack) ve öbek (heap)",
        ("YIĞIN", ["fonksiyonla açılır/kapanır", "otomatik, hızlı", "boyut derleme anında belli", "",
                   "taşma → dönüş adresi tehlikede"], "ana"),
        ("ÖBEK", ["malloc/free ile yönetilir", "yaşam süresi size bağlı", "boyut çalışma anında", "",
                  "taşma → komşu blok / meta veri"], "uyari"),
        alt_metin="taşmanın sonucu, belleğin hangi bölgesinde olduğuna göre değişir",
        dip="Kanarya yığını korur; öbek taşmasını yakalamaz — bu yüzden ASan gerekir.")
    return kaydet(fig, k, "h04-13-yigin-obek")

# ============================================================ HAFTA 6
def h06_06(k):
    fig, ax = iki_yol("WAF ile RASP farkı",
        ("WAF", ["uygulamanın ÖNÜNDE", "HTTP isteklerini süzer", "",
                 "uygulamanın içini bilmez", "sunucu tarafı"], "ana"),
        ("RASP", ["uygulamanın İÇİNDE", "kendi kodunu, belleğini,", "ortamını izler", "",
                  "MATE saldırganına cevap"], "iyi"),
        alt_metin="'kurcalandım mı, beni kim izliyor, hangi cihazdayım?'",
        dip="RASP, cihazın güvenilmez olduğu durumlar için tasarlanmıştır.")
    return kaydet(fig, k, "h06-06-waf-rasp")

def h06_07(k):
    fig, ax = katman("Hata ayıklayıcı algılama yolları", [
        ("İşletim sistemi bayrağı", "Linux /proc/self/status TracerPid · Windows IsDebuggerPresent", "ana"),
        ("PEB / NtGlobalFlag", "Windows süreç yapısındaki izler", "ana"),
        ("Zamanlama", "iki nokta arası süre eşiği aşıyor mu?", "uyari"),
        ("Kendi kendini izleme", "ptrace(PTRACE_TRACEME) başarısızsa biri izliyor", "ana"),
    ], alt_metin="hiçbiri tek başına kesin değil — sinyaller birlikte tartılır",
       dip="Her sinyal atlatılabilir; güç, birden çok bağımsız sinyalin birlikteliğinden gelir.", y=4.8)
    return kaydet(fig, k, "h06-07-antidebug")

def h06_08(k):
    fig, ax = akis([
        ("t1 = saat()", [], "ana"),
        ("Kritik bölge", ["birkaç komut"], "koyu"),
        ("t2 = saat()", [], "ana"),
        ("t2 - t1 > eşik?", ["→ debugger / kesme noktası"], "kotu"),
    ], "Zamanlama tabanlı sezme", "debugger kodu yavaşlatır",
       dip="Yanlış pozitif riski: yavaş cihaz, arka plan yükü. Eşiği ölçerek seçin.")
    return kaydet(fig, k, "h06-08-zamanlama")

def h06_09(k):
    fig, ax = iki_yol("Emülatör algılamada yanlış pozitif",
        ("Zayıf sinyaller", ["pil yok · sensör yok", "hipervizör biti", "",
                             "WSL2 / Hyper-V / VBS yüzünden", "MEŞRU makinede de görülür"], "kotu"),
        ("Doğru yaklaşım", ["birden çok sinyali TART", "sertliği derecelendir", "",
                            "sunucu tarafı attestation", "ikili 'çalış/çalışma' değil"], "iyi"),
        alt_metin="suçsuz kullanıcıyı engellemek en pahalı hatadır",
        dip="Bir skor üretin; eşiği ürünün risk iştahına göre ayarlayın.")
    return kaydet(fig, k, "h06-09-emulator")

def h06_10(k):
    fig, ax = tuval(11.5, 4.4)
    baslik(ax, "Kanca (hook) nasıl algılanır?", "kanca, fonksiyonun ilk baytlarını değiştirir")
    kutu(ax, 22, 64, 34, 12, "Normal fonksiyon", ["beklenen prolog baytları"], dolgu=IYIBG, kenar=IYI,
         bas_boyut=11, satir_boyut=9.4)
    kutu(ax, 22, 40, 34, 12, "Kancalı fonksiyon", ["ilk baytlar → jmp trampoline"], dolgu=KOTUBG, kenar=KOTU,
         bas_boyut=11, satir_boyut=9.4)
    ok(ax, 41, 64, 56, 58, renk=SOLUK, kalinlik=1.6)
    ok(ax, 41, 40, 56, 48, renk=SOLUK, kalinlik=1.6)
    kutu(ax, 76, 53, 34, 20, "DENETİM", ["prolog baytlarını karşılaştır",
                                          "dlsym+dladdr ile", "fonksiyonun geldiği .so'ya bak"],
         dolgu=COKACIK, kenar=ANA, bas_boyut=12, satir_boyut=9.4)
    serit(ax, 16, "libc/vDSO dışında bir modülden geliyorsa kanca vardır (LD_PRELOAD).")
    return kaydet(fig, k, "h06-10-hook")

def h06_11(k):
    fig, ax = katman("Tepki politikası: ne yapmalı?", [
        ("Hemen çök", "saldırgana denetimin YERİNİ gösterir — kötü", "kotu"),
        ("Sessiz/gecikmeli tepki", "sonraki işlemde sırrı sil, bağlantıyı kes", "iyi"),
        ("Decoy (sahte sonuç)", "saldırgan yanlış yolda zaman kaybeder", "iyi"),
        ("Sunucuya bildir", "telemetri + hesap/cihaz kısıtlama", "iyi"),
    ], alt_metin="tepki, algılamadan daha çok düşünülmesi gereken kısımdır",
       dip="Yanlış pozitifte meşru kullanıcıyı vurmayan, saldırganı yormayan tepki seçilir.", y=4.8)
    return kaydet(fig, k, "h06-11-tepki")

def h06_12(k):
    fig, ax = akis([
        ("Cihaz parmak izi", ["donanım/OS özellikleri"], "ana"),
        ("HKDF ile türet", ["cihaza özgü anahtar"], "koyu"),
        ("Sırrı bu anahtarla sar", ["AEAD"], "ana"),
        ("Başka cihazda", ["parmak izi farklı → AÇILMAZ"], "iyi"),
    ], "Cihaz bağlama: kopyalama işe yaramasın", "çalınan dosya başka cihazda anlamsızdır",
       dip="Code lifting ve kopyalama saldırılarının ölçeklenmesini bu engeller (11. hafta).")
    return kaydet(fig, k, "h06-12-cihaz-baglama")

# ============================================================ HAFTA 10
def h10_05(k):
    fig, ax = iki_yol("Simetrik ve asimetrik: hangisi ne için?",
        ("SİMETRİK (AES)", ["tek anahtar", "ÇOK HIZLI", "",
                            "sorun: anahtarı nasıl paylaşırsın?"], "ana"),
        ("ASİMETRİK (RSA/EC)", ["açık + gizli anahtar çifti", "YAVAŞ", "",
                                "anahtar dağıtımı ve İMZA çözülür"], "iyi"),
        alt_metin="pratikte HİBRİT: asimetrikle anahtar kur, simetrikle veri şifrele",
        dip="TLS tam olarak bunu yapar: ECDHE ile anahtar, AES-GCM ile veri.")
    return kaydet(fig, k, "h10-05-simetrik-asimetrik")

def h10_06(k):
    fig, ax = iki_yol("ECB neden asla kullanılmaz?",
        ("ECB", ["her blok BAĞIMSIZ şifrelenir", "",
                 "aynı düz metin bloğu →", "aynı şifreli blok", "→ DESENLER görünür"], "kotu"),
        ("CBC / CTR / GCM", ["her blok öncekine ya da", "nonce'a bağlı", "",
                             "aynı metin → farklı şifreli", "→ desen sızmaz"], "iyi"),
        alt_metin="ünlü 'ECB pengueni' bu yüzden görünür kalır",
        dip="Kip seçimi şifrelemenin kendisi kadar önemlidir; varsayılan tercih AEAD (GCM).")
    return kaydet(fig, k, "h10-06-ecb")

def h10_07(k):
    fig, ax = akis([
        ("Aynı anahtar + aynı nonce", ["iki farklı mesajda"], "kotu"),
        ("Anahtar akışı TEKRAR eder", ["K aynı"], "kotu"),
        ("C1 ⊕ C2 = P1 ⊕ P2", ["şifre düşer"], "kotu"),
        ("GCM'de kimlik anahtarı", ["sahtecilik mümkün"], "kotu"),
    ], "Nonce tekrarı neden felaket?", "gizlilik VE bütünlük birlikte çöker",
       dip="Nonce gizli olmak zorunda değil ama anahtar başına BENZERSİZ olmak zorundadır.", dip_renk=KOTU)
    return kaydet(fig, k, "h10-07-nonce-tekrari")

def h10_08(k):
    fig, ax = iki_yol("Neden HMAC, neden H(K‖m) değil?",
        ("H(K ‖ m)", ["Merkle–Damgård özetlerde", "UZUNLUK UZATMA saldırısı", "",
                      "saldırgan K'yı bilmeden", "H(K ‖ m ‖ ek) üretebilir"], "kotu"),
        ("HMAC", ["iç içe iki özetleme", "ipad / opad ile", "",
                  "uzunluk uzatma KAPALI", "standart ve kanıtlı"], "iyi"),
        alt_metin="kendi MAC'inizi kurmayın",
        dip="Doğrulamayı sabit zamanlı karşılaştırmayla yapın (CRYPTO_memcmp).")
    return kaydet(fig, k, "h10-08-hmac")

def h10_09(k):
    fig, ax = iki_yol("RSA dolgusu: hangisi nerede?",
        ("OAEP", ["RSA ile ŞİFRELEME", "rastgeleleştirilmiş dolgu", "",
                  "ham RSA asla kullanılmaz"], "ana"),
        ("PSS", ["RSA ile İMZA", "rastgeleleştirilmiş dolgu", "",
                 "PKCS#1 v1.5 yerine tercih"], "iyi"),
        alt_metin="dolgu, algoritmanın güvenliğinin ayrılmaz parçasıdır",
        dip="Eliptik eğride karşılıkları: X25519 (anahtar değişimi), Ed25519 (imza).")
    return kaydet(fig, k, "h10-09-oaep-pss")

def h10_10(k):
    fig, ax = akis([
        ("Veri + özel anahtar", ["imzala"], "ana"),
        ("İmza", ["veriyle birlikte gider"], "koyu"),
        ("Açık anahtarla doğrula", ["sonuç == 1 mi?"], "uyari"),
        ("KABUL / RED", ["r != 1 ise reddet"], "iyi"),
    ], "Dijital imza: oluşturma ve doğrulama", "en sık hata: if(r) ile denetlemek",
       dip="API 1=başarı, 0=başarısız, <0=hata döner; if(r) hatayı da 'doğru' sayar.", dip_renk=KOTU)
    return kaydet(fig, k, "h10-10-imza")

def h10_11(k):
    fig, ax = katman("X.509 sertifikasında ne var?", [
        ("Konu (Subject) + SAN", "kime ait — ad denetimi SAN'a bakar, CN'e değil", "ana"),
        ("Açık anahtar (SPKI)", "pinning bunu sabitler", "ana"),
        ("Geçerlilik aralığı", "notBefore / notAfter", "ana"),
        ("Uzantılar", "basicConstraints (CA:TRUE), KeyUsage, EKU", "uyari"),
        ("CA imzası", "zincirin bir üst halkası tarafından", "koyu"),
    ], alt_metin="doğrulama bu alanların HEPSİNİ denetler",
       dip="Yalnız 'imza geçerli' demek yetmez: ad, süre, amaç ve iptal de denetlenir.", y=5.0)
    return kaydet(fig, k, "h10-11-x509")

def h10_12(k):
    fig, ax = adimlar("Zincir doğrulamanın dört sorusu", [
        ("1 · İmza zinciri", ["köke kadar geçerli mi?"], "ana"),
        ("2 · Süre", ["her sertifika geçerli mi?"], "ana"),
        ("3 · Amaç / kısıt", ["CA:TRUE, KeyUsage, EKU"], "uyari"),
        ("4 · İptal", ["CRL / OCSP"], "kotu"),
    ], alt_metin="+ ad denetimi (SAN) — beşi birden geçmeden kabul edilmez", satir_basina=4,
       dip="Eksik ara sertifika zinciri kurdurmaz; fail-open ile 'geçti' saymak en sık hatadır.")
    return kaydet(fig, k, "h10-12-zincir-dogrulama")

# ============================================================ HAFTA 12
def h12_04(k):
    fig, ax = iki_yol("Neden bağımsız değerlendirme?",
        ("Geliştiricinin sözü", ["taraftır (çıkar çatışması)", "kendi hatasına kördür",
                                 "elinde kanıt yoktur", "", "'bence güvenli'"], "kotu"),
        ("Bağımsız değerlendirme", ["tarafsız laboratuvar", "tanımlı yöntem",
                                    "KANIT üretir", "", "'şu testte şu sonuç'"], "iyi"),
        alt_metin="üretici kendi ürününü onaylayamaz",
        dip="Değerlendirici iki şey varsayar: saldırgan sistemi tam bilir ve yetenekli/kaynaklıdır.")
    return kaydet(fig, k, "h12-04-bagimsiz-degerlendirme")

def h12_05(k):
    fig, ax = katman("Standartlar manzarası: hangisi neyi sertifikalar?", [
        ("ISO/IEC 27001", "KURUMU — bilgi güvenliği yönetim sistemi", "mor"),
        ("Ortak Kriterler (15408)", "ÜRÜNÜ — TOE, belirli güvence düzeyinde", "koyu"),
        ("FIPS 140-3", "KRİPTOGRAFİK MODÜLÜ", "ana"),
        ("ETSI EN 303 645", "tüketici IoT cihazı", "ana"),
        ("OWASP MASVS / ASVS", "uygulama — geliştirici dostu öz-değerlendirme", "iyi"),
    ], alt_metin="'sertifikalı' demek, NEYİN sertifikalandığını bilmeden anlamsızdır",
       dip="Kurum sertifikası ürün güvenliğini, ürün sertifikası kurum olgunluğunu göstermez.", y=5.2)
    return kaydet(fig, k, "h12-05-standartlar")

def h12_06(k):
    fig, ax = akis([
        ("Ürün adı + SÜRÜM", [], "ana"),
        ("Yapı (build) kimliği", ["git commit"], "ana"),
        ("İkili ÖZETİ", ["SHA-256"], "koyu"),
        ("TOE kimliği", ["sertifikanın kapsamı"], "iyi"),
    ], "TOE neden benzersiz tanımlanır?", "sertifika bir ANLIK FOTOĞRAFTIR",
       dip="Tanım belirsizse başka bir sürüm 'sertifikalı' görünür — sertifika geçersizleşir.", dip_renk=KOTU)
    return kaydet(fig, k, "h12-06-toe")

def h12_07(k):
    fig, ax = adimlar("Zafiyet değerlendirme yöntemleri: ucuzdan pahalıya", [
        ("1 · Kod incelemesi", ["insan gözü"], "ana"),
        ("2 · SAST", ["çalıştırmadan"], "ana"),
        ("3 · DAST", ["çalışırken"], "ana"),
        ("4 · Fuzzing", ["rastgele girdi"], "uyari"),
        ("5 · Sızma testi", ["el emeği, pahalı"], "kotu"),
    ], alt_metin="erken adımlar kolay bulguları eler; pahalı adım yalnız kalanlara harcanır",
       satir_basina=5, dip="Geliştirici önce kendi test ederse değerlendirmeye 'temiz' gider — maliyet düşer.")
    return kaydet(fig, k, "h12-07-yontemler")

def h12_08(k):
    fig, ax = iki_yol("Saldırı potansiyeli ↔ CVSS",
        ("SALDIRI POTANSİYELİ", ["saldırı ne kadar ZOR?", "",
                                 "zaman · uzmanlık · bilgi", "fırsat · ekipman", "→ olabilirlik"], "ana"),
        ("CVSS", ["açık ne kadar KÖTÜ?", "",
                  "gizlilik/bütünlük/erişilebilirlik", "etkisi", "→ ciddiyet"], "uyari"),
        alt_metin="farklı eksenler — biri diğerinin yerine geçmez",
        dip="Bulgu raporunda ikisi birlikte verilir; önceliklendirme ikisine göre yapılır.")
    return kaydet(fig, k, "h12-08-potansiyel-cvss")

def h12_09(k):
    fig, ax = akis([
        ("BULGU", ["ne bulundu, kanıtı ne"], "kotu"),
        ("ÖNERİ", ["nasıl düzeltilir"], "uyari"),
        ("AKSİYON", ["kim, ne zaman"], "ana"),
        ("DOĞRULAMA", ["düzeldi mi?"], "iyi"),
    ], "Bulgu → öneri → aksiyon döngüsü", "her bulgu bir sahip ve bir tarih alır",
       dip="Bir bulgu, gerçekten sömürülemez olduğu KANITLANIRSA 'etkilenmez' diye kapanır (VEX).")
    return kaydet(fig, k, "h12-09-bulgu-dongusu")

def h12_10(k):
    fig, ax = iki_yol("Etki analizi ↔ delta değerlendirme",
        ("ETKİ ANALİZİ", ["GELİŞTİRİCİNİN çıktısı", "",
                          "bu değişiklik güvenliği", "ya da TOE'yi etkiler mi?"], "ana"),
        ("DELTA DEĞERLENDİRME", ["LABORATUVARIN işi", "",
                                 "etkilenen kısmı bağımsız", "yeniden değerlendirir"], "iyi"),
        alt_metin="her değişiklikte tüm ürün baştan değerlendirilmez",
        dip="Sertifikanın sürdürülmesi bu iki adıma bağlıdır.")
    return kaydet(fig, k, "h12-10-etki-delta")

def h12_11(k):
    fig, ax = adimlar("Sızma testi planının dört başlığı", [
        ("1 · KAPSAM", ["ne test edilir", "ne edilmez"], "ana"),
        ("2 · ANGAJMAN KURALLARI", ["izin, sınır, zaman", "DURDURMA KOŞULU"], "kotu"),
        ("3 · YÖNTEM", ["WSTG / PTES / MASTG"], "ana"),
        ("4 · TEST KARTLARI", ["tekrarlanabilir", "adım + beklenen + gözlenen"], "iyi"),
    ], alt_metin="plan olmadan yapılan test ne tekrarlanabilir ne de savunulabilir",
       satir_basina=4, dip="Durdurma koşulu, gerçek zarar/veri kaybı riskini sınırlar — etik ve güvenli yürütme.")
    return kaydet(fig, k, "h12-11-pentest-plani")

# ============================================================ HAFTA 13
def h13_03(k):
    fig, ax = katman("İyi gereksinimin ölçütleri", [
        ("TEKİL", "bir cümle, bir gereksinim", "ana"),
        ("DOĞRULANABİLİR", "nasıl test edileceği bellidir", "iyi"),
        ("İZLENEBİLİR", "kaynağı ve kanıtı vardır", "iyi"),
        ("ÖLÇÜLEBİLİR", "sayı ya da somut teknik terim içerir", "ana"),
        ("'NE' odaklı", "'nasıl' yapılacağını dayatmaz", "mor"),
    ], alt_metin="bu ölçütleri karşılamayan gereksinim test edilemez",
       dip="'Uygulama güvenli olmalı' bunların HİÇBİRİNİ karşılamaz.", dip_renk=KOTU, y=5.0)
    return kaydet(fig, k, "h13-03-iyi-gereksinim")

def h13_04(k):
    fig, ax = iki_yol("Kötü gereksinim → iyi gereksinim",
        ("KÖTÜ", ["'Uygulama güvenli olmalı'", "'Anahtarlar iyi yönetilmeli'",
                  "'Veriler uygun saklanmalı'", "", "→ doğrulanamaz"], "kotu"),
        ("İYİ", ["'C sınıfı her varlık beklemede", " en az 128 bit AES-GCM ile", " şifrelenmelidir'", "",
                 "→ test edilebilir"], "iyi"),
        alt_metin="fark: ölçülebilir dayanak ve tekil ifade",
        dip="Zayıf gereksinim test edilemez; test edilemeyen gereksinim karşılandığı kanıtlanamaz.")
    return kaydet(fig, k, "h13-04-kotu-iyi")

def h13_05(k):
    fig, ax = katman("Gereksinim bloğunun alanları", [
        ("Kimlik (ID)", "CEN429-DR-01 gibi benzersiz", "ana"),
        ("Ölçülebilir ifade", "ne yapılacak", "ana"),
        ("Kaynak / gerekçe", "hangi tehdit ya da standart", "mor"),
        ("İlgili varlık", "neyi koruyor (S5)", "ana"),
        ("Doğrulama yöntemi", "hangi test kanıtlayacak (S16)", "iyi"),
        ("Durum", "karşılandı / devredildi / karşılanmadı", "uyari"),
    ], alt_metin="her gereksinim bu altı alanla yazılır", y=5.4,
       dip="Alanlardan biri boşsa gereksinim izlenebilir değildir.")
    return kaydet(fig, k, "h13-05-gereksinim-blogu")

def h13_06(k):
    fig, ax = adimlar("Devrederken yanıtlanacak üç soru", [
        ("1 · NEDEN", ["şimdi karşılanmıyor?"], "uyari"),
        ("2 · RİSKİ NE", ["kim kabul ediyor?"], "kotu"),
        ("3 · NASIL", ["ne zaman karşılanacak?", "telafi kontrolü var mı?"], "iyi"),
    ], alt_metin="devretmek serbest, SESSİZ devretmek değil", satir_basina=3,
       dip="Kayıt ve onay olmadan atlanan gereksinim = gizli açık, sahipsiz risk.")
    return kaydet(fig, k, "h13-06-devretme")

def h13_07(k):
    fig, ax = katman("Ortak Kriterler kavramları", [
        ("PP (Protection Profile)", "ürün SINIFI için standart gereksinim kümesi", "mor"),
        ("ST (Security Target)", "BELİRLİ ürünün güvenlik hedefi", "koyu"),
        ("SFR", "ürün NE yapacak (fonksiyonel)", "ana"),
        ("SAR", "buna NE KADAR güvenilecek (güvence)", "ana"),
        ("EAL", "güvence DERİNLİĞİ — güvenlik miktarı değil", "uyari"),
    ], alt_metin="EAL4+ her zaman 'daha güvenli' demek DEĞİLDİR",
       dip="Kapsam (ST/TOE) darsa yüksek EAL az şey kapsar. Kapsamı bilmeden EAL karşılaştırılmaz.",
       dip_renk=KOTU, y=5.2)
    return kaydet(fig, k, "h13-07-ortak-kriterler")

def h13_08(k):
    fig, ax = katman("FIPS 140-3 güvence düzeyleri", [
        ("Düzey 4", "aktif savunma; çevresel saldırılara direnç", "koyu"),
        ("Düzey 3", "kurcalamaya direnç + yanıt; kimlik tabanlı doğrulama", "ana"),
        ("Düzey 2", "kurcalama İZİ + rol tabanlı kimlik doğrulama", "ana"),
        ("Düzey 1", "temel: onaylı algoritmalar", "uyari"),
    ], alt_metin="yukarı çıktıkça fiziksel koruma beklentisi artar",
       dip="'FIPS doğrulanmış kütüphane kullanıyoruz' demek yetmez: doğru kip ve yapılandırma şart.",
       dip_renk=KOTU, y=4.8)
    return kaydet(fig, k, "h13-08-fips")

def h13_09(k):
    fig, ax = katman("Sektöre özgü gereksinim setleri", [
        ("OWASP MASVS / MASTG", "mobil uygulama — bu dersin projesine en yakın", "iyi"),
        ("ETSI EN 303 645", "tüketici IoT", "ana"),
        ("EMVCo / PCI", "ödeme kartı ekosistemi", "ana"),
        ("GSMA", "mobil operatör / SIM", "ana"),
    ], alt_metin="hepsi aynı soruyu sorar: hangi gereksinim, hangi kanıtla karşılandı?",
       dip="Projenizde MASVS seçin: somut, kontrol edilebilir maddeler + MASTG test rehberi.", y=4.6)
    return kaydet(fig, k, "h13-09-sektor")

def h13_10(k):
    fig, ax = tuval(11.5, 4.4)
    baslik(ax, "Uyum matrisi: her satır bir kanıt ister", "S17'nin iskeleti")
    basliklar_ = ["Kimlik", "Gereksinim", "Durum", "Önlem", "Kanıt"]
    genisler = [14, 30, 16, 18, 18]
    x = 3
    for b, g in zip(basliklar_, genisler):
        kutu(ax, x + g/2, 66, g - 1.5, 10, b, dolgu=KOYU, kenar=KOYU, bas_renk="white", bas_boyut=10.5)
        x += g
    satirlar = [("DR-01", "Beklemede AEAD", "Karşılandı", "S7.2", "test çıktısı", IYIBG, IYI),
                ("AP-07", "Güvenli güncelleme", "Devredildi", "S14.2", "gerekçe", MORBG, MOR),
                ("DT-04", "Sertifika sabitleme", "Karşılanmadı", "—", "kalan risk", KOTUBG, KOTU)]
    y = 52
    for s in satirlar:
        x = 3
        for i, g in enumerate(genisler):
            kutu(ax, x + g/2, y, g - 1.5, 9, s[i], dolgu=s[5], kenar=s[6], bas_boyut=9.2, kalin=False)
            x += g
        y -= 11
    serit(ax, 14, "Kanıt sütunu boş olan 'Karşılandı' satırı, KARŞILANMAMIŞ sayılır.")
    return kaydet(fig, k, "h13-10-uyum-matrisi")


ISLER = {4: [h04_05, h04_06, h04_07, h04_08, h04_09, h04_10, h04_11, h04_12, h04_13],
         6: [h06_06, h06_07, h06_08, h06_09, h06_10, h06_11, h06_12],
         10:[h10_05, h10_06, h10_07, h10_08, h10_09, h10_10, h10_11, h10_12],
         12:[h12_04, h12_05, h12_06, h12_07, h12_08, h12_09, h12_10, h12_11],
         13:[h13_03, h13_04, h13_05, h13_06, h13_07, h13_08, h13_09, h13_10]}

if __name__ == "__main__":
    KOK = sys.argv[1]
    n = 0
    for h, fnlar in ISLER.items():
        for fn in fnlar:
            fn(yol(h)); n += 1
    print("üretilen:", n)
    rapor()
