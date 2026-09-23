---
marp: true
theme: cen429
paginate: true
lang: tr
title: "CEN429 Hafta 13 — Güvenlik Gereksinimleri"
author: "Dr. Öğr. Üyesi Uğur CORUH"
header: "CEN429 Güvenli Programlama · Hafta 13"
footer: "RTEÜ Bilgisayar Mühendisliği · 2026-2027 Güz"
---



<!-- _class: baslik -->
<!-- _paginate: false -->

# Güvenlik Gereksinimleri

**CEN429 Güvenli Programlama — Hafta 13**

Dr. Öğr. Üyesi Uğur CORUH · 11.12.2026

<!--
Konuşma notu: Bu hafta güvenlik gereksinimlerini okuyup kendi projemize eşlemeyi öğreniyoruz: gereksinim, durum, kanıt.
-->

---

# Bugünün planı (3 saat)

| Saat | Bölüm | Konu |
| --- | --- | --- |
| 1 | 0–3 | Temel kavramlar · iyi gereksinim · izlenebilirlik · gereksinim bloğu · devredilenler |
| 2 | 4–5 | Ortak Kriterler (TOE, ST, PP, SFR/SAR, EAL) · FIPS 140-3 |
| 3 | 6–9 | ETSI, GSMA, EMVCo, PCI, MASVS · dersin gereksinim aileleri · uyum matrisi · proje |

<!-- Konuşma notu: Bu hafta güvenlik gereksinimlerini okuyup kendi projemize eşlemeyi öğreniyoruz: gereksinim → önlem → doğrulama → kanıt. Sıfır ön bilgi; her terimi tanımlayacağız. -->

---

<!-- _class: yogun -->

# Kısa tarihçe — güvenlik gereksinimleri nasıl standartlaştı?

- **1985** — **TCSEC** gereksinim düzeylerini resmîleştirir
- **1994** — **FIPS 140** kriptografik modül gereksinimleri (bugün **140-3**)
- **1999** — **Ortak Kriterler**: **PP/ST**, **SFR/SAR**, **EAL**
- **2010'lar** — **OWASP MASVS** (mobil), **ETSI EN 303 645** (IoT), **EMVCo/PCI** (ödeme)

> Değişmeyen ilke: gereksinim **ölçülebilir** ve **izlenebilir** olmalı; kanıtsız "karşılandı" geçersizdir.

---


# Bu hafta nereye oturuyor?

- **12. hafta:** bir ürün nasıl **değerlendirilir/test edilir**.
- **Bu hafta (13):** değerlendirmenin ölçtüğü **gereksinimler** nereden gelir, nasıl yazılır, nasıl izlenir.
- Çıktı: projenizin **uyum matrisi** (S17) ve **devredilenler** (S14).

---

# Öğrenme çıktısı

Bu hafta **ÖÇ.7** üstünedir.

Sonunda yapabileceğiniz:

- İyi bir güvenlik gereksinimini kötüsünden ayırmak
- Bir **izlenebilirlik/uyum matrisi** kurmak
- CC, FIPS, ETSI, EMVCo, PCI, MASVS'in ne istediğini karşılaştırmak

---

# Ana fikir

> Güvenlik bir "his" değil, **yazılı, ölçülebilir, izlenebilir** gereksinimlerle yönetilir:
> gereksinim → önlem → doğrulama → kanıt.

Bugün bu zinciri kurmayı öğreneceğiz.

---

<!-- _class: bolum -->

# 0. Temel kavramlar (sıfırdan)

<!-- Konuşma notu: Gereksinim/standart terimlerini sıfırdan tanımlıyoruz. -->

---

# Gereksinim (requirement) nedir?

- **Gereksinim:** sistemin **karşılaması gereken** bir koşul.
- Güvenlik gereksinimi: bir güvenlik koşulu.
- İyi gereksinim **doğrulanabilir** (test edilebilir).

---

# Üç tür gereksinim

- **İşlevsel:** hangi güvenlik işlevi olacak? (ör. veri AEAD ile korunur)
- **Güvence:** doğru yapıldığına nasıl güveneceğiz? (ör. test raporu)
- **Süreç:** kurum nasıl çalışmalı? (ör. her değişiklik incelenir)

---

# İyi vs kötü gereksinim

- **Kötü:** "Uygulama güvenli olmalıdır." (doğrulanamaz)
- **İyi:** "Sürüm derlemesi yığın koruyucu, PIE ve tam RELRO ile üretilmelidir." (ölçülebilir)

---

# İzlenebilirlik (traceability)

- **İzlenebilirlik:** her gereksinimi bir **önleme**, **teste** ve **kanıta** bağlamak.
- "Bu gereksinim nerede karşılandı, nasıl doğrulandı?"

---

# Uyum matrisi

- **Uyum matrisi:** gereksinim → durum → bölüm → doğrulama → kanıt tablosu.
- Projenin **S17** bölümü.
- Değerlendiricinin ilk baktığı yer.

---

# Gereksinim durumları

- **Karşılandı:** ürün bu gereksinimi sağlar (kanıtla).
- **Devredildi:** başka bir taraf sağlar (kime, neden, nasıl).
- **Karşılanmadı:** henüz sağlanmıyor.

---

# Devredilen gereksinim

- Bir bileşen bir gereksinimi **karşılayamıyorsa**, üst uygulamaya/OS'a **devreder**.
- Kılavuza: **kime**, **neden**, **nasıl** karşılanacağı yazılır.
- Projenin **S14** bölümü.

---

# Ortak Kriterler (CC)

- **Ortak Kriterler (ISO/IEC 15408):** ürün güvenliği değerlendirme standardı.
- Kavramlar: TOE, ST, PP, SFR, SAR, EAL (birazdan).

---

# CC · temel terimler

- **TOE:** değerlendirilen ürün.
- **ST (Security Target):** bu ürünün güvenlik hedefi belgesi.
- **PP (Protection Profile):** bir ürün **sınıfı** için ortak gereksinim seti.

---

# CC · SFR, SAR, EAL

- **SFR:** güvenlik **işlevsel** gereksinimleri.
- **SAR:** güvenlik **güvence** gereksinimleri.
- **EAL:** değerlendirmenin **derinlik** düzeyi (EAL1–EAL7).

---

# FIPS 140-3

- **FIPS 140-3:** kriptografik **modüllerin** doğrulanması standardı.
- Güvenlik düzeyleri (1–4).
- Yalnız modülü kapsar, uygulamanın tamamını değil.

---

# Sektör standartları

- **ETSI EN 303 645:** IoT temel güvenlik.
- **GSMA, EMVCo, PCI:** mobil/ödeme.
- **OWASP MASVS:** mobil uygulama gereksinimleri.

---

<!-- _class: yogun -->

# Gereksinim vs önlem · "karşılanmadı" vs "uygulanmaz"

- **Sık hata:** "Gereksinim: AES-256-GCM kullanılmalıdır." → bu bir **önlem**, gereksinim değil. Doğrusu: "...AEAD ile korunmalıdır" (gereksinim) + "AES-256-GCM, S7.2" (önlem).
- **Karşılanmadı:** gereksinim uygulanıyor ama henüz sağlanmıyor — bir **eksikliktir**, kalan riske yazılır.
- **Uygulanmaz:** gereksinim ürüne hiç uygulanmıyor (ör. ağ kullanmıyorsa "aktarımda veri" gereksinimleri) — her zaman **gerekçesiyle** yazılmalı.

---

<!-- _class: yogun -->

# Durum ve karar kelimeleri — özet

| Kelime | Ne zaman kullanılır | Yanında ne yazılmalı |
| --- | --- | --- |
| Karşılandı | Ürün gereksinimi kendisi sağlıyor | Önlem + doğrulama + kanıt |
| Devredildi | Başka bir taraf sağlıyor | Kime + neden + nasıl |
| Karşılanmadı | Uygulanır ama henüz sağlanmıyor | Kalan risk + planlanan düzeltme |
| Uygulanmaz | Ürüne hiç uygulanmıyor | Gerekçe |
| -malıdır (MUST) | Zorunlu | Karşılanmazsa doğrudan bulgu |
| -malı (SHOULD) | Güçlü öneri | Karşılanmazsa yazılı gerekçe |

