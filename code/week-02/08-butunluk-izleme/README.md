# Demo 08 — Bütünlük izleme: SHA-256 manifesti ve HMAC mührü

**Konu:** Dosya bütünlüğü izleme (Tripwire / AIDE mantığı), uygulama beyaz listesi, "beklenen
değer" korunması · **Hafta:** 2 · **Kitap:** Viega & Messier, Tarif 12.2 (değişiklik tespiti;
kitaptaki CRC32 burada SHA-256 ile güncellenmiştir), Tarif 6.1 ve 6.10 (özet ve HMAC)

## Ne gösteriyor?

Bir zararlı sisteme yerleştiğinde çoğu zaman **iz bırakır**: bir kütüphaneyi yamalar, yeni bir
dosya bırakır, bir günlüğü siler. Bütünlük izleyicisi "bilinen iyi" durumdaki her dosyanın
kriptografik özetini bir **manifeste** yazar ve sonra yeniden hesaplayıp karşılaştırır.

| Adım | Ne olur | Ders |
| --- | --- | --- |
| 1 | `cikti/izlenen/` altındaki dört dosyanın SHA-256 manifesti yazılır | Taban çizgisi (baseline) |
| 2 | Manifest, rastgele bir anahtarla HMAC-SHA256 ile **mühürlenir** | Beklenen değerler de korunmalı |
| 3 | Değişiklik yokken doğrulama: hepsi `TAMAM` | |
| 4 | Benzetim: bir dosyaya satır eklenir, biri kaldırılır, yeni biri bırakılır | `DEGISTI`, `SILINDI`, `YENI` |
| 5 | "Saldırgan" manifesti de yeniden yazar: izleyici kandırılır | Yerel, korunmasız referans değer zayıflıktır |
| 6 | Mühür doğrulaması başarısız: manifest anahtarsız biri tarafından değişmiş | HMAC anahtarsız üretilemez |

SHA-256 ve HMAC iki platformda da çalışır: Linux'ta OpenSSL, Windows'ta işletim sisteminin
BCrypt kütüphanesi (`common/cen429_kripto.h`). HMAC karşılaştırması **sabit zamanlıdır**.

## Çalıştırma

Önce bütün demoları bir kez derleyin (`code/` klasöründe): Windows `.\build.ps1` ·
WSL / Linux `./build.sh`. Sonra bu klasörde:

| Ortam | Komut |
| --- | --- |
| Windows (PowerShell) | `.\demo.ps1` — ya da `demo.cmd`'ye çift tıklayın |
| WSL / Linux | `sh demo.sh` |

## Neden güvenli?

- Bütün dosyalar demo betiği tarafından bu klasördeki `cikti/` altında **sentetik** içerikle
  üretilir; "saldırı" yalnız bu kendi ürettiğimiz dosyalara dokunur.
- Program yalnız verilen klasörün **üst düzeyindeki normal dosyalara** bakar; alt klasöre inmez,
  sembolik bağlantı izlemez, hiçbir dosyayı değiştirmez (yalnız manifesti ve mühürü yazar).
- Mühür anahtarı işletim sisteminin güvenli rastgele sayı üretecinden gelir ve her çalıştırmada
  yenilenir; hiçbir gerçek sırrı korumaz.

## Kendin dene

- Adım 4'te dosyanın içeriğini değil yalnız **değişiklik zamanını** değiştirin
  (`touch cikti/izlenen/ayar.conf`). İzleyici ne dedi? Neden?
- Mühür anahtarını manifestle aynı klasörde tutmanın sakıncası nedir? Gerçekte nerede
  durmalı (salt okunur ortam, ayrı sunucu, donanım modülü)?
- Tarif 12.2 CRC32 kullanır. Bir saldırgan CRC32'yi neden kolayca tutturabilir, SHA-256'yı neden
  tutturamaz?
