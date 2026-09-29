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
| 1 | Veri durumları · Şifreleme temelleri **Demo 1** · Rastgele sayılar · Kripto API'leri · IV/nonce **Demo 2–3** |
| 2 | Parola ve HKDF **Demo 4–5** · Anahtar yönetimi · TLS 1.3 **Demo 6** · TLS'i kodda kurmak, fail-open |
| 3 | Beklemede **Demo 7** · Maskeleme · Kullanımda **Demo 8** · Kabuklar **Demo 9** · Whitebox · Proje |

**Öğrenme çıktıları:** ÖÇ.2 (şifreleme, güvenli iletişim) · ÖÇ.4 (güvenli kanal)

<!--
Konuşma notu: Laboratuvarı önceden derleyin. Windows'ta build.ps1, WSL'de build.sh. Kripto tek başlıktan gelir: Linux'ta OpenSSL, Windows'ta BCrypt.
-->

---

# Önceki haftalardan gelenler

- **Beyaz kutu saldırgan modeli** — cihazın/sunucunun sahibi aynı zamanda olası saldırgandır; belleği okuyabilir, hata ayıklayıcı bağlayabilir **(Hafta 1)**
- **Bellekten güvenli silme** — bir sırrı `explicit_bzero`/`OPENSSL_cleanse` ile, derleyicinin kaldıramayacağı biçimde silmek **(Hafta 1)**
- **Entropi ölçümü** — bir dosyanın baytlarındaki düzensizliği ölçüp şifreli/paketli içeriği ayırt etmek **(Hafta 2)**

Bu hafta: beyaz kutu modeli → **kullanımda veri** ve **whitebox**; entropi → **rastgele üretecin girdisi**.

---

<!-- _class: yogun -->

# Bu haftanın kavramları

Her terim, gövdede ilk geçtiği yerde tanımlanır; burada yalnız **nerede** olduğunu işaretliyoruz.

| Kavram | Nerede |
| --- | --- |
| Verinin üç hâli (+ güvenlik kabuğu) | Bölüm 1 |
| Şifreleme | Bölüm 2 |
| AEAD | Bölüm 2 |
| Simetrik / asimetrik | Bölüm 2 |
| Özet (hash) | Bölüm 2 |
| MAC ve imza | Bölüm 2 |
| Rastgelelik / CSPRNG | Bölüm 3 |
| IV / nonce / tuz | Bölüm 4 |
| Anahtar türetme (KDF) | Bölüm 5–6 |
| İleri gizlilik | Bölüm 6 |
| Anahtar hiyerarşisi | Bölüm 7 |
| TLS | Bölüm 8 |

---

# Demolar nasıl çalışıyor?

- Tek kaynak, iki platform: **Windows (Visual Studio 2022)** ve **WSL/Linux (GCC)**
- Kripto ortak başlıktan: **Linux → OpenSSL**, **Windows → BCrypt (CNG)** — OpenSSL kurmaya gerek yok
- Derle: Windows `.\build.ps1` · WSL `./build.sh`
- Çalıştır: Windows `.\demo.ps1` · WSL `sh demo.sh`
- Binary dosyalar her demonun `bin\windows` / `bin/linux` klasöründe

> ⚠️ **Etik:** ağ yalnız `localhost`; sertifikalar bizim; teknikleri yalnız kendi
> bilgisayarınızda deneyin.

---

<!-- _class: bolum -->

# 1. Verinin üç hâli ve güvenlik kabuğu

---

# Neden veriye odaklanıyoruz?

- İlk iki hafta "hata → saldırı → düzeltme" ile **programın kendisini** koruduk.
- Bu hafta odak **veriye** kayıyor: parola, ödeme anahtarı, kişisel bilgi.
- Bir sır, yaşam döngüsü boyunca **üç ayrı hâlde** bulunur.
- Her hâlin tehdidi de savunması da **farklıdır**.

<!-- Konuşma notu: Hafta 1-2 programı korudu; bu hafta odak veride. Aynı derinlemesine savunma fikri burada da geçerli. -->

---

<!-- _class: yogun -->

# Kısa tarihçe — veriyi korumanın araçları

- **1976** Diffie–Hellman (açık anahtar) · **1977** **RSA** ve **DES**
- **2001** — **AES** (Rijndael) DES'in yerini alır
- **2007** — **GCM** standart olur: **AEAD** çağı (gizlilik + bütünlük birlikte)
- **1995 → 2018** — SSL 2.0 → TLS 1.0 → **TLS 1.3**

> Kural buradan çıkar: kendi kriptonu yazma, **AEAD** kullan, **anahtarı** doğru yönet.

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

# Üç hâl — tek bakışta

![w:1000](assets/h03-01-verinin-uc-hali.svg)

---

<!-- _class: sema -->

# Ana fikir: güvenlik kabuğu

![w:900](assets/h03-08-guvenlik-kabuklari.svg)

Saldırgan sırra ulaşmak için **hepsini sırayla** kırmalı = derinlemesine savunma.

---

# Örnek mimari: telefon ↔ sunucu

- **Telefon:** güvenilmez ortam — kullanıcı (yani olası saldırgan) cihazın sahibi; root/hata ayıklayıcı olabilir.
- **Sunucu:** güvenilir taraf.
- Her arayüzde sorulur: hangi veri, hangi hâlde, kimlik nasıl doğrulanıyor, gizlilik mi bütünlük mü?

<!-- Konuşma notu: Bu üç soru bugünün demolarının tam olarak cevapladığı sorulardır. -->

---

<!-- _class: bolum -->

# 2. Şifreleme temelleri

---

# Kriptografinin dört ailesi — şema

![w:900](assets/h03-12-kripto-aileleri.svg)

---

# Kriptografi tek şey değildir

- **Şifreleme, kısaca:** açık metni bir anahtarla okunamaz şifreli metne çevirmek; çözme aynı/eşleşen anahtarla tersine çevirir; güvenlik anahtarın gizliliğine dayanır.
- Farklı hedefler için **farklı araçlar** vardır.
- En sık karıştırılan dört aile: şifreleme, özet, MAC, imza.
- Hangisi **gizlilik**, hangisi **bütünlük**, hangisi **ikisi birden** verir?

<!-- Konuşma notu: Öğrenciler genelde "şifreledim = güvende" sanır. Bu bölüm bu yanılgıyı baştan kırar. -->

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

# En sık yapılan iki hata

1. **Yalnız şifrelemek, bütünlüğü unutmak.** Şifreli metin (ör. AES-CTR) saldırganın **fark edilmeden** bit değiştirmesini engellemez.
2. **Kendi şifreni/kipini yazmak.** Kerckhoffs ilkesi: güvenlik algoritmanın değil **anahtarın** gizliliğine dayanır.

> Standart, denenmiş yapıları kullanın; ev yapımı kripto neredeyse her zaman kırılır.

---

# Simetrik neden tek başına yetmez?

- **Simetrik (AES):** çok hızlı.
- Ama iki tarafın **aynı gizli anahtarı** bilmesi gerekir.
- Bu anahtarı güvensiz bir ağdan **nasıl** paylaşırsınız?

Cevap bir sonraki slaytta.

---

# Asimetrik neyi çözer, neye mal olur?

- **Asimetrik (RSA/EC):** herkesin bir **açık** (dağıtılır) ve bir **özel** (gizli) anahtarı var.
- Anahtar dağıtımı sorununu çözer.
- Ama işlemler **yavaştır**; büyük veriye uygun değil (100–1000× yavaş).

---

# Hibrit: ikisi birlikte

- **Hibrit:** asimetrik ile küçük bir **simetrik anahtar** taşınır; veri onunla AEAD'le şifrelenir.
- Gerçek sistemler hep böyle çalışır.

> TLS tam olarak budur: ECDHE ile oturum anahtarı → trafik AES-GCM ile.

<!--
Konuşma notu: RSA ile 1 GB dosya şifrelenmez. Asimetrik yalnız anahtarı taşır. Bu ayrımı netleştirin.
-->

---

<!-- _class: yogun -->

# Simetrik vs Asimetrik — karşılaştırma

| Özellik | Simetrik (AES) | Asimetrik (RSA/EC) |
| --- | --- | --- |
| Hız | Çok hızlı | Yavaş (100–1000×) |
| Anahtar | Tek, paylaşılan gizli | Açık/özel çift |
| Kullanım | Büyük veri şifreleme | Anahtar taşıma, imza |
| Bu haftada | Dosya/DB/oturum | TLS anahtar kurulumu (H10) |

---

# Blok şifre nedir?

- **Blok şifre:** veriyi sabit boyutlu **bloklar** halinde şifreleyen algoritma.
- **AES:** tek seferde **16 baytlık** bir bloğu şifreler.
- Bloktan **uzun** veri için bir **kip** (mode of operation) gerekir.

---

# Blok mü, akış mı? Kip önemli

AES bir **blok** şifresidir (16 bayt). Uzun veri için **kip** gerekir:

| Kip | Durum |
| --- | --- |
| **ECB** | ❌ desen sızdırır (Demo 3) |
| **CBC** | rastgele IV ister, tek başına bütünlük yok |
| **CTR** | akışa çevirir, nonce tekrarına çok hassas (Demo 2) |
| **GCM** | ✅ CTR + MAC = **AEAD** |

---

# ChaCha20: akış şifre

- **Akış şifresi:** blok kavramı yok; veriyle aynı uzunlukta bir **anahtar akışı** üretip XOR'lar.
- ChaCha20 zaten akış şifresidir.
- **+ Poly1305 MAC** = AEAD (ChaCha20-Poly1305, RFC 8439).

