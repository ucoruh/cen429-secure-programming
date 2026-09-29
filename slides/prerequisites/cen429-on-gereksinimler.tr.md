---
marp: true
theme: cen429
paginate: true
lang: tr
title: "CEN429 Güvenli Programlama — Ön Gereksinimler"
author: "Dr. Öğr. Üyesi Uğur CORUH"
header: "CEN429 Güvenli Programlama · Ön Gereksinimler"
footer: "RTEÜ Bilgisayar Mühendisliği · 2026-2027 Güz"
---

<!-- _class: baslik -->
<!-- _paginate: false -->

# Ön Gereksinimler

**CEN429 Güvenli Programlama — 2026-2027 Güz**

Dr. Öğr. Üyesi Uğur CORUH

<!-- Konuşma notu: Bu sunum, ders sitesindeki "Ön gereksinimler" sayfasının sunumudur; ilk dersten önce öğrencinin kendi kendine denetleyebileceği bir kontrol listesidir. -->

---

# Bu ders sizden ne bekliyor?

- İlk haftadan itibaren C/C++ programlarını **kendi bilgisayarınızda derleyip çalıştırıyorsunuz**
- Projeyi **Git ve GitHub** üzerinde yürütüyorsunuz
- Güvenlik önlemlerini **birim testleriyle** kanıtlıyorsunuz
- Dersin resmî ön koşulu: **CEN107 Algoritmalar ve Programlama I**

---

# Bu sayfanın planı

1. Algoritmalar ve Programlama I'den gelenler (zorunlu)
2. C programlama temelleri (zorunlu)
3. Derste kısaca hatırlatılan ön bilgiler
4. Bilgisayarınızda kurulu olması gerekenler
5. Kendinizi sınayın (ilk dersten önce)

**Kural:** CEN107'nin ilk haftalarındaki geliştirme ortamı, Git, birim test ve şablon kullanımı bu derste
**bilindiği varsayılarak** kullanılır.

---

<!-- _class: bolum -->

# İlk dersten önce

Aşağıdaki 5. bölümdeki denetimleri kendi bilgisayarınızda yapın.

Bir adımda takılırsanız ilgili Algoritmalar ve Programlama I sayfasına dönün; hâlâ çözemezseniz ilk derste
sorun.

---

# 1. Algoritmalar ve Programlama I'den gelenler

- Bu dört konu **CEN107 Algoritmalar ve Programlama I** (eski kodu CE103) dersinde öğretildi
- Burada **tekrar anlatılmaz**; bilindiği varsayılarak doğrudan kullanılır
- İsteğe bağlı başlangıç: CEN107 (CE103) Hafta 1 — Giriş ve geliştirici yol haritası

<!-- Konuşma notu: Bu bölümdeki dört kalemin hiçbiri CEN429'da yeniden öğretilmez; öğrenci CEN107'yi hatırlamıyorsa ilgili haftaya dönmesi gerektiğini vurgulayın. -->

---

# Geliştirme ortamı

**Nerede öğretildi?** CEN107 (CE103) Hafta 2 — Geliştirme ortamları

- Derleyici: GCC / Clang / MSVC
- IDE, Windows'ta WSL
- CMake ile derleme

**Bu derste nerede kullanılıyor?** Her haftanın demoları; 1. hafta laboratuvar kurulumu

---

# Git ve GitHub

**Nerede öğretildi?** CEN107 (CE103) Hafta 3 — Git ile sürüm yönetimi

- Depo oluşturma, `clone`, `commit`
- Dal (branch), çekme isteği (pull request)
- `.gitignore`

**Bu derste nerede kullanılıyor?** Proje rehberi (plan, kurulum, teslim); 1. hafta değişiklik yönetimi;
12. hafta sürüm kimliği

---

# Birim test ve kapsam araçları

**Nerede öğretildi?** CEN107 (CE103) Hafta 4 — Birim test ve kütüphaneler

- Test yazma
- `ctest` ile çalıştırma
- Kapsam (coverage) raporu

**Bu derste nerede kullanılıyor?** Projede S16 test sonuçları; 4. hafta sanitizer ve fuzzing; 12. hafta test planı

---

# Proje şablonlarının kullanımı

**Nerede öğretildi?** CEN107 (CE103) Hafta 2–4

- Şablonu çatallamak (fork)
- Derlemek
- Testleri ve dokümantasyonu üretmek

