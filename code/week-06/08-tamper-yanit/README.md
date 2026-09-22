# Demo 8 — RASP motoru: algılama + tepki politikası + cihaz/sürüm bağlama

**Konu:** RASP savunma+caydırma — tamper yanıtı, decoy, güvenli silme, cihaz/sürüm bağlama · **Hafta:** 6 ·
**Katalog:** K15 (tamper yanıtı/veri imha), K16 (rastgele sahte çıkış), L1 (cihaz bağlama), L2 (sürüm bağlama)

## Ne gösteriyor?

Haftanın **capstone** demosu; önceki parçaları tek bir "öz koruma motoru" altında birleştirir:

- **Algılama:** bir dizi kontrol (bütünlük, anti-debug, ortam, kanca, root) çalışır.
- **Cihaz/sürüm bağlama:** değerli sır, cihaz parmak izi + sürümden **HKDF** ile türetilen anahtarla AES-GCM'de
  sarılır. Başka cihazda anahtar farklı çıkar → sır açılamaz.
- **Tepki politikası:** tamper algılanınca motor (a) sırrı güvenle **siler**, (b) tamper bayrağını kaldırıp olayı
  kaydeder, (c) çökmek yerine **sahte (decoy)** sonuç döner.

| Senaryo | Ne olur |
| --- | --- |
| `normal` | Kontroller geçer, cihaz doğru → sır açılır, kullanılır, silinir |
| `tamper` | Bir kontrol başarısız → sil + decoy + bayrak |
| `baska-cihaz` | Kontroller geçer ama cihaz anahtarı tutmaz → sır açılamaz → decoy |

## Çalıştırma

Önce `code/` klasöründe derleyin. Sonra bu klasörde: Windows `.\demo.ps1` · WSL/Linux `sh demo.sh`. Elle:
`./bin/linux/rasp normal|tamper|baska-cihaz`.

## Neden güvenli?

Yalnız bellek içi hesap (HKDF + AES-GCM + güvenli silme); hiçbir dosyaya, kayda, ağa ya da sistem ayarına dokunmaz.

## Kendiniz deneyin

1. Tamper yanıtında neden **çökmek** yerine **decoy** döndürmek tercih edilir? (Saldırgana ipucu vermeme; hangi
   kontrolün tetiklediğini gizleme.)
2. `baska-cihaz` senaryosunda sırrı açmanın yolu var mı? Neden cihaz bağlama, çalınan bir veri dosyasını başka
   telefonda işe yaramaz kılar? (Hafta 3 Demo 9 "güvenlik kabuğu" ile bağlantı.)
3. Tek bir kontrolü (ör. anti-debug) atlatan saldırgan neden yine de başarısız olur? (İpucu: kombinasyon + cihaz
   bağlama + Demo 5 akış sayacı.)
