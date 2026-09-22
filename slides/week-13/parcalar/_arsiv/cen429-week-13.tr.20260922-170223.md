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

| Saat | Konu |
| --- | --- |
| 1 | Gereksinim nedir · iyi gereksinim · izlenebilirlik · gereksinim bloğu · devredilen gereksinimler |
| 2 | Ortak Kriterler (TOE, ST, PP, SFR/SAR, EAL) · FIPS 140-3 |
| 3 | ETSI EN 303 645 · GSMA · EMVCo, PCI · OWASP MASVS · dersin gereksinim aileleri · uyum matrisi etkinliği |

Kaynaklar: şema metinleri yerine **açık standartlar** ve **dersin gereksinim kimlikleri**

---

<!-- _class: bolum -->

# 1. Gereksinimden kanıta

---

<!-- _class: yogun -->

# Üç tür gereksinim

| Tür | Soru | Örnek |
| --- | --- | --- |
| **İşlevsel** | Hangi güvenlik işlevi? | Yerel veritabanındaki hassas veri AEAD ile korunmalı |
| **Güvence** | Doğru yapıldığına nasıl güveneceğiz? | Statik analiz raporu ve test sonuçları sunulmalı |
| **Süreç** | Kurum nasıl çalışmalı? | Her değişiklik birleştirilmeden önce incelenmeli |

---

<!-- _class: yogun -->

# Kötü → iyi gereksinim

| Kötü | İyi |
| --- | --- |
| "Uygulama güvenli olmalıdır." | "Sürüm derlemesi yığın koruyucu, PIE ve tam RELRO ile üretilmelidir." |
| "Veriler şifrelenmelidir." | "C sınıfı her varlık beklemede ≥128 bit düzeyinde AEAD ile şifrelenmelidir." |
| "Anahtarlar iyi yönetilmelidir." | (1) Her anahtarın amacı, kripto-periyodu, imhası belgelenmeli · (2) iş bitince silinmeli |

**Tekil · doğrulanabilir · izlenebilir · uygulanabilir · "ne", "nasıl" değil**

MUST/SHALL (-malıdır) · SHOULD (önerilir, uyulmazsa gerekçe) · MAY (isteğe bağlı)

---

<!-- _class: yogun -->

# İzlenebilirlik: uyum matrisi

```text
Gereksinim → Tehdit/varlık (S4, S5) → Önlem kartı → Kod → Doğrulama → Kanıt → Durum
```

| Kimlik | Durum | Bölüm | Doğrulama | Kanıt |
| --- | --- | --- | --- | --- |
| DR-01 | Karşılandı | S7.2 | Bir bayt değişince açma reddedilir | Test çıktısı |
| AP-03 | Karşılandı | S12.1 | `strings` taraması | CI kaydı |
| AP-07 | **Devredildi** | S14.2 | — | Gerekçe |
| DT-04 | Karşılanmadı | — | — | Kalan risk S16.4 |

**İleri:** her gereksinim → önlem + test? · **Geri:** her önlem → gereksinim/tehdit?

---

# Gereksinim bloğu kalıbı

```text
[Standart] Gereksinim kimliği — DURUM
Gereksinim metni.
Nasıl karşılandığı; ilgili önlem kartlarına başvuru.
```

- Sahada: kılavuzun her bölümü iki şemanın gereksinimleriyle açılır → **karşılandı / üst uygulamaya devredildi**
- Değerlendirici gereksinimden kanıta **tek bakışta** gider

---

<!-- _class: yogun -->

# Devredilen gereksinimler

| Kime? | Gereksinim |
| --- | --- |
| Üst uygulama | Güvenli kurulum ve güncelleme |
| Üst uygulama | Uzlaşmanın arka uca ve kullanıcıya bildirilmesi |
| Üst uygulama | Kendi kaynak kodunun korunması |
| Üst uygulama | Parametre olarak verilen varlıkların (sunucu adresi, sertifika, pin) korunması |
| İşletim sistemi | Yalıtım, desteklenen en düşük sürüm |
| Donanım | Kullanılmıyorsa "beklenti yok" |