**Bu derste nerede kullanılıyor?** Proje rehberi § 2 Proje kurulumu — şablon:
[`cpp-cmake-ctest-template`](https://github.com/ucoruh/cpp-cmake-ctest-template)

---

<!-- _class: yogun -->

# 2. C programlama temelleri (zorunlu)

Demoların hemen hepsi C ile yazılmıştır ve güvenlik hataları çoğunlukla bu temel yapıların yanlış
kullanımından doğar. Şunları rahatça okuyup yazabilmelisiniz:

- İşaretçiler (pointer), diziler ve dizeler (`char[]`, sonlandırıcı `\0`)
- Dinamik bellek (`malloc`, `calloc`, `free`) ve yapı (`struct`)
- Dosya okuma/yazma (`fopen`, `fread`, `fgets`)
- Birden çok kaynak dosyalı bir programı derlemek ve komut satırı argümanlarını (`argc`, `argv`) kullanmak

Yoğun kullanım: **1. hafta** (bellek, taşma) ve **4. hafta** (C/C++ sağlamlaştırma)

<!-- Konuşma notu: C temellerini bilmeyen öğrenci 1. ve 4. haftada ciddi zorlanır; bu slaytı vurgulu geçin. -->

---

# 3. Derste kısaca hatırlatılan ön bilgiler

Aşağıdakileri bilmiyorsanız sorun değil.

İlgili haftanın **"Başlamadan önce"** bölümü kısa bir hatırlatma yapar; önceden göz atarsanız ders daha
rahat geçer.

---

# Terminal ve sayı sistemleri

- **Terminal:** PowerShell ve Linux/WSL'de `cd`, `ls`, dosya yolları, ortam değişkenleri
  — gerekli: **1. hafta** ve bütün demolar
- **Binary ve onaltılık sayılar, bayt, XOR**
  — gerekli: **3., 9., 11. haftalar**

---

# Ağ ve diğer temel bilgiler

- **Temel ağ kavramları:** istemci–sunucu, TCP/IP, HTTP
  — gerekli: **3. ve 10. haftalar**
- **Basit SQL** (`SELECT … WHERE`), **Java ya da Python**'da temel sözdizimi
  — gerekli: **5. hafta**

---

# 4. Bilgisayarınızda kurulu olması gerekenler

**Dizüstü bilgisayar gereklidir.** İlk derse şu araçlar kurulu gelin:

- C/C++ derleyicisi: Windows'ta **Visual Studio 2022** (C++ ile masaüstü geliştirme), Linux/WSL'de **GCC**
  ya da **Clang**
- **CMake**, **Git** ve bir **GitHub** hesabı
- Windows kullanıyorsanız **WSL2 + Ubuntu**

---

# Kurulu olması gerekenler (devam)

- **OpenSSL 3**, **SQLite**, **Python 3**, **JDK 21**

Dönem içinde ayrıca **GoogleTest**, **SoftHSM2** ve **Tigress** kullanılır; kurulumları ilgili haftada
anlatılır.

Demo kodlarının kurulum kılavuzu: [`code/README.md`](https://github.com/ucoruh/cen429-secure-programming/blob/main/code/README.md)

---

<!-- _class: bolum -->

# 5. Kendinizi sınayın

İlk dersten önce

Aşağıdaki komutların her biri bir sürüm numarası yazmalıdır (sayılar farklı olabilir).

---

# Windows (PowerShell)

```powershell
git --version          # git version 2.x
cmake --version        # cmake version 3.2x ya da üstü
wsl --status           # Varsayılan Dağıtım: Ubuntu
```

---

# WSL / Linux

```bash
git --version          # git version 2.x
cmake --version        # cmake version 3.2x ya da üstü
gcc --version           # gcc (Ubuntu ...) 11 ya da üstü
openssl version         # OpenSSL 3.x
```

---

# Şablonu deneyin

Proje şablonunu kendi hesabınıza çatallayıp (fork) derleyin ve testlerini çalıştırın:

```bash
git clone https://github.com/<kullanici-adiniz>/cpp-cmake-ctest-template.git
cd cpp-cmake-ctest-template
cmake -S . -B build
cmake --build build
ctest --test-dir build      # beklenen: 100% tests passed
```

<!-- Konuşma notu: Bu üç komut bloğu, öğrencinin ilk derse gelmeden kendi bilgisayarında çalıştırması gereken tam kontrol listesidir; canlı gösterip her satırın ne beklediğini açıklayın. -->

---

# Sözlük

| Terim | Anlam |
| --- | --- |
| WSL | Windows Subsystem for Linux — Windows içinde Linux çalıştırma |
| CMake | Çoklu platform derleme sistemi üreticisi |
| CTest | CMake ile gelen test çalıştırıcı |
| Fork (çatallamak) | Bir deponun kendi hesabınıza kopyasını almak |
| Coverage (kapsam) | Testlerin kodun ne kadarını çalıştırdığının ölçümü |

---

<!-- _class: baslik -->

# Hazır mısınız?

Bu adımların hepsi hatasız bitiyorsa derse hazırsınız.

**Ders sitesi:** ucoruh.github.io/cen429-secure-programming