Sonuç aynı: **gizlilik + bütünlük tek pakette.**

---

# Özet (hash): tek yönlü parmak izi

- **Anahtarsızdır.** Yalnız verinin **değişip değişmediğini** gösterir.
- Saldırgan veriyi değiştirip **özeti de yeniden hesaplayabilir**.
- Bu yüzden özet tek başına bütünlük **kanıtı değildir**.
- Eski MD5/SHA-1 çakışmaya açık; **SHA-256/SHA-3** kullanın.

---

# MAC: paylaşılan anahtarla bütünlük

- **MAC** (ör. HMAC-SHA-256): **paylaşılan gizli anahtar** ister.
- "Bu mesajı, anahtarı bilen biri gönderdi ve değişmedi" der.
- İki taraf da anahtarı bildiği için MAC **inkâr edilemezlik sağlamaz**.
- MAC karşılaştırması **sabit zamanlı** olmalı (`CRYPTO_memcmp`), düz `memcmp` değil.

---

# İmza: inkâr edilemezlik

- **Dijital imza** (Ed25519, RSA-PSS): **açık/özel** anahtar çiftiyle çalışır.
- Yalnız özel anahtar sahibi imza üretebilir; herkes açık anahtarla doğrular.
- Bu yüzden **inkâr edilemezlik** sağlar.
- Sertifikalar ve sürüm imzalama (Hafta 10) bununla çalışır.

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

# AEAD çoğu zaman doğru cevaptır

