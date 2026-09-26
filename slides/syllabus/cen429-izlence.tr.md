---
marp: true
theme: cen429
paginate: true
lang: tr
title: "CEN429 Güvenli Programlama — Ders İzlencesi"
author: "Dr. Öğr. Üyesi Uğur CORUH"
header: "CEN429 Güvenli Programlama · Ders İzlencesi"
footer: "RTEÜ Bilgisayar Mühendisliği · 2026-2027 Güz"
---

<!-- _class: baslik -->
<!-- _paginate: false -->

# CEN429 Güvenli Programlama

**Ders İzlencesi — 2026-2027 Güz**

Dr. Öğr. Üyesi Uğur CORUH

---

# Ders bilgileri

| | |
| --- | --- |
| **İletişim** | ugur.coruh@erdogan.edu.tr — konu: **[CEN429]** |
| **Ofis** | F-301 · görüşme e-posta ile randevuyla |
| **Ders** | Cuma 09:00–12:00 · İİBF ve Hukuk Fakültesi Binası, D-402 |
| **Web sitesi** | ucoruh.github.io/cen429-secure-programming |
| **Sınıf** | Her dönem yeni sınıf; kod 1. haftada duyurulur |
| **Dil / tür** | Türkçe · Seçmeli · 7. yarıyıl |
| **Saat / kredi / AKTS** | 3 · 3 · 5 |
| **Ön koşul** | CEN107 Algoritmalar ve Programlama I |

---

# Dersin amacı

- Yaygın yazılım güvenlik açıklarını **tanımak**: arabellek taşması, bellek hataları, enjeksiyon
- Yazılım koruma yöntemlerini **uygulamak**: veri güvenliği ve kriptografi, C/C++ ve Java sağlamlaştırma (hardening),
  çalışma zamanı öz koruması, kod gizleme, whitebox kriptografi
- Güvenlik standartlarını ve **sızma testi planlamasını** bilmek
- Her konu: **hatalı kod → saldırı → düzeltme**

---

<!-- _class: yogun -->

# Öğrenme çıktıları

| Kod | Öğrenme çıktısı |
| --- | --- |
| ÖÇ.1 | Yaygın güvenlik açıklarını tanımlar ve sınıflandırır |
| ÖÇ.2 | Şifreleme yöntemlerini ve güvenli iletişim ilkelerini (SSL/TLS) açıklar |
| ÖÇ.3 | Kod sağlamlaştırma tekniklerini (girdi doğrulama, güvenli bellek, RASP, gizleme) C/C++ ve Java'da uygular |
| ÖÇ.4 | Şifreleme ve kimlik doğrulamayla güvenli kanal kurma ilkelerini açıklar |
| ÖÇ.5 | Güvenli tasarım ilkeleriyle yazılım planı oluşturur |
| ÖÇ.6 | Güvenlik incelemesi ve zafiyet değerlendirme yöntemlerini bilir |
| ÖÇ.7 | Güvenli programlama standartlarını ve sızma testi planlamasını bilir |

---

<!-- _class: yogun -->

# Haftalık program (1–8)

| Hf | Tarih | Konu |
| --- | --- | --- |
| 1 | 18.09 | Güvenli programlamaya giriş ve uygulama koruma planı |
| 2 | 25.09 | Bilgisayar virüsleri ve güvenlik modelleri |
| 3 | 02.10 | Veri güvenliği: aktarımda, beklemede, kullanımda |
| 4 | 09.10 | Kod sağlamlaştırma: C/C++ |
| 5 | 16.10 | Kod sağlamlaştırma: Java ve yorumlanan diller |
| 6 | 23.10 | Çalışma zamanı uygulama öz koruması (RASP) |
| 7 | 30.10 | **Ara proje gösterimleri** |
| 8 | 31.10–08.11 | **Ara sınav haftası — Quiz-1** |

---

<!-- _class: yogun -->

# Haftalık program (9–16)

| Hf | Tarih | Konu |
| --- | --- | --- |
| 9 | 13.11 | Gelişmiş kod gizleme ve çeşitlendirme |
| 10 | 20.11 | Sertifikalar ve kriptografik yöntemler |
| 11 | 27.11 | Whitebox kriptografi |
| 12 | 04.12 | Güvenlik sertifikasyonları ve sızma testi planlaması |
| 13 | 11.12 | Güvenlik gereksinimleri |
| 14 | 18.12 | Tigress ve çeşitlendirme |
| 15 | 25.12 | **Final proje gösterimleri** |
| 16 | 04–17.01 | **Final dönemi — Quiz-2** |

---

# Değerlendirme

- **Tek dönem projesi:** C/C++ uygulaması + güvenlik kılavuzu, iki kontrol noktası (rubrikli)
- **İki quiz:** sınav haftalarında

| Bileşen | Ağırlık | Zaman |
| --- | --- | --- |
| Proje kontrolü 1 (RAP1) | Vizenin %60'ı | 7. hafta |
| Quiz-1 | Vizenin %40'ı | 8. hafta |
| Proje kontrolü 2 (RAP2) | Finalin %70'i | 15. hafta |
| Quiz-2 | Finalin %30'u | 16. hafta |

**Başarı notu = 0,4 · Vize + 0,6 · Final**

---

# Kaynaklar ve araçlar

- **Ders notları** (web sitesi) — ana kaynak, kendi başına yeterli
- **Ders kitabı:** J. Viega, M. Messier, *Secure Programming Cookbook for C and C++*, O'Reilly, 2003
- **Açık standartlar:** SEI CERT, OWASP, MITRE CWE, NIST FIPS 140-3
- **Dizüstü bilgisayar gerekli:** WSL2 + Ubuntu, GCC/Clang, CMake, gdb, OpenSSL 3, SQLite, JDK 21, Tigress
- Demolar: `code/week-NN` klasörlerinde; `code` içinde bir kez derleyin, sonra `demo.ps1` (Windows) ya da `demo.sh` (WSL/Linux)

---

# Kurallar

- **Geç teslim kabul edilmez**; beklenmedik durumlar hemen bildirilir
- **Akademik dürüstlük:** birlikte çalışmak serbest, çözüm paylaşmak ve kaynaksız alıntı yasak
- **İletişim:** üniversite e-postası, konu satırında **[CEN429]**
- **Etik:** saldırı teknikleri yalnız **kendi bilgisayarınızda** ve verilen demolar üzerinde denenir

---

<!-- _class: baslik -->

# Soru ve cevap

**Ders sitesi:** ucoruh.github.io/cen429-secure-programming