⚠️ Devretmek ≠ yok saymak: **kime, neden, nasıl** · Proje: **S14**

---

<!-- _class: bolum -->

# 2. Ortak Kriterler ve FIPS 140-3

---

<!-- _class: yogun -->

# Ortak Kriterler (ISO/IEC 15408)

| Kavram | Anlamı | Dersteki karşılığı |
| --- | --- | --- |
| TOE | Değerlendirilen ürün | Değerlendirme hedefi (S0/S1) |
| ST | Ürüne özgü güvenlik hedefi | Güvenlik kılavuzu |
| PP | Ürün sınıfı için ortak gereksinim | Gereksinim aileleri |
| SFR | İşlevsel gereksinim (FCS, FDP, FIA…) | İşlevsel gereksinimler |
| SAR | Güvence gereksinimi (ADV, ATE, AVA…) | Güvence gereksinimleri |
| EAL | SAR paketleri 1–7 | — |

CEM (ISO/IEC 18045) · CCRA ile karşılıklı tanıma

---

<!-- _class: yogun -->

# EAL düzeyleri

| Düzey | Adı | Tipik |
| --- | --- | --- |
| EAL1–2 | İşlevsel / yapısal test | Düşük tehdit |
| EAL3 | Yöntemli test ve denetim | Orta |
| **EAL4** | Yöntemli tasarım, test, inceleme | Ticari ürünlerde en yaygın üst düzey |
| EAL5–6 | Yarı biçimsel | Akıllı kart, güvenli eleman (EAL5+/6+) |
| EAL7 | Biçimsel doğrulama | Çok yüksek risk |

⚠️ Yüksek EAL = **daha derin değerlendirme**, "daha güvenli" değil · "+" = ek güvence (çoğu zaman zafiyet değerlendirmesi)

Saldırı potansiyeli (AVA_VAN): **süre · uzmanlık · ürün bilgisi · fırsat penceresi · ekipman**

---

<!-- _class: yogun -->

# FIPS 140-3

| Düzey | Öne çıkan |
| --- | --- |
| 1 | Onaylı algoritmalar; fiziksel koruma yok (yazılım kütüphaneleri) |
| 2 | Kurcalama **izi**, rol tabanlı kimlik doğrulama |
| 3 | Kurcalamaya **direnç + yanıt**, kimlik tabanlı doğrulama (HSM) |
| 4 | Ortam saldırılarına tam koruma |

Modül: onaylı algoritma (CAVP) · **öz testler** · roller ve hizmetler · **sıfırlama** · güvenlik politikası

⚠️ "FIPS doğrulanmış kütüphane kullanıyoruz" ≠ uygulama doğrulanmış

---

<!-- _class: bolum -->

# 3. Sektör setleri ve dersin gereksinimleri

---

<!-- _class: yogun -->

# ETSI EN 303 645: 13 başlık

| | | |
| --- | --- | --- |
| 5.1 Varsayılan parola yok | 5.2 Zafiyet bildirimi | 5.3 Yazılımı güncel tut |
| 5.4 Hassas parametreleri güvenle sakla | 5.5 Güvenli iletişim | 5.6 Saldırı yüzeyini küçült |
| 5.7 Yazılım bütünlüğü | 5.8 Kişisel veri güvenliği | 5.9 Kesintiye dayanıklılık |
| 5.10 Telemetriyi incele | 5.11 Veri silme kolay | 5.12 Kurulum/bakım kolay |
| 5.13 Girdiyi doğrula | | |

Dönemin konularının kısa özeti gibi

---

<!-- _class: yogun -->

# GSMA, EMVCo, PCI, OWASP

| Belge | Kapsam |
| --- | --- |
| GSMA IoT yönergeleri · SAS · NESAS | IoT · SIM/eSIM tesisleri · ağ ekipmanı |
| EMVCo yazılım tabanlı mobil ödeme | Uygulama koruma · kimlik ve bağlama · varlık · DR/DU/DT · raporlama · kripto · geliştirme |
| PCI MPoC | Telefonu ödeme terminali olarak kullanma |
| PCI DSS · SSF | Kart verisi ortamı · güvenli ödeme yazılımı |
| OWASP MASVS / MASTG | STORAGE · CRYPTO · AUTH · NETWORK · PLATFORM · CODE · RESILIENCE · PRIVACY |

