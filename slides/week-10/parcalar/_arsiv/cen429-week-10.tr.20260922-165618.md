---
marp: true
theme: cen429
paginate: true
lang: tr
title: "CEN429 Hafta 10 — Sertifikalar ve Kriptografik Yöntemler"
author: "Dr. Öğr. Üyesi Uğur CORUH"
header: "CEN429 Güvenli Programlama · Hafta 10"
footer: "RTEÜ Bilgisayar Mühendisliği · 2026-2027 Güz"
---


<!-- _class: baslik -->
<!-- _paginate: false -->

# Sertifikalar ve Kriptografik Yöntemler

**CEN429 Güvenli Programlama — Hafta 10**

Dr. Öğr. Üyesi Uğur CORUH · 20.11.2026

<!--
Konuşma notu: Bu hafta kriptografinin yapı taşlarını ve PKI'yi uçtan uca kuruyoruz: kipler, MAC, RSA ve eliptik eğriler, imza, sertifika zinciri, iptal ve anahtar saklama.
-->

---

# Bugünün planı (3 saat)

| Saat | Konu |
| --- | --- |
| 1 | Kriptografinin haritası · algoritma ve anahtar uzunluğu · kipler ve dolgu · MAC, HMAC, yeniden oynatma |
| 2 | RSA (OAEP, PSS) ve eliptik eğriler · dijital imza · Diffie–Hellman ve araya girme |
| 3 | PKI · X.509 · OpenSSL ile kök → ara → uç zinciri · CRL/OCSP · PKCS#11, SoftHSM · kuantum sonrası |

**Laboratuvar:** OpenSSL 3 · boş bir çalışma klasörü · üretilen anahtarlar yalnız ders içindir

---

<!-- _class: bolum -->

# 1. Algoritmalar, kipler ve MAC

---

<!-- _class: yogun -->

# Beş iş, beş araç

| İş | Güncel | Terk edilen |
| --- | --- | --- |
| Gizlilik | AES-256-GCM, ChaCha20-Poly1305 | DES, 3DES, RC4 |
| Bütünlük + kimlik | HMAC-SHA-256, CMAC | MD5 tabanlı MAC |
| Parmak izi | SHA-256/384, SHA-3 | MD5, SHA-1 |
| Anahtar değişimi | X25519, ECDHE | 1024 bit DH, RSA ile taşıma |
| İmza | Ed25519, ECDSA P-256, RSA-PSS ≥ 3072 | DSA, RSA v1.5 (yeni tasarımda) |

Kitap (Tarif 5.16): **standart algoritma + hata yapmaya dirençli API** — ilke aynı, algoritmalar güncel

---

<!-- _class: yogun -->

# Güvenlik düzeyi (NIST SP 800-57)

| Düzey | Simetrik | Özet | RSA / DH | Eliptik eğri |
| --- | --- | --- | --- | --- |
| 112 | (3DES, eski) | SHA-224 | 2048 | 224 |
| **128** | **AES-128** | **SHA-256** | **3072** | **256** |
| 192 | AES-192 | SHA-384 | 7680 | 384 |
| 256 | AES-256 | SHA-512 | 15360 | 512 |

Yeni tasarım: **en az 128** · RSA-2048, 2030'dan sonra yeni kullanımda yetersiz · ECC aynı güvenlik, çok kısa anahtar

⚠️ Hataların çoğu algoritmada değil **birleştirmede** → TLS 1.3, AEAD, HPKE, Noise

---

<!-- _class: yogun -->

# Kipler

| Kip | Gizlilik | Bütünlük | Dolgu | Değerlendirme |
| --- | :-: | :-: | :-: | --- |
| ECB | ✗ desen | ✗ | ✓ | **Kullanmayın** |
| CBC | ✓ (IV tahmin edilemez) | ✗ | ✓ | Ayrı MAC · dolgu kâhinine dikkat |
| CTR | ✓ (nonce benzersiz) | ✗ | — | Ayrı MAC |
| **GCM** | ✓ | ✓ | — | **Önerilen** (AEAD) |
| **ChaCha20-Poly1305** | ✓ | ✓ | — | **Önerilen**; AES donanımı yoksa hızlı |

