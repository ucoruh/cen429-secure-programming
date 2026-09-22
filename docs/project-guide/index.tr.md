---
template: main.html
---

# CEN429 Dönem Projesi — Proje Rehberi

Bu projede, seçtiğiniz bir uygulamayı **sertifikasyon sürecinden geçiyormuş gibi** tasarlayıp geliştireceksiniz:
bir **C++ konsol uygulaması** ve onun güvenliğini sağlayan bir **dinamik kütüphane (DLL/.so)**. Amaç, dönem boyunca
öğrendiğiniz güvenlik yöntemlerini **tek bir üründe** birleştirmek ve hepsini bir **güvenlik kılavuzuyla** (S0–S17)
belgelemektir.

!!! abstract "Kısaca"
    - **Takım:** 2 kişi (tek başınıza da yapabilirsiniz).
    - **Dil/araçlar:** C++ (DLL/.so), CMake/CTest, SQLite, SoftHSM/PKCS#11, OpenSSL.
    - **İki teslim:** **Vize (RAP1)** — ürünün ilk yarısı; **Final (RAP2)** — tam ürün + test **sonuçları**.
    - **Teslimin kalbi:** kodun yanında, sertifikasyon belgesi gibi yazılmış **güvenlik kılavuzu** (S0–S17).
    - Rubrik ayrıntısı Microsoft Teams'te; bu sayfa gereksinimleri ve haftalarla bağını verir.

## 1. Proje planı (başlamadan önce)

- Başlamadan önce **GitHub**'da bir **proje planı** (Projects/README) oluşturun: iş paketleri, çıktılar, takvim ve
  takım üyelerinin sorumlulukları.
- Planı **ders sorumlusuna onaylatın**. Onaysız başlanan proje kabul edilmez.
- İlerlemeyi bu plandan izleyin; her hafta küçük ve **incelenebilir** commit'ler yapın (1. hafta değişiklik yönetimi).

## 2. Proje kurulumu

C++ şablonunu **fork** edin ve ders koduyla adlandırın:

- `https://github.com/ucoruh/cpp-cmake-ctest-template` → `cen429-proje-ad-soyad-cpp`

!!! tip "Şablonu tam kullanın"
    Şablon; derleme, **CTest ile birim testi**, dokümantasyon üretimi, test/dokümantasyon kapsamı ölçümü ve paketlemeyi
    sağlar. Şablon standartlarına uymayan teslimler kabul edilmez. Sürüm (release) üretin; sürüm kimliği ve özet
    değerlerini kaydedin (12. hafta TOE kimliği).

## 3. Konu seçimi

- Uygulama fikrinizi kendiniz seçin (ör. parola kasası, lisanslı içerik oynatıcı, çevrimdışı ödeme cüzdanı benzeri,
  güvenli not defteri). **İki takım aynı konuyu seçmesin** (intihali önlemek için).
- Bu dersi tekrar alıyorsanız **önceki projeden farklı** bir konu seçin.
- Konunuz, aşağıdaki güvenlik gereksinimlerini **anlamlı biçimde** uygulayabileceğiniz kadar zengin olmalı.

## 4. Gereksinimler (checklist)

Her gereksinimin yanında **hangi haftada işlendiği** ve **kılavuzda hangi bölüme (S)** yazılacağı verilmiştir.
Her maddeyi ya **karşılayın** ya da **gerekçeli olarak devredin/kapsam dışı bırakın** (13. hafta).

### 4.1 Geliştirme ortamı güvenliği · (Hafta 1, 12 · S13)
- Yazılım geliştirme akışı ve **değişiklik yönetimi** (temel çizgi → talep → sınıflandırma → onay → yayın → doğrulama).
- **Git** ile sürüm kontrolü; erişim kaydı; imzalı sürüm.
- Geliştirme bilgisayarı/sunucu güvenliği (kısa politika).

