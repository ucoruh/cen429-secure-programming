---
marp: true
theme: cen429
paginate: true
lang: tr
title: "CEN429 Hafta 12 — Güvenlik Sertifikasyonları ve Sızma Testi Planlaması"
author: "Dr. Öğr. Üyesi Uğur CORUH"
header: "CEN429 Güvenli Programlama · Hafta 12"
footer: "RTEÜ Bilgisayar Mühendisliği · 2026-2027 Güz"
---


<!-- _class: baslik -->
<!-- _paginate: false -->

# Güvenlik Sertifikasyonları ve Sızma Testi Planlaması

**CEN429 Güvenli Programlama — Hafta 12**

Dr. Öğr. Üyesi Uğur CORUH · 04.12.2026

<!--
Konuşma notu: Bu hafta bir ürünün bağımsız bir laboratuvarda nasıl değerlendirildiğini ve bir sızma testinin nasıl planlandığını adım adım görüyoruz.
-->

---

# Bugünün planı (3 saat)

| Saat | Konu |
| --- | --- |
| 1 | Neden bağımsız değerlendirme? · standartlar · değerlendirme süreci (13 adım) |
| 2 | Zafiyet değerlendirmesi yöntemleri · standartların istediği testler · saldırı potansiyeli |
| 3 | Sızma testi planı (kapsam, kurallar, yöntem, şablon) · raporlama · proje S16 |

⚠️ Sızma testi **yazılı izin** ve tanımlı kapsam olmadan yapılamaz

---

<!-- _class: bolum -->

# 1. Bağımsız değerlendirme ve süreç

---

# Neden bağımsız değerlendirme?

- "Kendi kodum güvenli" demek yetmez → **üçüncü taraf** doğrular
- Değerlendirici iki varsayım: **beyaz kutu** (tüm kaynak + belge) + **platform güvenilmez**
- Sonuç: korumanın *var olması* değil, **ne kadar kolay aşıldığı** ölçülür

---

<!-- _class: yogun -->

# Standartlar manzarası

| Standart | Neyi sertifikalar |
| --- | --- |
| ISO/IEC 27001 | **Kurumu** (süreç) |
| Ortak Kriterler (15408) | **Ürünü** (EAL derinliği) |
| FIPS 140-3 | Kripto **modülü** |
| ETSI EN 303 645 | IoT temel gereksinimleri |
| EMVCo / PCI | Ödeme; sıkı laboratuvar testi |
| OWASP MASVS/MASTG | Mobil uygulama (size en yakın) |

---

<!-- _class: yogun -->

# Değerlendirme süreci: 13 adım

**Hazırlık:** 1 TOE · 2 belge teslimi · 3 gereksinim şablonu · 4 atölye
**Değerlendirme:** 5 kod incelemesi · 6 zafiyet analizi · 7 sızma testi · 8 işlevsel uygunluk
**Sonuç/süreklilik:** 9 bulgu–düzeltme · 10 etki analizi · 11 delta · 12 kalan risk · 13 değişiklik yönetimi

Kılavuz = 2. adımda teslim edilen **güvenlik kılavuzu**; okuru laboratuvar

---

# TOE: değerlendirme hedefi benzersiz tanımlanır

- Sürüm numarası **yetmez** → ikili + kaynak + özet/etiket
- Kapsam dışı bileşenler yazılır
- Projede: S0/S1 sürüm kimliği (1. hafta)

> Sürüm kimliği tutarsızsa delta değerlendirme yapılamaz

---

<!-- _class: bolum -->

# 2. Yöntemler, testler, derecelendirme

---

<!-- _class: yogun -->

# Zafiyet değerlendirmesi: doğru sıra

| Sıra | Yöntem | Ne bulur |
| --- | --- | --- |
| 1 | Kod incelemesi (el ile) | Mantık, kripto yanlışları |
| 2 | SAST (statik) | Kalıp, tehlikeli çağrı |
| 3 | DAST + sanitizer | Çalışırken bellek/UB |
| 4 | Fuzzing | Beklenmeyen girdi yolları |
| 5 | Sızma testi | Birleştirip aşılabilirlik |

Ucuz+geniş → pahalı+derin · geliştirici bunları **önce kendi** çalıştırıp S16'ya koyar

---

# Standartların istediği testler

- **Ortak Kriterler:** kaynak inceleme + zafiyet analizi + sızma testi + **saldırı potansiyeli**
- **FIPS 140-3:** kripto modülü testleri (yalnız modül)
- **EMVCo/PCI:** işlevsel uygunluk + laboratuvar sızma testi
- **MASVS/MASTG:** mobil statik + dinamik

Yöntem rehberleri: **WSTG · MASTG · PTES · NIST SP 800-115** (tarif değil, metodoloji)

