# Demo 7 — Root / ayrıcalıklı ortam göstergesi algılama

**Konu:** RASP algılama — root/jailbreak göstergeleri (mobil), ayrıcalık seviyesi · **Hafta:** 6 ·
**Katalog:** K4 (root algılama), K5 (OS tabanlı bütünlük/attestation)

## Ne gösteriyor?

Mobil RASP'te root algılama `su` ikilisi, tehlikeli paketler ve yazılabilir sistem yolları gibi göstergelere bakar.
Masaüstündeki taşınabilir, güvenli karşılığı:

1. **Ayrıcalık seviyesi:** uygulama yönetici/root olarak mı çalışıyor? (Linux `geteuid()==0`, Windows yükseltilmiş
   token.) Ödeme benzeri uygulamalar en az ayrıcalık gereği root'ta çalışmayı reddeder.
2. **Tehlikeli gösterge taraması:** bilinen işaret yollarının varlığını yalnız **okuyarak** kontrol eder. Masaüstünde
   tipik mobil işaretler (su, magisk) bulunmaz → temiz. Demoyu deterministik kılmak için komut satırından ek "sahte
   işaret" yolu verilebilir (`demo.sh` bunu `cikti/` klasöründe üretir).

## Çalıştırma

Önce `code/` klasöründe derleyin. Sonra bu klasörde: Windows `.\demo.ps1` · WSL/Linux `sh demo.sh`. Adım 1 temiz,
Adım 2 sahte bir işaret dosyasıyla "algılandı" gösterir.

## Neden güvenli?

Yalnız dosya varlığını **okur** ve kendi ayrıcalık seviyesini sorgular; hiçbir dosyayı/ayarı değiştirmez, yönetici
yetkisi **gerektirmez**. Sahte işaret yalnız demonun kendi `cikti/` klasöründedir.

## Kendiniz deneyin

1. Bu göstergeler neden "kanıt değil, sinyal"dir? Root gizleme (Magisk Hide) bunları nasıl atlatır?
2. Bir uygulama sırf root gördüğü için çalışmayı reddetse, kendi cihazını root'lamış meşru kullanıcıya ne olur?
   (Yanlış pozitif / kullanıcı deneyimi dengesi.)
3. Windows'ta demoyu **Yönetici olarak** bir kez çalıştırın (isteğe bağlı). Ayrıcalık seviyesi nasıl değişti?
