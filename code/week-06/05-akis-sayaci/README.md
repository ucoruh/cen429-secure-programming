# Demo 5 — Kontrol akışı sayacı (control-flow integrity)

**Konu:** RASP savunma — kontrol akışı bütünlüğü, atlama (skip) saldırısına direnç · **Hafta:** 6 ·
**Katalog:** K17 (kontrol akışı sayacı / çift örtüşen sayaç)

## Ne gösteriyor?

Tek bir `if (guvenli) ...` kontrolü kolayca atlatılır: saldırgan koşullu atlamayı (`je` → `jmp`) yamalar. Savunma:
güvenlik kontrollerini bir **veri bağımlılığına** bağlamak. Burada her kontrol noktası bir anahtar zincirini bir adım
ilerletir (`acc = HMAC(acc, "asama-i")`); kritik işlem bu zincirden türetilen anahtarla bir sırrı **AES-GCM ile açar**.

| Senaryo | Kontroller | Sonuç |
| --- | --- | --- |
| `normal` | Üçü de sırayla | Zincir doğru → anahtar doğru → **ONAYLANDI** |
| `atlat` | Hiçbiri (doğrudan kritik işleme atlar) | Zincir yanlış → GCM reddeder → **decoy** |
| `kismi` | Yalnız ilki | Zincir eksik → **decoy** |
| `sirasiz` | Yanlış sırada | Zincir farklı → **decoy** |

Kritik işlem doğru sonucu **ancak** bütün kontrollerden sırayla geçilmişse üretebildiği için, tek bir `jmp` yaması işe
yaramaz.

## Çalıştırma

Önce `code/` klasöründe derleyin. Sonra bu klasörde: Windows `.\demo.ps1` · WSL/Linux `sh demo.sh`. Elle:
`./bin/linux/sayac normal|atlat|kismi|sirasiz`.

## Neden güvenli?

Yalnız bellek içi hesap yapar (HMAC zinciri + AES-GCM); hiçbir dosyaya, kayda ya da sistem ayarına dokunmaz.

## Kendiniz deneyin

1. `atlat` modunda gerçek sonucu almanın bir yolu var mı? Neden yok? (İpucu: anahtar zinciri veriye bağlı.)
2. `ASAMA` sayısını 5'e çıkarın ve iki kontrol noktası daha ekleyin. Zincir nasıl değişir?
3. Bu neden "çift/örtüşen sayaç" (K17) ile birleştirildiğinde daha da güçlenir? (Sayaç + iz + anahtar zinciri üçü de
   tutarlı olmalı.)
