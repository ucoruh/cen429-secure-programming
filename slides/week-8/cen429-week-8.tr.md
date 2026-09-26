---
marp: true
theme: cen429
paginate: true
lang: tr
title: "CEN429 Hafta 8 — Ara Sınav Haftası: Quiz-1"
author: "Dr. Öğr. Üyesi Uğur CORUH"
header: "CEN429 Güvenli Programlama · Hafta 8"
footer: "RTEÜ Bilgisayar Mühendisliği · 2026-2027 Güz"
---



<!-- _class: baslik -->
<!-- _paginate: false -->

# Ara Sınav Haftası: Quiz-1

**CEN429 Güvenli Programlama — Hafta 8**

Dr. Öğr. Üyesi Uğur CORUH · 31.10–08.11.2026

<!--
Konuşma notu: Quiz-1 haftası: 1-6. haftaların kavramlarını tekrar ediyoruz; bu sunum çalışma rehberidir.
-->

---

# Quiz-1: ne, ne zaman?

- Kapsam: **1–6. haftalar** · vizenin **%40**'ı
- Tarih, saat, yer, süre, soru biçimi: **ders sınıfında** duyurulur
- Ölçülen: ezber değil, **neden** sorusu — sık karıştırılan kavramları da nedeniyle öğrenin
- En iyi hazırlık: her haftanın **Kendini sınama** sorularını cevaba bakmadan yapıp demoları yeniden çalıştırmak
- Özellikle **3. ve 4. hafta** demolarını bir kez daha gözden geçirin

---

<!-- _class: yogun -->

# Konu haritası (1)

| Hafta | Ana kavramlar |
| --- | --- |
| 1 | CIA · varlık–tehdit–zafiyet–risk · beyaz kutu · Saltzer–Schroeder · 7 katman · koruma planı 7 adım · arayüz/varlık tablosu · STRIDE, VAD · saldırı ağacı · güvenli başlatma · bellek hataları · güvenli silme |
| 2 | Virüs/solucan/truva · salgın · kural tespiti · bütünlük izleme · BLP, Biba, Clark–Wilson · Unix/Windows ACL · RBAC · CWE, OWASP, CVE, CVSS · günlük enjeksiyonu |
| 3 | AEAD · özet/MAC/imza · CSPRNG · nonce/IV/tuz · ECB · Argon2id · HKDF · anahtar yaşam döngüsü · TLS 1.3 · sabitleme · fail-open · maskeleme · kabuklar |

*Ek not: 2. hafta — güven sınırı ve en az yetki ilkesi.*

---

<!-- _class: yogun -->

# Konu haritası (2)

| Hafta | Ana kavramlar |
| --- | --- |
| 4 | SEI CERT · girdi doğrulama · biçim dizesi (format string) · UAF · tamsayı/UB · hata işleme, sinyaller · statik analiz · sanitizer · fuzzing · kanarya/FORTIFY/ASLR/NX/RELRO/CFI · gizlemeye giriş |
| 5 | Yönetilen dil · CERT Java · enjeksiyon kökü · SQL/komut/yol · seri durumdan çıkarma · XXE/XSS · Python/JS, ReDoS · bayt kodu · ProGuard/R8 · SBOM, VEX |
| 6 | Algılama–savunma–caydırma · MATE · RASP mimarisi · bütünlük · hata ayıklayıcı/ortam/kanca · bellek koruması · root/imza · akış sayacı · tepki, decoy, cihaz bağlama |

*Ek not: 4. hafta — üç katman (kod → derleyici/OS → gizleme); 5. hafta — yönetilen dil bellek hatasını çözer, enjeksiyonu çözmez.*

---

# Quiz-1 kapsamı — şema

![w:950](assets/h08-01-kapsam.svg)

---

<!-- _class: yogun -->

# Sık karıştırılanlar (1)