---

<!-- _class: yogun -->

# Saldırı potansiyeli: "kırmak ne gerektirdi?"

| Faktör | Düşük | Yüksek |
| --- | --- | --- |
| Geçen süre | Bir gün | Aylar |
| Uzmanlık | Sıradan | Uzman |
| Hedef bilgisi | Kamuya açık | Gizli belge |
| Fırsat penceresi | Sınırsız/uzak | Kısıtlı fiziksel |
| Ekipman | Ücretsiz | Özel/pahalı |

Toplam **düşük** → kolay saldırı → **ciddi bulgu** (9. haftanın güç/dayanıklılık ölçüsü)

---

# CVSS + bulgu–öneri–aksiyon

- **Saldırı potansiyeli:** olabilirlik (zorluk) · **CVSS:** etki (C/I/A kaybı) → birlikte önceliklendirir
- Döngü: **bulgu → öneri → aksiyon → kapanış**
- Bazı bulgular "açık değil, iyi uygulama önerisi" olarak kapanır → vize **bulgu–aksiyon listesi** (7. hafta)

---

# Etki analizi vs delta değerlendirme

- **Güvenlik etki analizi:** değişiklikleri sınıflar (özellik/iyileştirme/düzeltme), etkilenen dosyalar, güvenlik etkisi — *geliştiricinin* çıktısı
- **Delta değerlendirme:** bu belgeye dayanıp **yalnız değişeni** yeniden değerlendirir — *laboratuvarın* işi

⚠️ Sürüm kimliği/özet tutarsızsa delta yapılamaz

---

<!-- _class: bolum -->

# 3. Sızma testi planı ve raporlama

---

# Plan: dört başlık

1. **Kapsam:** hangi ikili/sürüm, bileşen, ortam, veri (yalnız sentetik); **neyin dışarıda** olduğu
2. **Angajman kuralları:** yazılı izin, pencere, yasak yöntemler, durdurma koşulu, iletişim
3. **Yöntem:** MASTG/WSTG/PTES/NIST SP 800-115 → tekrarlanabilir, karşılaştırılabilir
4. **Test şablonu:** sekiz başlık (sonraki slayt)

⚠️ Kapsamı/kuralı yazılı olmayan test meşru bir çalışma değildir

---

<!-- _class: yogun -->

# Test kartı: sekiz başlık (= S16 iskeleti)

| Alan | İçerik |
| --- | --- |
| Test kimliği | Benzersiz numara |
| İlgili gereksinim | Hangi varlık/gereksinim (S17 bağı) |
| Amaç | Ne doğrulanıyor |
| Ön koşullar | Ortam, sürüm, veri |
| Yöntem/adımlar | Tekrarlanabilir |
| Beklenen sonuç | Güvenli davranış |
| Gözlenen sonuç | Ne oldu (kanıt) |
| Karar | Saldırı potansiyeli + geçti/kaldı + öneri |

---

# Takım etkinliği

- Her takım kendi projesinden **bir varlık** seçer
- Onun için **bir** test kartı doldurur
- Amaç açık bulmak değil, **doğru test kartını yazmayı** öğrenmek

---

# Raporlama: karar verilebilir belge

- **Yönetici özeti:** en kritik üç bulgu (teknik olmayan okur)
- **Yöntem ve kapsam**
- **Bulgular:** kanıt + saldırı potansiyeli + CVSS + öneri
- **Bulgu–aksiyon tablosu:** geliştirici yanıtı, kapanış
- **Kalan risk:** kapatılmayan/devredilen, gerekçesiyle

---

# Proje · S16 (test planı + sonuçları)

1. 2–3 kritik varlık için **sekiz başlıklı** test kartları (S17 bağlı)
2. Yöntem: MASTG/WSTG/PTES/NIST SP 800-115
3. **Sonuçlar** — finalde plan değil sonuç beklenir
4. Vize geri bildirimleri → **bulgu–aksiyon tablosu**
5. **Kalan risk** + gerekçe

⚠️ Yalnız kendi projen; depoda gerçek sır/kişisel veri yok

---

# Kendini sınama (seçme)

- 13 adımı üç aşamada özetleyin
- Değerlendiricinin iki varsayımı?
- Yöntemleri neden bu sırada uygularız?
- Saldırı potansiyeli 5 faktör; düşük puan neden ciddi?
- Etki analizi vs delta değerlendirme?

*(Tam liste ders notunda)*

---

<!-- _class: bolum -->

# Sonraki hafta

**13. hafta — Güvenlik gereksinimleri**
İyi gereksinim · izlenebilirlik/uyum matrisi · CC, FIPS 140-3, ETSI, EMVCo, PCI, MASVS