---

# Şimdi hazırız

Terimler:

gereksinim (işlevsel/güvence/süreç) · izlenebilirlik · uyum matrisi · durum (karşılandı/devredildi/karşılanmadı) · devredilen · CC (TOE/ST/PP/SFR/SAR/EAL) · FIPS 140-3 · ETSI/GSMA/EMVCo/PCI/MASVS

Şimdi: iyi gereksinim nasıl yazılır?

---

<!-- _class: bolum -->

# 1. İyi gereksinim nasıl yazılır?

---

# İyi gereksinim ölçütleri — şema

![w:950](assets/h13-03-iyi-gereksinim.svg)

---

# Üç tür (hatırlatma)

| Tür | Soru | Örnek |
| --- | --- | --- |
| İşlevsel | Hangi güvenlik işlevi? | Hassas veri AEAD ile korunur |
| Güvence | Doğru mu yapıldı? | Statik analiz + test raporu |
| Süreç | Kurum nasıl çalışır? | Her değişiklik incelenir |

---

# İyi gereksinim ölçütleri

- **Doğrulanabilir:** test edilebilir mi?
- **Tekil:** tek bir şey mi söylüyor?
- **Ölçülebilir:** somut mu?
- **Gerçekçi:** uygulanabilir mi?

---

# Kötü → iyi (1)

- **Kötü:** "Uygulama güvenli olmalıdır."
- **İyi:** "Sürüm derlemesi yığın koruyucu, PIE ve tam RELRO ile üretilmelidir."

Neden iyi? **Test edilebilir** (checksec).

---

# Kötü → iyi gereksinim — şema

![w:950](assets/h13-04-kotu-iyi.svg)

---

# Kötü → iyi (2)

- **Kötü:** "Veriler şifrelenmelidir."
- **İyi:** "C sınıfı her varlık beklemede ≥128 bit düzeyinde AEAD ile şifrelenmelidir."

Neden iyi? Hangi veri, hangi düzey, hangi yöntem belli.

---

# Kötü → iyi (3)

- **Kötü:** "Anahtarlar iyi yönetilmelidir."
- **İyi:** "(1) Her anahtarın amacı, kripto-periyodu ve imhası belgelenir. (2) İş bitince bellekten silinir."

Tekil, doğrulanabilir maddeler.

---

# İşlenmiş örnek · kötü gereksinimi iyileştirmek

Başlangıç cümlesi (gerçek bir taslaktan):

> "Uygulama, kullanıcı verilerini korumalıdır."

Bu cümleyi altı adımda iyi bir gereksinime dönüştüreceğiz; her adımda **önce/sonra** ve **neden değişti**.

---

# Adım 1 — Belirsiz kelimeleri işaretleyin

- **Önce:** "Uygulama, kullanıcı verilerini korumalıdır."
- Belirsiz kelimeler: "kullanıcı verileri" (hangi veri?), "korumalıdır" (neye karşı, hangi düzeyde?).
- **Neden değişti:** değerlendirici bu cümleyi okuyunca test edecek hiçbir şey bulamaz.

---

# Adım 2 — Varlık tablosuna bağlayın

- **Sonra:** "Yerel veritabanındaki **C sınıfı** alanlar korunmalıdır."
- **Neden değişti:** "kullanıcı verileri" tek şey değil; varlık tablosunda (1. hafta) ayrı satırlardır — oturum belirteci, profil, ödeme jetonu... her biri farklı sınıfta.
- Hâlâ "korunmalı" ölçülemez → sıradaki adım.

---

# Adım 3 — Koruma hedefini netleştirin

- **Sonra:** "...C sınıfı alanların **gizliliği ve bütünlüğü** korunmalıdır."
- **Neden değişti:** tehdit modeli hem "dosyayı okuma" (gizlilik) hem "dosyayı değiştirme" (bütünlük) riskini gösteriyor; ikisi de aynı anda gerekli.

---

# Adım 4 — Ölçülebilir teknik kriter ekleyin

- **Sonra:** "...kimlik doğrulamalı şifrelemeyle (**AEAD**) korunmalıdır."
- **Neden değişti:** 9. hafta kuralı — gizlilik ve bütünlük **aynı anda** isteniyorsa doğru araç sınıfı AEAD'dir; hâlâ belirli bir kütüphane adı verilmiyor.

---

# Adım 5 — Durum ve zorunluluk sözcüğünü ekleyin

- **Sonra:** "**Beklemedeki** C sınıfı hassas veri, kimlik doğrulamalı şifrelemeyle (AEAD) korunmalıdır." (**MUST**)
- **Neden değişti:** veri burada beklemede (disk üzerinde); "-malıdır" seçildi çünkü tehdide karşı vazgeçilmez bir koşul — "-abilir" olsaydı isteğe bağlı sayılırdı.

---

# Adım 6 — Kimlik verin ve tehdide bağlayın

- **Sonra (son hâl):** `CEN429-DR-01` — "Beklemedeki C sınıfı hassas veri, kimlik doğrulamalı şifrelemeyle (AEAD) korunmalıdır." *(Tehdit: T-03, "cihazı ele geçiren saldırgan veritabanı dosyasını okur/değiştirir".)*
- **Neden değişti:** kimliksiz bir gereksinim izlenebilirlik zincirine hiç girmez.

---

<!-- _class: yogun -->

# Altı adım · hangi belirsizliği giderdi?

| Adım | Giderdiği belirsizlik |
| --- | --- |
| 1 | Belirsiz kelimeyi işaretlemek |
| 2 | Hangi veri (varlık tablosu) |
| 3 | Hangi hedef (gizlilik/bütünlük) |
| 4 | Hangi araç sınıfı (AEAD) |
| 5 | Hangi durum, hangi zorunluluk |
| 6 | Kimlik ve tehdit bağı |

Biri eksik kalırsa gereksinim yine tartışmaya açık kalır; değerlendirici geri gönderir.

---

<!-- _class: yogun -->

# İkinci ve üçüncü örnekler

- **İkinci örnek (hız testi):** "Hızlı ve güvenli olmalıdır" → iki ayrı gereksinim tek cümlede. Aynı altı adımdan geçirilince: `CEN429-ID-04` — "Her oturum açma denemesi sunucu tarafında doğrulanmalıdır; istemci tarafı kontrolü tek başına yeterli kabul edilmemelidir."
- **Üçüncü örnek (süreç):** "Kod incelemesi yapılmalıdır." → Hangi değişiklik? Kim inceleyecek? Ne zaman? İyi hâli: "Her değişiklik, ana dala birleştirilmeden önce, yazan geliştirici dışında en az bir kişi tarafından incelenmeli ve onay sürüm kontrol sisteminde kayıt altına alınmalıdır."

---

<!-- _class: yogun -->

# Bölüm 1'in kuralı ve zorunluluk sözcükleri

- Gereksinim sütununa **ne** istendiğini yazın; **nasıl** karşıladığınızı ayrı bir önlem cümlesine yazın.
- Gereksinim metninde **araç sınıfını** (AEAD, CSPRNG, TLS 1.2+) yazın; belirli kütüphane/sürüm adını önleme koyun.
- **-malıdır (MUST):** zorunlu, karşılanmazsa doğrudan bulgu. **-malı (SHOULD):** güçlü öneri, gerekçe gerekir. **-abilir (MAY):** isteğe bağlı, bulgu değil.

---

<!-- _class: bolum -->

# 2. Gereksinimden kanıta: izlenebilirlik

---

# Zincir

![w:900](assets/h13-01-izlenebilirlik.svg)

Her gereksinim bu zincirle bir **kanıta** bağlanmalı.

---

# İzlenebilirlik neden önemli?

