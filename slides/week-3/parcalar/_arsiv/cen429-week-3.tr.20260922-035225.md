---
marp: true
theme: cen429
paginate: true
lang: tr
title: "CEN429 Hafta 3 — Veri Güvenliği: Aktarımda, Beklemede, Kullanımda"
author: "Dr. Öğr. Üyesi Uğur CORUH"
header: "CEN429 Güvenli Programlama · Hafta 3"
footer: "RTEÜ Bilgisayar Mühendisliği · 2026-2027 Güz"
---

<!-- _class: baslik -->
<!-- _paginate: false -->

# Veri Güvenliği: Aktarımda, Beklemede, Kullanımda

**CEN429 Güvenli Programlama — Hafta 3**

Dr. Öğr. Üyesi Uğur CORUH · 02.10.2026

<!--
Konuşma notu: Bu hafta odak programdan VERİYE kayıyor. Bir sırrın üç hâli var; her hâlin tehdidi ve savunması farklı. Ana fikir: güvenlik kabuğu (derinlemesine savunmanın somut hâli).
-->

---

# Bugünün planı (3 saat)

| Saat | Konu |
| --- | --- |
| 1 | Üç veri hâli · Şifreleme temelleri (AEAD) · IV/nonce/tuz · **Demo 1–3** |
| 2 | Paroladan/ana sırdan anahtar · TLS 1.3 ve pinning · **Demo 4–6** |
| 3 | Beklemede/kullanımda veri · Güvenlik kabukları · **Demo 7–9** · whitebox |

**Öğrenme çıktıları:** ÖÇ.2 (şifreleme, güvenli iletişim) · ÖÇ.4 (güvenli kanal)

<!--
Konuşma notu: Laboratuvarı önceden derleyin. Windows'ta build.ps1, WSL'de build.sh. Kripto tek başlıktan gelir: Linux'ta OpenSSL, Windows'ta BCrypt.
-->

---

# Demolar nasıl çalışıyor?

- Tek kaynak, iki platform: **Windows (Visual Studio 2022)** ve **WSL/Linux (GCC)**
- Kripto ortak başlıktan: **Linux → OpenSSL**, **Windows → BCrypt (CNG)** — OpenSSL kurmaya gerek yok
- Derle: Windows `.\build.ps1` · WSL `./build.sh`
- Çalıştır: Windows `.\demo.ps1` · WSL `sh demo.sh`
- İkili dosyalar her demonun `bin\windows` / `bin/linux` klasöründe

> ⚠️ **Etik:** ağ yalnız `localhost`; sertifikalar bizim; teknikleri yalnız kendi
> bilgisayarınızda deneyin.

---

<!-- _class: bolum -->

# 1. Verinin üç hâli ve güvenlik kabuğu

---

# Bir sırrın üç hâli

| Hâl | Nerede | Tehdit | Savunma |
| --- | --- | --- | --- |
| **Aktarımda** | Ağ | Dinleme, MITM | TLS + pinning + mesaj AEAD |
| **Beklemede** | Disk/DB | Dosya çalınması | Alan şifreleme (AEAD) |
| **Kullanımda** | RAM | Bellek dökümü | Kısa ömür, güvenli silme |

Her hâlin tehdidi de savunması da **farklı**. Hepsini birden düşünmek gerekir.

<!--
Konuşma notu: Öğrencilere sorun: telefonundaki bankacılık uygulamasında bir parola bu üç hâlden hangilerinde bulunur? Cevap: hepsinde.
-->

---

<!-- _class: sema -->

# Ana fikir: güvenlik kabuğu

```text
  +----------------------------------------------+
  |  Kabuk 4: Kanal (TLS 1.3 + pinning)          |
  |  +----------------------------------------+  |
  |  |  Kabuk 3: Oturum (mesaj AEAD + MAC)    |  |
  |  |  +----------------------------------+  |  |
  |  |  |  Kabuk 2: Depolama (AES-GCM)     |  |  |
  |  |  |  +----------------------------+  |  |  |
  |  |  |  | Kabuk 1: Cihaz baglama     |  |  |  |
  |  |  |  |        [ SIR ]             |  |  |  |
  |  |  |  +----------------------------+  |  |  |
  |  |  +----------------------------------+  |  |
  |  +----------------------------------------+  |
  +----------------------------------------------+
```

