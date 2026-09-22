# Demo 4 — Saldırı ağacı maliyet hesaplayıcı

**Konu:** Saldırı ağaçları (Schneier), en ucuz yol, derinlemesine savunma · **Hafta:** 2

## Ne gösteriyor?

Bir saldırı ağacını metin dosyasından okur ve her düğümün "en ucuz saldırı maliyetini" aşağıdan yukarı hesaplar:
**VEYA** düğümü çocuklarından en ucuzunu seçer (saldırganın işine gelen), **VE** düğümü çocukların toplamını alır
(hepsi gerektiği için). Kökün maliyeti = hedefe ulaşmanın en ucuz yolu; program bu yolu (savunulacak kritik zincir)
ayrıca çizer.

İkinci ağaç, "bellekten oku" dalına RASP eklendiğinde en ucuz yolun nasıl değiştiğini gösterir — yani bir savunmanın
saldırı maliyetini nasıl yükselttiğini sayıyla ölçer.

## Çalıştırma

Önce bütün demoları bir kez derleyin (`code/` klasöründe): Windows `.\build.ps1` · WSL / Linux `./build.sh` ·
Visual Studio: **Dosya > Aç > Klasör** → `code` → yapılandırmayı seçin → **Derle > Tümünü Derle**. Sonra bu
klasörde:

| Ortam | Komut |
| --- | --- |
| Windows (PowerShell) | `.\demo.ps1` — ya da `demo.cmd`'ye çift tıklayın |
| WSL / Linux | `sh demo.sh` |

Kendi ağacınızı yazın: `.\bin\windows\agac.exe agac-odeme.txt` (Windows) ya da `./bin/linux/agac agac-odeme.txt`
(Linux). Biçim `agac.c` başında açıklanmıştır (girinti = derinlik, yaprakta `maliyet=` verilir).

## Neden güvenli?

Bu bir **hesap makinesidir**: hiçbir saldırı yapmaz, hiçbir dosyaya dokunmaz; yalnız ağaçtaki sayıları toplar ve
en küçüğü seçer.

## Kendin dene

- Kök `VE` yapılırsa (tüm dalları birden gerektiren hedef) maliyet nasıl değişir? Bu gerçekçi mi?
- Yaprak maliyetleri yerine "gün-adam" değil "olasılık" koyup çarpım/olasılıkla hesaplasaydık ne değişirdi?
- Kendi dönem projeniz için bir saldırı ağacı yazın (en az 8 yaprak). En ucuz yol hangisi? Oraya hangi önlemi
  eklerseniz maliyet en çok artar?
