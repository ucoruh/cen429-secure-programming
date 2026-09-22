## Saldırı ağaçları

Saldırı ağacını geçen hafta çizmiştik; bu hafta **niceliğe** dökeceğiz. Kök, saldırganın hedefidir; dallar ona
ulaşma yollarıdır. **VEYA** düğümünde bir dal yeter, **VE** düğümünde hepsi gerekir. Her yaprağa bir **maliyet**
(gün-adam, ekipman, uzmanlık) yazarsak, ağacı aşağıdan yukarı çözerek **en ucuz saldırıyı** bulabiliriz:

- VEYA düğümü: çocukların **en ucuzu** (saldırganın işine gelen).
- VE düğümü: çocukların **toplamı** (hepsi gerektiği için).

### Demo 04 — Saldırı ağacı maliyet hesaplayıcı

!!! info "Demo 04 · `code/week-02/04-saldiri-agaci`"
    Girintiyle yazılmış bir saldırı ağacını okur, her düğümün en ucuz maliyetini hesaplar ve savunulacak en
    zayıf zinciri yazar. Hiçbir saldırı yapmaz; yalnız sayı toplar.

Windows: `cd code\week-02\04-saldiri-agaci ; .\demo.ps1` · WSL/Linux:
`cd code/week-02/04-saldiri-agaci && sh demo.sh` (önce `code/` içinde bir kez derleyin).

```text title="demo — Adım 1 (kısaltılmış)"
  [VEYA] Odeme anahtarini ele gecir  (maliyet=2)
    [VE] Yerel veritabanini kopyala ve coz [hepsi gerekir]  (maliyet=9)
    [VEYA] Kullanim aninda bellekten oku [biri yeter]  (maliyet=2)
      Hata ayiklayici ile bellekten oku  (maliyet=2)
    [VE] Sunucu ile telefon arasinda dinle [hepsi gerekir]  (maliyet=15)

  EN UCUZ SALDIRI = 2 birim. ... en zayif nokta:
  -> Kullanim aninda bellekten oku -> Hata ayiklayici ile bellekten oku
```

En ucuz yol **2 birim**: bellekteki anahtarı okumak. İkinci ağaç, bu dala **RASP** (hata ayıklayıcı ve kanca
algılama — 6. hafta) eklendiğinde ne olduğunu gösterir:

```text title="demo — Adım 2 (kısaltılmış)"
  [VEYA] Odeme anahtarini ele gecir  (maliyet=8)
    [VEYA] Kullanim aninda bellekten oku [biri yeter]  (maliyet=8)
      Bellek dokumu (rastgele silme'yi as)  (maliyet=8)
  EN UCUZ SALDIRI = 8 birim.
```

Savunma, en ucuz saldırıyı **2'den 8'e** çıkardı; en zayıf nokta değişti. Bu, güvenlik yatırımını **sayıyla**
gerekçelendirmenin yoludur: "Şu önlem, en ucuz saldırıyı 4 kat pahalılaştırıyor." VE düğümleri saldırganı birden
çok katmanı birlikte kırmaya zorlar — derinlemesine savunmanın niceliksel karşılığı.

!!! tip "Projeye bağlantı"
    Dönem projenizin **S4** bölümünde bir saldırı ağacı çizeceksiniz. Bu demonun girdi biçimini kullanıp kendi
    ağacınızı yazın; en ucuz yolu bulun ve oraya hangi önlemin en çok maliyet eklediğini gösterin.

## Güvenlik denetim kaydı: kanıt olarak günlük

Saldırı ağacı "saldırgan nereden gelir?" sorusunu sorar; **denetim kaydı** (audit log) ise "geldi mi, ne
yaptı?" sorusunu cevaplar. Bir olaydan sonra neyin olduğunu anlamanın, sorumluyu bulmanın ve bir daha
olmasını önlemenin tek yolu güvenilir kayıttır. Kitap bu konuyu Tarif 13.11'de işler; oradaki öneriler
bugün de geçerlidir, yalnız araçlar güncellenmiştir.

### Ne kaydedilir, ne asla kaydedilmez?

| Kaydet | Asla kaydetme |
| --- | --- |
| Kimlik doğrulama denemeleri (başarılı ve başarısız), kim, ne zaman, nereden | Parola, PIN, oturum belirteci, özel anahtar |
| Yetki değişiklikleri, rol atamaları, ayar değişiklikleri | Kart numarasının tamamı, kimlik numarası gibi kişisel veriler (gerekirse maskele) |
| Hassas işlemler (ödeme onayı, veri dışa aktarma, silme) | Şifreli verinin çözülmüş hali |
| Güvenlik denetimlerinin sonucu (imza hatası, bütünlük hatası, RASP uyarısı) | Hata ayıklama çıktısı (sürüm derlemesinde tamamen kaldırılır) |

