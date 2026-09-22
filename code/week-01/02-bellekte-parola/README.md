# Demo 2 — Bellekte kalan parola: `memset` neden yetmez?

**Konu:** Bellekteki sırlar, derleyici optimizasyonu ve güvenli silme (CWE-14, CWE-316) · **Hafta:** 1 ·
**Kitap:** Viega & Messier, Tarif 13.2 (bellekteki verinin silinmesi)

## Ne gösteriyor?

`parola` programı parolayı `parola.txt` dosyasından okur, onunla bir anahtar hesaplar ve işi bitince parolayı
silmeye çalışır. Sonra programın belleğinin bir dökümü alınır ve dökümde parola aranır. Bu, bir saldırganın çökme
dökümünden, takas dosyasından ya da hata ayıklayıcıyla sır çalmasının güvenli bir benzetimidir.

Aynı kaynak üç kez derlenir:

| Program | Silme yöntemi | Beklenen sonuç |
| --- | --- | --- |
| `parola_silmez` | Hiç silmez | Parola dökümde **bulunur** |
| `parola_memset` | `memset(parola, 0, ...)`, `-O2` / `/O2` | Parola dökümde **bulunur**: derleyici bir daha okunmayan bu yazmayı "gereksiz" sayıp siler |
| `parola_explicit` | `explicit_bzero` (Linux) / `SecureZeroMemory` (Windows) | Parola dökümde **bulunmaz** |

Linux betiği ayrıca makine kodunu sayar: `memset` sürümünde silme komutu 0 tanedir, yani silme kodu hiç üretilmemiştir.

## Çalıştırma

Önce bütün demoları bir kez derleyin (`code/` klasöründe): Windows `.\build.ps1` · WSL / Linux `./build.sh`.
Sonra bu klasörde:

| Ortam | Komut | Dökümü nasıl alır? |
| --- | --- | --- |
| Windows (PowerShell) | `.\demo.ps1` | Program kendi belleğini `MiniDumpWriteDump` ile `dokum\` klasörüne yazar |
| WSL / Linux | `sh demo.sh` (gdb gerekir) | Program gdb altında başlatılır, `gcore` ile `dokum/` klasörüne dökülür |

## Neden güvenli?

- Parola uydurmadır (`Gizli-Parola-2026`) ve yalnız bu klasördeki `parola.txt` dosyasındadır.
- Yalnız **demo programının kendi belleği** dökülür; başka hiçbir sürece dokunulmaz, yönetici yetkisi gerekmez.
- Döküm dosyaları (Windows'ta birkaç on MB) yalnız `dokum/` klasörüne yazılır; `build temizle` onları da siler.

## Kendiniz deneyin

1. `parola.txt` içindeki parolayı değiştirip demoyu yeniden çalıştırın.
2. `CMakeLists.txt`'de `parola_memset` için modu `optimize` yerine `korumasiz` yapın (`-O0` / `/Od`), yeniden
   derleyin. `memset` şimdi kaldı mı? Neden?
3. `parola.c`'deki `derin_cagri_zinciri()` yorumunu okuyun: silinmeyen bir sır neden saatlerce bellekte yaşayabilir?