- Değerlendirici "bu gereksinim nerede?" diye sorar.
- İzlenebilirlik yoksa: her şeyi baştan aramak.
- Varsa: matristen doğrudan bulunur.

---

# İzlenebilirlik örneği

| Gereksinim | Önlem | Doğrulama | Kanıt |
| --- | --- | --- | --- |
| Veri AEAD ile | AES-GCM | Birim testi | Test çıktısı |
| Sürüm korumaları | Bayraklar | checksec | Koruma tablosu |

---


# İki yön

- **İleri:** gereksinim → nerede karşılandı?
- **Geri:** bu kod/test → hangi gereksinimi karşılıyor?
- İyi matris **iki yönde** de izlenebilir.

---

# ⚠️ Kanıtsız "karşılandı"

- Matriste "karşılandı" ama kanıt yoksa...
- Değerlendirici gözünde **karşılanmamış** sayılır.
- İlk bulgulardan biri olur.

---

# İşlenmiş örnek · uçtan uca zincir

Zincirin nasıl kurulduğunu tek bir varlık üzerinden başından sonuna dolduralım: kullanıcının **oturum belirteci**.

Altı halka: varlık → tehdit → gereksinim → önlem → doğrulama → kanıt.

---

# 1. Varlık

| Alan | Değer |
| --- | --- |
| Varlık | Kullanıcının oturum belirteci (session token) |
| Konum | İstemci belleği; her istekte HTTP başlığında taşınır |
| Sınıf | **C** (gizlilik) |
| Yaşam döngüsü | Açılışta üretilir → her istekte kullanılır → çıkışta/zaman aşımında geçersiz kılınır |

---

# 2. Tehdit

- Ağ üzerinde konumlanan bir saldırgan (ör. aynı halka açık Wi-Fi), şifrelenmemiş bağlantıdan belirteci dinleyip yakalayabilir.
- Yakaladığı belirteçle kendi isteklerinde kullanarak kullanıcı **gibi davranabilir**.
- STRIDE: **Spoofing** + **Information Disclosure** (1. hafta terminolojisi).

---

# 3. Gereksinim

Varlık → tehdit → hedef (gizlilik+kimlik) → araç sınıfı → durum → zorunluluk zinciri kısaca tekrar uygulanır:

> `CEN429-DT-01` — "Oturum belirteci yalnız TLS 1.2 ve üzeri, sunucu sertifikası doğrulanmış bir kanaldan taşınmalıdır."

---

# 4. Önlem

Kılavuzun **S10.3 "Aktarım güvenliği"** bölümü:

> "İstemci, sunucuya her bağlantıda TLS 1.2+ el sıkışması yapar; sertifika zinciri ve ana bilgisayar adı doğrulanır (bkz. Hafta 10). Kanal kurulmadan hiçbir istek gönderilmez."

---

# 5. Doğrulama

Güvenlik testi ekibi bir MITM (ortadaki adam) aracıyla bağlantıya araya girmeye çalışır:

- Geçersiz/kendinden imzalı sertifika sunulunca bağlantının **reddedildiğini** doğrular.
- Düz metin (TLS'siz) bağlantı denemesinin **reddedildiğini** doğrular.

---

# 6. Kanıt

- Test aracının günlük çıktısı: `mitm_test_2026-11-03.log`
- CI çalıştırma kaydı: **#617**
- TLS handshake paket dökümü: `handshake.pcapng`
- `evidence/week13/` klasöründe saklanır, matriste bu dosya adlarıyla referans verilir.

---

<!-- _class: yogun -->

# Zincirin dolu satırı

| Kimlik | Gereksinim | Durum | Önlem | Doğrulama | Kanıt |
| --- | --- | --- | --- | --- | --- |
| CEN429-DT-01 | Oturum belirteci TLS 1.2+, sertifika doğrulanarak taşınmalı | Karşılandı | S10.3 | MITM testi: geçersiz sertifika/düz metin reddedilir | `mitm_test_2026-11-03.log`, CI #617, `handshake.pcapng` |

Bir halka eksik olsaydı: varlık yoksa "hangi veri" belirsiz kalır, tehdit yoksa gereksinim keyfi görünür, önlem yoksa iddia desteksiz kalır, doğrulama yoksa "nasıl test edildi" cevapsız kalır, kanıt yoksa satır **ilk bulgu** olur.

---

<!-- _class: yogun -->

# "Karşılanmadı" durumunun tam zinciri

| Halka | Karşılandı (DT-01) | Karşılanmadı (DT-04) |
| --- | --- | --- |
| Gereksinim | Oturum belirteci TLS ile taşınır | Sunucu sertifikası sabitlenmeli |
| Durum | Karşılandı | **Karşılanmadı** |
| Önlem | S10.3 | — (henüz yok) |
| Doğrulama | MITM testi geçti | — |
| Kanıt | Test günlüğü | **Kalan risk:** S16.4'e yazılır |

"Karşılanmadı"da önlem/doğrulama boş kalabilir ama **kanıt** (kalan riskin nerede belgelendiği) boş kalamaz.

---

# Bölüm 2'nin kuralı

- Her "karşılandı" satırının kanıt sütununda **bulunabilir, adlandırılmış** bir referans olmalı: dosya adı, CI numarası, test raporu bölümü.
- "Var", "test edildi" kanıt değil, kanıt **vaadidir**.
- Değerlendiricinin en sık yazdığı bulgu: **kanıtsız "karşılandı"**.

---

# Bölüm 1–2 — kısa sınama

1. İyi gereksinimin dört ölçütü?
2. "Uygulama güvenli olmalı" neden kötü?
3. İzlenebilirlik zinciri nedir?

<!-- Konuşma notu: Sonra gereksinim bloğu ve devredilenler. -->

---

# Bölüm 1–2 — cevaplar

1. **Belirli · ölçülebilir/doğrulanabilir · tekil · izlenebilir** (gerçekçi, atomik).
2. **Belirsiz ve ölçülemez**; "güvenli"nin tanımı yok → test edilemez, herkes farklı anlar.
3. **Tehdit/standart → gereksinim → tasarım/kod → test/kanıt.** Her gereksinim bir kaynağa ve bir kanıta **iki yönlü** bağlanır.

---


<!-- _class: bolum -->

# 3. Gereksinim bloğu ve devredilenler

---

# Devretme üç soru — şema

![w:950](assets/h13-06-devretme.svg)

---

# Gereksinim bloğu kalıbı

Her gereksinim bir **blok** olarak yazılır:

- **Kimlik:** benzersiz numara (ör. CEN429-DU-01)
- **Metin:** ne isteniyor (tekil, ölçülebilir)
- **Durum:** karşılandı / devredildi / karşılanmadı
- **Karşılama:** nasıl karşılandı
- **Doğrulama + kanıt**

---

# Örnek blok

```text
CEN429-DU-01
Metin: Yerel DB'deki C sınıfı veri AEAD ile şifrelenir.
Durum: Karşılandı
Karşılama: AES-256-GCM, anahtar TEE'de
Doğrulama: T-05 birim testi
Kanıt: test çıktısı, S16
```

---

# Neden blok?

- Her gereksinim aynı yapıda → **karşılaştırılabilir**.
- Değerlendirici hızlı okur.
- Uyum matrisi bu bloklardan üretilir.

---

# Devredilen gereksinim nedir?

- Bir bileşen bir gereksinimi **kendisi** karşılayamıyor.
- Sorumluluğu üst uygulamaya/OS'a/donanıma **devreder**.
- Bu bir kaçış değil, **açık bir sözleşmedir**.

---

# Devrederken üç soru

Devredilen her gereksinimde yaz:

- **Kime?** (üst uygulama / OS / donanım)
- **Neden?** (neden bu bileşen karşılayamıyor)
- **Nasıl?** (karşı taraf nasıl karşılayacak)

---

# Devredilen · örnek

```text
CEN429-AP-03: Güvenli kurulum ve güncelleme
Durum: Devredildi
Kime: Üst mobil uygulama (MPA)
Neden: SDK dağıtım kanalına sahip değil
Nasıl: MPA imzalı güncelleme + sürüm denetimi sağlar
```

---

# ⚠️ Sessiz devretme yok

- Bir gereksinimi karşılamıyor ve **yazmıyorsanız** → eksik.
- Devretme **belgelenmeli**; aksi halde "karşılanmadı" sayılır.
- S14 bölümü tam bunun için.

---

# Karşılandı mı, devredildi mi?

| Durum | Anlamı |
| --- | --- |
| Karşılandı | Ürün sağlar (kanıtla) |
| Devredildi | Başka taraf sağlar (kime/neden/nasıl) |
| Karşılanmadı | Henüz yok (kalan risk) |

---

# İşlenmiş örnek · bloğu doldurmak (Karşılandı)

Bu, 2. bölümdeki `CEN429-DR-01` zincirinin **kılavuza yazılmış** hâlidir:

> [CEN429-DR] CEN429-DR-01 — KARŞILANDI
> Gereksinim: Beklemedeki C sınıfı hassas veri, kimlik doğrulamalı şifrelemeyle (AEAD) korunmalıdır.
> Karşılama: Yerel kasa dosyası AES-256-GCM ile şifrelenir (S7.2); anahtar cihazın güvenli depolama biriminden türetilir. Doğrulama: birim testi, tek bayt değişince çözmenin reddedildiğini kontrol eder. Kanıt: CI #482, `evidence/week13/test_butunluk_ci482.log`.

---

# Aynı kalıp · Devredildi

> [CEN429-AP] CEN429-AP-07 — DEVREDİLDİ (üst uygulamaya)
> Gereksinim: Uygulama güvenli biçimde kurulmalı ve güncellenmelidir.
> Karşılama: Kütüphanenin kendi dağıtım/güncelleme mekanizması yok. Kime: üst uygulama geliştiricisi. Neden: kütüphane ağ/dosya sistemi seviyesinde kuruluma erişmez. Nasıl: mağaza imza doğrulaması ya da Hafta 6'daki imzalama şemasıyla imzalı güncelleme paketleri.

Devredilen blok da **Karşılama** alanına sahiptir — ama "karşı taraf nasıl yapmalı, biz neden yapmıyoruz" sorusunu cevaplar.

---

# Aynı kalıp · Karşılanmadı

> [CEN429-DT] CEN429-DT-04 — KARŞILANMADI
> Gereksinim: Sunucu sertifikası sabitlenmelidir (certificate pinning).
> Durum: Şu an yalnız standart TLS zinciri doğrulaması var, sabitleme yok. Kalan risk: güvenilir bir kökten sahte sertifika alınırsa MITM mümkün olabilir (S16.4). Planlanan düzeltme: v1.1 (görev #217).

"Karşılanmadı" bloğu **Karşılama** yerine **Durum** ve **Kalan risk** alanlarını doldurur.

---

# Blok alanlarının görevi

- **Başlık satırı** ([Aile] Kimlik — Durum): değerlendiricinin gözünü hızlıca nereye götüreceğini söyler.
- **Gereksinim** satırı: standarttan/tehditten gelen "ne"yi tekrarlar, yeniden yorumlanmaz.
- **Karşılama:** "nasıl"ı somut dosya/bölüm adlarıyla anlatır.
- **Doğrulama + Kanıt:** izlenebilirlik zincirinin son iki halkası.

---

<!-- _class: yogun -->

# Donanım devretmesi ve Bölüm 3'ün kuralı

- Güvenli eleman/TEE **varsa**: gereksinim donanıma devredilebilir.
- Güvenli eleman **yoksa**: devredilemez — devredilecek taraf yok; ürün yazılım tabanlı önlem almalı ya da "karşılanmadı" + kalan risk yazmalı. "Donanıma devredildi" yazmak burada **geçersiz devretmedir**.
- **Kural:** karşılama metni her zaman somut bir referansla bitmeli; devretmeden önce karşı tarafın **gerçekten** karşılayabileceğini doğrulayın.

---

# Bölüm 3 — kısa sınama

1. Gereksinim bloğunun alanları?
2. Devrederken hangi üç soru yanıtlanır?
3. Sessiz devretme neden sorun?

<!-- Konuşma notu: Sonra Ortak Kriterler ve FIPS. -->

---

# Bölüm 3 — cevaplar

1. **ID · ölçülebilir ifade · kaynak/gerekçe · ilgili varlık/tehdit · doğrulama yöntemi (kanıt) · durum/öncelik.**
2. (1) **Neden** şimdi karşılanmıyor? (2) **Riski ne, kim kabul ediyor** (onay)? (3) **Ne zaman/nasıl** karşılanacak (plan/telafi)?
3. Kayıt/onay olmadan gereksinim atlanır → **gizli açık**, sorumlusu yok, denetimde patlar. Açık, gerekçeli, onaylı devret.

---


<!-- _class: bolum -->

# 4. Ortak Kriterler (ISO/IEC 15408)

---

# Ortak Kriterler — şema

![w:950](assets/h13-07-ortak-kriterler.svg)

---

# CC nedir?

- **Ortak Kriterler:** ürün güvenliğini değerlendirmenin uluslararası standardı.
- Ortak bir **dil** ve **yöntem** sağlar.
- Ülkeler birbirinin değerlendirmesini tanır.

---

# TOE · değerlendirme hedefi

- **TOE (Target of Evaluation):** değerlendirilen tam ürün.
- Benzersiz tanımlanır (12. hafta): sürüm + ikili + özet.
- Kapsam dışı bileşenler yazılır.

---

# ST · güvenlik hedefi

- **ST (Security Target):** **bu** ürünün güvenlik hedefi belgesi.
- İçinde: tehditler, amaçlar, gereksinimler (SFR/SAR).
- Ürüne özgüdür.

---

# PP · koruma profili

- **PP (Protection Profile):** bir ürün **sınıfı** için ortak gereksinim seti.
- Örnek: "mobil cihaz PP", "akıllı kart PP".
- ST'ler genelde bir PP'yi temel alır.

---

# ST vs PP

| | ST | PP |
| --- | --- | --- |
| Kapsam | Tek ürün | Ürün sınıfı |
| Kim yazar | Geliştirici | Topluluk/otorite |
| Rol | Bu ürünün hedefi | Ortak taban |

---

# SFR · işlevsel gereksinimler

- **SFR (Security Functional Requirements):** ürünün **ne yapacağı**.
- Örnek: şifreleme, erişim denetimi, günlükleme.
- Standart bir katalogdan seçilir.

---

# SAR · güvence gereksinimleri

- **SAR (Security Assurance Requirements):** doğru yapıldığına **nasıl güveneceğiz**.
- Örnek: kaynak inceleme, test derinliği, zafiyet analizi.
- EAL bunları belirler.

---

# EAL · değerlendirme derinliği

- **EAL (Evaluation Assurance Level):** 1'den 7'ye derinlik.
- Yüksek EAL = daha derin inceleme.
- "+" ek güvence bileşenlerini gösterir (EAL4+).

---

# ⚠️ EAL yanlış anlaşılması

- EAL güvenliğin **derinliği**, güvenliğin **miktarı** değil.
- "EAL4+ > EAL2 daha güvenli" demek **yanlış**.
- Güvenlik, **ST'deki tehdit ve amaçlara** bağlıdır.

---

# İşlenmiş örnek · ST iskeleti — TOE

Bir mobil ödeme bileşeni için üç adımda dolduralım.

**Adım 1 — TOE'yi tanımlayın:**

> TOE: "CEN429-Pay" kütüphanesi, sürüm 1.0, yalnız Android ARM64 derlemesi.
> **Kapsam dışı:** üst uygulamanın arayüzü, sunucu tarafı bileşenler, işletim sistemi çekirdeği.

Kapsam dışını yazmak, kapsamı yazmak kadar önemlidir.

---

<!-- _class: yogun -->

# Tehdit → amaç → SFR eşlemesi

| Tehdit | Güvenlik amacı | SFR ailesi | Dersteki gereksinim |
| --- | --- | --- | --- |
| T.EAVESDROP | Aktarılan veri gizli/bütünlüklü kalmalı | FCS, FTP | CEN429-DT-01 |
| T.TAMPER | Uygulama bütünlüğünü denetlemeli | FPT | CEN429-AP-04 |
| — | Kimlik doğrulanmalı | FIA | CEN429-ID-02 |

Bu tablo ST'nin kalbidir: her satır "neden bu gereksinim var" ile "hangi kanıt istenir" arasındaki köprü.

---

<!-- _class: yogun -->

# Bölüm 4'ün kuralı

- TOE tanımı her zaman **hem içerdiklerini hem dışarıda bıraktıklarını** listeler.
- SFR'ler katalogdan seçilir, **uydurulmaz**; karşılığı yoksa "genişletilmiş bileşen" olarak gerekçelendirilir.
- Değerlendirici her tehdidin bir amaca, her amacın bir SFR'ye bağlandığını kontrol eder.

---

<!-- _class: bolum -->

# 5. FIPS 140-3

---

# FIPS 140-3 düzeyleri — şema

![w:950](assets/h13-08-fips.svg)

---

# FIPS 140-3 nedir?

- **Kriptografik modüllerin** doğrulanması standardı.
- Modülün algoritmaları, kendini testi, anahtar yönetimi.
- Yalnız **modülü** kapsar.

---

# Güvenlik düzeyleri (1–4)

| Düzey | Kabaca |
| --- | --- |
| 1 | Temel; onaylı algoritmalar |
| 2 | Kurcalama **izi** |
| 3 | Kurcalamaya **direnç** ve yanıt |
| 4 | En yüksek fiziksel koruma |

---

# ⚠️ FIPS uyumluluğu tuzağı

- FIPS **doğrulanmış** kütüphane kullanmak, uygulamayı otomatik FIPS uyumlu **yapmaz**.
- Uygulama modülü **onaylı kipte** ve **doğru** kullanmalı.
- Anahtarları da doğru yönetmeli.

---

# CC ve FIPS birlikte

- **CC:** ürünün bütününü değerlendirir.
- **FIPS:** kripto modülünü doğrular.
- Bir ürün CC değerlendirmesinde FIPS'li modül kullanabilir.

---

# İşlenmiş örnek · FIPS düzey 1 denetimi

Proje kripto katmanı: OpenSSL `EVP` arayüzü, AES-256-GCM, anahtarlar `getrandom()`'dan üretiliyor, **hata durumunda sessizce varsayılan bir anahtara düşüyor**.

Düzey 1 beklentilerini tek tek işaretleyelim.

---

<!-- _class: yogun -->

# Düzey 1 · durum tablosu

| Düzey 1 beklentisi | Durum | Neden |
| --- | --- | --- |
| Onaylı algoritma, onaylı kipte | Kısmen | CAVP sertifikası yoksa iddia edilemez |
| Açılış/koşullu öz testler | Karşılanmadı | Proje kendi öz testini çalıştırmıyor |
| Roller ve hizmetler tanımlı | Karşılanmadı | Kod rol ayrımı yapmıyor |
| Parametrelerin sıfırlanması | Karşılanmadı | Hata durumunda varsayılan anahtara düşülüyor |
| Güvenlik politikası belgesi | Karşılanmadı | Böyle bir belge yok |

---

<!-- _class: yogun -->

# En kritik açık ve Bölüm 5'in kuralı

- Hata durumunda "varsayılan anahtara düşmek", **sıfırlama (zeroization) ilkesinin tam tersidir**.
- 3. haftadaki kural: "rastgele üreteç başarısız olursa **dur**, devam etme" — burada tersi yapılıyor.
- **Kural:** bir FIPS iddiasının arkasında her zaman bir **CMVP sertifika numarası ve kapsamı** olmalı; yoksa "FIPS onaylı algoritmalar kullanıyoruz (doğrulanmış modül değil)" diye dürüstçe daraltın.

---

# Bölüm 4–5 — kısa sınama

1. ST ile PP farkı?
2. SFR ve SAR nedir?
3. "EAL4+ her zaman daha güvenli" neden yanlış?
4. FIPS'li kütüphane uygulamayı FIPS uyumlu yapar mı?

<!-- Konuşma notu: Sonra sektör standartları. -->

---

# Bölüm 4–5 — cevaplar

1. **PP** bir ürün **sınıfı** için standart gereksinim kümesi; **ST** belirli bir **ürünün (TOE)** neyi karşıladığını söyleyen belge.
2. **SFR** ürünün **ne yapacağı** (fonksiyonel); **SAR** buna **ne kadar güvenileceği** (güvence; EAL buradan gelir).
3. EAL **güvence derinliğini** ölçer, güvenlik miktarını değil; **kapsam (ST/TOE)** darsa yüksek EAL az şey kapsar.
4. **Hayır.** Modülü **doğru kip/yapılandırmada, onaylı algoritmalarla** kullanmak gerekir. Modül sertifikası ≠ uygulama uyumu.

---


<!-- _class: bolum -->

# 6. Sektöre özgü gereksinim setleri

---

# Sektör standartları — şema

![w:950](assets/h13-09-sektor.svg)

---

# Neden sektör standartları?

- CC/FIPS geneldir; sektörler kendi risklerine göre **ek** gereksinim ister.
- IoT, mobil, ödeme farklı tehdit ortamları.
- Projeniz hangisine yakınsa onu izleyin.

---

# ETSI EN 303 645 (IoT)

- Tüketici IoT için **temel** güvenlik gereksinimleri.
- Örnek: varsayılan parola yok, güvenli güncelleme, hassas parametreleri güvenle sakla.
- Geniş, uygulanabilir taban.

---

# ETSI · örnek maddeler

- Benzersiz parolalar (ortak varsayılan yok).
- Güvenlik güncellemelerini yönet.
- **Hassas güvenlik parametrelerini güvenle sakla** (→ projede S5/S7/S8).

---

# GSMA

- Mobil operatör ekosistemi için güvenlik yönergeleri.
- Cihaz, ağ, servis güvenliği.
- SIM/eSIM, kimlik.

---

# EMVCo

- Kart ödeme ekosistemi standartları (kartlar, terminaller, mobil ödeme).
- İşlevsel uygunluk + güvenlik değerlendirmesi.
- Saldırı potansiyeli puanlaması (12. hafta).

---

# PCI

- **PCI DSS:** kart verisi işleyen sistemler için güvenlik.
- **PCI MPoC/CPoC:** yazılım tabanlı ödeme kabulü.
- Sıkı; laboratuvar değerlendirmesi.

---

# OWASP MASVS

- **Mobile Application Security Verification Standard.**
- Mobil uygulama güvenlik **gereksinimleri**.
- Düzeyler: temel (L1), derinlemesine (L2), direnç (R).

---

# MASVS · projeniz için

- **En uygulanabilir** gereksinim seti.
- MASTG ile test edilir (12. hafta).
- Kripto, depolama, iletişim, kod kalitesi, direnç.

---

<!-- _class: yogun -->

# Standartlar · karşılaştırma

| Standart | Alan | Odak |
| --- | --- | --- |
| CC | Genel ürün | Değerlendirme derinliği |
| FIPS 140-3 | Kripto modülü | Modül doğrulama |
| ETSI 303 645 | IoT | Temel gereksinim |
| EMVCo/PCI | Ödeme | İşlevsel + güvenlik |
| MASVS | Mobil | Uygulama gereksinimi |

---

# Karşılaştırma · ders

- Hepsi aynı kökü paylaşır: **yazılı, doğrulanabilir** gereksinim.
- Fark: kapsam ve sıkılık.
- Projeniz için **MASVS** en pratik başlangıç.

---

<!-- _class: yogun -->

# Aynı gereksinim, dört standart (1) — beklemede veri

| Standart | Karşılığı |
| --- | --- |
| Ortak Kriterler | FCS + FDP bileşenleri |
| FIPS 140-3 | Düzey 1: onaylı algoritma, öz test, sıfırlama |
| ETSI EN 303 645 | Madde 5.4 "Hassas parametreleri güvenle sakla" |
| OWASP MASVS | MASVS-STORAGE |
| Dersin ailesi | `CEN429-DR-01` |

---

<!-- _class: yogun -->

# Aynı gereksinim, dört standart (2) — zayıf kimlik doğrulama

| Standart | Karşılığı |
| --- | --- |
| Ortak Kriterler | FIA bileşenleri |
| FIPS 140-3 | Düzey 2: rol tabanlı kimlik doğrulama |
| ETSI EN 303 645 | Madde 5.1 "Evrensel varsayılan parola yok" |
| OWASP MASVS | MASVS-AUTH |
| Dersin ailesi | `CEN429-ID-01` / `CEN429-ID-02` |

---

<!-- _class: yogun -->

# Örtüşme ve Bölüm 6'nın kuralı

- Bir standarda uyum kanıtı, başka bir standartta da **kısmen yeniden kullanılabilir** — ama "otomatik karşılanır" demek değildir; her standardın **kendi ek ölçütü** vardır.
- "FIPS'li modül kullanıyoruz, o yüzden MASVS-CRYPTO'yu da karşılıyoruz" cümlesi **tehlikelidir**.
- **Kural:** örtüşmeyi kanıt toplamayı hızlandırmak için kullanın, ama her standardı **ayrı ayrı** işaretleyin.

---

# Bölüm 6 — kısa sınama

1. ETSI EN 303 645 kimin için?
2. MASVS neden projeniz için en uygun?
3. CC ile MASVS farkı?

<!-- Konuşma notu: Sonra gereksinimleri projeye aktarma. -->

---

# Bölüm 6 — cevaplar

1. Tüketici **IoT** cihazları için temel güvenlik (varsayılan parola yok, güncelleme, güvenli iletişim…).
2. Proje uygulama odaklı; **MASVS** somut, kontrol edilebilir maddeler + **MASTG** test rehberi → doğrudan uygulanır.
3. **CC** ağır, akredite laboratuvar/sertifika (EAL); **MASVS** hafif, açık, geliştirici-dostu **öz-değerlendirme** standardı.

---


<!-- _class: bolum -->

# 7. Gereksinimleri projeye aktarmak

---

# Gereksinim aktarma kararı — şema

![w:950](assets/h13-02-gereksinim-karari.svg)

---

# Gereksinim → varlık → önlem

![w:900](assets/h13-05-gereksinim-blogu.svg)

Her gereksinim bir **varlığa** ve bir **önleme** bağlanır.

---

# Varlık yönetimiyle bağ

- Gereksinimler S5 **varlık listesine** bağlanır.
- Her varlık: C/I/I+ etiketi, koruma önlemi.
- Gereksinim, o korumayı **zorunlu** kılar.

---

# Plana aktarmak

- İşlevsel gereksinim → tasarım/kod (S6–S11).
- Güvence gereksinimi → test (S16).
- Süreç gereksinimi → geliştirme süreci (S13).

---

# İşlenmiş örnek · CR-03'e altı adımı uygulamak

`CEN429-CR-03` ("anahtarlar iş bitince silinmelidir"):

- **1. Uygulanabilirlik:** oturum ve kasa dosyası anahtarı var → uygulanır.
- **2. Sorumluluk:** kod projenin kendisi → biz karşılarız.
- **3. Varlıklara bağlama:** kasa dosyası anahtarının "silinme" sütunu boş — **eksiklik burada fark edilir**.

---

# Aynı örnek · tehditten sürüm planına

- **4. Tehditlere bağlama:** "fiziksel erişimi olan saldırgan bellek dökümü alır" tehdidine bağlanır.
- **5. Önlem/doğrulama:** `sifreleme_bellek_sil()` çağrısı; doğrulama: bellek dökümünde anahtar baytlarının **bulunmadığını** göstermek.
- **6. Sürüm planı:** oturum anahtarı v0.9'da karşılandı; kasa dosyası anahtarı v1.0'a planlandı, o güne kadar **karşılanmadı** + kalan risk yazılır.

---

<!-- _class: yogun -->

# Bölüm 7'nin kuralı

- Her "uygulanmaz" kararı, gerekçesini destekleyen bir **kanıtla** (kod taraması, mimari diyagram) birlikte yazılmalı.
- Gerekçesiz "uygulanmaz", gerekçesiz "karşılandı" kadar güvenilmezdir.
- Altı adımdan 3. ve 4.'ü (varlık/tehdit bağlama) atlamak en sık yapılan hatadır.

---

<!-- _class: bolum -->

# 8. Dersin gereksinim aileleri

---

# Gereksinim aileleri — şema

![w:900](assets/h13-11-gereksinim-aileleri.svg)

---

# Dersin kendi kimlikleri

Bu ders, açık standartlardan uyarlanmış kendi gereksinim ailelerini kullanır:

CEN429-**AP** (uygulama koruma), **ID** (kimlik), **AS** (varlık), **DR/DU/DT** (veri: beklemede/kullanımda/aktarımda)…

---

# Aileler (1)

| Aile | Konu |
| --- | --- |
| AP | Uygulama koruma (gizleme, RASP) |
| ID | Kimlik ve bağlama |
| AS | Varlık yönetimi |
| DR | Beklemedeki veri |

---

# Aileler (2)

| Aile | Konu |
| --- | --- |
| DU | Kullanımdaki veri |
| DT | Aktarımdaki veri |
| RP | Raporlama/günlük |
| CR | Kriptografi |
| DV | Geliştirme/süreç |

---

# Her aile → haftalara bağ

- AP → 4, 5, 6, 9, 11, 14
- CR/DR/DU/DT → 3, 10
- AS → 1, 3
- DV/RP → 12, 13

Projeniz bu ailelerden bir **alt küme** seçer.

---

<!-- _class: bolum -->

# Uyum matrisi etkinliği

---

# Etkinlik · adım 1

- Kendi projenizden **beş gereksinim** seçin (farklı ailelerden).
- Her biri için bir **gereksinim bloğu** yazın.

---

# Etkinlik · adım 2

Her gereksinim için matris satırı doldurun:

| Gereksinim | Durum | Bölüm | Doğrulama | Kanıt |
| --- | --- | --- | --- | --- |
| … | … | … | … | … |

---

# Etkinlik · adım 3

- En az birini **devredilen** olarak yazın (kime/neden/nasıl).
- En az birinin **kanıtını** somut gösterin.
- Bir "karşılanmadı" varsa **kalan riske** yazın.

---

# Etkinlik · değerlendirme

Değerlendirici gözüyle kontrol:

- Her satırın kanıtı var mı?
- Devredilenler açık mı?
- Gereksinimler **doğrulanabilir** mi?

---

<!-- _class: yogun -->

# İşlenmiş örnek · ilk taslak (yetersiz)

Bir takımın `CEN429-AP-04` için matris satırı, **ilk taslakta**:

| Kimlik | Gereksinim | Durum | Önlem | Doğrulama | Kanıt |
| --- | --- | --- | --- | --- | --- |
| CEN429-AP-04 | Uygulama çalışma anında bütünlüğünü denetlemeli | Karşılandı | Bütünlük kontrolü var | Test edildi | — |

Üç sorun: (1) önlem, gereksinimin **tekrarı**. (2) "Test edildi" doğrulama **yöntemi değil**. (3) Kanıt **boş**.

---

# Taslağı düzeltme · adım adım

1. Önlemi somutlaştır: açılışta kod bölümünün özeti (hash) hesaplanır, derleme zamanında gömülü beklenen özetle karşılaştırılır; uyuşmazsa çalışma durur (S12.3).
2. Doğrulama yöntemini netleştir: ikili dosyanın bir baytı değiştirilir, uygulamanın **başlamayı reddettiği** doğrulanır.
3. Kanıt ekle: CI işi `ci-integrity-check`, çalıştırma **#391**, `integrity_test.log`.

---

<!-- _class: yogun -->

# Düzeltilmiş satır

| Kimlik | Durum | Önlem | Doğrulama | Kanıt |
| --- | --- | --- | --- | --- |
| CEN429-AP-04 | Karşılandı | S12.3: açılış özeti hesaplanır, gömülü özetle karşılaştırılır | Bayt değişince başlamanın reddedildiği test edilir | CI `ci-integrity-check` #391, `integrity_test.log` |

---

# Fark neyde?

- Fark satırın **uzunluğunda** değil, her hücrenin **somutluğunda**.
- İlk taslak da "dolu" görünüyordu ama hiçbir hücresi **bağımsız olarak doğrulanamazdı**.
- Değerlendirici için önemli olan: her hücreyi okuyunca "bunu nereden biliyoruz?" sorusuna cevap bulabilmek.

---

# Bölüm 8'in kuralı

- Her satırın kanıtı **o satıra özgü** olmalı: belirli test adı, belirli CI numarası, belirli günlük dosyası.
- Tek bir genel raporu bütün satırlara kopyalamak, matrisin **tamamını** şüpheli hâle getirir.
- Genel bir rapora referans veriliyorsa, raporun **hangi bölümü/sayfası** olduğu da belirtilmeli.

---

# Bölüm 7–8 — kısa sınama

1. Gereksinim hangi iki şeye bağlanır?
2. Dersin gereksinim ailelerinden üçünü sayın.
3. Uyum matrisinde her satırda ne olmalı?

<!-- Konuşma notu: Sonra proje ve çözümlü sınama. -->

---

# Bölüm 7–8 — cevaplar

1. Yukarıda **kaynağa** (tehdit/standart/varlık) ve aşağıda **kanıta** (test/kod) — iki yön.
2. (15 aileden herhangi üçü) ör. **veri güvenliği · kod sağlamlaştırma · RASP · kriptografi/sertifika · bellek koruması · arayüz koruması**.
3. Gereksinim **ID+ifade · durum** (karşılandı/devredildi) **· kanıt** (test/dosya/S-bölümü). **Kanıtsız satır karşılanmamış** sayılır.

---


<!-- _class: bolum -->

# 9. Proje ve kapanış

---

# Proje · S14 ve S17

- [ ] **S17 uyum matrisi:** uygulanan her gereksinim için durum, bölüm, doğrulama, kanıt.
- [ ] **S14 devredilenler:** kime, neden, nasıl.
- [ ] En az bir "karşılanmadı" varsa **kalan riske** yaz.

---

# Değerlendirici gözüyle

- Kanıtsız "karşılandı" = karşılanmamış.
- Devredilenler açık ve gerekçeli mi?
- Gereksinimler doğrulanabilir mi?

---

<!-- _class: yogun -->

# 45 dakikada nasıl hazırlanır + kanıt klasörü

1. Aile tablosundan uygulanan gereksinimleri işaretleyin; uygulanmayanları "uygulanmaz, gerekçe: ..." bırakın.
2. Altı sütunu (kimlik, gereksinim, durum, önlem, doğrulama, kanıt) doldurun; kanıtsız "karşılandı" yazmayın.
3. "Devredildi" satırlarını S14'e, kime/neden/nasıl ile taşıyın.
4. Varlık tablonuzu (S5) her gereksinime bağlayın; S1'e dayandığınız standartları yazın.

```text
evidence/week13/  <- test/log/pcap dosyaları
  README.md       <- her dosya hangi gereksinimin kanıtı, bir satırla
```

---

<!-- _class: yogun -->

# Zaman kısıtlıysa · öncelik sırası

1. Önce **en az 15 gereksinimlik** bir S17 iskeleti (kimlik+gereksinim+durum) — boş S17'den çok daha iyi.
2. Elde **gerçek kanıtı olan** "karşılandı" satırlarını tamamlayın; kanıtı olmayanı dürüstçe "karşılanmadı" yapın.
3. Devredilen satırları S14'e taşıyın.
4. Son olarak kalan önlem/doğrulama sütunlarını doldurun.

**Kural:** "az ama dürüst" bir matris, "çok ama kanıtsız" olandan her zaman daha iyi puan alır.

---

<!-- _class: bolum -->

# Çözümlü kendini sınama

---

# Soru 1

**İyi bir güvenlik gereksiniminin dört ölçütü?**

**Cevap:** Doğrulanabilir, tekil, ölçülebilir, gerçekçi.

---

# Soru 2

**"Uygulama güvenli olmalıdır" neden kötü? Nasıl düzeltilir?**

**Cevap:** Doğrulanamaz. Ölçülebilir yazılır: ör. "sürüm derlemesi yığın koruyucu, PIE ve tam RELRO ile üretilir".

---

# Soru 3

**İzlenebilirlik zinciri nedir?**

**Cevap:** Gereksinim → önlem → doğrulama → kanıt. Her gereksinim bir kanıta bağlanır.

---

# Soru 4

**Uyum matrisinde kanıtsız "karşılandı" ne demek?**

**Cevap:** Değerlendirici için karşılanmamış sayılır; ilk bulgulardan biridir.

---

# Soru 5

**Bir gereksinimi devrederken hangi üç soru yanıtlanır?**

**Cevap:** Kime, neden, nasıl. Sessiz devretme "karşılanmadı" sayılır.

---

# Soru 6

**ST ile PP farkı?**

**Cevap:** ST tek ürünün güvenlik hedefi; PP bir ürün sınıfı için ortak gereksinim seti. ST genelde bir PP'yi temel alır.

---

# Soru 7

**"EAL4+ her zaman EAL2'den güvenli" doğru mu?**

**Cevap:** Hayır. EAL değerlendirmenin derinliğidir; güvenlik ST'deki tehdit ve amaçlara bağlıdır. "+" ek güvence bileşenidir.

---

# Soru 8

**FIPS doğrulanmış kütüphane kullanan uygulama FIPS uyumlu mudur?**

**Cevap:** Tek başına değil. Doğrulama modülü kapsar; uygulama onaylı kipte, doğru kullanmalı, anahtarları doğru yönetmeli.

---

# Soru 9

**ETSI EN 303 645'in "hassas parametreleri güvenle sakla" maddesi projede nereye karşılık gelir?**

**Cevap:** S5 varlık listesi, S7 veri güvenliği/kabuk matrisi, S8 anahtar yaşam döngüsü.

---

# Soru 10

**Bir kütüphane "güvenli güncelleme" gereksinimini karşılayamıyorsa?**

**Cevap:** Üst uygulamaya devreder ve kılavuzda kime/neden/nasıl karşılanacağını yazar.

---

<!-- _class: yogun -->

# Sözlük

| Terim | Anlam |
| --- | --- |
| İşlevsel/güvence/süreç | Üç gereksinim türü |
| İzlenebilirlik | Gereksinim→kanıt zinciri |
| Devredilen | Başka tarafa aktarılan gereksinim |
| TOE/ST/PP | CC temel kavramları |
| SFR/SAR/EAL | İşlevsel/güvence/derinlik |

---

# Özet: bu haftanın tek cümlesi

> Güvenlik, **yazılı, doğrulanabilir, izlenebilir** gereksinimlerle yönetilir; her gereksinim bir önleme, teste ve
> **kanıta** bağlanır, karşılanamayan açıkça **devredilir**.

---

<!-- _class: bolum -->

# Gelecek hafta

**14. hafta — Tigress ve çeşitlendirme**

Gizleme kurallarının otomatik, çeşitlendirilmiş uygulaması; ölçme ve derleme hattı.

---

<!-- _class: bolum -->

# Ek A · İşlenmiş uyum matrisi

<!-- Konuşma notu: Sentetik "NotKasa" ürünü için birkaç gereksinim bloğunu ve matris satırını dolduruyoruz. -->

---

# Bağlam · NotKasa

Sentetik uygulama: yerel şifreli not tutar, sunucuyla konuşur, güncellenir.

Birkaç gereksinim seçip matris satırı yazalım.

---

# Gereksinimin doğuşu · tehditten

```text
Tehdit: cihaz çalınırsa yerel notlar okunur
   ↓
Amaç: beklemede gizlilik
   ↓
Gereksinim: C sınıfı veri AEAD ile şifrelenir
```

Gereksinim havadan gelmez; **tehditten** türer.

---

# Blok · DR-01 (beklemede veri)

```text
CEN429-DR-01
Metin: Yerel DB'deki C sınıfı veri AES-256-GCM ile şifrelenir.
Durum: Karşılandı
Karşılama: AES-256-GCM, anahtar TEE'de
Doğrulama: T-05
Kanıt: test çıktısı (S16)
```

---

# Blok · CR-02 (kripto)

```text
CEN429-CR-02
Metin: Anahtarların amacı, kripto-periyodu, imhası belgelenir.
Durum: Karşılandı
Karşılama: S8 anahtar tablosu
Doğrulama: belge incelemesi
Kanıt: S8
```

---

# Blok · DT-03 (aktarımda veri)

```text
CEN429-DT-03
Metin: Sunucu iletişimi TLS 1.3 ve sertifika zinciri doğrulaması kullanır.
Durum: Karşılandı
Karşılama: TLS 1.3 + SAN denetimi + SPKI pin
Doğrulama: T-11
Kanıt: test + S11
```

---

# Blok · AP-04 (uygulama koruma) — devredilen

```text
CEN429-AP-04
Metin: Güvenli kurulum ve güncelleme sağlanır.
Durum: Devredildi
Kime: Üst uygulama (MPA)
Neden: SDK dağıtım kanalına sahip değil
Nasıl: MPA imzalı güncelleme + sürüm denetimi
```

---

# Blok · AS-05 — karşılanmadı

```text
CEN429-AS-05
Metin: Tüm hassas varlıklar için bellek izleme tespiti.
Durum: Karşılanmadı
Kalan risk: köklü cihazda canlı bellek analizi
Azaltma: kısa ömürlü anahtar + sunucu denetimi
```

---

<!-- _class: yogun -->

# Matris · toplu görünüm

| ID | Durum | Bölüm | Kanıt |
| --- | --- | --- | --- |
| DR-01 | Karşılandı | S8 | T-05 |
| CR-02 | Karşılandı | S8 | S8 |
| DT-03 | Karşılandı | S11 | T-11 |
| AP-04 | Devredildi | S14 | — |
| AS-05 | Karşılanmadı | S12 | kalan risk |

---

# Matristen okunanlar

- Üç karşılandı (kanıtlı), bir devredildi, bir kalan risk.
- Her satır izlenebilir.
- Değerlendirici bu tablodan başlar.

---

<!-- _class: bolum -->

# Ek B · Standart eşleme

---

# Aynı gereksinim, çok standart

Bir gereksinim birden çok standarda bağlanabilir:

![w:900](assets/h13-10-uyum-matrisi.svg)

---

# Eşleme neden yararlı?

- Bir kez karşılarsınız, birçok standardı **aynı anda** sağlarsınız.
- Uyum matrisinde standart sütunu ekleyin.
- Sertifikasyon değişse bile iş tekrarlanmaz.

---

<!-- _class: yogun -->

# Eşleme örneği

| Gereksinim | ETSI | MASVS | CC |
| --- | --- | --- | --- |
| Şifreli saklama | ✓ | STORAGE | SFR |
| Güvenli iletişim | ✓ | NETWORK | SFR |
| Güvenli güncelleme | ✓ | — | SAR |

---

# Ek A–B · özet

- Gereksinim tehditten türer, blok olarak yazılır, matrise girer.
- Bir gereksinim çok standardı karşılayabilir.
- Kanıt olmadan hiçbir satır "karşılandı" değildir.

---

<!-- _class: bolum -->

# Ek C · Gereksinim aileleri detay

<!-- Konuşma notu: Her aile için bir örnek gereksinim; öğrenci kendi projesine benzerini yazar. -->

---

# AP · uygulama koruma

- **Örnek:** "Hassas fonksiyonlar gizlenir ve bütünlük denetimiyle korunur."
- Bağ: 4, 6, 9, 11, 14. haftalar.
- Doğrulama: gizleme ölçümü + RASP testi.

---

# ID · kimlik ve bağlama

- **Örnek:** "Cihaz ve sürüm, anahtar kullanımına bağlanır."
- Bağ: 6, 11. haftalar.
- Doğrulama: cihaz bağlama testi.

---

# AS · varlık yönetimi

- **Örnek:** "Her varlık C/I/I+ ile etiketlenir ve yaşam döngüsü belgelenir."
- Bağ: 1, 3. haftalar.
- Doğrulama: S5 varlık listesi.

---

# DR/DU/DT · veri

- **DR (beklemede):** "Yerel veri AEAD ile şifreli."
- **DU (kullanımda):** "Anahtar kullanımdan sonra silinir."
- **DT (aktarımda):** "TLS 1.3 + zincir doğrulama."

---

# CR · kriptografi

- **Örnek:** "Onaylı algoritma, kip ve anahtar uzunluğu; anahtar hiyerarşisi belgeli."
- Bağ: 3, 10. haftalar.
- Doğrulama: algoritma envanteri.

---

# RP · raporlama

- **Örnek:** "Sürümde hassas veri düz loglanmaz."
- Bağ: 4, 6. haftalar.
- Doğrulama: `strings`, günlük denetimi.

---

# DV · geliştirme/süreç

- **Örnek:** "Her değişiklik birleştirilmeden önce incelenir; SBOM güncellenir."
- Bağ: 5, 12, 13. haftalar.
- Doğrulama: süreç kayıtları, SBOM.

---

# Aileden gereksinime · kural

- Projeniz her aileden **en az bir** gereksinim seçer.
- Her gereksinim tehditten türer, blok olarak yazılır.
- Matrise girer, kanıtla bağlanır.

---

<!-- _class: bolum -->

# Ek D · Sık yapılan hatalar

---

# Hata · doğrulanamaz gereksinim

- "Güvenli olmalı" gibi ölçülemez ifade.
- Doğrusu: somut, test edilebilir madde.

---

# Hata · kanıtsız "karşılandı"

- Matriste kanıt sütunu boş.
- Değerlendirici karşılanmamış sayar.

---

# Hata · sessiz devretme

- Karşılanamayan gereksinimi yazmamak.
- Doğrusu: kime/neden/nasıl (S14).

---

# Hata · EAL'i güvenlik miktarı sanmak

- "EAL4 > EAL2 daha güvenli" yanlış.
- EAL derinliktir; güvenlik ST'ye bağlı.

---

# Hata · FIPS'li kütüphane = FIPS uyumlu

- Modül doğrulanmış olsa da uygulama doğru kullanmalı.
- Onaylı kip + doğru anahtar yönetimi.

---

# Hata · kalan riski boş bırakmak

- Hiçbir ürünün kalan riski sıfır değildir.
- Boş "kalan risk" = eksik analiz.

---

<!-- _class: yogun -->

# Kontrol listesi

- [ ] Her gereksinim doğrulanabilir + tekil
- [ ] Her satırda durum/bölüm/doğrulama/kanıt
- [ ] Devredilenler: kime/neden/nasıl
- [ ] Karşılanmayanlar → kalan risk
- [ ] Standart eşlemesi (ETSI/MASVS/CC)
- [ ] En az bir aile başına gereksinim

---

# Son söz (13. hafta)

> Bir gereksinim, tehditten doğar; bir önleme, bir teste ve bir **kanıta** bağlanır; karşılanamıyorsa açıkça
> **devredilir**. Uyum matrisi bu zincirin haritasıdır.