- Ayrı ayrı "şifrele + MAC ekle" kurmak yerine **AEAD** kullanın.
- İki işi **tek çağrıda**, doğru sırada (encrypt-then-MAC) ve daha az hatayla yapar.
- Ayrı MAC yalnız şifrelenmeyecek ama bütünlüğü gereken veriler için (ya da AEAD'nin AAD alanıyla) gerekir.

---

# Demo 1 nedir?

- **Demo 1 · `code/week-03/01-aes-gcm-file`** — AEAD, NIST SP 800-38D.
- Bir dosyayı AES-256-GCM ile şifreler.
- Çıktı biçimi: `[12 bayt nonce][şifreli metin][16 bayt etiket]`.
- Sonra şifreli metnin ve yalnız etiketin bir baytını bozup çözmenin **reddedildiğini** görüyoruz.

---

# Demo 1 — kod

```c
crypto_random(nonce, 12);                /* her mesaja YENI nonce */
crypto_gcm_encrypt(key, nonce, 12, NULL, 0,
                   plain, plain_len, ct+12, tag);
int ok = crypto_gcm_decrypt(key, nonce, 12, NULL, 0, ct, ct_len, tag, plain);
if (!ok) { /* REDDET */ }
```

---

# Demo 1 — gerçek çıktı

```text
STEP 3  Decrypted and VERIFIED (54 bytes)
STEP 4  ciphertext byte changed -> VERIFICATION FAILED, REJECTED
STEP 5  only the tag changed -> REJECTED
```

---

# Demo 1 — ADIM 2 ve 3: nonce, doğru çözme

- **ADIM 2:** Rastgele 12 baytlık bir nonce üretildi, dosyanın başına yazıldı.
- Nonce **gizli değildir** (dosyada açık durur); yalnız **benzersiz** olması gerekir.
- **ADIM 3:** Aynı anahtar ve nonce ile çözüldü, etiket tuttu, düz metin geri geldi.

---

# Tuz, IV, nonce — şema

![w:900](assets/h03-14-tuz-iv-nonce.svg)

---

# Demo 1 — ADIM 4 ve 5: kurcalama → red

- **ADIM 4:** Şifreli metnin 20. baytı XOR ile değiştirildi. GCM etiketi bütün şifreli metin üzerinde hesaplandığı için **tek bayt bile** etiketi bozar → çözme reddedildi.
- **ADIM 5:** Bu kez yalnız **etikete** dokunuldu; yine reddedildi.
- Etiket, veriyle **ve** anahtarla birlikte hesaplanır; saldırgan onu anahtarsız üretemez.

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

<!-- _class: yogun -->

# Demo 1 — sık hatalar kontrol listesi

- [ ] Nonce her mesajda benzersiz mi? (Sabit nonce = felaket)
- [ ] Etiket saklanıyor ve çözerken doğrulanıyor mu?
- [ ] Doğrulama başarısızsa çıktı üretmeden mi çıkılıyor?
- [ ] Anahtar koda gömülü değil, güvenli bir kaynaktan mı geliyor?
- [ ] AES-CBC/CTR tek başına (MAC'siz) kullanılmıyor, değil mi?

<!-- Konuşma notu: Değerlendirici aynı düz metnin iki kez şifrelendiğinde farklı şifreli metin verdiğini (nonce tekrarı yok) de kontrol eder. -->

---

# AES-GCM: şifreleme ve etiket doğrulama (animasyon)

<iframe class="dsanim" src="anim/aes-gcm-tag-check.html?mode=slide&lang=tr" title="AES-GCM: şifreleme ve etiket doğrulama"></iframe>

<!-- Konuşma notu: Dosya biçimini [nonce][şifreli metin][etiket] ve doğru çözmede etiketin nasıl tuttuğunu gösterin. -->

---

# AES-GCM — uç durum: şifreli metin kurcalandı

<iframe class="dsanim" src="anim/aes-gcm-tag-check.html?mode=slide&lang=tr&example=edge-tamper-ct" title="Uç durum: şifreli metin kurcalandı — reddedilir"></iframe>

<!-- Konuşma notu: Tek bir bayt değiştiğinde yeniden hesaplanan etiketin nasıl uyuşmadığını ve çözmenin reddedildiğini gösterin. -->

---

<!-- _class: bolum -->

# 3. Rastgele sayılar ve kripto API'leri

---

# Üç tür rastgelelik — şema

![w:900](assets/h03-13-rastgelelik-turleri.svg)

---

# Neden rastgelelik bu kadar önemli?

- Anahtar, IV, nonce, tuz, oturum kimliği — hepsi tek bir varsayıma dayanır: **tahmin edilemezlik**.
- Dünyanın en iyi şifreleme algoritması, anahtarı tahmin edilebilir bir üreteçle oluşturulmuşsa **hiçbir şey** korumaz.
- Bu bölümde önce **yanlış** yollara, sonra **doğru** yola bakacağız.

---

<!-- _class: yogun -->

# Üç tür "rastgele"

| Tür | Örnek | Tahmin edilebilir mi? | Kullanım |
| --- | --- | --- | --- |
| İstatistiksel | `rand()`, `mt19937`, Java `Random` | **Evet** | Oyun, simülasyon |
| Kriptografik (CSPRNG) | `getrandom`, `BCryptGenRandom`, `RAND_bytes` | Hayır | Anahtar, IV, nonce, tuz, belirteç |
| Gerçek (entropi) | Donanım gürültüsü | Hayır | CSPRNG'yi tohumlamak |

**Kural:** güvenlikle ilgili her rastgele değer **CSPRNG**'den

`mt19937`'nin 624 çıktısını gören, sonraki bütün çıktıları hesaplar

---

# Hata 1 — zamanla tohumlamak

```c
srand(time(NULL));
unsigned char key[16];
for (int i = 0; i < 16; i++)
    key[i] = rand() & 0xFF;
```

Saldırgan anahtarın hangi gün üretildiğini biliyorsa, olası tohum sayısı bir günde yalnız **86.400**. Bir dizüstü bilgisayar hepsini saniyeler içinde dener.

---

# Hata 2 — entropiyi yanlışlıkla silmek

**Debian OpenSSL felaketi (2008):** bir paketleyici, bir uyarıyı susturmak için OpenSSL'in rastgele sayı havuzuna entropi ekleyen iki satırı kaldırdı.

- İki yıl boyunca tek entropi kaynağı **süreç kimliği** (≤ 32.768 değer) oldu.
- Saldırganlar bütün olası anahtarları önceden üretip listeledi (**CVE-2008-0166**).

---

# Dört yaygın yanlış anlama — şema

![w:900](assets/h03-20-yanlis-anlamalar.svg)

---

# Hata 2 — çıkarım

➡️ Kriptografik koda **anlamadan dokunmayın.**

➡️ Rastgele üretecin çıktısını **istatistiksel olarak test etmek**, tahmin edilemezliğini **kanıtlamaz**.

<!-- Konuşma notu: Debian olayı derste en çok hatırlanan örneklerden biridir; "iki satır sildim, iki yıl boyunca kırık anahtar üretildi" anlatısı etkili. -->

---

# Hata 3 — aralığa indirgerken sapma

`r % 6` masum görünür. `r` 0–255 tekdüze ise:

```text
256 = 42*6 + 4
```

- 0–3 değerleri **43'er** kez, 4–5 değerleri **42'şer** kez çıkar.
- Zar için önemsiz; parola/OTP üretirken tahmin edilebilirliği artırır.
- Doğru yöntem: **reddetme** (rejection sampling) — sonraki slaytta.

---

<!-- _class: yogun -->

# Doğru yol: işletim sisteminin üreteci

```c
/* Linux (3.17+ / glibc 2.25+) */
while (n > 0) {
    ssize_t r = getrandom(p, n, 0);
    if (r < 0) { if (errno == EINTR) continue; return -1; }
    p += r; n -= (size_t)r;
}

/* Windows */
BCryptGenRandom(NULL, buf, n, BCRYPT_USE_SYSTEM_PREFERRED_RNG);

/* OpenSSL */
if (RAND_bytes(buf, n) != 1) { /* NEVER continue */ }
```

⚠️ Dönüş değerini denetlemezsen "rastgele" sandığın **sıfır** anahtarla çalışırsın

---

# Dönüş değerini neden denetlemeli?

- Rastgele üreteç **başarısız olabilir**.
- Denetlenmezse tampon **ilklendirilmemiş** (ya da sıfır) kalır.
- Program "rastgele" sandığı **sabit** bir anahtarla çalışmaya devam eder.
- Hata durumunda tek doğru davranış: **işlemi durdurmak**.

<!-- Konuşma notu: Debian olayının bir başka versiyonu budur; kontrolsüz dönüş değeri de benzer bir felakete yol açabilir. -->

---

# Reddetme yöntemiyle sapmasız aralık

```c
uint32_t random_in_range(uint32_t upper) {        /* Tarif 11.11 */
    uint32_t threshold = (uint32_t)(-upper) % upper, r;   /* 2^32 mod upper */
    do random_bytes(&r, sizeof r); while (r < threshold);
    return r % upper;
}
```

Fikir: 2³² değerin, `upper`'a **tam bölünen** en büyük kısmını kullan, kalanı at.

---

<!-- _class: yogun -->

# Rastgele değerler — kullanım listesi

| Değer | Gizli? | Benzersiz? |
| --- | --- | --- |
| Anahtar | **Evet** | Evet |
| GCM nonce (12 B) | Hayır | **Asla tekrar** (rastgele: ≤ 2³² mesaj/anahtar) |
| CBC IV | Hayır | Tahmin edilemez |
| Tuz · Oturum belirteci | Hayır · **Evet** | Evet |

<!-- Konuşma notu: Şema gereksinimi: rastgele sayı kaynağına yapılan çağrı kancalanamamalı. Sahada ödeme için istemcide rastgele sayı üretilmez; native tarafta yalnız bellek doldurmada kullanılır. -->

---

# AEAD: dört girdi, iki çıktı

![w:900](assets/h03-02-aead.svg)

**AAD:** şifrelenmez ama değiştirilirse etiket tutmaz — dosya başlığı, sürüm, kayıt kimliği

1\. haftadaki "Kasa": türetme parametreleri AAD → yineleme sayısı değiştirilemez

---

# Şimdi kripto API'sinin içini açıyoruz

- Demo 1'de işi hazır yardımcı fonksiyonlara bıraktık.
- Şimdi OpenSSL'in **EVP** arayüzünü satır satır yazıyoruz.
- Amaç: kütüphaneyi kullanırken nerede hata yapılabileceğini görmek.
- Kural hâlâ geçerli: **kendi algoritmanı yazmazsın**, ama hazır algoritmayı **doğru çağırmak** da bir beceridir.

---

# EVP şifreleme — Adım 1: algoritmayı seç

```c
EVP_EncryptInit_ex(ctx, EVP_aes_256_gcm(), NULL, NULL, NULL);
```

- Algoritmayı seç (**AES-256-GCM**).
- Anahtarı ve nonce'u **henüz verme** — sıradaki adımda.

---

# EVP şifreleme — Adım 2: nonce boyu

```c
EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_SET_IVLEN, 12, NULL);
```

- Nonce (IV) uzunluğunu ayarla.
- GCM için önerilen **12 bayt**; varsayılan da budur ama açık yazmak iyi bir alışkanlıktır.

---

# EVP şifreleme — Adım 3: anahtar + nonce

```c
EVP_EncryptInit_ex(ctx, NULL, NULL, key, nonce);
```

- Anahtarı ve nonce'u **şimdi** ver.
- İlk `Init` çağrısında `NULL` bırakılan yerler burada doldu.

---

# EVP şifreleme — Adım 4: AAD

```c
EVP_EncryptUpdate(ctx, NULL, &n, aad, aad_n);
```

- AAD'yi ver: çıktı tamponu **`NULL`**.
- AAD **şifrelenmez**, yalnız etikete katılır (dosya başlığı, sürüm, kayıt kimliği).

---

# EVP şifreleme — Adım 5: veriyi şifrele

```c
EVP_EncryptUpdate(ctx, ciphertext, &n, plain, plain_n);
```

- Açık metni şifrele.
- Büyük veride bu adım **parça parça** tekrarlanabilir.

---

# EVP şifreleme — Adım 6: bitir (ZORUNLU)

```c
EVP_EncryptFinal_ex(ctx, ciphertext + n, &n);
```

- GCM akış kipinde çalıştığı için **dolgu yoktur**; bu çağrı genelde 0 bayt yazar.
- Ama çağrılması **zorunludur**: etiket burada hesaplanır.

---

# EVP şifreleme — Adım 7: etiketi al

```c
EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_GET_TAG, 16, tag);
```

- Etiketi al ve şifreli metinle birlikte sakla.

---

<!-- _class: yogun -->

# Yedi adım — bir arada

```c
EVP_EncryptInit_ex(ctx, EVP_aes_256_gcm(), NULL, NULL, NULL);   /* 1 algoritma */
EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_SET_IVLEN, 12, NULL);     /* 2 nonce boyu */
EVP_EncryptInit_ex(ctx, NULL, NULL, key, nonce);                /* 3 key+nonce */
EVP_EncryptUpdate(ctx, NULL, &n, aad, aad_n);                   /* 4 AAD (no output) */
EVP_EncryptUpdate(ctx, ciphertext, &n, plain, plain_n);         /* 5 veri */
EVP_EncryptFinal_ex(ctx, ciphertext + n, &n);                   /* 6 bitir: ZORUNLU */
EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_GET_TAG, 16, tag);        /* 7 tag */
```

Her çağrının dönüşü denetlenir · tek çıkış noktası (`goto done`) · `EVP_CIPHER_CTX_free`

---

# Çözme — adım 1-2: aç, etiketi ayarla

```c
EVP_DecryptUpdate(ctx, plain, &n, ciphertext, ciphertext_n);  /* WRITES the plaintext... */
EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_SET_TAG, 16, tag);  /* BEFORE Final */
```

- `DecryptUpdate` açık metni **hemen** tampona yazar — henüz doğrulanmadı!
- Beklenen etiket `Final`'dan **önce** verilir.

---

<!-- _class: yogun -->

# Çözme — adım 3: Final ZORUNLU kontrolü

```c
if (EVP_DecryptFinal_ex(ctx, plain + n, &n) != 1) {     /* the tag is verified HERE */
    OPENSSL_cleanse(plain, ciphertext_n);                /* wipe the half-decrypted data */
    return -1;
}
```

**Windows CNG:** `BCryptDecrypt` → `STATUS_AUTH_TAG_MISMATCH` (0xC000A002)

🚨 En sık AEAD hatası: Final'ın dönüşüne bakmadan tampondakini kullanmak

---

# Sabit zamanlı karşılaştırma

```c
unsigned char diff = 0;
for (size_t i = 0; i < n; i++) diff |= a[i] ^ b[i];   /* always walk every byte */
return diff == 0;                                     /* ≈ CRYPTO_memcmp */
```

`memcmp` ilk farklı baytta durur; süre kaç baytın doğru olduğunu **sızdırır**. Hazır karşılıklar: `CRYPTO_memcmp`, `sodium_memcmp`.

---

<!-- _class: yogun -->

# Kripto kütüphanesi kullanırken kontrol listesi

- [ ] Her dönüş değeri denetleniyor, hata = **dur**
- [ ] Nonce her seferinde yeni · etiket kullanımdan **önce** doğrulanıyor
- [ ] MAC karşılaştırması sabit zamanlı (`memcmp` değil)
- [ ] "Etiket hatası" ≠ "dolgu hatası" iletisi yok (**kâhin**)
- [ ] DES/3DES, RC4, MD5, SHA-1 (imza), ECB yok

<!-- Konuşma notu: Sahada kılavuzlarda algoritma envanteri tablosu bulunur. Birkaç yıl önceki envanterlerde SHA-1 ve CBC + ayrı MAC görülür; bugün SHA-256 ve AEAD. -->

---

# Sahada: algoritma envanteri

- Gerçek ürün kılavuzlarında bir **algoritma envanteri** bulunur: her algoritma, hangi amaçla, hangi anahtar boyuyla.
- İyi bir eleştirel okuma malzemesi: eski envanterlerde **SHA-1** ya da **ayrı MAC'li CBC** görülür.
- Bugün yazılan bir envanterde yerini **SHA-256** ve **AEAD** almalı.

---

# Değerlendirici nasıl test eder?

- Algoritma envanterini kaynak kodla **karşılaştırır**.
- Nonce üretimini ve tekrarını inceler.
- Şifreli veriyi bir bit değiştirerek geri verir; uygulamanın **reddettiğini** ve ayrıntılı hata vermediğini doğrular.
- MAC karşılaştırmasında `memcmp` arar.

---

<!-- _class: bolum -->

# 4. IV / nonce / tuz

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
C1 ⊕ C2 = P1 ⊕ P2      <-- anahtar akışı yok oldu!
```

Saldırgan **iki düz metnin XOR'unu** ele geçirir. Birini biliyorsa diğerini çözer.

> Gerçek olaylar: WEP kısa IV, Sony PS3 tekrar eden imza değeri.

---

# Demo 2 — nonce tekrarı sızdırır

```text
BAD CASE (same nonce):
  C1 xor C2 = 151b00000f4b42030906070d16000807 ... 44404015
  P1 xor P2 = 151b00000f4b42030906070d16000807 ... 44404015     <-- SAME = leaked
  P2 = (C1 xor C2) xor P1 = "Total balance is 45000, PIN is 1234"

GOOD CASE (different nonce):
  C1 xor C2 != P1 xor P2            <-- no leak
```

✅ Nonce'u rastgele ya da **kalıcı sayaç** olarak üret; asla tekrar etme.

---

# Demo 2 — kural (devamı)

- Rastgele nonce **pratiktir**; ama aynı anahtarla çok mesaj varsa (NIST önerisi: ≤ 2³²) doğum günü olasılığı devreye girer.
- Alternatif: nonce'u **sayaç** yap — ama sayaç **kalıcı** saklanmalı (cihaz yeniden başlayınca sıfırlanmamalı).
- Gerçek olaylar: **WEP** kısa IV, **Sony PS3** ECDSA'da tekrar eden rastgele değer (özel anahtar çıkarıldı).

---

# Nonce tekrarının tehlikesi (animasyon)

<iframe class="dsanim" src="anim/nonce-reuse.html?mode=slide&lang=tr" title="Nonce tekrarının tehlikesi"></iframe>

<!-- Konuşma notu: C1 xor C2'nin P1 xor P2'ye eşit çıktığını ve saldırganın bilinen bir mesajla diğerini kurtardığını gösterin. -->

---

# Nonce tekrarı — uç durum: farklı nonce, sızıntı yok

<iframe class="dsanim" src="anim/nonce-reuse.html?mode=slide&lang=tr&example=edge-diff-nonce" title="Uç durum: farklı nonce, sızıntı yok"></iframe>

<!-- Konuşma notu: Aynı iki mesajla, yalnız nonce farklı olunca ilişkinin tamamen kaybolduğunu gösterin. -->

---

# Demo 3 — ECB deseni sızdırır ("penguen")

```text
Original        AES-128-ECB          AES-256-GCM
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

# ECB — kural

✅ **ECB kullanmayın.** Şifreleme için AEAD (GCM, ChaCha20-Poly1305); disk için XTS-AES.

Kod incelemesinde `ecb` geçen her yer bir **bulgudur**. Değerlendirici aynı düz metnin tekrar eden 16 baytlık bloklarını arayarak ECB'yi otomatik yakalayabilir.

---

# Bu bölümün kuralı

- **Tuz, IV, nonce**: hiçbiri gizli değil, ama **her biri farklı bir tekrarsızlık** ister.
- Nonce **asla** aynı anahtarla tekrar etmesin.
- **ECB yasak.** Kip seçimi = güvenlik kararı.

<!-- Konuşma notu: Bu üç kavram sınavda en çok karıştırılanlardan; "gizli mi, benzersiz mi" ayrımını pekiştirin. -->

---

# ECB deseni sızdırır, GCM sızdırmaz (animasyon)

<iframe class="dsanim" src="anim/ecb-vs-gcm-pattern.html?mode=slide&lang=tr" title="ECB deseni sızdırır, GCM sızdırmaz"></iframe>

<!-- Konuşma notu: Küçük resmi ECB ile şifreleyince şeklin okunur kaldığını, GCM ile şifreleyince kaybolduğunu canlı gösterin. -->

---

# ECB — uç durum: dama tahtası

<iframe class="dsanim" src="anim/ecb-vs-gcm-pattern.html?mode=slide&lang=tr&example=edge-checkerboard" title="Uç durum: dama tahtası (ECB'nin en kötü durumu)"></iframe>

<!-- Konuşma notu: Dama tahtasında bile ECB çıktısının yalnız 2 farklı değer verdiğini gösterin. -->

---

<!-- _class: bolum -->

# 5. Paroladan anahtar türetme

---

# Paroladan anahtar türetme — şema

![w:900](assets/h03-15-kdf-iki-ek.svg)

---

# Parola neden doğrudan anahtar olamaz?

- Parola **kısa, düşük entropili ve tahmin edilebilir**.
- Doğrudan anahtar yapılırsa kaba kuvvet ucuzlaşır.
- Çözüm: paroladan anahtar türetme fonksiyonu (**KDF**).
- **Genel olarak KDF:** yalnız paroladan değil, bir **ana sırdan** da anahtar türetilebilir — bunu 6. bölümde (**HKDF**) görüyoruz.

---

# KDF iki iş yapar

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
1) SALT: same password + same salt -> SAME key
         same password + DIFFERENT salt -> DIFFERENT key
2) ROUNDS vs TIME (WSL):
   rounds =   1000  ->    0.37 ms
   rounds = 100000  ->   39.05 ms
   rounds = 600000  ->  209.55 ms   <-- OWASP 2023 minimum
   rounds =2000000  ->  628.42 ms
