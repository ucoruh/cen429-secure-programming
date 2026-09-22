# Demo 4 — Bytecode ve decompile: `.class` içinde ne görünür?

**Konu:** Bytecode, tersine mühendislik, sırların koda gömülmesi (CWE-798) ·
**Hafta:** 5 · **Kitap:** Viega & Messier, Tarif 12.11 (dize gizleme — kavram)

## Ne gösteriyor?

Küçük bir "lisans/PIN denetimi" sınıfı derlenir. Sonra JDK'nin kendi **`javap -c -p`**
aracıyla `.class` dosyası incelenir. Kaynak kod **olmadan** bile şunların açıkça
göründüğünü görürsünüz:

- **Sabit dizeler:** `// String 4729` (PIN) ve `// String PRO-2026-DEMO` (lisans
  anahtarı) sabit havuzunda (constant pool) düz metin durur.
- **Private alan ve metot adları:** `GECERLI_PIN`, `pinDogru`, `lisansGecerli` —
  anlamlı adlar mantığı ele verir.
- **Dallanma mantığı:** `ldc` (sabit yükle) ve `invokevirtual equals` bytecode'u,
  "girdiyi şu sabitle karşılaştır" mantığını gösterir.

Bu, gizleme (obfuscation) ihtiyacının **motivasyonudur**: Java bytecode yüksek
seviyelidir ve `javap`, `jadx`, CFR gibi araçlarla kolayca okunur. Demo 5 bu sızıntıyı
dize gizleme ve yansıma ile azaltır.

## Çalıştırma

| Ortam | Komut |
| --- | --- |
| Windows (PowerShell) | `.\demo.ps1` — ya da `demo.cmd`'ye çift tıklayın |
| WSL / Linux | `sh demo.sh` |

Yalnızca **JDK 17/21** gerekir (`javac`, `javap`). **İndirme gerektirmez.**

## Neden güvenli?

- Program yalnızca ekrana yazar; hiçbir dosyaya/sisteme dokunmaz, ağ kullanmaz.
- Bütün değerler (`4729`, `PRO-2026-DEMO`) **sentetiktir**; gerçek bir ürün, lisans ya
  da PIN değildir.

## Kendiniz deneyin

1. `javap -c -p LisansDenetimi` çıktısında `ldc` satırlarını bulun. PIN'i hangi satır
   ele veriyor? Bir saldırgan bu bilgiyle programı nasıl atlatabilir?
2. `main`'e doğru PIN'i (`4729`) argüman olarak verip çalıştırın. Bytecode'daki mantık
   ekranda gördüğünüz davranışla nasıl eşleşiyor?
3. `javap -v` (tam ayrıntı) çalıştırın. Sabit havuzunda (Constant pool) dizeleri
   listeleyin. `String` girişleri neden ayrı ayrı görünüyor?
