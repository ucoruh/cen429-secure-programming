---
marp: true
theme: cen429
paginate: true
lang: tr
title: "CEN429 Hafta 16 — Final Dönemi: Quiz-2"
author: "Dr. Öğr. Üyesi Uğur CORUH"
header: "CEN429 Güvenli Programlama · Hafta 16"
footer: "RTEÜ Bilgisayar Mühendisliği · 2026-2027 Güz"
---


<!-- _class: baslik -->
<!-- _paginate: false -->

# Final Dönemi: Quiz-2

**CEN429 Güvenli Programlama — Hafta 16**

Dr. Öğr. Üyesi Uğur CORUH · 04–17.01.2027

<!--
Konuşma notu: Quiz-2 dönemi: 9-14. haftaların kavramlarını tekrar ediyoruz; bu sunum çalışma rehberidir.
-->

---

# Quiz-2: ne, ne zaman?

- Kapsam: **9–14. haftalar** · finalin **%30**'u
- Tarih, saat, yer, süre, biçim: **ders sınıfında**
- En iyi hazırlık: Kendini sınama soruları · 10. hafta OpenSSL adımları · 13. hafta uyum matrisi

---

<!-- _class: yogun -->

# Konu haritası

| Hafta | Odak |
| --- | --- |
| 9 | Gizlemenin amacı, maliyeti, ölçülmesi (güç, dayanıklılık, maliyet) |
| 10 | Güvenlik düzeyi · kip ve dolgu · HMAC, EtM, yeniden oynatma · OAEP/PSS, Ed25519/X25519 · imza · DH · PKI, X.509 · CRL/OCSP · PKCS#11 |
| 11 | Beyaz/kara kutu modelleri · whitebox'ın katmanlı savunmadaki yeri ve sınırları |
| 12 | 13 adım · gereksinim şablonu · bulgu–aksiyon · etki analizi · delta değerlendirme |
| 13 | İyi gereksinim · uyum matrisi · devredilenler · CC, EAL · FIPS 140-3 · ETSI, EMVCo, PCI, MASVS |
| 14 | Çeşitlendirmenin amacı · maliyet ve etkinlik ölçümü |

---

<!-- _class: yogun -->

# Sık karıştırılanlar

| A | B | Fark |
| --- | --- | --- |
| CBC | GCM | Gizlilik + dolgu · AEAD, dolgu yok |
| OAEP | PSS | Şifreleme · imza |
| Ed25519 | X25519 | İmza · anahtar anlaşması |
| CN | SAN | Ad denetimi SAN'a |
| CRL | OCSP | Liste · anlık sorgu |
| ST | PP | Ürün hedefi · ürün sınıfı seti |
| EAL | Saldırı potansiyeli | Derinlik · saldırganın kaynağı |
| Karşılandı | Devredildi | Ürün karşılar · başka taraf (kime, neden, nasıl) |
| Etki analizi | Delta değerlendirme | Belgeler · yalnız değişeni değerlendirir |

---

<!-- _class: yogun -->

# Örnek sorular (10. hafta)

1. RSA-2048 + AES-256: güvenlik düzeyi?
2. "Dolgu geçersiz" ile "MAC geçersiz" ayrı iletiler: risk?
3. `if (EVP_DigestVerify(...))` neden hatalı?
4. `verify` ara sertifika olmadan neden başarısız?
5. OCSP'ye ulaşamayınca kabul: hangi örüntü?
6. Kimliksiz DH'ye karşı ne yapılır?

<!-- Konuşma notu: 1) ~112 bit; RSA-3072 ya da X25519. 2) Dolgu kâhini; tek hata, AEAD. 3) Negatif hata geçerli sayılır; == 1 ve sürüm imzalı olmalı. 4) Zincir köke ulaşmıyor. 5) Fail-open; Must-Staple, kısa ömür. 6) İmzalı DH, CertificateVerify. -->

---

<!-- _class: yogun -->

# Örnek sorular (12–13. haftalar)

7. TOE neden benzersiz tanımlanır?
8. Etki analizi ile delta değerlendirme ilişkisi?
9. "Uygulama güvenli olmalıdır" nasıl düzeltilir?
10. Kanıtsız "karşılandı" ne anlama gelir?
11. Kütüphane güvenli güncellemeyi karşılayamıyorsa?
12. EAL4+ her zaman EAL2'den güvenli mi?
13. FIPS doğrulanmış kütüphane = uygulama FIPS uyumlu mu?

<!-- Konuşma notu: Cevaplar 16. hafta sayfasında açılır kutularda. -->

---

# İyi şanslar

- Cevapları 16. hafta sayfasında
- Kılavuzunuz bir **portfolyo** öğesidir (gizli bilgi içermediğinden emin olun)