---

# Dolgu kâhini (2002 →)

- PKCS#7: 3 bayt eksik → `03 03 03`
- Çözücü "**dolgu geçersiz**" ile "MAC geçersiz"i **ayırt edilebilir** biçimde bildiriyorsa (ileti, süre)
- → saldırgan şifreli baytları değiştirip tepkiye bakarak mesajı **bayt bayt** çözer
- POODLE, Lucky Thirteen

**Savunma:** AEAD · CBC ise şifrele-sonra-MAC, MAC dolgudan **önce** · bütün hatalar **tek ve aynı**

---

<!-- _class: yogun -->

# HMAC

```text
HMAC(K, m) = H( (K ⊕ opad) ‖ H( (K ⊕ ipad) ‖ m ) )
```

- Düz `H(K ‖ m)` → **uzunluk uzatma**: anahtarsız `H(K ‖ m ‖ ek)` hesaplanır
- Kendi MAC'inizi özetten türetmeyin (Tarif 6.19)

```bash
printf 'tutar=100;alici=TR00' | openssl dgst -sha256 -mac HMAC -macopt hexkey:$(openssl rand -hex 32)
```

---

<!-- _class: yogun -->

# Şifreleme + MAC: üç yol

| Yöntem | Örnek | Değerlendirme |
| --- | --- | --- |
| **Şifrele-sonra-MAC** | IPsec ESP, TLS EtM | **Doğru**: MAC önce, geçersizse çözme yok |
| MAC-sonra-şifrele | Eski TLS (CBC) | Dolgu kâhini |
| Şifrele-ve-MAC | Eski SSH | Düz metin hakkında sızıntı |

Kendin birleştirirsen (Tarif 6.18): **iki ayrı anahtar** (HKDF) · EtM · MAC'e IV ve bağlam · sabit zamanlı karşılaştırma

---

<!-- _class: yogun -->

# Yeniden oynatma (Tarif 6.21)

MAC **değişmedi** der, **yeni** demez → "100 TL gönder" on kez

| Yöntem | Not |
| --- | --- |
| **Sayaç** | En güvenilir; sayaç MAC'in içinde |
| Zaman damgası | Saat eşzamanı; pencere içi tekrar için ek önlem |
| Sunucunun tek kullanımlık değeri | Sunucu kullanılanları hatırlar |

Ödemede: kart **işlem sayacı** (ATC) kriptograma girer · tek kullanımlık anahtar · sayaç = **I+** varlık

---

<!-- _class: bolum -->

# 2. RSA, eliptik eğriler, imza, DH

---

<!-- _class: yogun -->

# RSA: doğru dolguyla

| İş | Doğru | Eskimiş |
| --- | --- | --- |
| Şifreleme | **RSA-OAEP** (SHA-256) | PKCS#1 v1.5 (dolgu kâhini, 1998 →) |
| İmza | **RSA-PSS** | PKCS#1 v1.5 imza |

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:3072 -out rsa_ozel.pem
openssl pkeyutl -encrypt -pubin -inkey rsa_acik.pem -in oturum.key -out oturum.enc \
    -pkeyopt rsa_padding_mode:oaep -pkeyopt rsa_oaep_md:sha256
