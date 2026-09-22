# Demo 5 — Kod gizleme: dize gizleme, yansıma ve ProGuard

**Konu:** Statik/dinamik gizleme (obfuscation), küçültme (shrinking) · **Hafta:** 5 ·
**Kitap:** Viega & Messier, Tarif 12.11 (dize gizleme), 12.9 (fonksiyon işaretçileri /
dolaylı çağrı — kavram)

## Ne gösteriyor?

Demo 4'te `javap`'ın sabit dizeleri ve metot adlarını açığa çıkardığını gördük. Bu demo
üç savunmayı gösterir:

- **A) Statik dize gizleme:** Aynı gizli dize kaynakta düz metin yerine **XOR ile
  şifrelenmiş bir bayt dizisi** olarak durur; çalışma anında çözülür. `javap` çıktısında
  dize düz metin olarak **görünmez** (yalnızca bayt dizisi + çözme döngüsü).
- **B) Yansıma (reflection) ile dinamik çağrı:** Metot adı çalışma anında (o da gizli)
  üretilir ve `getDeclaredMethod` + `invoke` ile çağrılır. Bytecode'da metoda **doğrudan
  `invokestatic` çağrısı yoktur**; statik çağrı grafiği kırılır.
- **C) ProGuard (isteğe bağlı):** Aynı jar küçültülür ve gizlenir; `-keep` ile korunan
  giriş noktası kalır, kullanılmayan private üye (`gizliIslem`) kaldırılır/satır içi
  alınır, kalan üyeler kısa adlarla yeniden adlandırılır.

### Gizlemenin sınırları (dürüstçe)

- **Dize gizleme:** Çözme **anında** dize bellekte düz metin olarak oluşur; bellek
  dökümü ya da çözme fonksiyonunu çağırma (oracle) ile elde edilebilir. Ayrıca çözme
  anahtarı da bir yerde durur. Güçlü koruma için RASP + kısa ömür gerekir (Hafta 6).
- **Yansıma:** Metot **hâlâ sınıfta tanımlıdır** (`javap -p` onu listeler). Yansıma
  yalnızca *çağrı bağlantısını* gizler; asıl güç, ProGuard'ın metodu **yeniden
  adlandırmasıyla** birleştiğinde ortaya çıkar. Yansıma tek başına koruma değildir.
- Gizleme **geciktirir**, imkânsızlaştırmaz. Değerli sırlar istemcide durmamalı.

## ProGuard `-keep` kural tablosu (özet)

| Kural | Ne yapar |
| --- | --- |
| `-keep class X { <methods>; }` | Sınıfı ve üyeleri **hem tut hem adını koru** (giriş noktaları, yansımayla çağrılanlar) |
| `-keepclassmembers` | Sınıf gitse de belirtilen üyeleri koru (ör. serileştirme alanları) |
| `-keepnames` / `-keepclassmembernames` | Küçültmeye izin ver ama **kalanların adını koru** |
| `-dontobfuscate` / `-dontshrink` / `-dontoptimize` | İlgili aşamayı kapat |
| `-optimizationpasses N` | Optimizasyon geçiş sayısı |
| `-repackageclasses ''` | Tüm sınıfları tek (adsız) pakete taşı |
| `-allowaccessmodification` | Erişim belirteçlerini genişletip daha iyi gizleme |
| `-assumenosideeffects class ... Log { *; }` | Sürümde günlük çağrılarını kaldır |

> **R8**, Android'in varsayılan küçültücü/gizleyicisidir ve ProGuard kurallarıyla
> (`-keep` vb.) uyumludur; AGP ile birlikte gelir.

## Çalıştırma

| Ortam | Komut |
| --- | --- |
| Windows (PowerShell) | `.\demo.ps1` — ya da `demo.cmd`'ye çift tıklayın |
| WSL / Linux | `sh demo.sh` |

A ve B bölümleri yalnızca **JDK 17/21** ister, **indirme gerektirmez**. C (ProGuard)
bölümü isteğe bağlıdır: `hazirla` betiği ProGuard'ı resmi sürümden **sabit sürüm +
SHA-256 doğrulamasıyla** indirir (`lib/`, `.gitignore`'da). Yoksa demo bu bölümü atlar.

## Neden güvenli?

- Bütün programlar yalnızca ekrana yazar; ürettikleri jar/sınıflar `cikti/` ve `bin/`
  altındadır (ikisi de `.gitignore`'da). Sisteme/ağa dokunulmaz. Değerler sentetiktir.

## Kendiniz deneyin

1. `AcikSabit` ve `GizliSabit` üzerinde `strings bin/*.class` (Linux) çalıştırın. Hangi
   sınıfta gizli dize görünüyor? XOR anahtarını değiştirip bayt dizisini yeniden üretin.
2. Yansıma demosunda metot adını da düz metin yaparsanız (`getDeclaredMethod("gizliIslem")`)
   `javap` çıktısında ad görünür mü? Neden adı da gizlemek gerekir?
3. `proguard.pro`'da `-keep`'i kaldırıp yalnızca `-keepclasseswithmembers ... main`
   deneyin. Hangi üyeler yeniden adlandırılıyor? `-dontobfuscate` eklerseniz ne değişir?
