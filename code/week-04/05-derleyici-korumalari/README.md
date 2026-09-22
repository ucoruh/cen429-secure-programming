# Demo 5 — Derleyici ve işletim sistemi korumaları

**Konu:** Stack canary, FORTIFY, PIE/ASLR, DEP/NX, RELRO, CFG (CWE-121) · **Hafta:** 4 ·
**Kitap:** Viega & Messier, Tarif 3.3 (StackGuard/ProPolice/`/GS`) — bugün derleyicide yerleşik; ASLR/DEP/RELRO/CFI 2003'ten sonra eklenmiştir

## Ne gösteriyor?

Aynı taşma hatası iki kez derlenir: korumalar **kapalı** (`giris_zayif`) ve **açık** (`giris_sert`). Uzun bir
girdi 64 baytlık tamponu taşırınca sert sürümde **yığın canary'si** bozulur ve program güvenli biçimde durur;
zayıf sürümde taşma ya sessizce bozar ya da çöker. Sonra ikilideki korumaları bir betikle denetleriz.

| GCC/Clang (Linux) | MSVC (Windows) | Ne yapar |
| --- | --- | --- |
| `-fstack-protector-strong` | `/GS` | Yığın canary'si (dönüş adresinden önce gizli değer) |
| `-D_FORTIFY_SOURCE=2` | `_s` işlevleri / `strcpy_s` | Kütüphane çağrılarında boyut denetimi |
| `-fPIE -pie` (ASLR) | `/DYNAMICBASE /HIGHENTROPYVA` | Adresleri her çalıştırmada değiştir |
| NX (varsayılan) | `/NXCOMPAT` | Veri sayfasını kod olarak çalıştırma |
| `-Wl,-z,relro,-z,now` | (karşılığı yok) | GOT/PLT'yi salt-okunur yap |
| `-fsanitize=cfi` / `-fcf-protection` | `/guard:cf` | Kontrol akışı bütünlüğü (dolaylı çağrı denetimi) |

## Çalıştırma

Önce `code/` klasöründe: Windows `.\build.ps1` · WSL / Linux `./build.sh`.
Sonra bu klasörde: Windows `.\demo.ps1` (ya da `demo.cmd`) · WSL / Linux `sh demo.sh`.
Denetim adımı Linux'ta `readelf`, Windows'ta `dumpbin` kullanır (Developer PowerShell gerekmez).

## Neden güvenli?

- Taşma yalnız bu programın kendi yığınında olur; Linux'ta `prlimit --core=1:1 timeout`, Windows'ta
  `demo_hazirla()` ile sınırlanır. Bu korumalar **hatayı düzeltmez**, yalnız sömürmeyi zorlaştırır/durdurur.

## Kendiniz deneyin

1. `giris_sert`'i `readelf -h` ile inceleyin: `Type: DYN` (PIE) mı? `giris_zayif` neden `EXEC`?
2. Windows'ta `dumpbin /headers giris_sert.exe` çıktısında "Dynamic base" ve "High Entropy" satırlarını bulun.
3. Sert sürümde tamponu 64'ten 8 bayta indirin. Canary hâlâ tetikleniyor mu? Neden `/GS` her tamponu korumaz?
