---
marp: true
theme: cen429
paginate: true
lang: tr
title: "CEN429 Hafta 15 — Final Proje Gösterimleri"
author: "Dr. Öğr. Üyesi Uğur CORUH"
header: "CEN429 Güvenli Programlama · Hafta 15"
footer: "RTEÜ Bilgisayar Mühendisliği · 2026-2027 Güz"
---


<!-- _class: baslik -->
<!-- _paginate: false -->

# Final Proje Gösterimleri

**CEN429 Güvenli Programlama — Hafta 15**

Dr. Öğr. Üyesi Uğur CORUH · 25.12.2026

<!--
Konuşma notu: Final gösterim haftası: her takım güvenlik kılavuzunun tamamını, korumalı uygulamasını ve test sonuçlarını gösterir.
-->

---

# Bu hafta: final proje gösterimleri (RAP2)

- Ders anlatılmaz; final raporu (**kılavuzun tamamı**) + korumalı uygulama + test sonuçları
- RAP2 = finalin **%70**'i · Quiz-2 = **%30** · Başarı = `0,4·Vize + 0,6·Final`
- Ayrıntılı rubrik: proje rehberi · sıra ve süre: ders sınıfı
- ⚠️ Geç teslim yok · vize geri bildirimleri için **bulgu–aksiyon listesi**

---

<!-- _class: yogun -->

# Final rubriği

| Kriter | ÖÇ | Kılavuzda |
| --- | --- | --- |
| Kriptografi | 2 | S8 |
| Güvenli iletişim | 4 | S6 · S11 |
| Varlık yönetimi | 5 | S5 (tam) · S8 |
| İkili korumalar | 3 | S9 (ileri) · S15 |
| Güvenlik testi ve birim testleri | 6 | S16 **sonuçlar** |
| Standartlar | 7 | S1 · S14 · S17 |
| Final rapor ve sunum | 7 | Tümü |

---

<!-- _class: yogun -->

# Vizeden finale: yeni ve tamamlanacak bölümler

| Yeni | Tamamlanacak / güncellenecek |
| --- | --- |
| S6 kimlik ve bağlama | S5 varlıklar (tam) |
| S8 kripto ve anahtarlar | S9 sağlamlaştırma (ileri) |
| S11 güvenli iletişim | S12 raporlama (tam) |
| S14 varsayımlar ve devredilenler | S13 güncel SBOM |
| S15 derleme ve dağıtım hattı | S16 **sonuçlar** · S17 tam matris |

---

<!-- _class: yogun -->

# Hazırlık kontrol listesi

| Hafta | Gösterebilmeniz gereken |
| --- | --- |
| 9, 14 | Gizlenen fonksiyonlar ve gerekçe · maliyet tablosu · derleme hattında gizleme ve imzalama |
| 10 | Algoritma envanteri · anahtar yaşam döngüsü · TLS/sabitleme · imza doğrulaması |
| 11 | Hassas varlık için koruma yöntemi ya da gerekçesi |
| 12 | Test planı + **sonuçlar** · birim testleri · CI · bulgu–aksiyon listesi |
| 13 | Uyum matrisi · varsayımlar ve devredilenler |

---

# Önerilen gösterim akışı

1. **Özet:** ürün, mimari, en kritik üç varlık
2. **Vizeden bu yana:** bulgu–aksiyon listesi
3. **Canlı gösterim:** kripto, güvenli iletişim, bir koruma katmanı **çalışırken**
4. **Kanıt:** testler, koruma tablosu, SBOM, uyum matrisi
5. **Kalan risk:** bilerek kapsam dışı olanlar ve nedenleri

---

# Örnek sorular

- Bu anahtar nereden türetiliyor, nerede duruyor, ne zaman siliniyor?
- Zincir ve ad doğrulaması nerede?
- İmza doğrulaması başarısızsa ne oluyor? Eski imzalı sürüm yüklenebilir mi?
- Gizlemenin maliyetini ölçtünüz mü?
- Şu "karşılandı" satırının kanıtı nerede?
- Hangi gereksinimi devrettiniz, karşı taraf nasıl karşılayacak?

---

<!-- _class: yogun -->

# Sık yapılan hatalar

| Hata | Neden sorun? |
| --- | --- |
| Test planı var, sonuç yok | Finalde **sonuç** beklenir |
| Kanıtsız "karşılandı" | Karşılanmamış sayılır |
| Kılavuz ile kod sürümü farklı | Değerlendirilen ürün belirsiz |
| Boş kalan risk bölümü | Eksik analiz |
| Vize geri bildirimi yok sayılmış | Bulgu–aksiyon döngüsü sürecin parçası |
| Depoda gerçek sır / kişisel veri | Değerler **sentetik** olmalı |

---

# Dönem sonunda

- Kılavuzunuz = sertifikasyon belgelerinin küçük bir modeli → **portfolyo** (gizli bilgi içermediğinden emin olun)
- Teslim edilen her satır açıklanabilmeli; her takım üyesine soru sorulabilir

---

# Final dönemi

**Hafta 16 — Quiz-2**

- Kapsam: 9–14. haftalar
- Çalışma rehberi: 16. hafta sayfası