Kayıt, bir saldırganın da okuyabileceği varsayılarak tasarlanır. Günlüğe yazılan her sır, günlük
dosyasına erişen herkese verilmiş demektir. Bu yüzden öğretim üyesinin yöntemlerinden biri, sürüm
derlemesinde hata ayıklama günlüğünü koddan tamamen çıkarmaktır: kapalı bir bayrakla susturulmuş günlük
kodu ikili dosyada kalır ve hem dizgeleriyle bilgi sızdırır hem de yeniden açılabilir.

### Demo 10 — Günlük enjeksiyonu (CWE-117)

Günlük satırı çoğu zaman kullanıcıdan gelen bir alan içerir: kullanıcı adı, dosya adı, istek yolu. Bu alan
**satır sonu** (`\n`, `\r`) ya da **terminal kontrol karakteri** (ESC dizileri) içeriyorsa, saldırgan günlüğe
hiç yaşanmamış bir olayı yazdırabilir ya da gerçek bir satırı ekranda gizleyebilir.

!!! info "Demo 10 · `code/week-02/10-gunluk-enjeksiyonu` · CWE-117"
    Program dört örnek girdiyle bir giriş denetimi günlüğü yazar: biri normal, biri satır sonuyla sahte
    bir `admin ... BASARILI` satırı ekleyen, biri ESC dizisiyle satırın bir kısmını ekranda silen, biri de
    aşırı uzun. Önce güvensiz, sonra güvenli sürüm çalışır. Dosyalar yalnız demo klasöründeki `calisma/`
    altına yazılır.

=== "Windows (PowerShell)"

    ```powershell
    cd code\week-02\10-gunluk-enjeksiyonu
    .\demo.ps1
    ```

=== "WSL / Linux"

    ```bash
    cd code/week-02/10-gunluk-enjeksiyonu
    sh demo.sh
    ```

```text title="sh demo.sh — çıktı (kısaltılmış)"
ADIM 1 - GUVENSIZ gunluk: alan denetlenmeden yaziliyor
  DENETIM giris kullanici=ayse sonuc=BASARISIZ
  DENETIM giris kullanici=kayra
  DENETIM giris kullanici=admin sonuc=BASARILI sonuc=BASARISIZ
  DENETIM giris kullanici=deniz^[[2K^Mgizli sonuc=BASARISIZ
ADIM 2 - Sahte satiri say:
  Gunluk: 4 satir; sahte 'admin BASARILI' satiri: 1
ADIM 3 - GUVENLI gunluk: kacislama + sinir + sabit bicim dizgesi
  DENETIM giris kullanici=kayra\x0A2026-... kullanici=admin ...
  DENETIM giris kullanici=deniz\x1B[2K\x0Dgizli sonuc=BASARISIZ
  DENETIM giris kullanici=AAAAAAAAAAAAAAAA... sonuc=BASARISIZ
ADIM 4 - Sahte satiri say (guvenli):
  Gunluk: 4 satir; sahte 'admin BASARILI' satiri: 0
```

Güvensiz sürümde üç girdi dört satır üretti: `kayra` adının içine gizlenmiş satır sonu, günlüğe **hiç
gerçekleşmemiş bir yönetici girişi** ekledi. Bu günlüğü okuyan bir yönetici ya da otomatik uyarı sistemi
yanlış bir olaya tepki verir; gerçek saldırı ise gürültünün arasında kaybolur. Güvenli sürüm üç şey yapar:

1. **Kaçışlama:** yazdırılamayan her bayt (`\n`, `\r`, ESC) `\xNN` biçiminde yazılır; her girdi tek satır kalır.
2. **Sınır:** alan belirli bir uzunlukta kırpılır (`...`); günlük dosyası bir girdiyle şişirilemez.
3. **Sabit biçim dizgesi:** alan hiçbir zaman `printf`/`syslog`'un biçim dizgesi olarak verilmez. Kitabın
   Tarif 13.11'de uyardığı `syslog(LOG_INFO, kullanici_girdisi)` hatası bir **biçim dizgesi açığıdır**
   (CWE-134; 4. haftada ayrıntılı): doğrusu `syslog(LOG_INFO, "%s", kullanici_girdisi)`.

!!! tip "Değerlendirici nasıl test eder?"
    Kullanıcı adı, dosya adı gibi günlüğe düşen her alana satır sonu, ESC dizisi ve `%n`/`%x` gibi biçim
    belirteçleri koyar; sonra günlüğü açıp satır sayısının arttığına, ekranın bozulduğuna ya da programın
    çöktüğüne bakar. Ayrıca günlük dosyalarında parola, anahtar ve kişisel veri arar.

### Kurcalamaya dayanıklı günlük