openssl dgst -sha256 -sign rsa_ozel.pem -sigopt rsa_padding_mode:pss -out belge.sig belge.txt
```

Asimetrik yalnız **anahtar taşıma/anlaşma** ve **imza** için; veri simetrik (hibrit)

---

<!-- _class: yogun -->

# Eliptik eğriler

| Algoritma | İş | Not |
| --- | --- | --- |
| **Ed25519** | İmza | Deterministik, hızlı |
| **X25519** | Anahtar anlaşması | TLS 1.3, SSH, Signal varsayılanı |
| ECDSA P-256 | İmza | Her imzada **benzersiz, gizli** `k` |
| ECDH P-256 | Anahtar anlaşması | FIPS sistemlerinde yaygın |

🚨 Aynı `k` iki imzada → **özel anahtar** hesaplanır (2010 oyun konsolu, 2013 mobil cüzdanlar) → Ed25519 / RFC 6979

---

<!-- _class: yogun -->

# Dijital imza: nerede, nasıl doğrulanır?

| Kullanım | İmzalanan |
| --- | --- |
| Güncelleme | Paket (1. hafta T6) |
| Kod imzalama | Çalıştırılabilir, mobil paket |
| Sertifika | Açık anahtar + kimlik (CA) |
| TLS | El sıkışma özeti (`CertificateVerify`) |

```c
if (EVP_DigestVerifyInit(ctx, NULL, NULL, NULL, acik) == 1)     /* Ed25519 */
    sonuc = EVP_DigestVerify(ctx, imza, imza_n, veri, n);       /* 1 / 0 / <0 */
```

MAC'ten farkı: herkes doğrular, yalnız sahibi imzalar → **inkâr edilemezlik**

---

# İmza doğrulamanın üç tuzağı

1. **Dönüş değeri:** `if (sonuc)` → negatif **hata** değeri "geçerli" sayılır → `== 1`
2. **Ne imzalandı?** Yalnız içerik → eski ama geçerli imzalı paket geri yüklenir → **sürüm ve hedef** de imzalı olmalı, eskiyi reddet
3. **Hangi anahtarla?** Paketin içinde gelen anahtarla doğrulamak **hiçbir şey** kanıtlamaz → gömülü ya da güvenilir zincirden

---

# Diffie–Hellman ve araya girme

```text
 İstemci ──A'nın değeri──▶ Araya giren ──M'nin değeri──▶ Sunucu
 İstemci ◀──M'nin değeri── Araya giren ◀──B'nin değeri── Sunucu
      sır 1 (İstemci↔M)                   sır 2 (M↔Sunucu)
```

- DH **kiminle** anlaşıldığını söylemez → her mesaj aradakinden geçer
- ✅ **İmzalı DH** (Tarif 8.18 → ECDHE + Ed25519/ECDSA): TLS 1.3 `CertificateVerify`
- Geçici DH + silme → **ileri gizlilik**
- PKI yoksa: TOFU · parmak izi karşılaştırma · PAKE (OPAQUE, SPAKE2)

---

<!-- _class: bolum -->

# 3. PKI ve sertifikalar

---

<!-- _class: yogun -->

# PKI bileşenleri

| Bileşen | Görevi |
| --- | --- |
| **CA** | Açık anahtarı imzalayıp sertifika çıkarır |
| **RA** | Kimliği doğrular (kurum, ACME ile alan adı) |
| **Kök CA** | Kendini imzalar, **çevrimdışı**, HSM, anahtar töreni |
| **Ara CA** | Günlük sertifikaları çıkarır; ele geçerse yalnız o iptal |
| **Uç sertifika** | Sunucu, kişi, cihaz |
| **Güven deposu** | Güvenilen kökler |
| **İptal** | CRL, OCSP |

---

# Doğrulama: dört soru (Tarif 10.4)

1. **Zincir:** imzalar köke kadar doğrulanıyor mu?
2. **Geçerlilik:** tarihler içinde mi?
3. **Kullanım:** anahtar kullanımı, EKU · ara CA'da `CA:TRUE`
4. **Ad ve iptal:** SAN bu sunucu mu? İptal edilmiş mi?

3\. hafta: `SSL_CTX_set_verify` + `SSL_set1_host` = 1. ve 4. sorular

---

<!-- _class: yogun -->

# X.509 v3

| Alan | Anlamı |
| --- | --- |
| Seri no | CA içinde benzersiz, CRL kullanır |
| Düzenleyen / Konu | CA / sahibi |
| Geçerlilik | `notBefore` – `notAfter` |
| **SPKI** | Açık anahtar → 3. haftadaki **sabitleme** bunun özeti |
| Uzantılar | Temel kısıtlar, anahtar kullanımı, EKU, **SAN**, CRL/OCSP adresi |

DER (ikili) · PEM (Base64, `-----BEGIN CERTIFICATE-----`) · ⚠️ Ad denetimi **SAN**'a (RFC 6125), CN'ye değil

---

<!-- _class: yogun -->

# OpenSSL: kök ve ara CA

```bash
openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out kok.key
openssl req -x509 -new -key kok.key -sha256 -days 3650 -out kok.crt \
  -subj "/CN=CEN429 Lab Kok CA" \
  -addext "basicConstraints=critical,CA:TRUE" -addext "keyUsage=critical,keyCertSign,cRLSign"

openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out ara.key
openssl req -new -key ara.key -out ara.csr -subj "/CN=CEN429 Lab Ara CA"
openssl x509 -req -in ara.csr -CA kok.crt -CAkey kok.key -CAcreateserial -days 1825 -sha256 \
  -out ara.crt -extfile ara.ext        # CA:TRUE,pathlen:0
```

⚠️ Kök sertifikayı **hiçbir güven deposuna eklemeyin**

---

<!-- _class: yogun -->

# OpenSSL: sunucu sertifikası ve doğrulama

```bash
openssl req -new -key sunucu.key -out sunucu.csr -subj "/CN=localhost"
openssl x509 -req -in sunucu.csr -CA ara.crt -CAkey ara.key -CAcreateserial -days 90 \
  -sha256 -out sunucu.crt -extfile sunucu.ext
# sunucu.ext: CA:FALSE · digitalSignature · serverAuth · SAN=DNS:localhost,IP:127.0.0.1

openssl verify -CAfile kok.crt -untrusted ara.crt sunucu.crt    # OK
openssl verify -CAfile kok.crt sunucu.crt                       # HATA: zincir eksik
```

Sahada sık hata: sunucu ara sertifikayı **göndermez**

---

# Sınıf etkinliği: zinciri boz

1. Sunucuyu **kök** ile imzala, ara zincirde kalsın
2. Ara CA'yı `CA:FALSE` üret, sunucuyu onunla imzala
3. `-days 0`: süresi dolmuş sertifika
4. SAN `DNS:baska.ornek` → `s_client -verify_hostname localhost`

Her adımda `openssl verify` çıktısını yaz

---

<!-- _class: yogun -->

# İptal: CRL, OCSP, zımbalama

| Yöntem | Artı | Eksi |
| --- | --- | --- |
| **CRL** | Basit, önbelleklenir | Büyür; aralıkta iptal görülmez |
| **OCSP** | Anlık | Gecikme, gizlilik, erişilemezse? |
| **OCSP zımbalama** | Gizli ve hızlı | Sunucu yapılandırması |

```bash
openssl verify -crl_check -CAfile kok.crt -untrusted ara.crt -CRLfile ara.crl sunucu.crt
```

🚨 **Yumuşak başarısızlık:** yanıtlayıcıya ulaşılamazsa kabul → araya giren engeller = **fail-open** → Must-Staple, kısa ömürlü sertifika

---

<!-- _class: yogun -->

# HSM, PKCS#11, SoftHSM

| Kavram | Açıklama |
| --- | --- |
| HSM | Kurcalamaya dayanıklı, FIPS 140-3; anahtar **dışarı çıkmaz** |
| PKCS#11 | Standart C API (Cryptoki) |
| Öznitelik | `CKA_SENSITIVE`, `CKA_EXTRACTABLE=false` |
| SoftHSM | Yazılım benzetimi: geliştirme ve test |

```bash
softhsm2-util --init-token --free --label "cen429" --pin 1234 --so-pin 5678
pkcs11-tool --module /usr/lib/softhsm/libsofthsm2.so --login --pin 1234 \
            --keypairgen --key-type EC:prime256v1 --label imza-anahtari
