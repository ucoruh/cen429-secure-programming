---
marp: true
theme: cen429
paginate: true
lang: tr
title: "CEN429 Hafta 11 — Whitebox Kriptografi"
author: "Dr. Öğr. Üyesi Uğur CORUH"
header: "CEN429 Güvenli Programlama · Hafta 11"
footer: "RTEÜ Bilgisayar Mühendisliği · 2026-2027 Güz"
---


<!-- _class: baslik -->
<!-- _paginate: false -->

# Whitebox Kriptografi

**CEN429 Güvenli Programlama — Hafta 11**

Dr. Öğr. Üyesi Uğur CORUH · 27.11.2026

<!--
Konuşma notu: Bu hafta whitebox kriptografiyi bir güvenlik katmanı olarak işliyoruz. Ana kural: yayımlanmış saf-yazılım WBC tasarımlarının tamamı kırıldı; WBC tek başına çözüm değil, anahtar çıkarmayı geciktiren bir katmandır ve anahtar yenileme, cihaz bağlama, sunucu risk denetimiyle birlikte anlam kazanır. Saldırıları savunmayı sınamak için öğreniyoruz.
-->

---

# Bugünün planı (3 saat)

| Saat | Konu |
| --- | --- |
| 1 | Kara/gri/beyaz kutu · WBC saldırgan yetenekleri · naif çözümlerin çöküşü |
| 2 | Tablo tabanlı WBC (Chow AES): kısmi değerlendirme → iç/dış kodlama · maliyet |
| 3 | Saldırı geçmişi (BGE, DCA, DFA) · karşı önlemler · katmanlı yer · donanım |

Ana kaynaklar: **teknik kılavuz** (WBC saldırgan modeli) + **Chow 2002 / BGE / DCA / DFA**

---

<!-- _class: bolum -->

# 1. Üç saldırgan modeli

---

<!-- _class: yogun -->

# Kara / gri / beyaz kutu

| Model | Saldırgan ne görür/yapar? | Ortam |
| --- | --- | --- |
| **Kara** | Yalnız girdi/çıktı | Uzak sunucu |
| **Gri** | + yan kanallar (zaman, güç, EM) | Akıllı kart, gömülü |
| **Beyaz** | **Her şey**: kod, bellek, ara değer + değiştirir | Yazılım, kendi cihazında |

AES/RSA güvenlik kanıtı **kara kutu** varsayar — kod teslim edilince çöker

---

# WBC saldırganın yetenekleri (Chow 2002)

**Gözlemler:** komutlar, akış, bellek
**Denetler / değiştirir:** belleği kurcalar · **tek turu** çalıştırır · if koşulunu değiştirir · sayaç değiştirir · **hata enjekte eder**

> Kılavuz: bu yeteneklere karşı koruyan şey **yalnız WBC değil**, kod sağlamlaştırma (9. hafta) + RASP (6. hafta)

Uyum maddesi: *anahtarlar güvence altına alınmalı ve/veya gizlenmelidir*

---

# Problem neden zor?

- Program şifrelemek için anahtara **erişmek** zorunda → saldırgan da görür
- WBC fikri: anahtarı **açıkça var olmayacak** biçimde arama tablolarına "pişir"
- Gizliliği kriptodan gizlemeye taşımaz; **maliyet kuralı**: anahtar çıkarmayı pahalı yap

---

<!-- _class: yogun -->

# Naif çözümlerin çöküşü (kurallar)

- **Sabit diziye göm** → `strings` + **entropi taraması** (Shamir–van Someren) + gdb → dakikalar
- **XOR/whitening ile karıştır** → maske de ikili dosyada; program çözebiliyorsa saldırgan da çözer
- **Kod taşıma (code lifting)** → anahtarı hiç çıkarmadan tablolar+yorumlayıcı kopyalanır → **cihaz/sürüm bağlama** gerekir

⚠️ Yayımlanmış hiçbir saf-yazılım WBC kırılmadan kalmadı → WBC = **katman**, çözüm değil

---

<!-- _class: bolum -->

# 2. Tablo tabanlı WBC (kavram)

---

# Adım 1 · Anahtarı tabloya pişir

```text
Normal:  çıktı = S-box[ x XOR k ]
WBC:     T[x] = S-box[ x XOR k ]   → k tablonun İÇİNDE, kodda 'k' yok
```

Tek başına **güvensiz**: T, S-box'ın ötelenmişi → k geri çıkar → tablolar **kodlanır**

---

# Adım 2–4 · Genişlet, kodla, karıştır

- **T-box + MixColumns:** 8→32 bit tablolar; baytlar arası XOR → küçük XOR tabloları
- **İç kodlamalar:** her tablo çıkışına gizli bijeksiyon, sonraki girişte tersi → ara değerler karışır
- **Karıştırıcı bijeksiyonlar:** GF(2) matrisleri (8×8, 32×32) bilgiyi tablolara **yayar**
- Sonuç: tur = **arama tabloları ağı**; açık aritmetik anahtar yok (tablo tipleri I–IV)

---

# Adım 5 · Dış kodlama F, G

```text
Girdi --F⁻¹--> [ kodlanmış AES tabloları ağı ] --G--> Çıktı
```