Enjeksiyonu önlemek günlüğün **doğru** yazılmasını sağlar; ama sisteme sızan bir saldırganın izini
silmek için günlüğü **sonradan değiştirmesini** engellemez. Günlüğün değiştirilemez olması gerekmez;
değiştirildiğinin **fark edilmesi** yeterlidir. Bunun iki klasik yolu vardır:

- **Özet zinciri:** her kayıt bir önceki kaydın özetini içerir. Ortadan bir kaydı değiştirmek, sonraki
  bütün kayıtların zincirini bozar. Ancak saldırgan bütün zinciri baştan hesaplayabilir; anahtar yoktur.
- **HMAC zinciri ve anahtar evrimi:** her kayıt anahtarlı bir özetle mühürlenir; üstelik anahtar her
  kayıttan sonra tek yönlü bir fonksiyonla **evrilir** ve eski anahtar silinir (Schneier–Kelsey, 1999).
  Saldırgan makineyi ele geçirdiği anda yalnız **o anki** anahtarı bulur; ondan geriye, önceki kayıtları
  mühürleyen anahtarlara dönemez. Böylece ele geçirmeden önceki kayıtlar korunur (ileriye güvenlik).

Doğrulayıcı, başlangıç anahtarını ayrı ve güvenli bir yerde (çevrimdışı) tutar ve zinciri baştan
yeniden hesaplayarak her kaydı doğrular.

### Demo 11 — Kurcalamaya dayanıklı günlük: HMAC zinciri ve anahtar evrimi

!!! info "Demo 11 · `code/week-02/11-kurcalamaya-dayanikli-gunluk` · Tarif 13.11'in güncel hali"
    Program aynı altı kayıtlık günlüğü iki kez üretir: biri **anahtar evrimli**, biri **statik anahtarlı**.
    Her kayıt sıra numarası ve HMAC-SHA256 taşır (`code/common/cen429_kripto.h`). Ardından dört saldırı
    dener: kayıt değiştirme, kayıt silme, sıra değiştirme ve ele geçirilen anahtarla geçmişi yeniden
    yazma. Kayıtlar sentetiktir; dosyalar yalnız demo klasöründe oluşur.

=== "Windows (PowerShell)"

    ```powershell
    cd code\week-02\11-kurcalamaya-dayanikli-gunluk
    .\demo.ps1
    ```

=== "WSL / Linux"

    ```bash
    cd code/week-02/11-kurcalamaya-dayanikli-gunluk
    sh demo.sh
    ```

```text title="sh demo.sh — çıktı (kısaltılmış)"
ADIM 2 - Saglam gunlugu dogrula (evrim):
  #1 seq=1 "cuzdan acildi"  MAC:OK
  ...
  >>> SONUC: gunluk BUTUNLUKLU (tum kayitlar dogrulandi).
ADIM 3 - Ham kurcalama: seq=4 mesajini degistir (MAC eski)
  #4 seq=4 "odeme onaylandi tutar=9999"  MAC:BOZUK
  >>> SONUC: gunluk KURCALANMIS (dogrulama basarisiz).
ADIM 4 - Kayit SILME: seq=5 silinir
  #5 seq=6 "oturum kapandi"  MAC:BOZUK  SIRA:BOZUK
```

Kayıt değiştirildiğinde MAC tutmuyor; kayıt silindiğinde hem MAC hem sıra numarası bozuluyor. Demonun
son adımları asıl farkı gösterir: saldırgan makinede bulduğu anahtarla günlüğü yeniden yazmaya
çalıştığında, **statik anahtarlı** günlükte bütün geçmişi yeniden mühürleyip doğrulayıcıyı kandırabilir;
**anahtar evrimli** günlükte ise yalnız ele geçirme anından sonraki kayıtlara dokunabilir, çünkü önceki
anahtarlar artık hiçbir yerde yoktur.

!!! success "Kural"
    Günlüğe kullanıcı verisini kaçışlayarak ve sınırlayarak yazın; sırları asla yazmayın; günlüğü
    anahtarlı bir zincirle mühürleyin, anahtarı her kayıtta evriltin ve eski anahtarı silin; doğrulama
    anahtarını günlüğün bulunduğu makinede tutmayın. Mümkünse kayıtları anında ayrı bir günlük sunucusuna
    gönderin: saldırganın ulaşamadığı kopya en güçlü kanıttır.

!!! note "Sahada nasıl uygulanır?"
    Mobil ödeme gibi uygulamalarda cihaz üzerindeki günlük en az tutulur ve hassas alan içermez; güvenlik
    olayları (bütünlük hatası, hata ayıklayıcı algılama) sunucuya raporlanır. 6. haftada göreceğimiz RASP
    önlemlerinin "raporlama" ayağı budur.
