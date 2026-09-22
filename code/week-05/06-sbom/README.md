# Demo 6 — SBOM: yazılım malzeme listesi (CycloneDX) ve zafiyet eşleştirme

**Konu:** Bağımlılık güvenliği, SBOM, bilinen zafiyetli bileşenler (CWE-1104) ·
**Hafta:** 5 · **Kitap:** doğrudan tarif yok (dış kaynak); Viega & Messier'in "hiçbir
girdiye güvenme" ilkesi bağımlılıklara da uzanır

## Ne gösteriyor?

Demo, kendi ürettiği **sentetik** jar'lardan (`cikti/lib/`) bir **CycloneDX 1.5** JSON
SBOM'u üretir. Her bileşen için: **ad, sürüm, purl** (paket URL'si) ve **SHA-256**.
Ardından küçük, **sentetik** bir "bilinen zafiyetli sürümler" listesiyle eşleştirir ve
etkilenen bileşenler için uyarı basar.

| Adım | Ne olur |
| --- | --- |
| 1 | `lib/`'deki jar'lar taranır; ad/sürüm/SHA-256 çıkarılır, CycloneDX JSON yazılır |
| 2 | Her bileşen için `pkg:maven/...@sürüm` biçiminde **purl** üretilir |
| 3 | Sentetik zafiyet listesiyle eşleştirilir; iki bileşen için uyarı verilir |

**Neden önemli?** SBOM, "hangi bileşenin hangi sürümü bende var?" sorusuna **makine
tarafından okunabilir** bir cevaptır. 2021'de **Log4Shell** (Log4j 2.x'teki
CVE-2021-44228) çıktığında, SBOM'u olan ekipler "etkilendim mi?" sorusunu **saniyeler**
içinde yanıtladı; olmayanlar günlerce kod taradı. Bu demodaki `gunluk-cekirdek` bileşeni
o senaryonun sentetik bir benzetimidir (gerçek Log4j değildir).

## Çalıştırma

| Ortam | Komut |
| --- | --- |
| Windows (PowerShell) | `.\demo.ps1` — ya da `demo.cmd`'ye çift tıklayın |
| WSL / Linux | `sh demo.sh` |

Yalnızca **Python 3** gerekir. **İndirme gerektirmez** (yerleşik `zipfile`, `hashlib`,
`json`). CycloneDX üretimi için harici araç (`cyclonedx-*`) gerekmez; gerçek projelerde
`cyclonedx-maven-plugin`, `syft` veya `cdxgen` kullanılır.

## Neden güvenli?

- Bileşen adları/sürümleri ve zafiyet kimlikleri **tamamen sentetiktir** (gerçek
  kütüphane/CVE değil). Üretilen jar'lar ve SBOM `cikti/` altındadır (`.gitignore`'da).
- Ağ kullanılmaz; sisteme dokunulmaz. Yerel bir NVD/OSV veritabanı indirilmez.

## Kendiniz deneyin

1. `BILESENLER`'e yeni bir bileşen ekleyip `ZAFIYETLI`'ye ekleyin. SBOM ve uyarı nasıl
   değişiyor? Sürümü "düzeltilen" değere yükseltince uyarı kalkıyor mu?
2. Üretilen `cikti/sbom.cyclonedx.json`'u açın. `purl`, `hashes` ve `metadata.component`
   alanlarını inceleyin. SPDX ile CycloneDX arasındaki temel fark nedir?
3. Gerçek bir projede SBOM'u nasıl otomatik üretirdiniz? (İpucu: derleme hattında bir
   adım + zafiyet taraması; S13 proje bölümüne yazın.)
