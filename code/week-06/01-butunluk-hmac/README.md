# Demo 1 — Çalışma zamanı bütünlük denetimi (self-hashing, HMAC)

**Konu:** RASP algılama — kod/veri bütünlüğü doğrulama, yama (patch) tespiti · **Hafta:** 6 ·
**Kitap:** Viega & Messier, Tarif 12.2 (Detecting Modification — CRC32; biz HMAC-SHA-256'ya güncelliyoruz)

## Ne gösteriyor?

Uygulama, kendi ikili dosyasının (ya da korunan bir modülün) **HMAC-SHA-256** özetini çalışma zamanında hesaplar ve
önceden kaydedilmiş "altın" değerle karşılaştırır. Dosya tek bir bayt bile değişmişse (yamalanmışsa) fark yakalanır.

| Adım | Ne olur | Ders |
| --- | --- | --- |
| 1 | `kaydet oz` — kendi dosyasının altın HMAC'i kaydedilir | Referans değer |
| 2 | `dogrula oz` — yama yok, bütünlük **TAMAM** | Normal çalışma |
| 3 | İkili dosyanın bir **kopyası** alınıp 1 baytı değiştirilir | Yama simülasyonu (kendi `cikti/` klasöründe) |
| 4 | Yamalı kopyanın HMAC'i altın değerle karşılaştırılır → **YAMA ALGILANDI** | Bütünlük denetimi patch'i yakalar |

CRC32 yerine HMAC kullanmamızın sebebi: CRC kriptografik değildir, saldırgan kolayca aynı CRC'yi üretecek şekilde
yamalar. HMAC için gizli anahtar gerekir.

## Çalıştırma

Önce bütün demoları bir kez derleyin (`code/` klasöründe): Windows `.\build.ps1` · WSL / Linux `./build.sh`.
Sonra bu klasörde:

| Ortam | Komut |
| --- | --- |
| Windows (PowerShell) | `.\demo.ps1` — ya da `demo.cmd`'ye çift tıklayın |
| WSL / Linux | `sh demo.sh` |

## Neden güvenli?

- Program yalnız dosya **okur** ve karşılaştırır; hiçbir dosyayı, kaydı ya da sistem ayarını **değiştirmez**.
- "Yama" adımı, ikili dosyanın **kendi `cikti/` klasöründeki bir kopyası** üzerinde yapılır; asıl program dosyasına
  dokunulmaz. `demo.ps1 temizle` / `sh` yeniden çalıştırınca `cikti/` silinir.

## Kendiniz deneyin

1. Kopyada **farklı** bir ofset baytını değiştirin. HMAC yine değişiyor mu? (Evet — HMAC dosyanın tamamına bağlıdır.)
2. Altın değer dosyasını (`cikti/altin.hmac`) saldırgan gibi düzenleyin. Denetim artık neyi yakalayamaz? Bu, "altın
   değer nerede saklanmalı?" sorusunu neden önemli kılar?
3. Bu denetim **tek başına** neden yeterli değildir? (İpucu: saldırgan denetleyici kodun kendisini de yamalayabilir.)
   Çözüm yönleri: çoklu/örtüşen denetleyiciler, sonucu bir **veri bağımlılığı** yapmak (Demo 5), sunucu tarafı
   attestation.
