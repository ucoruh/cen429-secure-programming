# Demo 6 — Bileşen / paket imza ve özet doğrulaması

**Konu:** RASP — yeniden paketlemeye (repackaging) karşı imza doğrulama; Android APK imza doğrulamasının genel hâli ·
**Hafta:** 6 · **Katalog:** K2 (paket hash), K3 (paket imza), K6 (karşılıklı native↔modül doğrulama)

## Ne gösteriyor?

Android'de uygulama, yeniden paketlemeye karşı **APK imzasını** (Signature Scheme v2/v3) doğrular. Bu, "yüklediğim
bileşen beklenen, değiştirilmemiş sürüm mü?" sorusunun genel hâlidir. Demo bunu taşınabilir C'de gösterir: bir
"eklenti modülü" dosyası yüklenmeden **önce** ayrık bir imza (HMAC-SHA-256) ile doğrulanır.

| Adım | Ne olur |
| --- | --- |
| 1–2 | Modül oluşturulur ve üretimde imzalanır (`modul.imza`) |
| 3 | Modül değişmemiş → imza **tutar** → yüklenebilir |
| 4 | Modül yeniden paketlenir (1 bayt değişir) → imza **tutmaz** → yükleme **reddedilir** |

## Önemli fark

APK v2/v3 **açık anahtar (asimetrik)** imza kullanır; doğrulayanın imzalama anahtarına değil, yalnız açık anahtara
ihtiyacı olur. Burada öğretim için **paylaşılan anahtarlı HMAC** kullanıyoruz; asimetrik imza (Ed25519 / RSA-PSS)
**Hafta 10**'da. İlke aynı: yüklemeden önce bütünlük + kaynak doğrulaması.

## Çalıştırma

Önce `code/` klasöründe derleyin. Sonra bu klasörde: Windows `.\demo.ps1` · WSL/Linux `sh demo.sh`.

## Neden güvenli?

Yalnız demonun kendi `cikti/` klasöründeki dosyaları okur/yazar; hiçbir sistem dosyasına ya da ayarına dokunmaz.

## Kendiniz deneyin

1. `modul.dat`'ı değiştirip **imzayı da** yeniden üretin (`uret`). Doğrulama tekrar tutuyor mu? Bu neden gerçek
   saldırıda işe yaramaz? (İpucu: saldırganın imzalama anahtarı yok.)
2. Karşılıklı doğrulama (K6): modül de native'in HMAC'ini taşısaydı, saldırganın **ikisini birden** tutarlı yamalaması
   gerekirdi. Bunu nasıl kurardınız?
3. Neden asimetrik imza (Hafta 10) HMAC'ten daha güçlü bir dağıtım modeli sunar?
