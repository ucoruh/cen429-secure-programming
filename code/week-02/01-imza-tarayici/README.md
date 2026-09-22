# Demo 01 — Oyuncak antivirüs: imza, polimorfizm, sezgisel analiz, emülasyon

**Konu:** Zararlı yazılım tespiti ve zararlının gizlenme yöntemleri · **Hafta:** 2 ·
**Kitap:** Viega & Messier, Tarif 12.1 (yazılım korumasının sorunu — saldıran ve savunan aynı yöntemleri kullanır)

## Ne gösteriyor?

Dört tarama yönteminin nasıl çalıştığını **ve nerede yetersiz kaldığını** çalışan kodla gösterir. Hiç gerçek zararlı
yazılım yoktur. Bunun yerine bu demo için uydurulmuş, çalıştırılamayan bir **"KAPSÜL"** veri biçimi kullanılır:
başlık + bir "çözücü" komut satırı + (düz ya da karıştırılmış) gövde. Bu yapı, gerçek şifreli/polimorfik zararlıların
iskeletini taklit eder ama içinde yalnız zararsız metin vardır.

| Adım | Yöntem | Ders |
| --- | --- | --- |
| 1 | Özet + entropi | Laboratuvar yakaladığı örneği önce inceler |
| 2 | **Hash** (SHA-256) | Birebir aynı dosyayı yakalar; **tek bayt değişince** atlatılır |
| 3 | **Desen** (bayt dizisi) | Küçük değişikliklere dayanıklı; çözücü de değişince (polimorfizm) atlatılır |
| 4 | — | Aynı gövde + farklı anahtar → tamamen farklı baytlar (şifreli katmanın gücü) |
| 5 | **Sezgisel** | İmza olmadan puan verir; yanlış pozitif (zararsız `arsiv.bin`) ve yanlış negatif üretir |
| 6 | **Emülasyon** | Çözücüyü güvenli bir "sanal makinede" çalıştırır, çözülen gövdeyi yeniden tarar → hepsini yakalar |

SHA-256 iki platformda da çalışır: Linux'ta OpenSSL, Windows'ta işletim sisteminin BCrypt kütüphanesi
(`common/cen429_kripto.h`).

## Çalıştırma

Önce bütün demoları bir kez derleyin (`code/` klasöründe): Windows `.\build.ps1` · WSL / Linux `./build.sh` ·
Visual Studio: **Dosya > Aç > Klasör** → `code` → yapılandırmayı seçin (**Windows (MSVC)** ya da **WSL (GCC)**) →
**Derle > Tümünü Derle**. Sonra bu klasörde:

| Ortam | Komut |
| --- | --- |
| Windows (PowerShell) | `.\demo.ps1` — ya da `demo.cmd`'ye çift tıklayın |
| WSL / Linux | `sh demo.sh` |

İkili dosyalar `bin\windows\` ya da `bin/linux/` altına, örnek dosyalar `cikti/` altına yazılır (ikisi de `.gitignore` ile dışlanır).

## Neden güvenli?

- Üretilen dosyalar **çalıştırılabilir değildir**; hiçbir işletim sistemi onları çalıştıramaz, yalnız bizim
  tarayıcımız okur.
- Tarayıcı yalnız **okur**: hiçbir dosyayı değiştirmez, silmez, çalıştırmaz.
- "Çözücü emülasyonu" gerçek makine kodu çalıştırmaz; yalnız 6 komutluk oyuncak bir dili yorumlar ve komut sayısını
  sınırlayarak (zaman aşımı) sonsuz döngüyü engeller. Bilinmeyen komut ya da gövdeden uzun `UZUNLUK` reddedilir —
  yani **dosyaya güvenilmez**.
- Antivirüsü tetikleyen hiçbir dize (örneğin EICAR test dizesi) kullanılmaz.

## Kendin dene

- `imzalar.txt` içine `poli_3.bin`'in çözücüsü için yeni bir `DESEN` satırı ekleyin. Şimdi desen yöntemi onu
  yakalıyor mu? Peki dördüncü bir polimorfik kopya (yeni algoritma) üretilse?
- `ornek_uret.c`'de `MAVI-KEDI-42` işaretini iki parçaya bölerek gövdeye yazın (`MAVI-` + `KEDI-42`). Emülasyon hâlâ
  yakalıyor mu? Ya desen?
- Çözücüye `BOS` komutları eklendiğinde sezgisel puan neden artıyor? Gerçek zararlılar neden "çöp kod" (junk code)
  ekler?
