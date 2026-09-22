# Demo 2 — Serbest bırakılmış belleğin kullanımı ve çift serbest bırakma

**Konu:** use-after-free (CWE-416), double-free (CWE-415) · **Hafta:** 4 ·
**Kitap:** Viega & Messier, Tarif 3.3 (bellek yönetimi hataları) — sanitizer'lar 2003'ten sonra eklenmiştir

## Ne gösteriyor?

Yığında (heap) tutulan bir "oturum" nesnesi `free()` ile bırakıldıktan sonra işaretçi **NULL yapılmazsa** hâlâ
kullanılabilir (askıda/dangling işaretçi). Saldırgan aynı boyutta yeni bir blok ayırıp o boşluğa kendi verisini
koyar; askıdaki işaretçi artık saldırganın verisini gösterir. Böylece `user` rolü `admin` olur ve nesnedeki
fonksiyon işaretçisi başka bir işlevi çağırır. Çift serbest bırakma da ayırıcının iç yapısını bozar.

| Adım | Ne olur | Ders |
| --- | --- | --- |
| 1 | `uaf uaf` (korumasız) | Serbest bloğu `admin` nesnesi doldurur → yetki yükseltme |
| 2 | `uaf_asan uaf` | ASan `heap-use-after-free` bildirir (nerede ayrıldı/bırakıldı/kullanıldı) |
| 3 | `uaf cift` (korumasız) | Çift serbest → ayırıcı bozulmayı algılar / tanımsız davranış |
| 4 | `uaf_asan cift` | ASan `attempting double-free` bildirir |
| 5 | `uaf_guvenli` | `free`+NULL, sahiplik, tek noktadan serbest: iki hata da biter |

## Çalıştırma

Önce `code/` klasöründe: Windows `.\build.ps1` · WSL / Linux `./build.sh`.
Sonra bu klasörde: Windows `.\demo.ps1` (ya da `demo.cmd`) · WSL / Linux `sh demo.sh`.

## Neden güvenli?

- Askıdaki fonksiyon işaretçisi yalnız programın **kendi** `yonetici_panel` işlevini çağırır; dışarıya kod
  enjekte edilmez. Çökebilecek adımlar Linux'ta `prlimit --core=1:1 timeout`, Windows'ta `demo_hazirla()` ile
  sınırlanır.

## Kendiniz deneyin

1. Korumasız `uaf uaf`'ta `sahte` ayırmasını kaldırın. `o->rol` şimdi ne gösteriyor? UAF her zaman istismar
   edilebilir mi, yoksa bellek düzenine mi bağlı?
2. `uaf_guvenli.c`'de `guvenli_serbest` yerine düz `free(o)` yazın (NULL yapmadan). Hangi adım tekrar tehlikeli olur?
3. ASan raporundaki üç yığın izini okuyun: nesne nerede **ayrıldı**, nerede **bırakıldı**, nerede **kullanıldı**?
