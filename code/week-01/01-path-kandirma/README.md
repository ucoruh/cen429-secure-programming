# Demo 1 — PATH ile kandırma: program yanlış komutu çalıştırıyor

**Konu:** Güvenli başlatma, güvenilmeyen arama yolu (CWE-426, CWE-427) · **Hafta:** 1 ·
**Kitap:** Viega & Messier, Tarif 1.1 (ortamı temizleme), 1.7 ve 1.8 (dış programları güvenli çalıştırma: Unix / Windows)

## Ne gösteriyor?

`rapor` programı bir başlık basıp bir sistem komutunu çağırır: Windows'ta `hostname`, Linux'ta `date`. Komutu
**çıplak adıyla** ve `system()` üzerinden çağırdığı için hangi dosyanın çalışacağına kabuk, `PATH` ortam değişkenine
bakarak karar verir. `PATH`'i değiştirebilen kişi, programınızın ne çalıştıracağını da belirler.

| Adım | Ne olur | Ders |
| --- | --- | --- |
| 1 | Normal çalışma: gerçek komut bulunur | Kod doğru görünür, testler geçer |
| 2 | `PATH`'in başına `sahte` klasörü eklenir: sahte komut çalışır | Girdi yalnız klavye değildir; ortam da girdidir |
| 3 | Düzeltilmiş `rapor_guvenli` aynı saldırı altında doğru çalışır | Mutlak yol + kabuksuz çalıştırma + küçük, temiz ortam |

Düzeltilmiş sürüm Windows'ta `CreateProcessW` ile `System32\hostname.exe`'yi tam yoluyla ve yalnız `SystemRoot`
içeren bir ortamla, Linux'ta `posix_spawn` ile `/bin/date`'i temiz bir ortamla başlatır.

## Çalıştırma

Önce bütün demoları bir kez derleyin (`code/` klasöründe): Windows `.\build.ps1` · WSL / Linux `./build.sh` ·
Visual Studio: **Dosya > Aç > Klasör** → `code` → **Derle > Tümünü Derle**. Sonra bu klasörde:

| Ortam | Komut |
| --- | --- |
| Windows (PowerShell) | `.\demo.ps1` — ya da `demo.cmd`'ye çift tıklayın |
| WSL / Linux | `sh demo.sh` |

## Neden güvenli?

- "Sahte" komut (`sahte\hostname.bat`, `sahte/date`) yalnız ekrana bir uyarı basar; başka hiçbir şey yapmaz.
- `PATH` değişikliği **yalnız demo betiğinin kendi sürecinde** geçerlidir; sisteminizin ayarlarına yazılmaz,
  betik bitince kaybolur.

## Kendiniz deneyin

1. Sahte komutun yazdığı mesajı değiştirin ve saldırıyı elle tekrarlayın (PowerShell:
   `$env:PATH = "$PWD\sahte;" + $env:PATH; .\bin\windows\rapor.exe` — yalnız o pencerede geçerlidir).
2. Windows'ta `sahte\hostname.bat` dosyasını demo klasörüne kopyalayıp `PATH`'e dokunmadan `rapor.exe`'yi
   çalıştırın. Ne oldu? (İpucu: `cmd.exe` komutu önce çalışma klasöründe arar.)
3. `rapor_guvenli.c`'de hangi üç satır saldırıyı engelliyor? Birini geri alıp saldırının yeniden çalıştığını görün.
