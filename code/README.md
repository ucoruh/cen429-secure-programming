# CEN429 Güvenli Programlama — Uygulama Kodları

Bu klasör, ders notlarındaki bütün demoların ve alıştırmaların **çalışan** kaynak kodlarını içerir. Her hafta bir
klasördür (`week-01`, `week-02`, ...); her demo kendi alt klasöründedir. Bütün demolar **üç ortamda da** çalışır:

- **Windows**: Visual Studio 2022 Community (ücretsiz) ile, ya da PowerShell'den
- **WSL**: Windows içindeki Ubuntu
- **Linux**: doğrudan Ubuntu ya da benzeri bir dağıtım

Derleme sistemi CMake'tir; Visual Studio `code/` klasörünü doğrudan açar, ayrıca proje dosyası gerekmez.

## Güvenlik kuralları (önce bunu okuyun)

Bu derste saldırıları **görerek** öğreniyoruz; bu yüzden bütün demolar şu kurallara göre yazıldı:

- Demolar **yalnız kendi klasörlerinde** dosya üretir (`bin/`, gerekirse `dokum/`); temizleme komutu hepsini siler.
- **Yönetici yetkisi (sudo / "Yönetici olarak çalıştır") gerekmez**, işletim sisteminin hiçbir ayarı değiştirilmez.
- "Saldırı" adımları gerçek zarar vermez: ekrana bir uyarı basar ya da demo klasöründeki bir dosyayı okur.
- Çökmesi beklenen programlar sınırlandırılarak çalıştırılır: Windows'ta hata penceresi açılmaz, Linux'ta çökme
  dökümü (core) yazılmaz, her komutun bir zaman sınırı vardır.
- Ağ gerektiren demolar yalnız kendi bilgisayarınızda (`localhost`) çalışır; dışarıdaki hiçbir sisteme bağlanmaz.
- Bu teknikleri **yalnız kendi bilgisayarınızda ve bu demolar üzerinde** deneyin. Başkasına ait sistemlerde izinsiz
  denemek suçtur.

## Hızlı başlangıç

| İş | Windows (PowerShell) | WSL / Linux |
| --- | --- | --- |
| Bütün demoları derle (`code/` içinde) | `.\build.ps1` | `./build.sh` |
| Bir demoyu çalıştır (demo klasöründe) | `.\demo.ps1` — ya da `demo.cmd`'ye çift tıklayın | `sh demo.sh` |
| Derleme çıktılarını sil | `.\build.ps1 temizle` | `./build.sh temizle` |

Her demo klasöründe aynı dosyalar bulunur:

| Dosya | Ne işe yarar |
| --- | --- |
| `*.c` | Hatalı sürüm ve düzeltilmiş (`*_guvenli.c`) sürüm |
| `CMakeLists.txt` | Aynı kaynaktan hangi sürümlerin, hangi derleme ayarıyla üretileceği |
| `demo.ps1`, `demo.cmd` | Windows'ta demoyu adım adım, açıklamalarıyla çalıştırır (derste gösterilen akış) |
| `demo.sh` | Aynı akış, WSL / Linux için |
| `README.md` | Demo neyi gösteriyor, neye dokunmuyor, kendi başınıza neyi deneyebilirsiniz |

