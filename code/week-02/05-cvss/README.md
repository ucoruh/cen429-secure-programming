# Demo 5 — CVSS v3.1 Temel Puan hesaplayıcı

**Konu:** CVE ve CVSS puanlama, zafiyet ciddiyeti · **Hafta:** 2

## Ne gösteriyor?

Bir CVSS v3.1 vektörünü (ör. `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`) alıp 0.0–10.0 arası **Temel
Puanı**, FIRST'ün resmi formülleriyle sıfırdan hesaplar. Sekiz metriğin puanı nasıl etkilediğini elle görmek için
idealdir. `--ornekler` beş tipik zafiyeti çözer; `test_cvss.py` sonuçları FIRST belgesindeki bilinen değerlerle
karşılaştırarak doğrular.

## Çalıştırma

Bu demo **derleme gerektirmez** (Python). `code/` klasöründeki `build.ps1`/`build.sh` diğer demoları derler;
bu demoyu doğrudan çalıştırabilirsiniz:

| Ortam | Komut |
| --- | --- |
| Windows (PowerShell) | `.\demo.ps1` — ya da `demo.cmd`'ye çift tıklayın |
| WSL / Linux | `sh demo.sh` |

Elle:

```bash
python3 cvss.py "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
python3 cvss.py --ornekler
python3 test_cvss.py          # bilinen puanlarla karşılaştırır
```

Windows'ta `python3` yerine `py -3` kullanın: `py -3 cvss.py --ornekler`.

## Neden güvenli?

Yalnız aritmetik yapar. Ağ isteği yapmaz, dosya yazmaz, hiçbir sisteme dokunmaz.

## Kendin dene

- `AV:N`'yi `AV:L` yapın (uzaktan → yerel). Puan neden düşüyor? "Cihaz saldırganın elinde" senaryosunda bu düşüş
  gerçeği yansıtıyor mu?
- `S:U`'yu `S:C` yapın (kapsam değişti). Neden puan artıyor? "Kapsam" tam olarak neyi anlatır?
- Kendi projenizdeki bir zafiyet için bir vektör kurun ve puanlayın. Temel Puan bağlamı (varlığın değeri)
  içermez — sizin S4 tablonuzda bunu nasıl eklersiniz?
