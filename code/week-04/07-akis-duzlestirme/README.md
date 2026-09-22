# Demo 7 — Kontrol akışı düzleştirme (control-flow flattening)

**Konu:** Kod gizleme, CFG düzleştirme · **Hafta:** 4 ·
**Kitap:** Viega & Messier, Tarif 12.3 (kodu gizleme)

## Ne gösteriyor?

Küçük bir PIN denetimi iki biçimde yazılır: doğal `if` zinciri (`pin.c`) ve el ile **düzleştirilmiş** biçim
(`pin_duz.c`) — bütün adımlar tek bir sonsuz döngü içindeki `switch` dağıtıcısına konur. Çıktı **aynıdır**, ama
kontrol akışı grafı (CFG) farklıdır: bloklar arasındaki komşuluk kaybolur, tersine mühendislik zorlaşır. Bu,
Tigress'in `--Transform=Flatten` dönüşümünün elle karşılığıdır (Hafta 14).

| Adım | Ne olur |
| --- | --- |
| 1 | İki sürüm aynı PIN'ler için aynı sonucu verir (4291 doğru) |
| 2 | `objdump`/`dumpbin` ile `pin_dogrula`'nın makine kodu karşılaştırılır (daha çok atlama) |
| 3 | Süre ölçümü: düzleştirme maliyeti (yavaşlama) görülür |

## Çalıştırma

Önce `code/` klasöründe: Windows `.\build.ps1` · WSL / Linux `./build.sh`.
Sonra bu klasörde: Windows `.\demo.ps1` (ya da `demo.cmd`) · WSL / Linux `sh demo.sh`.
Fonksiyon bazında CFG için WSL/Linux'ta `objdump -d` en nettir; Windows'ta Ghidra da kullanılabilir.

## Neden güvenli?

- Program yalnız kendi PIN'ini denetler; hiçbir sisteme dokunmaz. Doğru PIN **sentetiktir**. Gizleme
  kırılamazlık vermez, yalnız tersine mühendislik **maliyetini** artırır; bu yüzden yalnız kritik fonksiyonlara
  uygulanır ve RASP/kripto gibi katmanlarla birlikte gelir.

## Kendiniz deneyin

1. `pin_duz.c`'de durum sırasını karıştırın (case etiketlerini değiştirin). Çıktı değişiyor mu? CFG?
2. İki sürümü `-O2` ile derleyin. Derleyici düzleştirmeyi kısmen geri "düzleştirebilir" mi? (İpucu: opak yüklem
   olmadan dağıtıcı sadeleşebilir.)
3. Süre farkını yüzde olarak hesaplayın. Bu maliyet 20M yerine tek bir çağrı için anlamlı mı?
