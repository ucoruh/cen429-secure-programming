# Demo 11 — Kurcalamaya dayanıklı günlük: HMAC zinciri + anahtar evrimi

**Konu:** İleriye güvenli, kurcalamaya duyarlı denetim kaydı · **Hafta:** 2 ·
**Dayanak:** Schneier & Kelsey, "Secure audit logs to support computer forensics", 1999

## Ne gösteriyor?

Bir denetim günlüğü saldırganın elindeki bir makinede tutuluyorsa, saldırgan makineyi ele geçirdiğinde geçmiş
kayıtları **fark edilmeden** değiştiremesin ya da silemesin isteriz. İki fikir birleştirilir:

1. **Özet zinciri:** `mac_i = HMAC(K_i, mac_{i-1} || seq_i || mesaj_i)`. Her kayıt bir öncekinin MAC'ini
   kapsadığından, bir kaydı **değiştirmek, silmek veya yeniden sıralamak** zinciri kırar.
2. **Anahtar evrimi (ileriye güvenlik):** `K_{i+1} = HMAC(K_i, "cen429-evrim")` ve `K_i` **silinir**. Anahtar
   tek yönlü türetildiğinden, saldırgan ele geçirme anında yalnız **güncel** anahtarı (`K_N`) görür; ondan eski
   anahtarları (`K_j, j<N`) geri hesaplayamaz. Böylece geçmiş kayıtlar için geçerli MAC üretemez.

Karşılaştırma için **statik anahtar** modu da vardır: tek sabit anahtar. Statik modda ele geçirilen anahtar =
ilk anahtar olduğundan saldırgan geçmişi yeniden yazabilir; **evrim** modunda yazamaz. Demonun can alıcı adımı
budur (Adım 6).

| Adım | Saldırı | Beklenen sonuç |
| --- | --- | --- |
| 2 | (yok) | Sağlam günlük **doğrulanır** |
| 3 | Bir kaydın mesajını değiştir (MAC eski) | O kayıtta **MAC:BOZUK** |
| 4 | Bir kaydı sil | Zincir kopar → **KURCALANMIŞ** |
| 5 | İki kaydı yer değiştir | Sıra + zincir → **KURCALANMIŞ** |
| 6a | Ele geçirilen anahtarla geçmişi yeniden yaz (**evrim**) | **YAKALANIR** |
| 6b | Aynı saldırı (**statik**) | **YAKALANMAZ** (uyarı) |

## Çalıştırma

Önce bütün demoları bir kez derleyin (`code/` klasöründe): Windows `.\build.ps1` · WSL / Linux `./build.sh`.
Sonra bu klasörde: Windows `.\demo.ps1` · WSL / Linux `sh demo.sh`.

HMAC/SHA-256 çağrıları ortak `code/common/cen429_kripto.h` başlığından gelir (Linux'ta OpenSSL, Windows'ta CNG);
ayrıca kütüphane kurmanız gerekmez.

## Neden güvenli?

Program **yalnız kendi klasöründeki `calisma/`** altına yazar. "Doğrulayıcı anahtarı" gerçekte çevrimdışı,
güvenli bir yerde durur; burada ders amacıyla diskte tutulur. Bütün değerler sentetiktir; ağ ve yönetici yetkisi
kullanılmaz.

## Kendiniz deneyin

1. `erisim.zdenetim` dosyasını bir metin düzenleyiciyle açıp bir MAC onaltılığının tek karakterini değiştirin;
   `dogrula` ne diyor?
2. Adım 6a'da mesajı eski hâline geri yazarsanız (yani hiç değiştirmezseniz) doğrulama geçer mi? Neden?
3. `evrimlet()` fonksiyonunu devre dışı bırakıp (evrim modunu statik gibi çalıştırıp) 6a'nın nasıl "yakalanmaz"a
   döndüğünü görün — anahtar evriminin katkısı tam olarak budur.