Derlenen programlar demonun kendi klasöründe `bin\windows\` ya da `bin/linux/` altına yazılır.

## Kurulum A — Windows ve Visual Studio 2022 Community

1. [Visual Studio 2022 Community](https://visualstudio.microsoft.com/tr/vs/community/) indirin. Kurulumda
   **İş yükleri** sekmesinden **C++ ile masaüstü geliştirme** (*Desktop development with C++*) seçin. Sağdaki
   ayrıntılarda **C++ AddressSanitizer** ve **Windows için C++ CMake araçları** işaretli olsun (varsayılan olarak
   işaretlidir). CMake ayrıca kurulmaz; Visual Studio'nun içinde gelir.
2. Aynı projeyi Visual Studio'dan WSL ile de derlemek isterseniz ayrıca **C++ ile Linux ve katıştırılmış geliştirme**
   (*Linux and embedded development with C++*) iş yükünü seçin ve Kurulum B'yi uygulayın.
3. Depoyu indirin (Visual Studio: **Git > Depoyu Kopyala**, ya da Git for Windows):

   ```powershell
   mkdir C:\Dersler; cd C:\Dersler
   git clone https://github.com/ucoruh/cen429-secure-programming.git
   ```

   Kısa ve yerel bir yol (ör. `C:\Dersler\...`) önerilir. OneDrive ya da Google Drive ile eşitlenen klasörlerde
   derleme sırasında dosyalar kilitlenebilir.

### Visual Studio'da açmanın iki yolu

**Yol 1 — Klasör aç (önerilen).**
**Dosya > Aç > Klasör** (*File > Open > Folder*) ile `code` klasörünü seçin. Visual Studio `CMakePresets.json`
dosyasını okur. Üstteki yapılandırma kutusundan **Windows (MSVC)** seçin, sonra **Derle > Tümünü Derle**
(*Build > Build All*). Bir programı hata ayıklayıcıda çalıştırmak için üstteki **Başlangıç Öğesi** (*Select Startup
Item*) kutusundan programı seçip F5'e basın. Programa argüman vermek için Çözüm Gezgini'nde **CMake Hedefleri
Görünümü**'ne (*CMake Targets View*) geçin, hedefe sağ tıklayın, **Hata Ayıklama Yapılandırması Ekle** (*Add Debug
Configuration*) seçin ve açılan `launch.vs.json` dosyasına şunu ekleyin:

```json
"args": [ "AAAAAAAAAAAAAAAAB" ],
"currentDir": "${workspaceRoot}\\week-01\\03-tasma-giris"
```

**Yol 2 — Klasik çözüm dosyası.**
PowerShell'de `code` klasöründe bir kez `.\build.ps1` çalıştırın, sonra `code\build\windows-msvc\cen429_demolar.sln`
dosyasını açın. Projeler **Hafta 01 / 03 Tasma giris** gibi klasörlerde gruplanmıştır. Bir projeye sağ tıklayıp
**Başlangıç Projesi Olarak Ayarla** (*Set as Startup Project*), argümanları **Özellikler > Hata Ayıklama > Komut
Bağımsız Değişkenleri** (*Properties > Debugging > Command Arguments*) alanına yazın ve F5'e basın. Çalışma klasörü
kendiliğinden demonun klasörüdür.

### Komut satırından (PowerShell)

```powershell
cd C:\Dersler\cen429-secure-programming\code
.\build.ps1
cd week-01\03-tasma-giris
.\demo.ps1
```

PowerShell "betik çalıştırma bu sistemde devre dışı" derse ayar değiştirmeniz gerekmez: `demo.cmd` dosyasına çift
tıklayın ya da `powershell -ExecutionPolicy Bypass -File .\demo.ps1` yazın.

## Kurulum B — WSL (Windows içinde Ubuntu)

1. Windows'ta PowerShell'i açıp bir kez çalıştırın (bilgisayar yeniden başlayabilir):

   ```powershell
   wsl --install -d Ubuntu-24.04
   ```

2. Ubuntu açıldıktan sonra gerekli araçları kurun (yalnız WSL içindeki Ubuntu'ya kurulur, Windows'a dokunmaz):

   ```bash
   sudo apt update
   sudo apt install -y build-essential gdb valgrind strace ltrace cmake ninja-build rsync zip \
                       binutils sqlite3 libsqlite3-dev openssl libssl-dev python3
   ```

3. Depoyu Ubuntu içindeki ev klasörünüze indirin (Linux dosya sistemi `/mnt/c` altından çok daha hızlıdır ve
   dosya izinlerini doğru tutar), derleyin ve bir demoyu deneyin:

   ```bash
   cd ~
   git clone https://github.com/ucoruh/cen429-secure-programming.git
   cd cen429-secure-programming/code
   ./build.sh
   cd week-01/03-tasma-giris
   sh demo.sh
   ```

Visual Studio'dan WSL ile derlemek için Yol 1'de yapılandırma kutusundan **WSL (GCC)** seçin; derlenen programları
WSL terminalinde `sh demo.sh` ile çalıştırın.

## Kurulum C — Linux

Kurulum B'nin 2. ve 3. adımları aynen geçerlidir. CMake 3.16 ve üstü yeterlidir. Demolar Ubuntu 20.04 (GCC 9) ve
Ubuntu 24.04 (GCC 13) ile denenmiştir.

## Aynı kaynaktan farklı sürümler: derleme modları

Demolarda aynı `.c` dosyası birkaç kez, farklı ayarlarla derlenir. Böylece aynı hatanın hangi korumayla nasıl
davrandığını yan yana görürsünüz. Program adının sonundaki ek modu söyler:

| Mod | Program adı | GCC (Linux / WSL) | MSVC (Windows) | Ne gösterir |
| --- | --- | --- | --- | --- |
| `korumasiz` | `giris` | `-O0` | `/Od` | Hatanın en çıplak hali |
| `optimize` | `parola_memset` | `-O2` | `/O2` | Sürüm derlemesi; derleyici kodu yeniden düzenler |
| `asan` | `giris_asan` | `-fsanitize=address` | `/fsanitize=address` | Bellek hatasını çalışma anında yakalayan araç |
| `denetimli` | `giris_denetimli` | `-D_FORTIFY_SOURCE=2` | `strcpy_s` gibi `_s` işlevleri | Kütüphanenin boyut denetimi |
| `guvenli` | `giris_guvenli` | `-O2` | `/O2` | Kaynak kodda düzeltilmiş sürüm |

Bütün ayarlar tek bir yerde, `cmake/cen429.cmake` dosyasındaki `cen429_ornek()` işlevindedir.

## Klasör yapısı

```text
code/
├── CMakeLists.txt        # week-* klasörlerini kendiliğinden ekler
├── CMakePresets.json     # Visual Studio yapılandırmaları: Windows (MSVC), WSL (GCC), Linux (GCC)
├── build.ps1 / build.sh  # hepsini derle (ya da "temizle")
├── cmake/cen429.cmake    # derleme modları
├── common/               # bütün demoların ortak başlıkları ve betik yardımcıları
└── week-01/
    ├── 01-path-kandirma/
    ├── 02-bellekte-parola/
    ├── 03-tasma-giris/
    └── 04-isaretli-uzunluk/
