---
template: main.html
---

# Ön gereksinimler

Bu derste ilk haftadan itibaren C/C++ programlarını **kendi bilgisayarınızda derleyip çalıştırıyor**, projeyi
**Git ve GitHub** üzerinde yürütüyor, güvenlik önlemlerini **birim testleriyle** kanıtlıyorsunuz. Bu yüzden aşağıdaki
bilgi ve araçlarla gelmeniz gerekir. Dersin resmî ön koşulu **CEN107 Algoritmalar ve Programlama I**'dir; özellikle o
dersin ilk haftalarındaki geliştirme ortamı, Git, birim test ve şablon kullanımı bu derste **bilindiği varsayılarak**
kullanılır.

!!! warning "İlk dersten önce"
    Aşağıdaki [5. bölümdeki](#5-kendinizi-sinayin-ilk-dersten-once) denetimleri kendi bilgisayarınızda yapın. Bir
    adımda takılırsanız ilgili Algoritmalar ve Programlama I sayfasına dönün; hâlâ çözemezseniz ilk derste sorun.

## 1. Algoritmalar ve Programlama I'den gelenler (zorunlu)

| Konu | Nerede öğretiliyor? | Bu derste nerede kullanılıyor? |
| --- | --- | --- |
| **Geliştirme ortamı:** derleyici (GCC/Clang/MSVC), IDE, Windows'ta WSL, CMake ile derleme | [CE103 Hafta 2 — Geliştirme ortamları](https://ucoruh.github.io/ce103-algorithms-and-programming-I/week-2-setup/ce103-week-2-setup/) | Her haftanın demoları; [1. hafta](../week-1/cen429-week-1.md) laboratuvar kurulumu |
| **Git ve GitHub:** depo oluşturma, `clone`, `commit`, dal (branch), `pull request`, `.gitignore` | [CE103 Hafta 3 — Git ile sürüm yönetimi](https://ucoruh.github.io/ce103-algorithms-and-programming-I/week-3-git/ce103-week-3-git/) | [Proje rehberi](../project-guide/index.md) (plan, kurulum, teslim); 1. hafta değişiklik yönetimi; [12. hafta](../week-12/cen429-week-12.md) sürüm kimliği |
| **Birim test ve kapsam (coverage) araçları:** test yazma, `ctest` ile çalıştırma, kapsam raporu | [CE103 Hafta 4 — Birim test ve kütüphaneler](https://ucoruh.github.io/ce103-algorithms-and-programming-I/week-4-test/ce103-week-4-test/) | Projede S16 test sonuçları; [4. hafta](../week-4/cen429-week-4.md) sanitizer ve fuzzing; 12. hafta test planı |
| **Proje şablonlarının kullanımı:** şablonu çatallamak (fork), derlemek, testleri ve dokümantasyonu üretmek | CE103 Hafta 2–4 | [Proje rehberi · 2. Proje kurulumu](../project-guide/index.md#2-proje-kurulumu) — [`cpp-cmake-ctest-template`](https://github.com/ucoruh/cpp-cmake-ctest-template) |

İsteğe bağlı başlangıç: [CE103 Hafta 1 — Giriş ve geliştirici yol haritası](https://ucoruh.github.io/ce103-algorithms-and-programming-I/week-1-intro/ce103-week-1-intro/).

## 2. C programlama temelleri (zorunlu)

Demoların hemen hepsi C ile yazılmıştır ve güvenlik hataları çoğunlukla bu temel yapıların yanlış kullanımından
doğar. Şunları rahatça okuyup yazabilmelisiniz:

- işaretçiler (pointer), diziler ve dizeler (`char[]`, sonlandırıcı `\0`),
- dinamik bellek (`malloc`, `calloc`, `free`) ve yapı (`struct`),
- dosya okuma/yazma (`fopen`, `fread`, `fgets`),
- birden çok kaynak dosyalı bir programı derlemek ve komut satırı argümanlarını (`argc`, `argv`) kullanmak.

Bu konular [1. hafta](../week-1/cen429-week-1.md) (bellek, taşma) ve [4. hafta](../week-4/cen429-week-4.md) (C/C++
sağlamlaştırma (hardening)) boyunca yoğun biçimde kullanılır.

## 3. Derste kısaca hatırlatılan ön bilgiler

Aşağıdakileri bilmiyorsanız sorun değil; ilgili haftanın **"Başlamadan önce"** bölümü kısa bir hatırlatma yapar.
Önceden göz atarsanız ders daha rahat geçer.

| Ön bilgi | Hangi haftada gerekiyor? |
| --- | --- |
| Terminal: PowerShell ve Linux/WSL'de `cd`, `ls`, dosya yolları, ortam değişkenleri | [1. hafta](../week-1/cen429-week-1.md) ve bütün demolar |
| İkili ve onaltılık sayılar, bayt, XOR | [3.](../week-3/cen429-week-3.md), [9.](../week-9/cen429-week-9.md), [11.](../week-11/cen429-week-11.md) haftalar |
| Temel ağ kavramları: istemci–sunucu, TCP/IP, HTTP | [3.](../week-3/cen429-week-3.md) ve [10.](../week-10/cen429-week-10.md) haftalar |
| Basit SQL (`SELECT … WHERE`), Java ya da Python'da temel sözdizimi | [5. hafta](../week-5/cen429-week-5.md) |

## 4. Bilgisayarınızda kurulu olması gerekenler

**Dizüstü bilgisayar gereklidir.** İlk derse şu araçlar kurulu gelin:

- C/C++ derleyicisi: Windows'ta **Visual Studio 2022** (C++ ile masaüstü geliştirme), Linux/WSL'de **GCC** ya da
  **Clang**
- **CMake**, **Git** ve bir **GitHub** hesabı
- Windows kullanıyorsanız **WSL2 + Ubuntu**
- **OpenSSL 3**, **SQLite**, **Python 3**, **JDK 21**

Dönem içinde ayrıca GoogleTest, SoftHSM2 ve Tigress kullanılır; bunların kurulumu ilgili haftada anlatılır. Demo
kodlarının kurulum kılavuzu: [`code/README.md`](https://github.com/ucoruh/cen429-secure-programming/blob/main/code/README.md).

## 5. Kendinizi sınayın (ilk dersten önce)

Aşağıdaki komutların her biri bir sürüm numarası yazmalıdır (sayılar farklı olabilir):

=== "Windows (PowerShell)"

    ```powershell
    git --version          # git version 2.x
    cmake --version        # cmake version 3.2x ya da üstü
    wsl --status           # Varsayılan Dağıtım: Ubuntu
    ```

=== "WSL / Linux"

    ```bash
    git --version          # git version 2.x
    cmake --version        # cmake version 3.2x ya da üstü
    gcc --version          # gcc (Ubuntu ...) 11 ya da üstü
    openssl version        # OpenSSL 3.x
    ```

Ardından proje şablonunu kendi hesabınıza çatallayıp (fork) derleyin ve testlerini çalıştırın:

```bash
git clone https://github.com/<kullanici-adiniz>/cpp-cmake-ctest-template.git
cd cpp-cmake-ctest-template
cmake -S . -B build
cmake --build build
ctest --test-dir build      # beklenen: 100% tests passed
```

Bu adımların hepsi hatasız bitiyorsa derse hazırsınız.