---

<!-- _class: yogun -->

# Gereksinimleri plana aktarmak

1. **Uygulanır mı?** Değilse gerekçe
2. **Sorumlu kim?** Biz / devret (S14)
3. **Varlıklara bağla** (S5): yaşam döngüsü ve C/I/I+ dolu mu?
4. **Tehditlere bağla** (S4): karşılığı yoksa model eksik ya da gereksinim gereksiz
5. **Önlem + doğrulama** (S6–S13, S16)
6. **Sürüm planı** · karşılanamayan → kalan risk

---

<!-- _class: yogun -->

# Dersin gereksinim aileleri

| Aile | Örnek |
| --- | --- |
| **AP** uygulama koruması | Derleyici korumaları · gizleme · günlük yok · öz bütünlük · tepki · geri alma reddi · güvenli güncelleme |
| **ID** kimlik ve bağlama | Doğrulanan varlıklar · karşılıklı kimlik doğrulama · cihaz/sürüm bağlama |
| **AS** varlık | Yaşam döngüsü ve C/I/I+ · ortak statik anahtar yok · sabitler korunur |
| **DR / DU / DT** | AEAD + silme · kısa ömür · TLS ≥1.2 + mesaj düzeyi |
| **RP** raporlama | Açık günlük yok · bilgi vermeyen hata · hata ayıklama kipi yok |
| **CR** kripto | Standart algoritma · hiyerarşi ve periyot · silme · entropi |
| **DV** geliştirme | Korumalı dallar · inceleme · sürüm kimliği · SBOM · CI testleri |

---

# Uyum matrisi etkinliği (25 dk)

1. Projenize uygulanan ≥ **15** gereksinim; uygulanmayanlara gerekçe
2. Durum · bölüm · doğrulama yöntemi
3. "Karşılandı" satırlarının kanıtını **şimdi** göster — gösteremiyorsan durumu değiştir
4. İki takım matris değiştirir, üçer satırı "değerlendirici gibi" sorgular

---

<!-- _class: bolum -->

# 4. Proje ve kapanış

---

# Proje: S14 ve S17

- [ ] **S17 uyum matrisi:** uygulanan bütün gereksinimler; durum, bölüm, doğrulama, kanıt
- [ ] **S14 varsayımlar ve devredilenler:** platformlar, kapsam dışı, ortam; kime/neden/nasıl
- [ ] **S1 kaynaklar:** ETSI EN 303 645, OWASP MASVS, NIST SSDF, CERT
- [ ] **S5** varlık tablosunu gereksinimlere göre gözden geçir

---

# Kendini sınama

1. İşlevsel ve güvence gereksinimi farkı?
2. İyi gereksinimin beş özelliği?
3. İleri ve geri izlenebilirlik neyi sorar?
4. "Devredildi" ne zaman, nasıl yazılır?
5. EAL4 her zaman EAL2'den güvenli mi?
6. ST ile PP farkı?
7. CEM saldırı potansiyeli etkenleri?
8. FIPS 140-3 düzey 2 ile 3 farkı?

<!-- Konuşma notu: 1) İşlev vs güven. 2) Tekil, doğrulanabilir, izlenebilir, uygulanabilir, ne-odaklı. 3) Gereksinim→önlem / önlem→gereksinim. 4) Başka taraf karşılıyorsa; kime, neden, nasıl. 5) Hayır, derinlik. 6) Ürün sınıfı vs ürün. 7) Süre, uzmanlık, bilgi, fırsat, ekipman. 8) İz vs direnç+yanıt. -->

---

# Gelecek hafta

**Hafta 14 — Tigress ve çeşitlendirme**

- Kaynaktan kaynağa gizleyici olarak Tigress
- Dönüşümleri birleştirme, tohumla çeşitlendirme
- Maliyet ve dayanıklılığın değerlendirilmesi