```

---

# Demo 4 — tuzun etkisi

- Aynı parola + **aynı** tuz → her seferinde **aynı** anahtar.
- Tuz sabitse saldırgan bir kez tablo kurup herkesi arayabilir.
- Aynı parola + **farklı** tuz → tamamen **farklı** anahtar.

➡️ Tuz her kayıt için **rastgele ve benzersiz** olmalı.

---

# Demo 4 — maliyetin etkisi

- Tur sayısı 1.000 → 2.000.000 olunca süre ~0,4 ms → ~628 ms'ye çıktı.
- Bu **doğrudan çarpandır**: saldırganın her denemesi de o kadar pahalılaşır.
- "Kullanıcı girişinde 200 ms" kabul edilebilir; saldırgana **milyarlarca** deneme yerine **binlerce** deneme demektir.

<!-- Konuşma notu: Argon2id ek olarak bellek de ister; GPU/ASIC ile paralel kaba kuvveti PBKDF2'den daha çok zorlaştırır. -->

---

# Demo 4 — kural

✅ Rastgele tuz + Argon2id (ya da yüksek turlu PBKDF2). ❌ Düz/tuzsuz SHA-256.

<!--
Konuşma notu: 200 ms kullanıcıya kabul edilebilir; saldırgana milyar deneme yerine bin deneme demektir.
-->

---

# İleri: biber (pepper)

- Tuza ek olarak, veritabanında **saklanmayan**, yapılandırmada ya da HSM'de tutulan gizli bir **biber** eklenebilir.
- DB çalınırsa (biber sızmadıkça) özetler bir kat daha korunur.
- **Tuz gizli değildir; biber gizlidir.**

---

# Bu bölümün kuralı

- Parolayı **asla** doğrudan anahtar yapma.
- Rastgele **tuz** + yeterli maliyetli bir **KDF** (Argon2id öncelikli).
- Maliyeti donanıma göre ayarla, yıllar içinde **artır**.

---

# Paroladan anahtar türetme: tuz ve tur (animasyon)

<iframe class="dsanim" src="anim/pbkdf2-stretching.html?mode=slide&lang=tr" title="Paroladan anahtar türetme: tuz ve tur"></iframe>

<!-- Konuşma notu: Aynı parola + aynı tuzun aynı anahtarı, farklı tuzun tamamen farklı anahtarı verdiğini canlı gösterin. -->

---

# PBKDF2 — uç durum: tek tur

<iframe class="dsanim" src="anim/pbkdf2-stretching.html?mode=slide&lang=tr&example=edge-one-round" title="Uç durum: tek tur (yalnız gösterim için)"></iframe>

<!-- Konuşma notu: Tek turun yalnız gösterim amaçlı olduğunu, gerçek PBKDF2'nin 100.000+ tur kullandığını vurgulayın. -->

---

<!-- _class: bolum -->

# 6. HKDF, oturum anahtarları, ileri gizlilik

---

# Neden ana sırdan direkt kullanmıyoruz?

- Uzun ömürlü bir "ana sır" **doğrudan** kullanılmaz.
- Ondan, her amaç ve her oturum için **ayrı** anahtarlar türetilir.
- Araç: **HKDF** (RFC 5869) — iki aşamalı bir KDF.

---

# HKDF Adım 1: Extract

- Girdi: **ana sır** + **tuz**.
- Çıktı: tekdüze bir **ara anahtar (PRK)**.
- Amaç: ham sırdaki düzensizliği tek biçim bir anahtara sıkıştırmak.

---

# HKDF Adım 2: Expand

- Girdi: **PRK** + **`info`** etiketi.
- Çıktı: istenen boyda **anahtar**.
- **Farklı `info` → farklı anahtar.** Aynı PRK'dan şifreleme anahtarı, MAC anahtarı, oturum anahtarı ayrı ayrı çıkar.

---

<!-- _class: sema -->

# HKDF: ana sırdan türev anahtarlar

![w:900](assets/h03-03-hkdf.svg)

Farklı `info` → farklı anahtar. Bir amacın anahtarı başka amaca kullanılmaz.

---

# İleri gizlilik (forward secrecy) nedir?

- **İleri gizlilik:** bugünkü anahtar sızsa bile **eski oturumlar** çözülemez.
- Tek yönlü zincir: `K0 = ana sır`, `Kᵢ = HKDF(Kᵢ₋₁)`.
- Her adımda **eskisini sil**.

---

# İleri gizlilik — şema

![w:900](assets/h03-11-ileri-gizlilik.svg)

> Bugünkü anahtar sızsa bile **eski oturumlar** güvende. TLS 1.3'te varsayılan (geçici ECDHE ile).

---

# Demo 5 — HKDF çıktısı

```text
info='...encryption...' -> 5a5ed417c87e3566...0d37002cb
info='...MAC...'        -> 4c63a348654a076c...0ce1750e6   (different)

FORWARD SECRECY chain:
  K1=cbbe8fdd0b6ca8be  K2=1113abf7352881e0
  K3=a99c7ad8e0e6fb6b  K4=4974f0e86d9dcb37
  ^ the old key is wiped at every step