```

⚠️ SoftHSM ≠ HSM (anahtar diskte) · değeri: aynı kod üretimde gerçek HSM'e bağlanır

<!-- Konuşma notu: Ödemede hiyerarşinin tepesi sunucuda HSM'de; telefona inen anahtarlar HSM'de üretilip cihaza bağlanır; kütüphane hesap anahtarı üretmez. Kılavuzda her algoritma dayandığı standartla listelenir. -->

---

<!-- _class: yogun -->

# Kuantum sonrası: kripto çevikliği

| Durum | Ne değişiyor? |
| --- | --- |
| Simetrik, özet | Sınırlı etki: AES-256, SHA-384/512 |
| Anahtar anlaşması | **ML-KEM** (FIPS 203, 2024) · TLS'te X25519 ile **karma** |
| İmza | **ML-DSA** (FIPS 204), **SLH-DSA** (FIPS 205) |
| Takvim | RSA ve ECC 2030'dan sonra aşamalı bırakılıyor |

"Şimdi topla, sonra çöz" · Algoritma adını koda gömme → **anahtar sürümü + algoritma kimliği** (3. hafta)

---

<!-- _class: bolum -->

# 4. Proje ve kapanış

---

# Proje: S8 ve S11 taslağı

- [ ] **S8 algoritma envanteri:** amaç, anahtar uzunluğu, kip, standart, kütüphane · eskimiş varsa geçiş planı
- [ ] **S8 anahtar yaşam döngüsü:** üretim, saklama, kripto-periyot, yenileme, imha
- [ ] **S11 güvenli iletişim:** TLS sürümü, doğrulama, SPKI + yedek pin, mesaj düzeyi koruma
- [ ] Güncelleme/yapılandırma dosyasına **Ed25519 imza** + geri almayı reddet
- [ ] Test sertifikaları için kök → ara → uç zinciri (kök anahtar depoya **girmez**)

---

# Kendi başına çalış (not verilmez)

1. HMAC ile düz `H(K ‖ m)` · uzunluk uzatma
2. RSA-3072 ile Ed25519: boyut ve hız
3. `imza_dogrula`: `if (sonuc)` ile `== 1`
4. Zinciri bozmak: dört senaryo
5. `s_server` + `s_client`: ara sertifika olmadan
6. `openssl ca` ile iptal ve CRL
7. Sayaçlı, yeniden oynatmaya dayanıklı AES-GCM iletisi
8. SoftHSM anahtarıyla PKCS#11 imzası; dışa aktarma denemesi

---

# Kendini sınama

1. 128 bit düzey için RSA ve ECC uzunluğu?
2. Dolgu kâhini ne zaman mümkün, iki savunma?
3. Neden HMAC, neden `H(K ‖ m)` değil?
4. Neden şifrele-sonra-MAC?
5. MAC yeniden oynatmayı neden önlemez?
6. RSA'da hangi dolgular önerilir?
7. ECDSA'da aynı `k` neden felaket?

<!-- Konuşma notu: 1) 3072 / 256. 2) Hata ayırt edilebiliyorsa; AEAD, EtM + tek hata. 3) Uzunluk uzatma. 4) Geçersiz ileti hiç çözülmez. 5) Yeni olduğunu kanıtlamaz; sayaç. 6) OAEP, PSS. 7) Özel anahtar hesaplanır. -->

---

# Kendini sınama (devam)

8. `EVP_DigestVerify` için `if (sonuc)` neden hatalı?
9. Kimliksiz DH neden açık, TLS 1.3 nasıl çözer?
10. Kök CA neden çevrimdışı, ara CA neden var?
11. Ad denetimi neden SAN'a?
12. OCSP yumuşak başarısızlığı neden tehlikeli?
13. SoftHSM ile HSM farkı?
14. Kripto çevikliği nedir?

<!-- Konuşma notu: 8) Negatif hata geçerli sayılır. 9) Araya girme; imzalı el sıkışma. 10) Kök ele geçerse her şey çöker. 11) Standart ve istemciler SAN'a bakar. 12) Fail-open. 13) Anahtar diskte; PKCS#11 uyumlu kod. 14) Algoritmayı yapılandırmayla değiştirebilmek. -->

---

# Gelecek hafta

**Hafta 11 — Whitebox kriptografi**

- Beyaz kutu ve kara kutu saldırgan modelleri
- Tablo tabanlı gerçekleştirim fikri
- Katmanlı savunma içinde yeri
