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
- Ölçülen: ezber değil, **neden** sorusu
- En iyi hazırlık: her haftanın **Kendini sınama** soruları + demoları yeniden çalıştırmak

---

<!-- _class: yogun -->

# Konu haritası (1)

| Hafta | Ana kavramlar |
| --- | --- |
| 1 | CIA · varlık–tehdit–zafiyet–risk · beyaz kutu · Saltzer–Schroeder · 7 katman · koruma planı 7 adım · arayüz/varlık tablosu · STRIDE, VAD · saldırı ağacı · güvenli başlatma · bellek hataları · güvenli silme |
| 2 | Virüs/solucan/truva · salgın · kural tespiti · bütünlük izleme · BLP, Biba, Clark–Wilson · Unix/Windows ACL · RBAC · CWE, OWASP, CVE, CVSS · günlük enjeksiyonu |
| 3 | AEAD · özet/MAC/imza · CSPRNG · nonce/IV/tuz · ECB · Argon2id · HKDF · anahtar yaşam döngüsü · TLS 1.3 · sabitleme · fail-open · maskeleme · kabuklar |

---

<!-- _class: yogun -->

# Konu haritası (2)

| Hafta | Ana kavramlar |
| --- | --- |
| 4 | SEI CERT · girdi doğrulama · biçim dizisi · UAF · tamsayı/UB · hata işleme, sinyaller · statik analiz · sanitizer · fuzzing · kanarya/FORTIFY/ASLR/NX/RELRO/CFI · gizlemeye giriş |
| 5 | Yönetilen dil · CERT Java · enjeksiyon kökü · SQL/komut/yol · seri durumdan çıkarma · XXE/XSS · Python/JS, ReDoS · bayt kodu · ProGuard/R8 · SBOM, VEX |
| 6 | Algılama–savunma–caydırma · MATE · RASP mimarisi · bütünlük · hata ayıklayıcı/ortam/kanca · bellek koruması · root/imza · akış sayacı · tepki, decoy, cihaz bağlama |

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
| ProGuard | Dize gizleme | Adlar · dizgeler |
| Gizleme | Güvenli kodlama | Geciktirir · düzeltir |
| Maskeleme | Tokenizasyon | Gösterimde gizle · kasadaki değere bağlı belirteç |
| Takma ad | Anonim | Hâlâ kişisel veri · kişiye bağlanamaz |

---

<!-- _class: yogun -->

# Bir haftalık plan

| Gün | Ne yapılacak? |
| --- | --- |
| 1 | 1. hafta: STRIDE, saldırı ağacı, koruma planı · Demo 1–4 |
| 2 | 2. hafta: BLP, Biba, Clark–Wilson · bir CVSS vektörünü kendin puanla |
| 3 | 3. hafta (1): AEAD, nonce, KDF, rastgele sayı · Demo 1–5 |
| 4 | 3. hafta (2): anahtar yönetimi, TLS, sabitleme, kabuklar · Demo 6–9 |
| 5 | 4. hafta: CERT çiftleri, biçim dizisi, UAF, UB, korumalar |
| 6 | 5–6. hafta: enjeksiyon, seri durumdan çıkarma, ProGuard, SBOM, RASP |
| 7 | Örnek soruları süre tutarak çöz, yanlışları oku |

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

<!-- Konuşma notu: 1) SQL enjeksiyonu → PreparedStatement. 2) Etiket doğrulanmadan açık metin kullanılıyor, Final dönüşü denetlenmiyor. 3) Fail-open: hata yutuluyor, bağlantı kabul ediliyor. -->

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

# Gelecek hafta

**Hafta 9 — Gelişmiş kod gizleme ve çeşitlendirme**

- Gizleme taksonomisi, opak yüklemler, veri kodlama
- Sanallaştırma ve derleyici tabanlı gizleme (kavram)
- Gizlemenin ölçülmesi: güç, dayanıklılık, maliyet
