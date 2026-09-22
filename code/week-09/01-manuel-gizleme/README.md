# Hafta 9 · Demo 1 — Manuel gizleme ve maliyet ölçümü

Aynı `erisim_ver(jeton)` denetimi iki sürümde: **temiz** (korumasız) ve **gizli**
(el ile K-01 opak yüklem, K-04 düzleştirme, K-05 rastgele çıkış, K-07 dize kodlama,
K-08 opak boolean). Davranış **birebir aynıdır**; yalnız okunması zorlaşır ve maliyeti artar.

## Çalıştırma

```sh
../../build.sh        # ya da Windows'ta ..\..\build.ps1
sh demo.sh            # Linux/WSL
```

Windows'ta doğrudan: `bin\windows\erisim_gizli.exe CEN429-OK`

## Ne gösterir?

1. **Davranış korundu:** iki sürümün çıktısı aynı jetonlar için birebir aynı.
2. **Sır gizlendi:** `strings` çıktısında geçerli jeton `CEN429-OK` temizde görünür, **gizlide görünmez** (K-07).
3. **Maliyet ölçüldü:** yalnız `erisim_ver` fonksiyonunun komut ve dal sayısı (`objdump`) — gizli sürümde artar.
   Örnek ölçüm: temiz 28 komut/3 dal → gizli 51 komut/6 dal.

## Güvenlik

Tümüyle sentetik; dosya/ağ/sistem işlemi yok. Geçerli jeton ikiliye gömülü değildir,
komut satırından verilir. `make clean` / `bin/` silmek yeterlidir.

> 14. hafta bu el işini **Tigress** ile otomatik ve çeşitlendirilmiş yapar (bkz. `week-14`).
