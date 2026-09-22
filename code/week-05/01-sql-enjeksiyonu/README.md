# Demo 1 — SQL enjeksiyonu: dize birleştirme vs parametreli sorgu

**Konu:** Girdi doğrulama, enjeksiyon savunması (CWE-89) · **Hafta:** 5 ·
**Kitap:** Viega & Messier, Tarif 3.11 (SQL enjeksiyonu), 3.1 (temel girdi doğrulama)

## Ne gösteriyor?

Bir giriş/arama sorgusu **iki yolla** kurulur:

- **KÖTÜ:** Kullanıcı girdisi SQL metnine **dize birleştirmeyle** gömülür. `parola`
  alanına `' OR '1'='1` yazılınca sorgunun **yapısı** değişir; saldırgan parolayı
  bilmeden giriş yapar veya başka kullanıcının (yöneticinin) satırını sızdırır.
- **İYİ:** **Parametreli sorgu** (`?`) kullanılır. Girdi motora ayrı gönderildiği için
  yalnızca bir **değer**dir; komutun yapısını asla değiştiremez, saldırı reddedilir.

Ana demo **Python'un yerleşik `sqlite3`** modülüyle çalışır ve **hiç indirme
gerektirmez**. İsteğe bağlı Java bölümü aynı fikri gerçek JDBC `PreparedStatement`
ile gösterir (SQLite JDBC sürücüsü `hazirla` betiğiyle indirilir).

| Adım | Ne olur | Ders |
| --- | --- | --- |
| 1 | Dürüst giriş: iki yol da çalışır | Kötü kod normal durumda "doğru" görünür |
| 2 | `' OR '1'='1` → kötü yolda giriş atlanır | Girdi komutun yapısını değiştirdi |
| 3 | `' OR rol='yonetici' --` → başka satır sızar | Yorum (`--`) sorgunun kalanını siler |
| 4 | Kaçışlama neden yetmez? | Bağlam/DB'ye göre değişir; parametre kesin çözüm |

## Çalıştırma

| Ortam | Komut |
| --- | --- |
| Windows (PowerShell) | `.\demo.ps1` — ya da `demo.cmd`'ye çift tıklayın |
| WSL / Linux | `sh demo.sh` |

Java (JDBC) bölümü **isteğe bağlıdır**. Sürücüyü indirmek için:

| Ortam | Komut |
| --- | --- |
| Windows | `.\hazirla.ps1` |
| WSL / Linux | `sh hazirla.sh` |

`hazirla`, `org.xerial:sqlite-jdbc:3.42.0.0` jar'ını Maven Central'dan **sabit sürüm +
SHA-256 doğrulamasıyla** `lib/` altına indirir. Jar `.gitignore`'da olduğu için depoya
girmez. Sürücü yoksa demo Python bölümünü çalıştırır ve Java bölümünü atlar.

Gereken araçlar: **Python 3** (ana demo), isteğe bağlı **JDK 17/21** (Java bölümü).

## Neden güvenli?

- Bütün saldırılar yalnızca demonun **kendi** veritabanına yapılır. Python demosu
  `cikti/demo.db` dosyasını demo klasöründe kurar; Java demosu veritabanını
  **bellekte** (`jdbc:sqlite::memory:`) tutar. Hiçbir sistem dosyasına dokunulmaz.
- Ağ kullanılmaz; yönetici yetkisi istenmez. Bütün değerler sentetiktir.

## Kendiniz deneyin

1. `sqli.py`'de `giris_guvenli` çağrılarına da `' OR '1'='1` verin. Neden parametreli
   sorguda saldırı işe yaramıyor? (İpucu: motor girdiyi metin değeri olarak arar.)
2. Kötü yola bir "naif kaçışlama" ekleyin (`ad.replace("'", "''")`). `--` içeren
   girdi hâlâ etkili mi? Sayı bağlamında (`WHERE id = ` + girdi) kaçışlama yeterli mi?
3. Java demosunu `hazirla` ile çalıştırın; `girisKotu` ile `girisGuvenli`'nin motora
   gönderdiği şeyi karşılaştırın. `PreparedStatement` neden "yapı + değer"i ayırır?