- **Güç:** `G∘AES∘F⁻¹` — saldırgan standart AES giriş/çıkışını görmez; BGE/DCA zorlaşır
- **Sınır:** artık **standart AES değil** → yalnız iki ucu da sizde olan protokolde; EMV gibi standartlarda kullanılamayabilir

---

<!-- _class: yogun -->

# Maliyet: WBC bedava değil

| Ölçüt | Mertebe |
| --- | --- |
| Tablo boyutu | Yüzlerce KB (~770 KB) · std AES anahtarı 16–32 bayt |
| Tur başına okuma | Binlerce (~3000) |
| Hız | Std AES'e göre ~50× yavaş |

Ölçü hissi: 288 tablo × 1 KB ≈ 294.912 bayt → yalnız **seçili, kritik** işlemler (bkz. 9. hafta K-10)

---

<!-- _class: bolum -->

# 3. Saldırı geçmişi ve karşı önlemler

---

<!-- _class: yogun -->

# "Hepsi kırıldı" — kronoloji

| Yıl | Kilometre taşı | Çıkarım |
| --- | --- | --- |
| 2002 | Chow WB-AES/DES | Fikrin doğuşu |
| 2004 | **BGE** — Chow AES (~2³⁰) | İç kodlama yetmez |
| 2007 | WB-DES kırıldı | DES-WBC bırakılır |
| 2010'lar | Karroumi çift-AES (~2²²) | "Daha çok tablo" ≠ güç |
| 2015 | **DFA** (Unboxing) | Hata enjeksiyonu; iç matematiği bilmeden |
| 2016 | **DCA** (CHES) | İzlere DPA istatistiği; kodlamayı görmezden gelir |
| 2017–24 | **WhibOx** | Gönderilen tasarımların **tamamı** kırıldı |

---

# DCA ve DFA neden yeni tasarımları da vurur?

- **DCA:** kutuyu açmaz; çalışırken ara değer izlerini toplar → DPA benzeri istatistikle anahtar; iç kodlama izi çoğu zaman bozmaz
- **DFA:** çalışırken değere **hata enjekte eder**; bozulan çıktıdan anahtarı geri hesaplar

İkisi de gizli matematiği çözmeye çalışmaz → genel, taşınabilir saldırılar

---

# Karşı önlemler (savunma kuralları)

- Statik rastgelelik + **doğrusal olmayan maskeleme** (DCA'yı zorlar)
- **Dış kodlama** (F,G) — ama standart AES uyumu gider
- **Katmanlı savunma:** gizleme (9) + RASP (6) → iz toplamak/hata enjekte etmek zorlaşır
- **Anahtar yenileme** (kısa kripto-periyot) → çıkarılanın değeri düşer
- **Cihaz/sürüm bağlama** → code lifting kapanır
- **Sunucu risk denetimi** → son ve en güvenilir savunma

---

<!-- _class: bolum -->

# 4. Katmanlı yer ve donanım

---

<!-- _class: yogun -->

# Anahtar koruma seçenekleri

| Seçenek | Anahtar nerede | Güç | Ne zaman |
| --- | --- | --- | --- |
| Sabit dizide düz | Yazılımda açık | Yok | Asla |
| Gizli/parçalı | Yazılımda gizli | Çok düşük | Düşük değer, kısa ömür |
| **WBC + katman** | Tablolara gömülü | Orta (geciktirir) | Donanım kökü yoksa |
| **TEE / SE** | Donanımla yalıtık | Yüksek | Cihaz destekliyorsa |
| **HSM / SoftHSM** | Donanım modülü | Yüksek | Sunucu tarafı |

**Karar:** anahtarı yazılıma koymak zorunda değilsen, koyma

---

# Hatalı → saldırı → koruma

1. **Hatalı:** `static const uint8_t k[16]` gömülü anahtar
2. **Saldırı:** `strings`+entropi bloğu bulur, gdb doğrular → dakikalar
3. **Koruma:** TEE/SE'ye taşı → yoksa WBC + gizleme + RASP + **cihaz bağlama** + **anahtar yenileme** + **sunucu risk**
4. **Kalan risk:** tek cihazda yine çıkabilir; ama bir kırık her yeri açmaz, ömrü kısa

---

# Proje · S8 (anahtar koruma gerekçesi)

1. Hassas anahtar nerede durur, nasıl korunur (düz değilse: TEE/SE, WBC, gizleme — hangisi, neden)
2. Yeterli değilse **açıkça yaz** + telafi katmanları (yenileme, cihaz bağlama, sunucu denetimi)
3. Kullanmadıysan **gerekçe** (maliyet / donanım kökü / düşük değer) — gerekçeli "kullanmadık" tam yanıttır

⚠️ Depoda **gerçek anahtar olmasın** — hepsi sentetik

---

# Kendini sınama (seçme)

- Üç saldırgan modeli; AES kanıtı hangisini varsayar?
- Sabit diziye gömülü anahtar neden koruma değil? (entropi)
- Kod taşıma nedir, hangi önlem kapatır?
- İç vs dış kodlama; dış kodlamanın sınırı?
- "Hepsi kırıldı" kararınızı nasıl etkiler?

*(Tam liste ders notunda)*

---

<!-- _class: bolum -->

# Sonraki hafta

**12. hafta — Sertifikasyon ve sızma testi planlaması**
Bir korumanın "ne kadar dayandığını" ölçmek → bağımsız değerlendirme süreci ve raporlama
