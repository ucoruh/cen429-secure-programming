# Demo 4 — Fuzzing'e giriş (libFuzzer)

**Konu:** Fuzz test, sanitizer'la birlikte otomatik hata bulma (CWE-125/CWE-787) · **Hafta:** 4 ·
**Kitap:** Viega & Messier, Tarif 3.1 (girdi doğrulama) — fuzzing 2003'ten sonra yaygınlaşmıştır

## Ne gösteriyor?

Küçük bir uzunluk önekli ayrıştırıcı (`[tur][uzunluk][veri...]`) sınır denetimi yapmıyor. libFuzzer, kod
kapsamını ölçüp girdiyi otomatik değiştirerek **çökerten girdiyi saniyeler içinde** bulur; ASan tam yerinde
raporlar. Sonra düzeltip aynı süre fuzzlarız: artık çökme üretilemez.

| Adım | Ne olur |
| --- | --- |
| 1 | Normal girdi (`tohum/normal.bin`) sorunsuz ayrıştırılır |
| 2 | Hatalı ayrıştırıcı libFuzzer ile (≤10 sn) fuzzlanır → çökerten girdi bulunur |
| 3 | Bulunan girdi ASan reproducer ile oynatılır → tam hata raporu |
| 4 | Düzeltilmiş ayrıştırıcı aynı süre fuzzlanır → çökme yok |
| 5 | Düzeltilmiş sürüm `tohum/cokerten.bin`'i güvenle reddeder |

## Platformlar

- **Linux / WSL:** `clang -fsanitize=fuzzer,address`. Ubuntu 24.04'te clang 18 hazır gelir; Ubuntu 20.04'te
  `sudo apt-get install -y clang`. **Clang yoksa** libFuzzer hedefleri CMake tarafından **otomatik atlanır**;
  `demo.sh` bunu söyler ve hatayı yine ASan reproducer ile (`tohum/cokerten.bin`) gösterir.
- **Windows:** MSVC `/fsanitize=fuzzer` (Visual Studio 2022 "C++ AddressSanitizer" bileşeni). Kurulu değilse
  `demo.ps1` yalnız ASan reproducer'ı çalıştırır.

## Neden güvenli?

- Fuzzing her zaman **süre sınırlıdır** (`-max_total_time`) ve bütün çıktı bu klasördeki `fuzz-cikti/` altına
  yazılıp demo sonunda silinir. Çökebilecek çalıştırmalar Linux'ta `prlimit --core=1:1 timeout` + `setarch -R`,
  Windows'ta `demo_hazirla()` ile sınırlanır. Depoya yalnız küçük **tohum** girdileri konur.

## Kendiniz deneyin

1. `-max_total_time`'ı 2 saniyeye indirin. Çökme yine bulunuyor mu? Kapsam (coverage) neden bunu hızlandırır?
2. `ayristir.c`'de yalnız `if (n < 2) return 0;` ekleyin (ilk hata). Fuzzer şimdi hangi ikinci hatayı bulur?
3. `fuzz-cikti/corpus`'a birkaç farklı tohum ekleyin. Fuzzer daha hızlı mı ilerliyor?
