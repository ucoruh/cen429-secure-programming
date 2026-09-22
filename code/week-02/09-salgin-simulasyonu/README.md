# Demo 09 — Solucan salgın simülasyonu (SI modeli)

**Konu:** Solucanların yayılma hızı ve yayılma stratejileri (rastgele tarama, hitlist) ·
**Hafta:** 2 · **Kaynak:** SI salgın modeli; Staniford, Paxson, Weaver, "How to 0wn the
Internet in Your Spare Time" (2002) — kavramsal.

## Ne gösteriyor?

Bir solucanın ağda yayılmasını **Duyarlı–Enfekte (SI)** salgın modeliyle benzetir. Program
hiçbir ağ işlemi yapmaz, hiçbir yere bağlanmaz, dosya üretmez; yalnız şu fark denklemini
çözer ve sonucu ASCII çubuk grafiğiyle basar:

```text
i(t+dt) = i(t) + beta * i(t) * (1 - i(t)/N) * dt
```

Burada `i(t)` enfekte makine sayısı, `N` toplam savunmasız makine, `beta` bulaşma
katsayısıdır. Erken (üstel) evrede **ikilenme süresi = ln(2)/beta**.

| Senaryo | Ne temsil eder | Ders |
| --- | --- | --- |
| Code Red benzeri | Yavaş rastgele tarama (TCP) | Saatler süren yayılma |
| Slammer benzeri | Hızlı rastgele tarama (tek UDP paketi) | Dakikalar süren yayılma |
| Hitlist | Aynı hız, hazır hedef listesiyle başlar (i0 büyük) | Yavaş açılış evresi kaybolur |

Kullanılan `beta` değerleri **örnektir**; gerçekte gözlenen ikilenme süreleri (Slammer ~8,5 s,
Code Red ~37 dk) ders notunda tartışılır.

## Çalıştırma

Önce bütün demoları bir kez derleyin (`code/` klasöründe): Windows `.\build.ps1` ·
WSL / Linux `./build.sh`. Sonra bu klasörde:

| Ortam | Komut |
| --- | --- |
| Windows (PowerShell) | `.\demo.ps1` — ya da `demo.cmd`'ye çift tıklayın |
| WSL / Linux | `sh demo.sh` |

## Neden güvenli?

- Program **yalnız aritmetik** yapar: bir fark denklemini adımlar. Ağ, dosya, süreç, kalıcılık
  yoktur; hiçbir şeye bağlanmaz.
- "Solucan" yalnız bir **sayıdır** (enfekte makine sayısı); kendini kopyalayan hiçbir kod yoktur.

## Kendin dene

- `salgin.c` içinde Slammer `beta` değerini iki katına çıkarın. İkilenme süresi ve %90 doygunluk
  nasıl değişti?
- Hitlist boyutunu (`i0`) 100, 1000, 40000 yapın. Açılış evresi nasıl kısalıyor?
- Gerçek Slammer neden bir dakika sonra yavaşladı? (İpucu: savunmasız makine mi bitti, yoksa ağ
  bant genişliği mi doydu?)
