# Demo 1 — Biçim dizisi (format string) açığı

**Konu:** Kullanıcı denetimli biçim dizisi (CWE-134) · **Hafta:** 4 ·
**Kitap:** Viega & Messier, Tarif 3.2 (biçimlendirme işlevlerine saldırıları önleme)

## Ne gösteriyor?

`printf(kullanici)` gibi bir çağrı, "ekrana ne yazdıracağını" kullanıcıya sorar. Kullanıcı biçim belirteci
(`%x`, `%p`, `%n`) yazarsa program bunları **komut** gibi işler:

- `%x` / `%p` → yığından değer **okur** (bilgi sızıntısı; programın gizli değeri sızar),
- `%n` → belleğe **yazar** (çökme, giderek kod çalıştırma).

Düzeltme tek satırdır: `printf("%s", kullanici)` — veri her zaman **argüman**, biçim her zaman **sabit**.

| Adım | Ne olur | Ders |
| --- | --- | --- |
| 0 | Derleyici uyarısı | GCC/Clang `-Wformat-security` uyarır; MSVC C derleyicisi susar, `/analyze` yakalar |
| 1 | `sizinti Merhaba` | Normal |
| 2 | `sizinti '%x.%x...'` | Yığın hex olarak dökülür; gizli değer (`0x5ece7`) sızar |
| 3 | `sizinti 'AAAA%n'` | Linux korumasız: `SIGSEGV` · Windows: CRT `%n`'i durdurur |
| 4 | `sizinti_denetimli 'AAAA%n'` | Linux `_FORTIFY_SOURCE`: `*** %n in writable segment detected ***` |
| 5 | `sizinti_guvenli '...%n...'` | `%n` artık yalnız metin: güvenli |

## Çalıştırma

Önce bütün demoları bir kez derleyin (`code/` klasöründe): Windows `.\build.ps1` · WSL / Linux `./build.sh`.
Sonra bu klasörde: Windows `.\demo.ps1` (ya da `demo.cmd`) · WSL / Linux `sh demo.sh`.

## Neden güvenli?

- Bütün belirteçler yalnız **bu programın kendi belleğini** okur/yazar. Çökebilecek adımlar Linux'ta
  `prlimit --core=1:1 timeout` ile, Windows'ta `demo_hazirla()` ile sınırlanır; hata penceresi açılmaz,
  çökme dökümü yazılmaz, sistem ayarı değişmez.

## Kendiniz deneyin

1. `%n` yerine `%s` verin: `sizinti '%s %s %s'`. Ne olur, neden? (İpucu: `%s` bir işaretçi bekler.)
2. `sizinti_guvenli`'de `printf("%s", argv[1])` yerine `printf(argv[1])` yazıp yeniden derleyin. Açık geri geldi mi?
3. Linux'ta `sizinti_denetimli`'yi `objdump -d` ile inceleyin: `printf` yerine `__printf_chk` çağrısını bulun.
