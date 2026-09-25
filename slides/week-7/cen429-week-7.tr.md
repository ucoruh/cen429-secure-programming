---
marp: true
theme: cen429
paginate: true
lang: tr
title: "CEN429 Hafta 7 — Ara Proje Gösterimleri"
author: "Dr. Öğr. Üyesi Uğur CORUH"
header: "CEN429 Güvenli Programlama · Hafta 7"
footer: "RTEÜ Bilgisayar Mühendisliği · 2026-2027 Güz"
---



<!-- _class: baslik -->
<!-- _paginate: false -->

# Ara Proje Gösterimleri

**CEN429 Güvenli Programlama — Hafta 7**

Dr. Öğr. Üyesi Uğur CORUH · 30.10.2026

<!--
Konuşma notu: Bu hafta ders değil gösterim haftası: her takım güvenlik kılavuzunun vize bölümlerini ve çalışan uygulamasını gösterir.
-->

---

# Bu hafta: ara proje gösterimleri (RAP1)

- Ders anlatılmaz; her takım **ara raporunu teslim eder** ve **uygulamasını gösterir**
- RAP1 = vizenin **%60**'ı · Quiz-1 = **%40** → `Not_Vize = 0,6·RAP1 + 0,4·QUIZ1`
- Ayrıntılı rubrik: proje rehberi · sıra, süre, teslim saati: ders sınıfı
- ⚠️ Geç teslim kabul edilmez

---

<!-- _class: yogun -->

# Vize rubriği: beş kriter

| Kriter | ÖÇ | Kılavuzda |
| --- | --- | --- |
| Güvenlik analizi | 1 | S2 · S3 arayüz tablosu · S4 tehdit/saldırgan modeli |
| Veri güvenliği | 2 | S5 varlık listesi · S7 kabuk matrisi |
| C/C++ sağlamlaştırma ve RASP | 3 | S9 (temel) · S10 |
| Proje yönetimi | 5 | S13 süreç, SBOM · GitHub deposu ve plan |
| Ara rapor | 7 | Vize bölümlerinin tamamı |

Kanıt = kılavuzun ilgili bölümü + kod + test çıktısı; her tehdide karşılık en az bir önlem gösterin.

---

# Rubriğin okunuşu — şema

![w:950](assets/h07-04-rubrik.svg)

---

<!-- _class: yogun -->

# Ara raporda hangi bölümler?

| Tam | Taslak / kısa / plan |
| --- | --- |
| S0 kapak · S2 genel bakış · S3 mimari · S4 tehdit modeli | S1 kapsam (taslak) · S5 varlıklar (taslak) |
| S7 veri güvenliği · S10 RASP · S13 süreç | S9 sağlamlaştırma (temel) · S12 raporlama (kısa) |
| | S16 test (plan) · S17 uyum matrisi (taslak) |

Finale kalanlar: S6 · S8 · S11 · S14 · S15

---

# RAP1 teslimi — şema

![w:950](assets/h07-02-rap1.svg)

---

<!-- _class: yogun -->

# Hazırlık kontrol listesi

| Hafta | Gösterebilmeniz gereken |
| --- | --- |
| 1 | Depo + plan · S2 · S3 arayüz tablosu · S4 STRIDE + saldırı ağacı · S5 taslak (C/I/I+) |
| 2 | Her tehdit → CWE + CVSS v3.1 vektörü |
| 3 | S7 algoritma/anahtar/bağlama · kabuk matrisi · CSPRNG · AEAD doğrulama |
| 4 | S9 koruma tablosu · CERT bulguları · ASan+UBSan · fuzz sonucu |
| 5 | SBOM + tarama · girdi doğrulama tablosu |
| 6 | S10 RASP envanteri · tepki politikası · bir atlatma denemesi |

---

<!-- _class: yogun -->

# Önerilen gösterim akışı

1. **Ürün ve mimari** (S2–S3, ~2 dk): tek şema, güven sınırları
2. **Tehditler ve varlıklar** (S4–S5): en kritik üç tehdit, her birine bir önlem
3. **Canlı gösterim:** en az bir önlem **çalışırken** (ör. şifreli veri, imza doğrulama, RASP tetiklenmesi) — yedek video + hazır komutlarla
4. **Kanıt:** koruma tablosu, sanitizer/fuzz, SBOM — komut + çıktı
5. **Kalan risk ve plan:** finale kadar ne yapılacak? (dürüst analiz puan getirir)

Her önlem için: **Neyi korur? · Nasıl yapıldı? · Nasıl kanıtlandı?**

---

# Gösterim günü akışı — şema

![w:950](assets/h07-01-gosterim-akisi.svg)

---

<!-- _class: yogun -->

# Örnek sorular

- Güven sınırını geçen en riskli akış hangisi?
- Bu varlık bellekte ne kadar açık kalıyor, nerede siliniyor?
- Anahtar nereden geliyor, nerede duruyor, ne zaman siliniyor? Nonce tekrar edebilir mi?
- Hangi derleyici koruması kapalı, neden?
- RASP denetimi başarısız olunca ne oluyor?
- SBOM'da zafiyetli bileşen var mı? Etkileniyor musunuz?
- En kritik üç varlığınız, C/I/I+ etiketleri ve yaşam döngüsü nedir?
- Bir tehdide karşı hangi önlem var, nasıl doğrulandı? (tehdit → önlem → kanıt)
- Kalan riskiniz ne, neden kabul edilebilir? (dürüst ve gerekçeli yanıtlayın)

---

<!-- _class: yogun -->

# Sık yapılan hatalar

| Hata | Neden sorun? |
| --- | --- |
| Kılavuz ile kod tutarsız | En ciddi bulgulardan biri |
| Kanıtsız "güvenli" iddiası | Puanlanmaz |
| Varlık listesinde anahtar/günlük/kod yok | Listede olmayan korunmuyor |
| Genel bilgiden tehdit tablosu | Projeye özgü tehditler kaçar |
| Prova edilmemiş gösterim | Süre boşa gider |
| Depoda gerçek parola/anahtar/kişisel veri | Ciddi güvenlik hatası; değerler **sentetik** |
| Canlı demo yedeksiz çöküyor / kalan risk bölümü boş | Hazırlıksızlık ve dürüst olmayan analiz izlenimi verir |

---

# Sık yapılan hatalar — şema

![w:950](assets/h07-03-sik-hatalar.svg)

---

# Akademik dürüstlük

- Kaynaksız kod/metin, takım dışı çalışma, uydurma sonuç **kabul edilmez**
- Teslim edilen her satır açıklanabilmeli
- Her takım üyesi kendi bölümünü anlatabilmeli; herkese soru sorulabilir

---

# Gösterimden sonra

- Geri bildirimi **bulgu listesi** olarak yazın (bulgu · önem · düzeltme · tarih) → 12. haftanın küçük modeli
- Final bölümleri: S6 · S8 · S11 · S14 · S15 · S16 sonuç · S17

> Gösterim bir **kanıt** sunumudur: her iddianın arkasında bir belge, test ya da canlı çıktı olsun.

---

# Gelecek hafta

**Hafta 8 — Ara sınav haftası: Quiz-1**

- Kapsam: 1–6. haftalar
- Çalışma rehberi ve örnek sorular: 8. hafta sayfası