Saldırgan sırra ulaşmak için **hepsini sırayla** kırmalı = derinlemesine savunma.

---

<!-- _class: bolum -->

# 2. Şifreleme temelleri

---

<!-- _class: yogun -->

# Hangi araç neyi korur?

| Araç | Sağlar | Örnek |
| --- | --- | --- |
| Simetrik şifreleme | Gizlilik | AES, ChaCha20 |
| Asimetrik şifreleme | Gizlilik + anahtar dağıtımı | RSA, EC |
| Özet (hash) | Parmak izi (anahtarsız) | SHA-256 |
| MAC | Bütünlük + kimlik (paylaşılan anahtar) | HMAC |
| İmza | + inkâr edilemezlik | Ed25519 |
| **AEAD** | **Gizlilik + bütünlük birlikte** | **AES-GCM** |

❌ Yalnız şifrelemek bütünlük vermez · ❌ Kendi algoritmanı yazma (Kerckhoffs)

---

# Simetrik + Asimetrik = Hibrit

- **Simetrik (AES):** hızlı, ama iki taraf aynı gizli anahtarı bilmeli
- **Asimetrik (RSA/EC):** anahtar dağıtımını çözer, ama yavaş
- **Hibrit:** asimetrik ile küçük bir **simetrik anahtar** taşınır; veri onunla AEAD'le şifrelenir

> TLS tam olarak budur: ECDHE ile oturum anahtarı → trafik AES-GCM ile.

<!--
Konuşma notu: RSA ile 1 GB dosya şifrelenmez. Asimetrik yalnız anahtarı taşır. Bu ayrımı netleştirin.
-->

---

# Blok mü, akış mı? Kip önemli

AES bir **blok** şifresidir (16 bayt). Uzun veri için **kip** gerekir:

| Kip | Durum |
| --- | --- |
| **ECB** | ❌ desen sızdırır (Demo 3) |
| **CBC** | rastgele IV ister, tek başına bütünlük yok |
| **CTR** | akışa çevirir, nonce tekrarına çok hassas (Demo 2) |
| **GCM** | ✅ CTR + MAC = **AEAD** |

ChaCha20 zaten akış şifresi; + Poly1305 = AEAD.

---

# Özet / MAC / İmza: hangisi ne zaman?

| Soru | Araç |
| --- | --- |
| "Dosya bozuldu mu?" (anahtarsız) | Özet (SHA-256) |
| "Anahtarı bilen biri mi yolladı, değişti mi?" | MAC (HMAC) |
| "Kesinlikle şu kişi imzaladı, inkâr edemez" | İmza (Ed25519) |
| "Hem gizle hem bütünlüğü kanıtla" | **AEAD (AES-GCM)** |

⚠️ Özet tek başına bütünlük **kanıtı değildir** (saldırgan özeti de yeniler).

---

<!-- _class: sema -->

# AEAD: tek çağrıda gizlilik + bütünlük

```text
  Anahtar (32) ----+
  Nonce (12) ------+---> [ AES-256-GCM ] ---> Sifreli metin
  Duz metin -------+                     ---> Etiket (16 bayt)
  AAD (dogrulanir,
      sifrelenmez) -+

  Cozerken: etiket DOGRULANIR.
  Tek bit degistiyse -> cozme REDDEDILIR.
```

<!--
Konuşma notu: AAD'yi vurgulayın: sürüm no, kayıt kimliği gibi bağlanması gereken ama şifrelenmeyecek veriler oraya konur.
-->

---

# Demo 1 — AES-256-GCM ile dosya şifreleme

```c
kripto_rastgele(nonce, 12);              // her mesaja YENI nonce
kripto_gcm_sifrele(anahtar, nonce, 12, NULL, 0,
                   duz, duz_boy, cik+12, etiket);
int ok = kripto_gcm_coz(...);            // etiket dogrulanir
if (!ok) { /* REDDET */ }
```

