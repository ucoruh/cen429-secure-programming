# Demo 6 — Sembol ve dize sızıntısı

**Konu:** İkiliden bilgi sızması, sembol/dize gizleme (CWE-200, CWE-215) · **Hafta:** 4 ·
**Kitap:** Viega & Messier, Tarif 12.11 (dizeleri gizleme)

## Ne gösteriyor?

Sürüm ikilisinde bırakılan **açık dizeler** (loglama metinleri, gizli sabitler) ve **fonksiyon adları** tersine
mühendise doğrudan ipucu verir. `strings` ve `nm` ile bunları görürüz; sonra dizeyi derleme zamanında karıştırıp
(XOR), loglamayı sürümde derlemeden çıkarıp ve sembolleri `strip`'leyerek sızıntıyı kapatırız.

| Adım | Ne olur |
| --- | --- |
| 1 | `gizli_acik` ve `gizli_kapali` aynı çalışır (lisans denetimi) |
| 2 | `strings` → açık sürümde `CEN429-LISANS-2026` ve `[LOG]` görünür; kapalı sürümde yok |
| 3 | `nm` → açık sürümde `lisans_dogrula` görünür; kapalı sürüm strip'li ("no symbols") |
| 4 | Windows: adlar EXE'de değil `.pdb`'de; kapalı sürüm PDB üretmez, dizeler gizli |

## Öğretim üyesinin yöntemleri (dersin kendi yöntemleri)

- **Sembol görünürlüğünü kapatma** (`-fvisibility=hidden`, `static`, `strip -s`): paylaşılan kütüphanede dışa
  açılan sembolleri en aza indir.
- **Sürümde loglamayı kaldırma:** LOG makrolarını derleme zamanı bayrağıyla tamamen derle-dışı bırak.
- **Statik dize karıştırma:** hassas sabitleri derleme zamanında şifrele/karıştır, kullanım anında çöz.

## Çalıştırma

Önce `code/` klasöründe: Windows `.\build.ps1` · WSL / Linux `./build.sh`.
Sonra bu klasörde: Windows `.\demo.ps1` (ya da `demo.cmd`) · WSL / Linux `sh demo.sh`.
Linux'ta `strings`/`nm` (binutils) gerekir; Windows'ta betik saf PowerShell ile tarar.

## Neden güvenli?

- Program yalnız kendi dizesini çözer ve ekrana basar; hiçbir sistem kaynağına dokunmaz. Bütün değerler
  **sentetiktir**. Bu bir gizleme (obfuscation) tekniğidir: kırılamazlık değil, **maliyet artışı** sağlar.

## Kendiniz deneyin

1. `gizli_kapali` çalışırken bellekte çözülmüş dize bir süre durur. Bu neden tek başına yeterli değildir?
   (Hafta 3: güvenli silme.)
2. XOR anahtarını 0x5A yerine her derlemede farklı yapın (çeşitlendirme). Neden bu daha iyidir?
3. `nm --dynamic gizli_acik` ile `nm gizli_acik` farkı nedir? `-fvisibility=hidden` hangisini etkiler?