### 4.2 Kullanımdaki veri güvenliği · (Hafta 3, 6 · S7)
- Bellekteki hassas veri kullanımdan sonra **güvenli silinir** (`memset_s` benzeri).
- Çalışma zamanı veri koruması (gölge kopya/bütünlük — 6. hafta).

### 4.3 Aktarımdaki veri güvenliği · (Hafta 3, 10 · S6, S11)
- **TLS 1.3**; sertifika zinciri + **SAN** doğrulaması; **sabitleme (pinning)** + yedek pin.
- Şifrelenmiş **oturum anahtarı**; **cihaz/sürüm bağlama**; bütünlük + kimlik doğrulama; sunucu doğrulama kodu.

### 4.4 Beklemedeki veri güvenliği · (Hafta 3, 10, 11 · S8)
- Dosya/DB şifreleme **AEAD** (AES-GCM); nonce tekrarsız.
- Hassas anahtarlar için **whitebox** ya da **SoftHSM/PKCS#11**; kararın **gerekçesi** (11. hafta).

### 4.5 Statik varlıkların korunması · (Hafta 1, 4, 9 · S5, S9)
- Gizli anahtarlar, özet değerleri, kaynak kodu, kaynaklar: şifreleme + erişim kontrolü + gizleme.

### 4.6 Dinamik varlıkların korunması · (Hafta 3, 6 · S5, S8)
- Cihaz/uygulama parmak izleri, oturum verileri, dinamik anahtarlar şifrelenir.

### 4.7 Varlık yönetimi · (Hafta 1, 3, 13 · S5)
Her varlık için: **ad, açıklama, konum (tablo/sütun), kaynak, boyut, oluşturma/silme zamanı, varsayılan,
koruma şeması (C/I/I+)**.

### 4.8 Arayüz tanımları ve korunması · (Hafta 1, 4 · S3, S6)
- Tüm arayüzler erişim kontrolü + kimlik doğrulama ile korunur; girdi **güven sınırında** doğrulanır.

### 4.9 Kod sağlamlaştırma · (Hafta 4, 9, 14 · S9)
- Opak döngü/yüklem, ad/dosya/dize/aritmetik gizleme, opak boolean, sahte işlem/ölü dal, **kontrol akışı düzleştirme**
  + rastgele çıkış, sürümde **log kapalı**. Maliyeti **ölçün** (9/14. hafta demoları).

### 4.10 RASP · (Hafta 6 · S10)
- Checksum bütünlük denetimi, çağıran uygulama hash/imza doğrulaması, kök/emülatör tespiti, **hook/anti-debug**,
  tamper tespiti + yanıt, kontrol akışı sayacı.

### 4.11 Bellek koruması · (Hafta 4 · S9)
- Derleyici/OS korumaları (yığın koruyucu, PIE, RELRO, NX, CFI); hassas veri kullanım sonrası temizlenir.

### 4.12 Kriptografi ve sertifikalar · (Hafta 3, 10 · S8, S11)
- Doğru algoritma/kip/dolgu; imza doğrulaması (`==1`, sürüm kapsamı); SSL/TLS + pinning + karşılıklı kimlik doğrulama.

### 4.13 Sertifikasyon ve sızma testi planı · (Hafta 12, 13 · S16, S14, S17)
- Standart eşlemesi (ETSI/EMVCo/GSMA/PCI/MASVS); **sızma testi planı** (kapsam, kurallar, yöntem, test kartı) ve
  **sonuçları**; saldırı potansiyeli + CVSS.

### 4.14 İkili uygulama koruması · (Hafta 6, 9, 11, 14 · S9, S10, S15)
- **Tespit** (checksum, anti-debug, emülatör), **savunma** (gizleme, dize/kaynak şifreleme, çağrı gizleme),
  **caydırma** (yanıt/kapanma politikası).

### 4.15 OWASP ve derleme/dağıtım hattı · (Hafta 5, 14 · S13, S15)
- OWASP MASVS/ASVS ilkeleri; **SBOM** (CycloneDX) + bağımlılık taraması; gizleme+imzalama içeren derleme hattı.