```

---

# Demo 5 — açıklama

- Aynı ana sırdan farklı `info` ile **farklı** anahtarlar çıktı; bir amacın anahtarı başka amaca kullanılamaz.
- İleri gizlilik zincirinde her adımda eski anahtar **silindi**.
- Elde yalnız **K4** var; zincir tek yönlü olduğu için K4'ten **K3, K2, K1 geri hesaplanamaz**.

---

# Demo 5 — kural

✅ Amaca/oturuma göre ayrı anahtar · her türetmeye benzersiz `info` · kullanınca sil.

---

# Bu bölümün kuralı

- Ana sırdan **amaca ve oturuma göre** ayrı anahtarlar türetin.
- Her türetmeye **benzersiz** bir `info`/label koyun.
- Kısa ömürlü oturum anahtarlarını **kullanınca silin**.

<!-- Konuşma notu: "Tek bir anahtarı her işe koşmayın" — bu bölümün tek cümlelik özeti. -->

---

# HKDF: Extract/Expand ve ileri gizlilik (animasyon)

<iframe class="dsanim" src="anim/hkdf-extract-expand.html?mode=slide&lang=tr" title="HKDF: Extract/Expand ve ileri gizlilik"></iframe>

<!-- Konuşma notu: PRK'dan iki farklı info ile iki farklı anahtar türediğini, sonra ileri gizlilik zincirinin eski anahtarı nasıl sildiğini gösterin. -->

---

# HKDF — uç durum: tek adımlık zincir

<iframe class="dsanim" src="anim/hkdf-extract-expand.html?mode=slide&lang=tr&example=edge-one-step" title="Uç durum: tek adımlık zincir"></iframe>

<!-- Konuşma notu: Zincirin en küçük hâlini gösterip K0'ın nasıl silinip yerini K1'e bıraktığını vurgulayın. -->

---

<!-- _class: bolum -->

# 7. Dinamik anahtar yönetimi

---

# Algoritma mı kırıldı, anahtar mı kötü yönetildi?

- "Algoritma kırıldı" diye haber yapılan olayların çok küçük bir kısmı gerçekten algoritmanın kırılmasıdır.
- Büyük çoğunluk **anahtar yönetimi** hatasıdır: koda gömülü anahtar, hiç değişmeyen anahtar, tek anahtarla her iş.
- Bu bölüm bu hataları önlemek için var.

---

<!-- _class: yogun -->

# Bir anahtarın hayatı (NIST SP 800-57)

**Üretim → Dağıtım → Saklama → Kullanım → Yenileme → İptal → İmha**

| Aşama | Tipik hata |
| --- | --- |
| Üretim | `rand()`, sabit anahtar, istemcide üretilmemesi gereken anahtar |
| Dağıtım | Düz metin; yalnız TLS'e güven |
| Saklama | Kaynak kodda / yapılandırma dosyasında düz |
| Kullanım | Aynı anahtarla şifreleme **ve** MAC |
| Yenileme | Hiç değişmemesi |
| İmha | Yedekte, günlükte, bellekte kalan kopya |

---

# Kripto-periyot nedir?

- Bir anahtarın **kullanılmasına izin verilen süre**.
- Süre dolunca anahtar yeni veriyi **şifrelemek** için kullanılmaz.
- Eski veriyi **çözmek** için bir süre daha tutulabilir.
- Etkenler: korunan verinin miktarı, gizli kalması gereken süre, anahtarın ne kadar açıkta durduğu.

---

# Anahtarın hayatı — şema

![w:950](assets/h03-04-anahtar-yasam-dongusu.svg)

---

# Anahtar hiyerarşisi: iki temel fikir

1. **Anahtar ayrımı:** farklı amaçlar için farklı anahtarlar (HKDF `info` ile).
2. **Zararın sınırlanması:** alt düzeydeki bir anahtarın ele geçirilmesi yalnız **o dalı** etkiler.

---

# Anahtar hiyerarşisi

![w:900](assets/h03-05-anahtar-hiyerarsisi.svg)

- **Anahtar ayrımı:** her amaca ayrı anahtar (HKDF `info`)
- **Zarar sınırlama:** tek kullanımlık anahtar çalınırsa kaybedilen = **tek işlem**

---

# Ödemede hiyerarşi ve anahtar yenileme

EMV tarzı zincir:

**Kurum ana anahtarı** (HSM) → **kart ana anahtarı** (kart no + sıra no) → **oturum anahtarı** (işlem sayacı) → **tek kullanımlık anahtar**

- Telefona yalnız en alttaki **sınırlı kullanım** anahtarları iner
- Tükenince sunucudan yenileri istenir (**replenishment**)
- Telefon ele geçse bile: birkaç işlemlik anahtar, sunucuda kolayca iptal

---

# Zarflama (envelope encryption) — neden?

Büyük veriyi doğrudan ana anahtarla şifrelemek iki sorun yaratır:

- Ana anahtar **sık kullanılır** → açıkta kalma süresi artar.
- Anahtar değişince **bütün veri** yeniden şifrelenmelidir.

---

# Zarflama — dört adım

1. Her kayıt için rastgele bir **veri anahtarı (DEK)** üretilir; veri onunla şifrelenir.
2. DEK, bir **anahtar şifreleme anahtarıyla (KEK)** sarılır.
3. KEK güvenli bir yerde durur: TPM, HSM, bulut KMS.
4. KEK yenilendiğinde yalnız küçük **DEK'ler** yeniden sarılır — veri değil.

---

<!-- _class: yogun -->

# Zarflama ve anahtar sürümü

![w:900](assets/h03-09-zarflama.svg)

- Okuyucu sürüme bakar → doğru anahtarı bulur
- Sürüm alanı AAD → saldırgan eski/zayıf anahtara **yönlendiremez**

---

# Kayıt biçimi ve AAD — şema

![w:950](assets/h03-10-kayit-bicimi.svg)

---

<!-- _class: yogun -->

# Anahtar nerede saklanır?

| Seçenek | Koruma |
| --- | --- |
| Kaynak kod · yapılandırma · ortam değişkeni | **Yok / zayıf** |
| DPAPI (`CryptProtectData`) | Kullanıcı/makine hesabına bağlı |
| Anahtarlık · Android Keystore | OS, bazen donanım |
| TPM | Donanım; anahtar çıkarılamaz |
| HSM / bulut KMS | Anahtar HSM'den hiç çıkmaz |

İstemciye yalnız **zararı sınırlı, kısa ömürlü** anahtarlar

---

<!-- _class: yogun -->

# Sahadan: şema gereksinimleri ve dört anahtar grubu

| Gereksinim (Şema-A / Şema-B) | Karşılığı |
| --- | --- |
| Standart algoritma, **güvenli yapılandırma** | Doğru API kullanımı, TLS |
| Her anahtar: hiyerarşi, kullanım, **kripto-periyot**; **tek amaç** | Hiyerarşi, anahtar ayrımı |
| Kur, güncelle, iş bitince **sil** | Yaşam döngüsü |
| Rastgele sayı çağrısı **kancalanamamalı** | 6. hafta |
| Anahtarlar cihaza ve uygulamaya **bağlı, farklı** | Cihaz/sürüm bağlama |

Gruplar: dinamik cihaz anahtarları (whitebox) · dinamik ödeme anahtarları · **tek** statik anahtar (dize gizleme) · sunucu sertifikası

---

<!-- _class: yogun -->

# Oturum anahtarı: sahadan akış

1. Sunucu 32 B oturum kimliği → yapılandırma anahtarıyla şifreli → bildirimle gelir
2. İstemci whitebox AES ile çözer
3. **Kimlik doğrulama kodu** = SHA-256(oturum kimliği parçası + cüzdan kimliği + parmak izi)
4. **Oturum anahtarı** = HMAC(yapılandırma anahtarının özeti, oturum kimliği) → 16 B AES
5. Mesaj: AES-CTR + 256 bit MAC

---

# Oturum anahtarı: bugünkü öneri

| Tasarımda | Bugün |
| --- | --- |
| CTR + ayrı MAC | AEAD (GCM / CCM / ChaCha20-Poly1305) |
| Özel HMAC türetmesi | HKDF + ayrı `info` |
| SHA-1 | SHA-256 · ileri gizlilik için geçici (EC)DH |

<!-- Konuşma notu: Eleştirel okuma: tasarım dönemindeki gereksinimleri karşıladı; beceri, bugün neyin neden değişmesi gerektiğini gerekçesiyle söylemek. -->

---

# Bu bölümün kuralı

- Anahtarları bir **hiyerarşi** içinde düzenleyin; her anahtarın **tek amacı** ve bir kripto-periyodu olsun.
- Veriyi **zarflayın**; anahtar sürümünü AAD ile koruyun.
- İstemci cihazına yalnız **zararı sınırlı, kısa ömürlü** anahtarlar indirin.

---

<!-- _class: bolum -->

# 8. Aktarımda veri: TLS 1.3

---

<!-- _class: sema -->

# TLS 1.3 el sıkışması

![w:900](assets/h03-06-tls13.svg)

Tek gidiş-dönüş · her zaman geçici ECDHE → **ileri gizlilik varsayılan**.

---

# TLS 1.3 el sıkışması: mesaj sırası (animasyon)

<iframe class="dsanim" src="anim/tls13-handshake.html?mode=slide&lang=tr" title="TLS 1.3 el sıkışması: mesaj sırası"></iframe>

<!-- Konuşma notu: Mesajların sırasını iki yaşam çizgisinde adım adım izleyin; tek gidiş-dönüşte tamamlandığını vurgulayın. -->

---

# El sıkışma — uç durum: yarıda kesilen

<iframe class="dsanim" src="anim/tls13-handshake.html?mode=slide&lang=tr&example=edge-aborted" title="Uç durum: sertifika reddedildi, el sıkışma yarıda kesildi"></iframe>

<!-- Konuşma notu: Sertifika doğrulaması başarısız olunca Finished'ın hiç gönderilmediğini gösterin. -->

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

# Sertifika sabitleme: birincil, yedek, uyuşmazlık (animasyon)

<iframe class="dsanim" src="anim/certificate-pinning.html?mode=slide&lang=tr" title="Sertifika sabitleme: birincil, yedek, uyuşmazlık"></iframe>

<!-- Konuşma notu: Sunucu pininin önce birincil, sonra (gerekirse) yedek pinle karşılaştırıldığını gösterin. -->

---

# Sabitleme — uç durum: hiçbir pinle eşleşme yok

<iframe class="dsanim" src="anim/certificate-pinning.html?mode=slide&lang=tr&example=edge-mismatch" title="Uç durum: hiçbir pinle eşleşmiyor — reddedilir"></iframe>

<!-- Konuşma notu: Bir saldırı denemesinde ne birincil ne yedek pinin eşleşmediğini, bağlantının reddedildiğini gösterin. -->

---

# Demo 6 — MITM → hostname + pinning

```text
1 Insecure  -> ATTACKER: ACCEPTED (DANGEROUS, MITM would work)
2 Verify    -> REAL     : VERIFIED, ACCEPTED
3 Verify    -> ATTACKER : REJECTED (self-signed)
4 Pin       -> REAL     : pin MATCHED, ACCEPTED
5 Pin       -> ATTACKER : pin did NOT match, REJECTED
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

