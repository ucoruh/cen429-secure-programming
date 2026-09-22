# Demo 7 — Güvenli seri durumdan çıkarma (ObjectInputFilter)

**Konu:** Güvensiz deserialization (CWE-502) · **Hafta:** 5 · **Kitap:** doğrudan tarif
yok (Java'ya özgü); Viega & Messier'in "hiçbir girdiye güvenme" (Tarif 3.1) ilkesinin
uzantısı

## Ne gösteriyor?

Java'nın nesne serileştirmesiyle **güvenilmez** veriyi filtresiz çözmek tehlikelidir:
gelen bayt akışı, beklediğimizin **dışında** sınıflar oluşturabilir. Gerçek saldırılarda
bu sınıflar zincirlenerek (gadget chain) uzaktan kod çalıştırmaya kadar gider.

Bu demo **zararlı bir zincir yazmaz**; yalnızca savunmayı gösterir:

- **KÖTÜ:** Filtre yok. `ObjectInputStream` akıştaki her sınıfı oluşturur — beklenen
  `Ayar` da, beklenmeyen `BaskaSinif` da kabul edilir.
- **İYİ:** `ObjectInputFilter` ile yalnızca **beklenen** sınıflara izin verilir
  (`"SeriDemo$Ayar;java.base/*;!*"`). Beklenen sınıf geçer; beklenmeyen sınıf
  **reddedilir** (`InvalidClassException`).

## En iyi çözüm

- Mümkünse Java serileştirmesi yerine **veri biçimleri** (JSON, Protobuf) kullanın;
  bunlar kod değil, veri taşır.
- Zorunluysa `ObjectInputFilter` ile sınıfları **allow-list** yapın; ayrıca derinlik,
  dizi boyutu ve referans sayısı sınırları koyun (`maxdepth`, `maxarray`, `maxrefs`).

## Çalıştırma

| Ortam | Komut |
| --- | --- |
| Windows (PowerShell) | `.\demo.ps1` — ya da `demo.cmd`'ye çift tıklayın |
| WSL / Linux | `sh demo.sh` |

Yalnızca **JDK 17/21** gerekir. **İndirme gerektirmez.**

## Neden güvenli?

- İki sınıf da (`Ayar`, `BaskaSinif`) **zararsızdır**; yalnızca veri tutar. Hiçbir gadget
  zinciri, dosya işlemi, komut çalıştırma ya da ağ erişimi yoktur.
- Serileştirme bellekte (`byte[]`) yapılır; diske yazılmaz.

## Kendiniz deneyin

1. Filtreye `BaskaSinif`'ı da ekleyin (`SeriDemo$Ayar;SeriDemo$BaskaSinif;...`). Artık
   ikisi de geçiyor mu? Allow-list neden "reddet-öncelikli" (`!*`) bitmeli?
2. Filtreye derinlik sınırı ekleyin (`maxdepth=5`). İç içe nesnelerde ne değişir?
3. Aynı senaryoyu JSON ile kurgulayın (bir alan haritası). JSON neden "kod değil veri"
   olduğu için bu sınıf saldırısına kapalıdır?