```

Yalnız bazı haftaları derlemek için: `cmake -S . -B build/tek -DCEN429_HAFTALAR="week-01;week-03"`.

## Sorun giderme

| Belirti | Çözüm |
| --- | --- |
| `CMake bulunamadı` (Windows) | Visual Studio kurulumunda **C++ ile masaüstü geliştirme** iş yükünü seçin |
| `clang_rt.asan_dynamic-x86_64.dll bulunamadı` | `*_asan.exe` programlarını `demo.ps1` ile ya da `bin\windows\` içinden çalıştırın; derleme bu dosyayı oraya kopyalar. Yoksa kurulumda **C++ AddressSanitizer** bileşenini ekleyin |
| `cmake: command not found` (WSL) | `sudo apt install cmake build-essential` |
| ASan `DEADLYSIGNAL` yazıp duruyor (yeni Linux çekirdekleri) | `demo.sh` bunu kendisi önler; elle çalıştırırken `setarch $(uname -m) -R ./bin/linux/giris_asan ...` |
| `Permission denied` (WSL) | Betiği `sh demo.sh` ile çalıştırın; depoyu `/mnt/c` yerine `~` altına indirin |
| `Cannot restore timestamp` (Windows) | Eşitlenen (OneDrive / Drive) klasördesiniz: `.\build.ps1`'i yeniden çalıştırın ya da depoyu yerel bir klasöre alın |
