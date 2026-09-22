# Demo 4 — Negatif uzunluk: denetim var ama yetmiyor

**Konu:** İşaretli / işaretsiz tamsayı dönüşümü (CWE-195, CWE-805) · **Hafta:** 1 ·
**Kitap:** Viega & Messier, Tarif 3.5 (tamsayı dönüşümü ve taşması)

## Ne gösteriyor?

Bir dosyadan ya da ağdan gelen "kayıt uzunluğu" `int` olarak okunur ve yalnız **üst** sınırı denetlenir. `-1` bu
denetimi geçer. `memcpy`'nin uzunluk parametresi `size_t` (işaretsiz) olduğu için `-1`,
18 446 744 073 709 551 615 gibi dev bir sayıya dönüşür ve bellek taşar.

| Adım | Ne olur | Ders |
| --- | --- | --- |
| 0 | Derleyici hatayı görüyor mu? | GCC yalnız `-Wsign-conversion` ile uyarır; MSVC C derleyicisi hiç uyarmaz, aynı kod C++ olarak derlenince C4365 çıkar |
| 1 | `kopya 8`: normal | — |
| 2 | `kopya 100`: reddedilir | Üst sınır denetimi çalışıyor |
| 3 | `kopya -1`: **çöker** | Linux: `SIGSEGV` (çıkış 139) · Windows: `0xC0000409` (yığın taşması algılandı) |
| 4 | `kopya_asan -1` | ASan `negative-size-param` bildirir |
| 5 | `kopya_guvenli` | `-1`, `12abc` reddedilir; `8` çalışır |

## Çalıştırma

Önce bütün demoları bir kez derleyin (`code/` klasöründe): Windows `.\build.ps1` · WSL / Linux `./build.sh`.
Sonra bu klasörde: Windows `.\demo.ps1` (ya da `demo.cmd`) · WSL / Linux `sh demo.sh`.

Windows'ta 0. adım Visual Studio'nun `cl` derleyicisini kendisi bulur; "Developer PowerShell" açmanız gerekmez.

## Neden güvenli?

- Çökme yalnız bu programın kendi belleğinde olur. Windows'ta hata penceresi açılmaz, Linux'ta çökme dökümü
  yazılmaz ve komutun zaman sınırı vardır.

## Kendiniz deneyin

1. `kopya.c`'de denetimi `if (uzunluk < 0 || uzunluk > KAYIT_BOYUTU)` yapın. Yeter mi? `kopya_guvenli.c` neden
   ayrıca `atoi` yerine `strtol` kullanıyor? `kopya 99999999999` deneyin.
2. Uzunluk değişkenini baştan `size_t` yapın. Hangi hata sınıfı ortadan kalkar, hangisi kalır?
3. `-Wsign-conversion` uyarısını bütün projede açsaydık başka hangi satırlar uyarı verirdi?
