# Demo 6 — TOCTOU yarış durumu (CWE-367)

**Konu:** Zafiyet sınıflandırma (CWE-367: Time-of-check Time-of-use), Unix erişim denetimi · **Hafta:** 2 ·
**Kitap:** Viega & Messier, Tarif 2.3 (bir kullanıcının dosyaya erişimini denetleme; TOCTOU yarışları)

## Ne gösteriyor?

Bir "günlük yazıcısı" programı, yazmadan önce "bu dosyaya yazmam güvenli mi?" diye denetler. **Güvensiz** sürüm
önce `lstat()` ile bakar, sonra `fopen()` ile açar. İki işlem arasında saldırgan hedefi bir **sembolik bağla**
değiştirirse, program denetlediğinden başka bir dosyaya yazar. **Güvenli** sürüm `O_NOFOLLOW | O_CREAT` ile açar;
denetim ve kullanım tek atomik adımda olduğu için sembolik bağı reddeder.

| Adım | Sürüm | Sonuç |
| --- | --- | --- |
| 1 | Güvensiz (denetle → sonra aç) | Yazı `gizli_hedef.txt`'e yönlendirilir: **saldırı başarılı** |
| 2 | Güvenli (`O_NOFOLLOW`) | Sembolik bağ reddedilir: **saldırı engellenir** |

## Çalıştırma

Bu demo **yalnız Linux / WSL** üzerinde çalışır (sembolik bağ, `O_NOFOLLOW` ve POSIX dosya API'si). Windows'ta
derlenmez; `demo.ps1` WSL'de nasıl çalıştırılacağını yazar.

Önce bütün demoları bir kez derleyin (`code/` klasöründe, WSL/Linux): `./build.sh` (ya da Visual Studio'da
**WSL (GCC)** yapılandırmasıyla **Tümünü Derle**). Sonra bu klasörde:

| Ortam | Komut |
| --- | --- |
| WSL / Linux | `sh demo.sh` |
| Windows | `.\demo.ps1` — WSL'de nasıl çalıştıracağınızı gösterir |

## Neden güvenli? (etik)

- Bütün dosyalar **`calisma/` alt klasöründe** üretilir; hiçbir sistem dosyasına dokunulmaz.
- Yönetici (sudo) yetkisi **gerekmez**; hiçbir sistem ayarı değişmez.
- `gizli_hedef.txt`, saldırının "korunması gereken dosya"yı temsil eden zararsız bir demo dosyasıdır.
- Yarışı derste görünür kılmak için program `TOCTOU_GECIKME_US` ortam değişkeniyle küçük bir gecikme uygular;
  gerçek saldırıda bu gecikmeye gerek yoktur (saldırgan defalarca dener).

## Kendin dene

- `TOCTOU_GECIKME_US` gecikmesini 0 yapın (saldırı betiğinden `export` satırını çıkarın). Saldırı hâlâ tutuyor mu?
  Neden gerçek saldırganlar denemeyi otomatikleştirir?
- Güvenli sürümde `O_NOFOLLOW`'u kaldırın. Şimdi hangi sürüm gibi davranıyor?
- Bu açığın CWE numarası nedir? Aynı ailedeki "geçici dosya" açığı (CWE-377) nasıl önlenir? (İpucu: `O_EXCL`,
  `mkstemp`.)