```text
ADIM 3  Cozuldu ve DOGRULANDI (53 bayt)
ADIM 4  1 bayt degistir -> DOGRULAMA BASARISIZ, REDDEDILDI
ADIM 5  yalniz etiketi degistir -> yine REDDEDILDI
```

---

# Demo 1 — kural

✅ Bir şey şifreliyorsan **AEAD** kullan (AES-GCM / ChaCha20-Poly1305)
✅ Her mesaja **benzersiz nonce**
✅ Etiketi **her zaman doğrula**; başarısızsa **hiçbir çıktı üretme** (fail-closed)
✅ Bütünlüğü ayrı adıma bırakma

<!--
Konuşma notu: "Değerlendirici bir baytı değiştirip uygulamanın sessizce yanlış veri döndürüp döndürmediğine bakar." Kitap tarif 6.18 → AEAD.
-->

---

<!-- _class: bolum -->

# 3. IV / nonce / tuz

---

# Üçü de gizli DEĞİL, ama...

| Kavram | Nerede | Kural | Bozulursa |
| --- | --- | --- | --- |
| **Tuz** | Paroladan anahtar | rastgele, kayıt başına | rainbow tablo |
| **IV** | CBC | rastgele, öngörülemez | ilk blok sızar |
| **Nonce** | CTR/GCM | anahtarla asla tekrar etmesin | anahtar akışı sızar |

Gizli olan tek şey **anahtardır**.

---

<!-- _class: yogun -->

# Nonce tekrarı neden felaket?

CTR/GCM: `C = P ⊕ AA(anahtar, nonce)`

Aynı anahtar **ve** aynı nonce iki mesajda:

```text
C1 = P1 ⊕ AA        C2 = P2 ⊕ AA
C1 ⊕ C2 = P1 ⊕ P2      <-- anahtar akisi yok oldu!
```

Saldırgan **iki düz metnin XOR'unu** ele geçirir. Birini biliyorsa diğerini çözer.

> Gerçek olaylar: WEP kısa IV, Sony PS3 tekrar eden imza değeri.

---

# Demo 2 — nonce tekrarı sızdırır

```text
KOTU (ayni nonce):
  C1 xor C2 = 070e1c08...5c1215
  P1 xor P2 = 070e1c08...5c1215     <-- AYNI = sizdi
  P2 = (C1 xor C2) xor P1 = "Toplam bakiye 45000 TL..."

IYI (farkli nonce):
  C1 xor C2 != P1 xor P2            <-- sizinti YOK
```

✅ Nonce'u rastgele ya da **kalıcı sayaç** olarak üret; asla tekrar etme.

---

# Demo 3 — ECB deseni sızdırır ("penguen")

```text
Orijinal        AES-128-ECB          AES-256-GCM
########        ================     : -..--+%%*-:*
#  ##  ##       =##==####====##      *.#*##:*%+###:
#  #####        =##=====##==###      :+ .- .% +.#%=
########        ================     =%+## #:###%+%
```

❌ ECB: aynı blok → aynı şifreli blok, **şekil okunur kalır**
✅ GCM/CTR: her blok farklı → gürültü

<!--
Konuşma notu: Ünlü "ECB penguen" örneğinin ASCII hâli. Kod incelemesinde 'ecb' geçen her yer bulgudur.
-->

---

<!-- _class: bolum -->

# 4. Paroladan anahtar türetme

---

# Parola doğrudan anahtar olamaz

KDF iki iş yapar:

1. **Tuz:** rastgele → rainbow tablo işe yaramaz, aynı parola fark edilmez
2. **Yavaşlık:** yüzbinlerce tur → her deneme pahalı, kaba kuvvet yavaşlar

| KDF | Maliyet | Ne zaman |
| --- | --- | --- |
| PBKDF2 | CPU (tur) | uyumluluk/FIPS |
| scrypt | CPU + bellek | bellek-zor |
| **Argon2id** | CPU + bellek + paralellik | **birinci tercih** |