<!-- _class: yogun -->

# TLS istemcisi: adım 1–4 (Tarif 9.1, 10.7, 10.8)

```c
SSL_CTX *ctx = SSL_CTX_new(TLS_client_method());          /* 1 */
SSL_CTX_set_min_proto_version(ctx, TLS1_2_VERSION);      /* 2 against downgrade */
SSL_CTX_set_verify(ctx, SSL_VERIFY_PEER, NULL);           /* 3 VALIDATE */
SSL_CTX_set_default_verify_paths(ctx);                    /* 4 the root store */
```

1. Sürümden bağımsız istemci bağlamı.
2. En düşük sürümü **TLS 1.2** yapar — atlanırsa sürüm düşürme saldırısına açık.
3. Karşı tarafın sertifikasını **doğrula** — atlanırsa OpenSSL herhangi bir sertifikayı kabul eder.
4. İşletim sisteminin güvenilir kök deposunu yükler.

---

# TLS istemcisinin adımları — şema

![w:900](assets/h03-16-tls-istemci-adimlari.svg)

---

<!-- _class: yogun -->

# TLS istemcisi: adım 5–7

```c
SSL_set_tlsext_host_name(ssl, host);                      /* 5 SNI */
SSL_set1_host(ssl, host);                                 /* 6 hostname check */
/* connect + handshake */
SSL_get_verify_result(ssl) == X509_V_OK;                  /* 7 belt + suspenders */
```

5. Sunucuya hangi adı istediğini söyler (SNI) — atlanırsa aynı IP'de yanlış sertifika gelebilir.
6. Sertifikadaki adın **bu** sunucu olduğunu denetler.
7. Doğrulama sonucunu açıkça sorar — bir yapılandırma hatası sessizce geçmesin (kemer + askı).

Kitap: OpenSSL'in doğrulamayan varsayılanı "**olabilecek en kötü varsayılan**"

---

# Adım 6 neden hayati?

- Zincir doğrulaması yalnız "güvenilir CA mı imzaladı?" diye sorar
- Saldırgan **kendi** alan adı için tamamen **geçerli** bir sertifika alabilir
- Ad denetimi yoksa `bank.example` yerine `attacker.example` sertifikası kabul edilir

➡️ 2012 "dünyanın en tehlikeli kodu" çalışması: çok sayıda uygulama ve kütüphane bu adımı atlıyordu

---

<!-- _class: yogun -->

# SPKI sabitleme

```c
X509 *cert = SSL_get_peer_certificate(ssl);         /* 3.x: SSL_get1_... */
int n = i2d_X509_PUBKEY(X509_get_X509_PUBKEY(cert), NULL);
/* convert to DER -> SHA256 -> compare with the pin list via CRYPTO_memcmp */
for (i = 0; i < PIN_COUNT; i++)
    if (CRYPTO_memcmp(digest, TRUSTED_PINS[i], 32) == 0) return 1;
return 0;                                            /* no match: CUT */
```

```bash
openssl s_client -connect server.example:443 -servername server.example </dev/null \
 | openssl x509 -pubkey -noout | openssl pkey -pubin -outform der \
 | openssl dgst -sha256 -binary | base64
```

---

<!-- _class: yogun -->

# Sabitlemeyi sürdürmek

| Kural | Neden? |
| --- | --- |
| Sertifikayı değil **SPKI**'yi sabitle | Aynı anahtarla yenilenen sertifika çalışır |
| Her zaman **yedek pin** | Birincil kaybolursa uygulama "tuğlalaşmaz" |
| Yedek anahtar **çevrimdışı** | Birlikte ele geçmesin |
| Yeni pin, eskisi kaldırılmadan **önce** dağıtılır | Güncelleme penceresi |
| Pin hatasını **raporla** | Saldırı mı, yapılandırma mı? |
| Bayrakla kapatılamaz | Saldırgan önce bayrağı değiştirir |

Tarayıcılar HPKP'yi 2018'de bıraktı; mobil/masaüstünde sabitleme sürüyor (MASVS-NETWORK)

---

# Windows: WinHTTP / Schannel

- WinHTTP sertifikayı ve adı **varsayılan olarak doğrular**
- Tehlike: doğrulamayı kapatan bayraklar

```c
DWORD flags = SECURITY_FLAG_IGNORE_UNKNOWN_CA |
          SECURITY_FLAG_IGNORE_CERT_CN_INVALID |
          SECURITY_FLAG_IGNORE_CERT_DATE_INVALID;   /* NEVER in a release build */
WinHttpSetOption(request, WINHTTP_OPTION_SECURITY_FLAGS, &flags, sizeof flags);
```

✅ Test sunucusunun CA'sını geliştirme makinesinin güven deposuna ekle; kod aynı kalsın

---

<!-- _class: yogun -->

# Eleştirel okuma: sessizce açılan kapı

```java
defaultValidator.checkServerTrusted(chain, authType);          // 1 chain
try {
    PublicKey expected = keyStore.getCertificate("ca").getPublicKey();
    if (!Arrays.equals(expected.getEncoded(), chain[0].getPublicKey().getEncoded()))
        throw new CertificateException("pin did not match");    // 2 pin
} catch (KeyStoreException e) {
    e.printStackTrace();                                        // 3 ??? -> connection ACCEPTED
}
```

- Hata yutuldu → sabitleme **atlandı** = **fail-open**
- Ayrıca: yedek doğrulamada iptal denetimi kapalı · dosya yoksa "devam" · tek pin
- ✅ **Fail-closed:** sonucu belirleyemiyorsan → **reddet**

<!-- Konuşma notu: Kod incelemesinde catch bloklarını ve "bulunamadı, devam ediliyor" günlüklerini ayrıca arayın. -->

---

<!-- _class: yogun -->

# En sık TLS hataları

| Hata | Sonuç |
| --- | --- |
| Doğrulama geri çağrısı hep "geçerli" / her şeye güvenen `TrustManager` | Her sertifika kabul |
| Ad denetimi kapalı (`HostnameVerifier` hep `true`) | Başka sitenin sertifikası kabul |
| Sertifika hatasında "devam et" (web görünümü) | Araya giren fark edilmez |
| Hata ayıklama bayrağı sürümde | Saldırgan açar |
| Yedeksiz uç sertifika pini | Yenilemede uygulama çöker → pin kaldırılır |
| "Nasılsa TLS var" | Sunucuda/istemcide açık veri korunmaz |

---

# Kendi bağlantını test et

```bash
openssl s_client -connect server.example:443 -servername server.example -verify_return_error -brief
openssl s_client -connect server.example:443 -tls1_1      # should be rejected
```

1. Kendi imzalı sertifika → **reddet** (Demo 6)
2. Başka ad için geçerli sertifika → **reddet**
3. Cihaza kendi CA'nı kur + proxy → sabitleme yapan uygulama **reddetmeli**
4. Pin hatası raporlanıyor mu?

<!-- Konuşma notu: Sahada aktarım: TLS + açık anahtar sabitleme + sunucu sertifika zinciri denetimi (dış kabuk) ve içinde oturum anahtarlı mesaj şifreleme. Sunucu adresi ve pin değerleri üst uygulamadan parametreyle geliyorsa korunmaları üst uygulamanın sorumluluğu olarak kılavuza yazılır. -->

---

# Bu bölümün kuralı

- İstemcide doğrulamayı **elle açın**: CA deposu + `SSL_VERIFY_PEER` + `SSL_set1_host` + min. TLS 1.2.
- Yüksek riskte **SPKI sabitleme** ekleyin, her zaman **yedek pin** bulundurun.
- Hata durumunda **kapalı kalın** (fail-closed): istisnayı yutup güven deposuna düşmeyin.

---

<!-- _class: bolum -->

# 9. Beklemede ve kullanımda veri

---

# Kullanımda veri katmanları — şema