| A | B | Fark |
| --- | --- | --- |
| Kodlama | Şifreleme | Kodlama anahtarsız, gizlilik yok |
| Özet | MAC | MAC gizli anahtar ister |
| MAC | İmza | İmza asimetrik → inkâr edilemezlik |
| Nonce | Tuz | Nonce asla tekrar etmez · tuz parola başına |
| PBKDF2/Argon2id | HKDF | Parola (yavaş) · yüksek entropili sır (hızlı) |
| Zincir doğrulama | Ad denetimi | "Güvenilir CA mı?" · "Bu sunucu için mi?" |
| Fail-open | Fail-closed | Hatada "geçti" · hatada "reddet" |

---

<!-- _class: yogun -->

# Sık karıştırılanlar (2)

| A | B | Fark |
| --- | --- | --- |
| Kanarya | ASLR | Dönüşte taşma tespiti · adres rastgeleleştirme |
| ASan | UBSan | Bellek erişimi · tanımsız davranış |
| İşaretsiz sarma | İşaretli taşma | Tanımlı · **tanımsız** |
| Parametreli sorgu | Kaçış | Asıl çözüm · ikinci hat |
| ProGuard | Dize gizleme | Adlar · dizeler (string) |
| Gizleme | Güvenli kodlama | Geciktirir · düzeltir |
| Maskeleme | Tokenizasyon | Gösterimde gizle · kasadaki değere bağlı belirteç |
| Takma ad | Anonim | Hâlâ kişisel veri · kişiye bağlanamaz |

---

<!-- _class: yogun -->

# Sık karıştırılanlar (3)

| A | B | Fark |
| --- | --- | --- |
| Hata | Zafiyet | Kötüye kullanılabilir hata |
| Kara kutu | Beyaz kutu (MATE) | Programa sahip |
| Simetrik | Asimetrik | Tek / çift anahtar |
| AEAD | Yalnız şifreleme | + bütünlük |

---

# Soru tipleri — şema

![w:950](assets/h08-02-soru-tipleri.svg)

---

<!-- _class: yogun -->

# Bir haftalık plan

| Gün | Ne yapılacak? |
| --- | --- |
| 1 | 1. hafta: STRIDE, saldırı ağacı, koruma planı · Demo 1–4 |
| 2 | 2. hafta: BLP, Biba, Clark–Wilson · bir CVSS vektörünü kendin puanla |
| 3 | 3. hafta (1): AEAD, nonce, KDF, rastgele sayı · Demo 1–5 |
| 4 | 3. hafta (2): anahtar yönetimi, TLS, sabitleme, kabuklar · Demo 6–9 |
| 5 | 4. hafta: CERT çiftleri, biçim dizesi, UAF, UB, korumalar |
| 6 | 5–6. hafta: enjeksiyon, seri durumdan çıkarma, ProGuard, SBOM, RASP |
| 7 | Örnek soruları süre tutarak çöz, yanlışları oku |

---

# Vize notu hesabı — şema

![w:950](assets/h08-03-vize-hesabi.svg)

---

# Çalışma planı — şema

![w:950](assets/h08-04-calisma-plani.svg)

---

# Soru 1

**MATE saldırgan neden kriptografiyi tek başına yetersiz bırakır?**

**Cevap:** Anahtar bellekte; saldırgan programı çalıştırıp okur. Kripto gizliliği verir ama beyaz kutuda anahtar korunmaz; RASP/gizleme/whitebox gerekir.

---

# Soru 2

**AES-GCM'de aynı nonce iki kez kullanılırsa?**

**Cevap:** Gizlilik ve bütünlük çöker; anahtar akışı ve veri sızabilir. Nonce her zaman benzersiz olmalı.

---

# Soru 3

**ASan hangi taşmayı göremez?**

**Cevap:** Aynı yapının içinde alandan alana taşmayı (arada koruma bölgesi (redzone) yoktur).

---

# Soru 4

**Kanarya neyi durdurur, neyi durdurmaz?**

**Cevap:** Durdurur: dönüş adresine ulaşan yığın (stack) taşması. Durdurmaz: öbek (heap) taşması, önceki değişkenler, sızan kanarya.

---

# Soru 5

**RASP self-hashing tek başına neden yetmez?**

**Cevap:** Saldırgan özet fonksiyonunu bulup atlatabilir. Gizleme + çapraz + örtüşen denetim gerekir.

---

# Soru 6

**Paroladan anahtar türetirken neden KDF ve tuz?**