---

# Demo 4 — tur sayısı, süre, tuz

```text
1) TUZ: ayni parola + ayni tuz -> AYNI anahtar
        ayni parola + FARKLI tuz -> FARKLI anahtar
2) TUR vs SURE (WSL):
   tur =   1000  ->    0.37 ms
   tur = 100000  ->   39.05 ms
   tur = 600000  ->  209.55 ms   <-- OWASP 2023 asgari
   tur =2000000  ->  628.42 ms
```

✅ Rastgele tuz + Argon2id (ya da yüksek turlu PBKDF2). ❌ Düz/tuzsuz SHA-256.

<!--
Konuşma notu: 200 ms kullanıcıya kabul edilebilir; saldırgana milyar deneme yerine bin deneme demektir. İleri: pepper (gizli, DB'de tutulmaz).
-->

---

<!-- _class: bolum -->

# 5. HKDF, oturum anahtarları, ileri gizlilik

---

<!-- _class: sema -->

# HKDF: ana sırdan türev anahtarlar

```text
  Ana sir --> [Extract (+tuz)] --> PRK
                                    |
       +----------------+----------+----------+
       v                v                     v
  info="sifreleme"  info="MAC"        info="oturum-42"
       |                |                     |
  Sifreleme K.      MAC K.            Oturum-42 K.
```

Farklı `info` → farklı anahtar. Bir amacın anahtarı başka amaca kullanılmaz.

---

# İleri gizlilik (forward secrecy)

Tek yönlü zincir: `K0 = ana sır`, `Kᵢ = HKDF(Kᵢ₋₁)`, her adımda eskisini **sil**.

```text
  K1 -> K2 -> K3 -> K4   (elde yalniz K4 var)
  K4'ten K3, K2, K1 GERI HESAPLANAMAZ (tek yonlu)
```

> Bugünkü anahtar sızsa bile **eski oturumlar** güvende. TLS 1.3'te varsayılan.

---

# Demo 5 — HKDF çıktısı

```text
info='...sifreleme...' -> 2b8b4684...0e577a55
info='...MAC...'       -> 30a302d1...c55dfa84   (farkli)

ILERI GIZLILIK zinciri:
  K1=0630f63f...  K2=def84847...
  K3=54b13f0f...  K4=55524a8f...
  ^ her adimda eski anahtar silindi
```

✅ Amaca/oturuma göre ayrı anahtar · her türetmeye benzersiz `info` · kullanınca sil.

---

<!-- _class: bolum -->

# 6. Aktarımda veri: TLS 1.3

---

<!-- _class: sema -->

# TLS 1.3 el sıkışması

```text
  Istemci                                   Sunucu
    |  --- ClientHello + anahtar payi --->    |
    |  <-- ServerHello + anahtar payi -----   |
    |  <-- {Sertifika}+{Imza}+{Finished} --   |
    |  [ DOGRULA: zincir + sure + ad + pin ]  |
    |  --- {Finished} ------------------->    |
    |  === Uygulama verisi (AEAD) =========   |
```

Tek gidiş-dönüş · her zaman geçici ECDHE → **ileri gizlilik varsayılan**.

---

# Doğrulamanın üç katmanı

| Katman | Soru |
| --- | --- |
| **Zincir** | Güvenilir CA mı imzaladı, süresi/iptali? |
| **Ana makine adı** | Sertifika gerçekten **bu sunucu** için mi? |
| **Sabitleme** | Beklediğim **belirli anahtar** mı? |

⚠️ **OpenSSL varsayılanı: doğrulamaz!** `SSL_VERIFY_PEER` + `SSL_set1_host` şart.

---

# Sabitleme (pinning) ve TOFU

- **Pinning:** sunucunun **açık anahtarının (SPKI)** SHA-256'sını göm. Zincir
  geçerli olsa bile anahtar tutmuyorsa **REDDET**. (Mobilde yaygın.)
- **TOFU:** PKI yoksa ilk anahtarı hatırla, değişirse uyar (SSH modeli).

**TLS 1.2 → 1.3:** tek RTT · yalnız güçlü AEAD takımları · zayıf özellikler kaldırıldı
· downgrade'e karşı minimum sürüm zorla.

---

# Demo 6 — MITM → hostname + pinning

```text
1 Guvensiz  -> SALDIRGAN: KABUL (TEHLIKELI, MITM olurdu)
2 Dogrula   -> GERCEK   : DOGRULANDI, KABUL
3 Dogrula   -> SALDIRGAN: REDDEDILDI (kendi imzali)
4 Pin       -> GERCEK   : pin TUTTU, KABUL
5 Pin       -> SALDIRGAN: pin TUTMADI, REDDEDILDI
```

Yalnız 127.0.0.1, kendi ürettiğimiz sertifikalar. (Windows: WSL'de çalıştırın.)

<!--
Konuşma notu: SSL_set1_host satırını yoruma alıp yeniden derleyin; hangi saldırgan hâlâ yakalanır, hangisi kaçar? Sınıf etkinliği.
-->

---

# "Yalnız TLS'e güvenmeme"

- TLS kanalı korur ama **uç noktalar** güvenilmez olabilir (kök alınmış telefon,
  hatalı pinning)
- Yüksek güvenlikte TLS'in **içine** bir kat daha: mesaj düzeyi AEAD + MAC
- Böylece TLS aşılsa bile gövde hâlâ şifreli → güvenlik kabuğunun en dış 2 katmanı

✅ Sertifika hatasını **yutma**, güven deposuna düşme (fail-closed).

---

<!-- _class: bolum -->

# 7–8. Beklemede ve kullanımda veri

---

# Beklemede veri: dosya/alan şifreleme

- **Tüm disk/dosya:** LUKS, BitLocker, XTS-AES ya da uygulama AEAD
- **Alan/sütun:** yalnız hassas alanları uygulama katmanında AEAD ile şifrele
- **Maskeleme:** `**** **** **** 4242` — şifreleme DEĞİL, maruz kalmayı azaltır
  (log, ekran, test, tokenizasyon)

> Maskeleme şifrelemenin yerine geçmez, tamamlar (farklı tehditler).

---

# Demo 7 — SQLite'ta alanı AES-GCM ile şifrele

```text
Saldirgan DB'yi acti:
  1|Ayse Yilmaz|D1ED7A36...   <- kart alani SIFRELI
Dogru anahtarla uygulama:
  1|Ayse Yilmaz|4242-4242-4242-4242
Yanlis anahtar:
  1|Ayse Yilmaz|(COZULEMEDI - etiket tutmadi)
```

`ad` açık, `kart` şifreli. Anahtar koda gömülü değil (cihaza bağlı KDF).
Linux `sqlite3`, Windows yerleşik `winsqlite3`.

---

# Kullanımda veri: 3 katman

| Katman | Linux | Windows |
| --- | --- | --- |
| Döküm engelle | `RLIMIT_CORE=0` | `SetErrorMode` |
| Belleği kilitle | `mlock` | `VirtualLock` |
| Güvenli sil | `OPENSSL_cleanse` | `SecureZeroMemory` |

\+ **kısa ömür**, kopyalama. `memset` -O2'de silinebilir; cleanse **silinemez**.

---

# Demo 8 — mlock + güvenli silme

```text
Katman 1 - cokme dokumu kapatildi: TAMAM
Katman 2 - mlock ile takasa yazma engellendi: TAMAM
Sir kullaniliyor: dolu bayt = 20
Katman 3 - guvenli silme sonrasi dolu bayt = 0
OPENSSL_cleanse cagrisi makine kodunda kaldi (memset gibi silinmez)
```

**Cihaz bağlama:** anahtarı cihaz parmak izinden **HKDF + AEAD** ile sar → başka
cihazda açılamaz (Demo 9).

---

<!-- _class: bolum -->

# 9. Güvenlik kabukları

---

# Demo 9 — 4 kabukla sar, ters sırada aç

```text
SARMA: sir -> K1(cihaz) -> K2(depo) -> K3(oturum) -> K4(kanal)
   Kabuk 4 = 128 bayt  <- aktarilan paket
ACMA : K4 -> K3 -> K2 -> K1 -> sir   (hepsi TAMAM, sir DOGRU)

Saldiri 1: 1 bit kurcala -> Kabuk 4 RED (etiket tutmadi)
Saldiri 2: baska cihaza kopyala -> dis 3 kabuk acilir,
           Kabuk 1 (cihaz) RED -> sir ACILAMAZ
```

✅ "Hangi tek önlem?" değil, "hangi **katmanlar**?" · bağımsız anahtarlar.

---

<!-- _class: bolum -->

# 10. Whitebox kriptografiye giriş

---

# Neden whitebox?

- Bu haftanın gizli varsayımı: anahtar kullanılırken **bellekte açık durur**
- "Cihazın sahibi saldırgan" belleği okuyabilir → o anı yakalar
- Güvenli silme pencereyi **daraltır**, kapatmaz
- **Whitebox:** anahtarı tablolara gömer, ham hâli **hiç** bellekte görünmez

⚠️ Sihirli değnek değil: oracle/code-lifting'e açık → diğer kabuklarla birlikte.
**Ayrıntı: Hafta 11.**

---

<!-- _class: yogun -->

# Yaygın yanlış anlamalar

- ❌ "Şifreledim, güvendeyim" → şifreleme yalnız gizlilik; bütünlük için AEAD
- ❌ "TLS var, MITM imkânsız" → doğrulama yapılmazsa mümkün (Demo 6)
- ❌ "SHA-256 ile parola sakladım" → tuzsuz/hızlı; Argon2id + tuz gerekir
- ❌ "Nonce gizli olmalı" → hayır, **benzersiz** olmalı; gizli olan anahtar
- ❌ "Kendi şifremi yazarım" → Kerckhoffs: güvenlik anahtarda, algoritmada değil

---

# Proje: bu hafta (S5, S7)

- **S5 — Varlık listesi (taslak):** her hassas varlık; konum, ömür, C/I/I+, koruma
- **S7 — Veri güvenliği + kabuk matrisi:** her varlık × üç hâl × kabuklar; güvenli
  silme politikası

Gereksinim aileleri: `CEN429-DT/DR/DU` (aktarım/beklemede/kullanımda), `AS`, `CR`

> S17 uyum matrisine her gereksinim için satır ekleyin.

---

# Sınıf etkinlikleri

1. **MITM'i durdur:** Demo 6'da `SSL_set1_host`'u kapat → hangi saldırgan kaçar?
2. **Nonce'u tekrarlat:** Demo 1'de sabit nonce → iki şifreli metni XOR'la
3. **Üç veri hâli haritası:** sağlık uygulaması için tehdit/önlem tablosu
4. **KDF maliyeti:** 100 ms veren tur sayısını bul

<!--
Konuşma notu: Grupları 3-4 kişi yapın. Etkinlik 1 ve 3 tartışma için en verimlisi.
-->

---

# Kendini sınama (örnek)

1. AEAD ile AES-CTR farkı?
2. Nonce tekrarı neden felaket?
3. ECB neden kullanılmaz?
4. OpenSSL istemcisinin en tehlikeli varsayılanı?
5. Pinning neyi, hostname doğrulama neyi yakalar?
6. Güvenlik kabuğu nedir, bir örnek?

> Tam liste (20 soru) ve cevaplar ders sitesinde. Quiz-1 bu tarz + kod okuma.

---

<!-- _class: baslik -->

# Gelecek hafta

**Hafta 4 — Kod Sağlamlaştırma: C/C++**

Güvenli bellek yönetimi · sanitizer'lar · derleyici/OS korumaları
(stack canary, ASLR, DEP/NX, CFI) · kontrol akışı düzleştirme

Kaynak: Viega & Messier, Tarif 3.1–3.5, 13.1