![w:900](assets/h03-18-kullanimda-veri-katmanlari.svg)

---

# Beklemede veri: iki düzey — şema

![w:900](assets/h03-17-beklemede-iki-duzey.svg)

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
Attacker opens the DB:
  1|Jane Doe|C6EA7420...   <- card field ENCRYPTED
Correct key:
  1|Jane Doe|4242-4242-4242-4242
Wrong key:
  1|Jane Doe|(COULD NOT DECRYPT - wrong key?)
```

`name` açık, `card_encrypted` şifreli. Anahtar koda gömülü değil (cihaza bağlı KDF).
Linux `sqlite3`, Windows yerleşik `winsqlite3`.

---

# SQLite alan şifreleme: doğru ve yanlış anahtar (animasyon)

<iframe class="dsanim" src="anim/sqlite-field-encryption.html?mode=slide&lang=tr" title="SQLite alan şifreleme: doğru ve yanlış anahtar"></iframe>

<!-- Konuşma notu: Doğru anahtarla her iki satırın da çözüldüğünü, yanlış anahtarla HER satırın reddedildiğini gösterin. -->

---

# SQLite alan şifreleme — uç durum: yanlış anahtar

<iframe class="dsanim" src="anim/sqlite-field-encryption.html?mode=slide&lang=tr&example=edge-wrong-key" title="Uç durum: yanlış anahtar — iki satır da reddedilir"></iframe>

<!-- Konuşma notu: Yanlış anahtarla hiçbir satırın çöp veri döndürmediğini, ikisinin de reddedildiğini vurgulayın. -->

---

<!-- _class: yogun -->

# Veri maskeleme: dört teknik

| Teknik | Geri dönülür mü? | Kullanım |
| --- | --- | --- |
| **Gösterimde maskeleme** | Hayır | Ekran, fiş, günlük |
| **Tokenizasyon** | Yalnız kasaya erişen | Kart saklama, ödeme |
| **Takma adlandırma** | Anahtarı olan eşleştirir | Analiz, test |
| **Anonimleştirme** | Hayır | Açık veri |

Takma adlı veri hâlâ **kişisel veri** (KVKK, GDPR) · "anonim" demek çok daha güçlü bir iddia

---

<!-- _class: yogun -->

# Gösterimde maskeleme

```c
/* "1234567812345678" -> "************5678" */
void mask_pan(const char *pan, char *out, size_t out_size) {
    size_t n = strnlen(pan, 19);
    if (out_size < n + 1) { if (out_size) out[0] = '\0'; return; }
    for (size_t i = 0; i < n; i++)
        out[i] = (i + 4 < n) ? '*' : pan[i];
    out[n] = '\0';
}
```

- PCI DSS: en fazla ilk 6 (yeni sürümlerde 8) + son 4
- Maskeleme **kaynağa yakın:** istemciye zaten maskeli gönder

---

# Tokenizasyon

![w:900](assets/h03-07-tokenizasyon.svg)

- Veritabanı, raporlar, günlükler çalınsa bile **kart numarası yok**
- PCI DSS kapsamı küçülür = 1. haftadaki "**aktar**" yanıtı
- Mobil ödemede telefona inen = cihaza özgü **belirteç numarası**
- Biçim korunabilir: FF1 (NIST SP 800-38G)

---

# Takma ad ve test verisi

```c
crypto_hmac_sha256(pseudonym_key, 32, id_number, strlen(id_number), pseudonym);
```

- ❌ Düz SHA-256: 11 haneli kimlik no → hepsi denenebilir
- ✅ **Anahtarlı** HMAC; anahtar veri kümesinden ayrı · anahtar imha = fiilen anonim

Test verisi tercihi: **1. sentetik** → 2. statik maskeleme → 3. dinamik maskeleme

---

<!-- _class: yogun -->

# Günlükte maskeleme

- **Kaynakta önleme:** hassas tür, yazdırması hep maskeli
- **Çıkışta süzme:** 13–19 hane + Luhn, `password=`, `token=` → `****`

```c
while ((p = strstr(p, "password=")) != NULL) {
    p += strlen("password=");
    while (*p && !isspace((unsigned char)*p)) *p++ = '*';
}
```

⚠️ Süzgeç **ikinci** hat: JSON'u tanımaz, veri zaten bellekte · sahada sürümde günlük **tamamen kaldırılır**

<!-- Konuşma notu: Değerlendirici ekranlarda, ağ yanıtlarında, günlüklerde, çökme raporlarında, yedeklerde tam kart/kimlik numarası ve parola arar; test ortamında gerçek veri olup olmadığını sorar. -->

---

# Veri maskeleme: 3 teknik bir arada (animasyon)

<iframe class="dsanim" src="anim/masking.html?mode=slide&lang=tr" title="Veri maskeleme: kısmi maskeleme, tokenizasyon, takma adlandırma"></iframe>

<!-- Konuşma notu: Aynı değeri kısmi maskeleme, tokenizasyon ve takma adlandırma ile üç farklı şekilde işleyin. -->

---

# Maskeleme — uç durum: çok kısa bir değer

<iframe class="dsanim" src="anim/masking.html?mode=slide&lang=tr&example=edge-too-short" title="Uç durum: maskelemek için çok kısa bir değer"></iframe>

<!-- Konuşma notu: Değer maskelenemeyecek kadar kısaysa değişmeden gösterildiğini vurgulayın. -->

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
Layer 1 - crash dump turned off: OK
Layer 2 - mlock blocked writing to swap: OK
Secret in use: non-zero bytes = 23
Layer 3 - non-zero bytes after secure wipe = 0
OPENSSL_cleanse call stays in machine code (unlike memset, cannot be removed)
```

**Cihaz bağlama:** anahtarı cihaz parmak izinden **HKDF + AEAD** ile sar → başka
cihazda açılamaz (Demo 9).

---

# Bu bölümün kuralı

- Beklemede: hassas alanları **AEAD** ile şifrele, anahtarı koda gömme.
- Maskeleme şifrelemenin **yerine geçmez**, tamamlar (log, ekran, test).
- Kullanımda: sırrı **en son anda** aç, **en kısa süre** tut, kaldırılamaz biçimde **sil**.

---

# Bellekte güvenli silme (animasyon)

<iframe class="dsanim" src="anim/memory-wipe.html?mode=slide&lang=tr" title="Bellekte güvenli silme"></iframe>

<!-- Konuşma notu: Üç katmanın (döküm engelleme, kilitleme, güvenli silme) sırrı adım adım nasıl koruduğunu gösterin. -->

---

# Bellek silme — uç durum: özel karakterler

<iframe class="dsanim" src="anim/memory-wipe.html?mode=slide&lang=tr&example=edge-symbols" title="Uç durum: özel karakterler içeren bir sır"></iframe>

<!-- Konuşma notu: Özel karakterlerin de aynı şekilde güvenle silindiğini gösterin. -->

---

<!-- _class: bolum -->

# 10. Güvenlik kabukları

---

# Demo 9 — 4 kabukla sar, ters sırada aç

```text
WRAP:   secret -> K1(device) -> K2(storage) -> K3(session) -> K4(channel)
   Layer 4 = 128 bytes  <- transmitted packet
UNWRAP: K4 -> K3 -> K2 -> K1 -> secret   (all OK, secret CORRECT)

Attack 1: tamper 1 bit -> Layer 4 REJECTED (tag did not hold)
Attack 2: copy to another device -> outer 3 layers open,
          Layer 1 (device) REJECTED -> secret CANNOT be opened
```

✅ "Hangi tek önlem?" değil, "hangi **katmanlar**?" · bağımsız anahtarlar.

---

<!-- _class: yogun -->

# Sahadaki kabuk matrisi

| Kabuk | İçerik |
| --- | --- |
| 1 | Ödeme anahtarı **whitebox DES biçiminde** — hiç açık değil |
| 2 | Cüzdan anahtarıyla WB-AES-CBC + cihaz + uygulama bağlama |
| 3 | Beklemede: WB-AES-CBC + SHA-256 MAC + cihaz + sürüm · Aktarımda: oturum anahtarlı AES + MAC |
| 4 | TLS + açık anahtar sabitleme + sunucu sertifikası denetimi |
| Dış | Kimlik doğrulama kodu (oturum anahtarı + bağlama) |

---

<!-- _class: yogun -->

# Bir varlık, beş aşama

| Aşama | K1 | K2 | K3 | K4 |
| --- | :-: | :-: | :-: | :-: |
| Sunucudan aktarım | ✔ | ✔ | ✔ | ✔ |
| Veritabanında saklama | ✔ | ✔ | ✔ | — |
| Java tarafında çözme / API | ✔ | ✔ | — | — |
| Ödemede Java tarafı | ✔ | ✔ | — | — |
| Ödemede **native** taraf | ✔ | — | — | — |

- En içte bile **bir kabuk kalır** · o anki açıklığı **RASP** korur
- "Normal" varlık: beklemede 1, aktarımda 2 kabuk → maliyet dengesi
- Saldırı algılanınca yerel veritabanı **tamamen silinir**

<!-- Konuşma notu: Bugün DES yerine AES tabanlı whitebox ve AEAD tercih edilirdi; matris fikri zamansız. Proje S7'de bu tablo doldurulacak. -->

---

# Bu bölümün kuralı

- Kritik bir varlığı korurken "hangi tek önlem?" değil, "hangi **katmanlar**?" diye sorun.
- Her aşamaya (taşıma, depolama, kullanım) bir kabuk koyun.
- Kabukları **birbirinden bağımsız anahtarlarla** kurun; birinin kırılması diğerini vermesin.