**Cevap:** Parola düşük entropili; KDF yavaşlatır, tuz aynı parolaların aynı anahtar üretmesini önler (gökkuşağı tablosu).

---

# Soru 7

**En az yetki ilkesi bir örnekle?**

**Cevap:** Uygulamanın DB kullanıcısı yalnız `SELECT` yapabilsin; `DROP` yetkisi olmasın. Fazla yetki = büyük hasar.

---

# Soru 8

**Tehdit modellemede STRIDE'ın "E"si nedir, bir önlem?**

**Cevap:** Elevation of privilege (yetki yükseltme). Önlem: en az yetki, yetki denetimi, güvenli varsayılan.

---

# Soru 9

**Deserialization neden tehlikeli, çözüm?**

**Cevap:** Çıkarma sırasında kod çalışabilir (gadget). Çözüm: veri biçimi + şema; zorunda kalınırsa beyaz liste filtresi.

---

# Örnek · çoktan seçmeli

**Aşağıdakilerden hangisi bir AEAD kipidir?**

A) ECB B) CBC C) **GCM** ✓ D) Ham RSA

---

# Örnek · doğru/yanlış

- Gizleme hatayı düzeltir. **(Y)**
- Nonce gizli olmalı. **(Y — benzersiz olmalı, gizli değil)**
- Parametreli sorgu SQL enjeksiyonunu önler. **(D)**

---

<!-- _class: yogun -->

# Örnek: hatayı bulun (1)

```c
void kaydet(const char *ad) {
    char tampon[32];
    sprintf(tampon, "kullanici=%s", ad);
    syslog(LOG_INFO, tampon);
}
```

```c
char parola[64];  oku(parola, sizeof parola);  dogrula(parola);
memset(parola, 0, sizeof parola);  return;
```

<!-- Konuşma notu: 1) sprintf taşması (STR31-C, snprintf) + syslog biçim dizisi (FIO30-C, "%s"). 2) memset derleyici tarafından kaldırılabilir (MSC06-C) → explicit_bzero/SecureZeroMemory. -->

---

<!-- _class: yogun -->

# Örnek: hatayı bulun (2)

```java
String sql = "SELECT * FROM notlar WHERE ogrenci = '" + no + "'";
```

```c
EVP_DecryptUpdate(ctx, acik, &n, sifreli, sifreli_n);
kullan(acik, n);
EVP_DecryptFinal_ex(ctx, acik + n, &m);
```

```java
try { pinDenetle(zincir); } catch (KeyStoreException e) { e.printStackTrace(); }
```

<!-- Konuşma notu: 1) SQL enjeksiyonu; kesin çözüm parametreli sorgu (PreparedStatement) — veri asla komut olarak yorumlanmaz, string birleştirme yapılmaz. 2) Etiket doğrulanmadan açık metin kullanılıyor, Final dönüşü denetlenmiyor. 3) Fail-open: hata yutuluyor, bağlantı kabul ediliyor. -->

---

# Örnek: senaryolar

1. Bütün kullanıcılarda **aynı gömülü AES anahtarı**: riskler ve öneri?
2. Dağıtılan paket **hata ayıklama derlemesi**: hangi bulgular?
3. "Bu işlemi ben yapmadım": hangi STRIDE harfi, hangi kanıt?
4. Arşiv açan fonksiyon: hangi hatalara karşı ne yaparsınız?
5. Log4Shell'de asıl sorun neydi, ne önlerdi?
6. RASP denetimleri neden tek bir `if` ile değerlendirilmemeli?

<!-- Konuşma notu: Cevaplar 8. hafta sayfasında, açılır kutularda. -->

---

# Son söz (Quiz-1 hazırlık)

> Ezber değil, **neden** ölçülür: "neden bu kip?", "neden bu denetim?", "neyi korumaz?"

İyi şanslar.

---

# Gelecek hafta

**Hafta 9 — Gelişmiş kod gizleme ve çeşitlendirme**

- Gizleme taksonomisi, opak yüklemler, veri kodlama
- Sanallaştırma ve derleyici tabanlı gizleme (kavram)
- Gizlemenin ölçülmesi: güç, dayanıklılık, maliyet