## 5. Teslim edilecekler

- [ ] **Kaynak kod** (fork edilen şablon, CMake/CTest, C++ DLL/.so + SQLite + SoftHSM entegrasyonu).
- [ ] **Birim testleri** (kripto ve koruma fonksiyonları) ve **CI** kaydı.
- [ ] **Güvenlik kılavuzu (S0–S17)** — sertifikasyon belgesinin küçültülmüş modeli (aşağıda).
- [ ] **Test sonuçları (S16)** — plan değil, **gözlenen** sonuçlar.
- [ ] **Uyum matrisi (S17)** ve **devredilen gereksinimler (S14)**.
- [ ] **SBOM** + bağımlılık taraması. Değerler **sentetik**; depoda gerçek sır/kişisel veri **olmayacak**.

## 6. Güvenlik kılavuzu bölümleri (S0–S17)

| No | Bölüm | No | Bölüm |
| --- | --- | --- | --- |
| S0 | Kapak, sürüm geçmişi | S9 | Kod sağlamlaştırma (ileri) |
| S1 | Kapsam, kısaltmalar, kaynaklar | S10 | RASP + tepki politikası |
| S2 | Ürün ve mimari | S11 | Güvenli iletişim (TLS) |
| S3 | Arayüzler | S12 | Raporlama/günlükleme |
| S4 | Tehdit modeli (STRIDE, ağaç) | S13 | Geliştirme süreci, SBOM, değişiklik |
| S5 | Varlık listesi + koruma | S14 | Varsayımlar ve devredilenler |
| S6 | Kimlik/bağlama | S15 | Derleme, imzalama, dağıtım hattı |
| S7 | Veri güvenliği + kabuk matrisi | S16 | Güvenlik testi ve **sonuçları** |
| S8 | Kripto, anahtar yaşam döngüsü | S17 | Gereksinim uyum matrisi |

## 7. Değerlendirme

!!! info "Ağırlıklar (izlence)"
    - **Vize = 0,7·RAP1 + 0,3·Quiz-1** · **Final = 0,7·RAP2 + 0,3·Quiz-2**
    - **Başarı notu = 0,4·Vize + 0,6·Final**
    - **RAP1 (7. hafta):** ürünün ilk yarısı (S2–S5 + temel korumalar). **RAP2 (15. hafta):** tam ürün + S16 sonuçları.

| Kriter | ÖÇ | Kılavuzda |
| --- | --- | --- |
| Kriptografi uygulaması | ÖÇ.2 | S8 |
| Güvenli iletişim | ÖÇ.4 | S6, S11 |
| Varlık yönetimi | ÖÇ.5 | S5, S8 |
| İkili uygulama korumaları | ÖÇ.3 | S9, S10, S15 |
| Güvenlik testi ve birim testleri | ÖÇ.6 | S16 |
| Güvenlik standartları | ÖÇ.7 | S1, S14, S17 |
| Rapor ve sunum | ÖÇ.7 | Tümü |

Ayrıntılı **analitik rubrik** Microsoft Teams'tedir. Her satır bir **kanıt** ister: "karşılandı" diyen satırın
kanıtı yoksa karşılanmamış sayılır (13. hafta).

## 8. Akademik dürüstlük

Teslim ettiğiniz her satırı **açıklayabilmelisiniz**; gösterimde takımın her üyesine soru sorulabilir. Başkasının
kodunu/metnini kullandıysanız kaynağını belirtin. İntihal ve izinsiz kopyalama başarısızlık nedenidir.

!!! warning "Güvenli ve yasal çerçeve"
    Sızma testi yalnız **kendi** projeniz üzerinde yapılır. Örnekler ve değerler **sentetik** olmalı; hiçbir gerçek
    sır, anahtar ya da kişisel veri depoya girmemeli. Uygulamanız başkasının sistemine/verisine zarar vermemeli.