---

# Güvenlik kabukları: dört katmanlı savunma (animasyon)

<iframe class="dsanim" src="anim/security-layers.html?mode=slide&lang=tr" title="Güvenlik kabukları: dört katmanlı savunma"></iframe>

<!-- Konuşma notu: Dört katmanın sarılıp ters sırada açıldığını, sırrın en sonunda geri geldiğini adım adım gösterin. -->

---

# Güvenlik kabukları — uç durum: başka cihaz

<iframe class="dsanim" src="anim/security-layers.html?mode=slide&lang=tr&example=edge-wrong-device" title="Uç durum: başka cihaz — Katman 1'de reddedilir"></iframe>

<!-- Konuşma notu: Dış üç katmanın açıldığını ama cihaza bağlı en iç katmanın başka cihazda açılamadığını vurgulayın. -->

---

<!-- _class: bolum -->

# 11. Whitebox kriptografiye giriş

---

# Whitebox'a giden yol — şema

![w:900](assets/h03-19-whitebox-motivasyon.svg)

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

# Uçtan uca: bir notu üç hâlde de korumak

Bir uygulama kullanıcının "notunu" korur: sunucudan **gelir** (aktarımda), diskte **durur** (beklemede), ekranda **gösterilir** (kullanımda).

| Hâl | Koruma | Bölüm |
| --- | --- | --- |
| Aktarımda | TLS 1.3 + zincir/SAN + (varsa) SPKI pin | 8 |
| Beklemede | AES-256-GCM (AEAD), benzersiz nonce, anahtar KDF'den | 5, 9 |
| Kullanımda | En kısa süre bellekte tut, iş bitince sil | 9 |

Anahtar zinciri: parola → **KDF** → ana anahtar → **HKDF** → veri/oturum anahtarı; her aşamada **AEAD bütünlüğü** de gelir.

---

<!-- _class: yogun -->

# Klasik kripto hataları — özet

| Hata | Bölüm | Kural |
| --- | --- | --- |
| Nonce tekrarı | 4 | Anahtarla asla tekrar etmesin; sayaç ya da yeterli rastgele nonce |
| Zayıf rastgelelik | 3 | `rand()` değil, **CSPRNG** (`getrandom`, `BCryptGenRandom`) |
| Parolayı doğrudan anahtar yapmak | 5 | **KDF** ile türet (tuzlu, yavaş) |
| ECB kipi | 4 | Desen sızdırır ("penguen"); **AEAD** kullan |
| Şifreleme var, bütünlük yok | 2 | **AEAD** ya da encrypt-then-MAC |
| Sabit zamanlı olmayan karşılaştırma | 3 | `memcmp` değil, sabit zamanlı karşılaştır |

Altı hatanın hepsi bu destede işlendi; burada tek bakışta toparlıyoruz.

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

# Kendini sınama — cevaplar (örnek 1–6)

1. **AES-CTR** yalnız gizlilik verir; **AEAD (AES-GCM)** gizlilik **+ bütünlük/kimlik** doğrulamayı bir **etiketle** birlikte verir. CTR'de değişiklik fark edilmez.
2. Aynı anahtar+nonce **anahtar akışını tekrarlar**; iki şifreli metnin XOR'u açık metni sızdırır, GCM'de **kimlik anahtarı** riske girer.
3. **ECB** aynı bloğu aynı şifreli bloğa çevirir → **desenler görünür**; anlamsal güvenlik yok.
4. İstemcinin **sertifika/hostname doğrulamasını kendiliğinden yapmaması**; elle açılmazsa **MITM**.
5. **Pinning:** beklenen sunucu anahtarını (SPKI) sabitler → sahte-ama-"geçerli" sertifikayı yakalar. **Hostname doğrulama:** sertifikanın doğru **alan adına** ait olduğunu yakalar.
6. **Güvenlik kabuğu:** varlığı saran koruma (C=gizlilik, I=bütünlük). Örn. anahtar dosyası = AES-GCM (C) + etiket/HMAC (I).

---

# Kendini sınama (devam)

7. `rand()` neden güvenlik için kullanılamaz? Yerine?
8. `EVP_DecryptFinal_ex` başarısız döndü; tampondaki açık metne ne yaparsınız?
9. MAC karşılaştırmasında `memcmp` neden sakıncalı?
10. Kripto-periyodu dolan anahtar hemen silinir mi?
11. Zarflamada KEK yenilenince neden veri yeniden şifrelenmez?

<!-- önce sordur, sonra cevap slaytını aç -->

---

# Kendini sınama — cevaplar (7–11)

7. `rand()` **istatistikseldir, tahmin edilebilir** → CSPRNG kullanın (`RAND_bytes` / `getrandom`).
8. Çözme başarısızsa tampondaki açık metni **güvenli silin** (`memset_s`) ve **reddedin** — bütünlük doğrulanmadı, kullanmayın.
9. `memcmp` **erken çıkar** → **zamanlama sızıntısı**; `CRYPTO_memcmp` / sabit zamanlı karşılaştırma kullanın.
10. **Hayır.** Yeni şifrelemede kullanılmaz ama eski veri yeniden şifrelenene dek **yalnız çözmede** tutulur.
11. Veri **DEK** ile şifrelidir; KEK yenilenince yalnızca **DEK'ler yeniden sarılır** (rewrap), veri değil.

---

# Kendini sınama (devam)

12. `SSL_set1_host` çağrılmazsa ne olur?
13. Sabitlemede neden SPKI ve neden yedek pin?
14. "Fail-open" nedir? Bir örnek
15. Kimlik numarasının düz SHA-256'sı neden takma ad olamaz?
16. Tokenizasyon PCI DSS kapsamını neden küçültür?

<!-- önce sordur, sonra cevap slaytını aç -->

---

# Kendini sınama — cevaplar (12–16)

12. `SSL_set1_host` yoksa **hostname doğrulanmaz**; başka ada ait **geçerli** sertifika kabul edilir → MITM.
13. **SPKI** sertifika yenilense de (anahtar aynıysa) **değişmez**; **yedek pin** anahtar değişiminde uygulamanın **"tuğlalaşmasını"** önler.
14. **Fail-open:** hata durumunda "geçti/izin ver" sayılması; örn. **yutulan `KeyStoreException`** ile doğrulamanın atlanması.
15. Kimlik no'nun değer uzayı **küçük/tahmin edilebilir** → düz SHA-256 **kaba kuvvetle** geri döner; **anahtarlı HMAC** gerekir.
16. **Tokenizasyon:** gerçek PAN yalnız **kasada** kalır; sistemin kalanı token tutar → **PCI DSS denetim kapsamı** daralır.

---

# Kendini sınama (devam)

17. Verinin üç hâli ve her birinin koruması?
18. Parola neden doğrudan anahtar olamaz?
19. AEAD ne sağlar, hangi ayrı adımların yerine geçer?
20. İleri gizlilik ne demek?
21. IV/nonce/tuz gizli mi? Kuralı ne?
22. CSPRNG neden gerekli?
23. Anahtar hiyerarşisi neden var?

<!-- önce sordur, sonra cevap slaytını aç -->

---

# Kendini sınama — cevaplar (17–23)

17. **Aktarımda** (TLS), **beklemede** (AEAD şifreleme), **kullanımda** (kısa ömür + silme).
18. Düşük entropili ve tahmin edilebilir; **KDF** (PBKDF2/Argon2) ile tuzlu, yavaş türetilir.
19. **Gizlilik + bütünlüğü** birlikte verir; ayrı şifreleme + MAC adımlarının yerine geçer.
20. Her oturum için **yeni anahtar**; uzun vadeli anahtar sızsa bile eski oturumlar çözülemez.
21. **Gizli değildir** ama **benzersiz/tekrarsız** olmalı; nonce tekrarı ve sabit tuz tehlikelidir.
22. `rand()` tahmin edilebilir; anahtar/nonce/tuz için **CSPRNG** (OS) gerekir.
23. Tek anahtar her işte kullanılmaz; ana anahtardan türev anahtarlar gelir, her birinin ayrı görevi ve ömrü olur.

---

<!-- _class: yogun -->

# Sözlük

| Terim | Anlam |
| --- | --- |
| Üç hâl | Aktarımda/beklemede/kullanımda |
| AEAD | Şifreleme + bütünlük |
| CSPRNG | Güvenli rastgele üreteç |
| KDF/HKDF | Anahtar türetme |
| Nonce/tuz | Benzersiz/rastgele yardımcı değer |
| İleri gizlilik | Eski oturumlar sonra çözülemez |

---

<!-- _class: baslik -->

# Bir sonraki hafta

**4. hafta — Kod Sağlamlaştırma (hardening): C/C++**

Bu hafta veriyi (anahtarı, açık metni) doğru şifreleme ve anahtar yönetimiyle korumayı öğrendik; ama şifreleme kodunun kendisi de bir C/C++ programıdır — bir arabellek taşması, biçim dizesi (format string) açığı ya da tamsayı hatası, özenle korunan anahtarı ve açık metni belleğe sızdırabilir.

4\. haftada **SEI CERT C/C++** kurallarıyla tam olarak bu tür hataları önlemeyi, statik analiz ve sanitizer'larla yakalamayı işleyeceğiz.

> Bu haftanın özeti: veriyi **üç hâlinde de** koru; doğru kip (AEAD), güvenli rastgelelik, KDF ile anahtar, benzersiz nonce ve iyi yönetilen anahtar hiyerarşisi.

10\. haftada PKI ve sertifikalarla derinleşeceğiz.
