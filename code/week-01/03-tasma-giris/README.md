# Demo 3 — Bir baytlık taşmayla yönetici olmak

**Konu:** Arabellek taşması, bellek düzeni, çalışma anı denetimleri (CWE-120, CWE-787) · **Hafta:** 1 ·
**Kitap:** Viega & Messier, Tarif 3.3 (arabellek taşmalarını önleme)

## Ne gösteriyor?

Oturum bilgisi bir yapıda tutulur: 16 baytlık kullanıcı adı ve hemen arkasında `yonetici` alanı. Ad `strcpy` ile,
uzunluk denetlenmeden kopyalanır. 16 bayttan uzun bir ad, bellekte arkadaki alanın üzerine yazar.

```text
ofset:  0 ........................ 15 | 16 17 18 19
        [ ad[0] ................ ad[15] ][ yonetici  ]
"AAAAAAAAAAAAAAAAB" -> 16 x 'A' ad'a, 'B' (0x42 = 66) yonetici'ye
```

| Adım | Program | Ne olur | Ders |
| --- | --- | --- | --- |
| 1 | `giris ayse` | Normal kullanıcı | — |
| 2 | `giris AAAAAAAAAAAAAAAAB` | **Yönetici paneli açılır** | Bir bayt taşma yetki verir |
| 3 | `giris_asan` aynı girdi | ASan **sessiz** kalır | Taşma yapının içinde kaldı; araçların da sınırı var |
| 4 | `giris_asan` 40 karakter | ASan `stack-buffer-overflow` bildirir | Yapının dışına taşan yazma yakalanır |
| 5 | `giris_denetimli` aynı kısa girdi | Program durdurulur | `_FORTIFY_SOURCE` (Linux) / `strcpy_s` (Windows) hedef boyutunu bilir |
| 6 | `giris_guvenli` | Girdi reddedilir | Asıl çözüm: uzunluğu ve karakterleri denetle |

## Çalıştırma

Önce bütün demoları bir kez derleyin (`code/` klasöründe): Windows `.\build.ps1` · WSL / Linux `./build.sh`.
Sonra bu klasörde: Windows `.\demo.ps1` (ya da `demo.cmd`) · WSL / Linux `sh demo.sh`.

Visual Studio'da adım adım izlemek için: `giris` hedefini başlangıç öğesi yapın, argüman olarak
`AAAAAAAAAAAAAAAAB` verin (bkz. `code/README.md`), `strcpy` satırına kesme noktası koyun ve **Bellek**
(*Memory*) penceresinde `&o` adresini izleyin.

## Neden güvenli?

- Taşma yalnız programın kendi yığınında olur; program ya mesaj basıp biter ya da denetim tarafından durdurulur.
- Windows'ta hata penceresi açılmaz (`demo_hazirla()`), Linux'ta çökme dökümü yazılmaz ve her komutun zaman sınırı vardır.

## Kendiniz deneyin

1. `yonetici` alanını 1 yapacak adı bulun. (İpucu: 17. karakterin ASCII kodu.)
2. Yapıdaki alanların sırasını değiştirin (`yonetici` önce). Saldırı hâlâ çalışıyor mu? Bu gerçek bir çözüm mü?
3. `giris_guvenli.c`'deki denetimi kaldırıp yerine `strncpy` koyun. Sonlandırıcı `\0` ne oldu?
