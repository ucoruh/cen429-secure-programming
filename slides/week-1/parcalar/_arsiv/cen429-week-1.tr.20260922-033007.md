---
marp: true
theme: cen429
paginate: true
lang: tr
title: "CEN429 Hafta 1 — Güvenli Programlamaya Giriş ve Uygulama Koruma Planı"
author: "Dr. Öğr. Üyesi Uğur CORUH"
header: "CEN429 Güvenli Programlama · Hafta 1"
footer: "RTEÜ Bilgisayar Mühendisliği · 2026-2027 Güz"
---

<!-- _class: baslik -->
<!-- _paginate: false -->

# Güvenli Programlamaya Giriş ve Uygulama Koruma Planı

**CEN429 Güvenli Programlama — Hafta 1**

Dr. Öğr. Üyesi Uğur CORUH · 18.09.2026

<!--
Konuşma notu: Kendinizi ve dersi tanıtın. Bu ders "saldırıyı görerek savunmayı öğrenme" dersi. Her hafta çalışan demolar olacak.
-->

---

# Bugünün planı (3 saat)

| Saat | Konu |
| --- | --- |
| 1 | Ders tanıtımı · Güvenlik nedir? · Saldırgan kim? · Tasarım ilkeleri |
| 2 | Uygulama koruma planı · Arayüz ve varlık tabloları · STRIDE · Saldırı ağacı · **Demo 1–2** |
| 3 | Süreç belleği · **Demo 3–4** · Proje başlangıcı · Kendini sınama |

**Demolar:** `code/week-01` — Windows `.\demo.ps1` · WSL / Linux `sh demo.sh` · Visual Studio: Klasör Aç → `code`

<!--
Konuşma notu: Demoları önceden bir kez derleyin (Windows: code içinde .uild.ps1, WSL: ./build.sh) ki derste bekleme olmasın. Öğrencilere iki ortamın da aynı sonucu verdiğini gösterin; Visual Studio'da Klasör Aç ile code klasörünü açmak yeterli.
-->

---

# Ders nasıl yürüyor?

- **Tek dönem projesi:** C/C++ uygulaması + "sertifikasyondan geçecekmiş gibi" bir **güvenlik kılavuzu**
  - Vize kontrolü: **7. hafta** gösterim · Final kontrolü: **15. hafta** gösterim
- **İki quiz:** 8. hafta (1–6) · 16. hafta (9–14)
- Not: `Vize = 0,6·Proje1 + 0,4·Quiz1` · `Final = 0,7·Proje2 + 0,3·Quiz2`
- Her hafta: **hatalı kod → saldırı → düzeltme**

> ⚠️ **Etik:** Teknikleri yalnız **kendi bilgisayarınızda** ve verilen demolar üzerinde deneyin.

---

<!-- _class: bolum -->

# 1. Güvenlik nedir?

---

# Kasa benzetmesi

| Kavram | Kasa | Yazılım |
| --- | --- | --- |
| **Varlık** | Para | Parola, ödeme anahtarı |
| **Tehdit** | Hırsız | Parolayı çalmak isteyen |
| **Zafiyet** | Arızalı kilit | Denetlenmeyen `strcpy` |
| **Saldırı** | Kilidi açmak | Uzun adla yönetici olmak |
| **Karşı önlem** | Yeni kilit | Uzunluk denetimi |
| **Risk** | Olasılık × etki | "Bulunursa bütün hesaplar gider" |

<!--
Konuşma notu: Öğrencilere kendi örneklerini sorun: "Instagram hesabınız için varlık, tehdit, zafiyet ne?"
-->

---

# Güvenliğin üç hedefi: CIA

| | Soru | Bozulursa |
| --- | --- | --- |
| **C**onfidentiality — Gizlilik | Yalnız yetkili görebiliyor mu? | Parolalar sızar |
| **I**ntegrity — Bütünlük | Yetkisiz değiştirilebiliyor mu? | Bakiye, not değişir |
| **A**vailability — Erişilebilirlik | Gerektiğinde çalışıyor mu? | Sistem çöker |

\+ Kimlik doğrulama · Yetkilendirme · İnkâr edilemezlik

**Soru:** Bankacılık uygulaması bakiyeyi şifresiz yazıyor → ? · Alıcı IBAN yolda değişiyor → ? · Bayram gecesi çöküyor → ?

---

# Hata ≠ zafiyet, ama…

> Güvenlik açıklarının çok büyük kısmı **sıradan yazılım hatalarıdır.**

**Heartbleed (2014, CVE-2014-0160)**

- İstemci: "Bana **64 KB** geri yolla" — ama yalnız **birkaç bayt** gönderir
- Sunucu uzunluğu **denetlemez** → komşu belleği (parolalar, anahtarlar) geri yollar
- Tek bir eksik uzunluk denetimi → internetin önemli bir kısmı etkilendi

<!--
Konuşma notu: Demo 4'te aynı aileden bir hatayı (uzunluk denetimi) kendi ellerimizle göreceğiz.
-->

---

# Saldırgan kim, neye erişebiliyor?

| Saldırgan | Erişim | Savunma |
| --- | --- | --- |
| Uzaktaki | Yalnız ağ mesajları | Girdi doğrulama, TLS |
| Yerel kullanıcı | Dosyalar, ortam değişkenleri | İzinler, güvenli başlatma |
| İçeriden kişi | Kaynak kod, sunucu | Ayrıcalık ayrımı, denetim kaydı |
| **Cihazın sahibi (beyaz kutu)** | **Bellek, hata ayıklayıcı, ikili kod** | **RASP, kod gizleme, whitebox** |

**Bu dersin farkı:** program **saldırganın cihazında** çalışıyorsa ne yaparız?

<!--
Konuşma notu: Mobil ödeme, DRM, oyun hileleri, lisans denetimi örnekleri. "Anahtarı gizle" demek yetmez; saldırgan belleği okuyabilir.
-->

---

<!-- _class: yogun -->

# Güvenli tasarım ilkeleri (Saltzer & Schroeder, 1975)

| İlke | Tek cümle |
| --- | --- |
| En az ayrıcalık | Yalnız gereken yetkiyle çalış |
| Güvenli varsayılan | Varsayılan "izin yok" |
| Tam aracılık | Her erişimi her seferinde denetle |
| Açık tasarım | Güvenlik algoritmanın değil **anahtarın** gizliliğine dayanır |
| Mekanizma ekonomisi | Basit = daha az hata |
| Ayrıcalıkların ayrılması | Kritik işe iki koşul |
| En az ortak mekanizma | Paylaşılan kaynağı azalt |
| Kabul edilebilirlik | Kullanılamayan güvenlik atlatılır |

\+ **Derinlemesine savunma:** tek önleme güvenme, **katman** kur.

---

<!-- _class: bolum -->

# 2. Uygulama koruma planı ve tehdit modelleme

---

# Uygulama koruma planı: 7 adım

1. **Kapsam** — Neyi koruyoruz? Hangi ikili, hangi sürüm, hangi özet?
2. **Mimari ve arayüzler** — Kim kiminle, hangi kanaldan konuşuyor?
3. **Varlıklar** — Nerede durur, ne zaman silinir, **C** mi **I** mı?
4. **Tehditler** — Saldırgan kim, varlığa hangi yoldan ulaşır?
5. **Karşı önlemler** — Hangi katman, hangi önlem?
6. **Doğrulama** — Çalıştığı nasıl kanıtlanıyor?
7. **Kalan risk** — Kabul edilenler ve nedenleri

→ Sertifikasyonda bu plan **yüzlerce sayfalık bir güvenlik kılavuzudur.** Siz projede **20–30 sayfalık** sürümünü yazacaksınız.

---

<!-- _class: sema -->

# Örnek mimari: mobil ödeme uygulaması

```text
 TELEFON (güvenilmez)                    SUNUCU (güvenilir)
 ─────────────────────                   ──────────────────
 Mobil uygulama
       │ A
 Kütüphane – Java  ──── D: TLS + mesaj şifreleme ───>  Arka uç + HSM
       │ B (JNI)
 Kütüphane – native C/C++ ── E: NFC ──>  Ödeme terminali
       │ C
 Yerel veritabanı (şifreli)
```

- Telefon **saldırganın elinde** olabilir: root, hata ayıklayıcı, bellek dökümü
- En hassas işler **native C/C++** katmanında

<!--
Konuşma notu: Bu mimari yalnız yöntemi göstermek için. Arayüz ve varlık tablosu yöntemini dönem boyunca kullanacağız; tablodaki varlıkları koruyan yöntemleri sonraki haftalarda tek tek açacağız (3: güvenlik kabukları, 4 ve 9: native sağlamlaştırma, 6: RASP, 10: anahtar hiyerarşisi, 11: whitebox).
-->

---

<!-- _class: yogun -->

# Arayüz ve varlık tabloları

| Arayüz | Uçlar | Kimlik doğrulama | Gizlilik / bütünlük |
| --- | --- | --- | --- |
| C | native – veritabanı | — | Şifreleme + MAC, anahtar cihaza bağlı |
| D | SDK – sunucu | Sertifika sabitleme | **TLS + ayrıca mesaj şifreleme** |

| Varlık | Nerede | Ömür | Koruma |
| --- | --- | --- | --- |
| Tek kullanımlık ödeme anahtarı | DB (şifreli), bellek | Tek ödeme | C, I |
| Oturum anahtarı | Yalnız bellek | Oturum | C, I |
| İşlem sayacı | DB | Kalıcı | I |

**Listede olmayan varlık korunmuyor demektir.**

---

# STRIDE

| | Tehdit | Bozduğu | Örnek |
| --- | --- | --- | --- |
| **S** | Kimlik taklidi | Kimlik doğrulama | Sahte uygulama SDK'yı çağırır |
| **T** | Kurcalama | Bütünlük | Native denetim ikili dosyada değiştirilir |
| **R** | İnkâr | İnkâr edilemezlik | "Bu ödemeyi ben yapmadım" |
| **I** | Bilgi sızması | Gizlilik | Anahtar bellek dökümünden okunur |
| **D** | Hizmet engelleme | Erişilebilirlik | Binlerce sahte kayıt isteği |
| **E** | Yetki yükseltme | Yetkilendirme | Sıradan kullanıcı → yönetici |

Veri akış diyagramını çiz → **güven sınırını geçen her ok** için altı harfi sor.

---

# Saldırı ağacı: "Ödeme anahtarını ele geçir"

**HEDEF: Ödeme anahtarı** — *VEYA* (biri yeter)

1. **Veritabanını çöz** — *VE* (hepsi gerekir): root yetkisi al **+** veritabanı anahtarını bul
2. **Bellekten oku** — *VEYA*: hata ayıklayıcı bağla **|** bellek dökümü al **|** fonksiyona kanca at
3. **Trafiği dinle** — *VE*: TLS'i kır **+** mesaj düzeyi şifrelemeyi kır

---

# Saldırı ağacından çıkan sonuçlar

- "Trafiği dinle" yolu **iki katmanı birden** kırmayı gerektirir → pahalı → **derinlemesine savunma** çalışıyor
- "Bellekten oku" yolunun **üç alternatifi** var → en zayıf nokta **bellekteki anahtar**
  - Bu hafta: **Demo 2** (bellekte kalan sır)
  - Hafta 6: çalışma zamanı koruması (hata ayıklayıcı, kanca algılama)
  - Hafta 11: whitebox kriptografi (anahtar bellekte hiç açık durmaz)
- Savunmacının hedefi: saldırganı **VE** düğümlerine zorlamak

---

# Sınıf alıştırması (15 dk)

**Öğrenci not sistemi:** öğretim üyesi not girer, öğrenci görür, veri sunucuda.

1. Veri akış diyagramı + güven sınırları
2. Her STRIDE harfinden **bir** tehdit
3. "Notumu 45'ten 85'e çıkar" saldırı ağacı — **en ucuz yol** hangisi?

<!--
Konuşma notu: 3-4 kişilik gruplar. 10 dakika çalışma, 5 dakika iki gruba sunum. İpucu: E için doğrudan URL ile not girme sayfası; R için değişiklik kaydının olmaması.
-->

---

<!-- _class: bolum -->

# 3. Program başlarken ve bellekte kalan sırlar

---

# Program boş sayfayla başlamaz

Çalıştıran kişiden **devraldıkları:**

- Ortam değişkenleri: `PATH`, `LD_PRELOAD`, `IFS`…
- Açık dosya tanıtıcıları, çalışma dizini, `umask`
- Kaynak sınırları, çökme dökümü ayarı

> Program bunlara güvenirse, **onları kontrol eden programı kontrol eder.**
> Kitap: Viega & Messier, Tarif 1.1–1.9

---

# Demo 1 — PATH ile kandırma (CWE-426)

```c
int durum = system(KOMUT);  /* Linux: "date"  Windows: "hostname" */
                            /* HANGİSİ çalışacak? */
```

`.\demo.ps1` (Windows) · `sh demo.sh` (WSL / Linux)

```text
ADIM 2 — PATH="$PWD/sahte:$PATH" ./bin/linux/rapor
Rapor tarihi:
  !!! SAHTE 'date' calisti !!!
ADIM 3 — ./bin/linux/rapor_guvenli  ->  Rapor tarihi: Sat Sep 19 ...
```

<!--
Konuşma notu: Önce sahte/date (Windows'ta sahte\hostname.bat) dosyasını gösterin: yalnız bir mesaj basıyor. Windows'ta cmd.exe komutu PATH'ten önce çalışma klasöründe de arar. "Gerçek saldırgan burada ne yapardı?" sorusunu sorun.
-->

---

# Düzeltme: üç kural

```c
char *const arguman[]     = { "date", NULL };
char *const temiz_ortam[] = { "PATH=/usr/bin:/bin", "LANG=C", NULL };
posix_spawn(&pid, "/bin/date", NULL, NULL, arguman, temiz_ortam);
```

1. **Mutlak yol** → PATH araması yok
2. **Kabuk yok** (`posix_spawn` / `execve`) → özel karakter, `IFS` yok
3. **Temiz ortam** → bilinen, küçük bir ortam

Windows: `CreateProcessW` + `System32\hostname.exe` + yalnız `SystemRoot`

En iyisi: başka programa hiç gerek bırakma → `strftime()`, `GetComputerNameW()`

---

# Demo 2 — Bellekte kalan parola (CWE-14)

```c
char parola[64];
n = dosya_oku(fd, parola, sizeof(parola) - 1);
anahtar = anahtar_turet(parola, n);
memset(parola, 0, sizeof(parola));         /* sürüm 2 */
explicit_bzero(parola, sizeof(parola));    /* sürüm 3, Linux */
SecureZeroMemory(parola, sizeof(parola));  /* sürüm 3, Windows */
```

```text
Hiç silmeyen   -> parola dökümde BULUNDU
memset (-O2)   -> parola dökümde BULUNDU      ← !!!
explicit_bzero -> parola dökümde bulunamadı
```

<!--
Konuşma notu: Linux'ta demo gdb ile programı durdurup gcore ile belleği döküyor; Windows'ta program kendi belleğini MiniDumpWriteDump ile dokum klasörüne yazıyor. Bu, çökme dökümü veya hata ayıklayıcı saldırısının güvenli bir benzetimi. MSVC /O2 de memset'i kaldırıyor. Makine kodu: Linux'ta objdump -d, Visual Studio'da Ayrıştırılmış Kod penceresi.
-->

---

<!-- _class: yogun -->

# Neden memset kayboldu?

Derleyicinin düşüncesi:

> "`parola` bundan sonra **hiç okunmuyor**. Ona sıfır yazmak sonucu değiştirmez. **Gereksiz — siliyorum.**"

**Ölü yazma giderme** (dead store elimination): hız için iyi, **sırlar için felaket**.

| Platform | Kaldırılamayan silme |
| --- | --- |
| Linux (glibc) | `explicit_bzero` |
| Windows | `SecureZeroMemory` |
| C11 Ek K | `memset_s` |
| OpenSSL | `OPENSSL_cleanse` |

\+ `setrlimit(RLIMIT_CORE, 0)` · `mlock` · sırrı **kısa** tut, **kopyalama**

---

<!-- _class: bolum -->

# 4. Süreç belleği ve taşmalar

---

# Süreç belleği

```text
 yüksek adres
 ┌──────────────────────┐
 │ Yığın (stack)   ↓    │  yerel değişkenler, dönüş adresleri
 │                      │
 │ Öbek (heap)     ↑    │  malloc
 ├──────────────────────┤
 │ .data / .bss         │  küresel değişkenler
 ├──────────────────────┤
 │ .text                │  makine kodu
 └──────────────────────┘
 düşük adres
```

**C dizinin sonunu denetlemez.** `ad[16]`'ya 17. bayt → arkadaki değişkenin üzerine.

---

# Yapının bellekteki hali

```c
struct oturum { char ad[16]; int yonetici; };
```

```text
 ofset:  0 ............................ 15 | 16  17  18  19
        [ a  y  s  e \0  .  .  .  .  .  . ][ 00  00  00  00 ]   yonetici = 0

 "AAAAAAAAAAAAAAAAB" (17 karakter) kopyalanınca:
        [ A  A  A  A  A  A  A  A  A  A  A ][ 42  00  00  00 ]   yonetici = 66 (!)
                                              'B'  '\0'
```

Küçük uçlu (little-endian): en düşük bayt en düşük adreste.

---

# Demo 3 — Taşmayla yetki yükseltme (CWE-121)

`.\demo.ps1` (Windows) · `sh demo.sh` (WSL / Linux)

| Sürüm | 17 karakterlik saldırı |
| --- | --- |
| `giris` (korumasız) | ❌ **YÖNETİCİ erişimi verildi** |
| `giris_asan` (ASan) | ❌ **sessiz kaldı** — taşma yapının **içinde** |
| `giris_asan` + 40 karakter | ✅ stack-buffer-overflow yakalandı |
| `giris_denetimli` (`_FORTIFY_SOURCE=2` / `strcpy_s`) | ✅ program durduruldu |
| `giris_guvenli` | ✅ **Reddedildi** |

<!--
Konuşma notu: Asıl vurgu: tek bayt yeter; araçların sınırı var; asıl düzeltme kodda.
-->

---

# Düzeltme: doğrula, sonra sınırlı kopyala

```c
/* İzin listesi: 1–15 karakter, harf/rakam/_/- */
static int ad_gecerli_mi(const char *s)
{
    size_t n = strnlen(s, 16);
    if (n == 0 || n >= 16) return 0;
    for (size_t i = 0; i < n; i++) {
        unsigned char c = (unsigned char)s[i];
        if (!isalnum(c) && c != '_' && c != '-') return 0;
    }
    return 1;
}
struct oturum o = { .yonetici = 0 };           /* güvenli varsayılan */
snprintf(o.ad, sizeof(o.ad), "%s", argv[1]);   /* boyutu bilen kopya */
```

Canary, NX, ASLR (4. hafta) **sömürmeyi zorlaştırır, hatayı düzeltmez.**

---

# Tamsayılar: -1 ne zaman dev olur?

`int` işaretli · `size_t` işaretsiz · negatifler **ikiye tümleyen**

```text
int    -1  =  0xFFFFFFFFFFFFFFFF
size_t     =  18 446 744 073 709 551 615
```

```c
if (uzunluk > 16) return -1;   /* -1 bu denetimi GEÇER */
memcpy(hedef, kaynak, uzunluk); /* int -> size_t */
```

---

# Demo 4 — İşaretli uzunluk (CWE-195)

```text
ADIM 0  GCC -Wall -Wextra: sessiz · -Wsign-conversion: uyarı
        MSVC (C): sessiz · aynı kod C++ olarak: C4365
ADIM 1  kopya 8     -> Kopyalandi: ORNEK-KA
ADIM 2  kopya 100   -> Reddedildi
ADIM 3  kopya -1    -> Linux: SIGSEGV (139) · Windows: 0xC0000409
ADIM 4  ASan        -> negative-size-param: (size=-1)
ADIM 5  kopya_guvenli -1 / 12abc -> Reddedildi
```

**Kural:** boyutlar `size_t` · **alt ve üst** sınır · `strtol` · uyarıları **aç**

---

<!-- _class: yogun -->

# Bu haftanın araç kutusu

| İş | Linux / GCC | Windows / MSVC |
| --- | --- | --- |
| Şüpheli kod uyarıları | `-Wall -Wextra -Wsign-conversion` | `/W4` |
| Kütüphanede boyut denetimi | `-D_FORTIFY_SOURCE=2 -O2` | `strcpy_s` gibi `_s` işlevleri |
| Bellek hatasını yakalama | `-fsanitize=address` | `/fsanitize=address` |
| Bellek dökümü | `gdb` + `gcore` | `MiniDumpWriteDump` |
| Makine kodu | `objdump -d` | VS Ayrıştırılmış Kod |
| Kaldırılamayan silme | `explicit_bzero` | `SecureZeroMemory` |
| Güvenle program çalıştırma | `posix_spawn` + mutlak yol | `CreateProcessW` + tam yol |

---

<!-- _class: bolum -->

# 5. Proje ve kapanış

---

# Proje: bu hafta yapılacaklar

1. **Takım** (bireysel ya da en çok 4 kişi) ve **konu**
2. GitHub deposu + **proje planı** (iş paketleri, takvim) → onaylat
3. Güvenlik kılavuzu taslağı:
   - **S0** kapak ve sürüm geçmişi · **S2** ürün genel bakışı
   - **S3** mimari ve **arayüz tablosu**
   - **S4** saldırgan modeli · **STRIDE** · **saldırı ağacı**

---

# Kendi başına çalış (not verilmez)

1. PATH tuzağı: `ls` (Linux) / `whoami` (Windows) ile tekrarla, tam yolla düzelt
2. Demo 2'de `MOD optimize` → `MOD korumasiz`: `memset` şimdi çalışıyor mu?
3. Demo 3'te 16, 17, 18, 19, 20 karakter: `yonetici` değerleri tablosu
4. `struct oturum`'a `bakiye` ekle: taşmayla 1000'in üstüne çıkar, sonra engelle
5. Kendi projenin STRIDE tablosu (≥ 8 tehdit + önlem)
6. Heartbleed raporunu oku: hangi denetim eksikti? Hangi CWE?

Ayrıntı ve ipuçları: ders sitesi → Hafta 1 → "Kendi başına çalış"

---

# Kendini sınama

1. Varlık, tehdit, zafiyet farkı?
2. Alıcı IBAN'ın yolda değişmesi CIA'nın hangisi?
3. Beyaz kutu saldırganı neyi farklı yapar?
4. STRIDE "E" hangi demo?
5. VE / VEYA düğümü — savunma için hangisi iyi?
6. `system("date")` neden tehlikeli? Üç düzeltme?
7. `memset` neden kayboldu?
8. ASan 17 karakteri neden yakalamadı?
9. `-1` `memcpy`'ye gidince ne olur?
10. Derinlemesine savunma — mobil ödeme mimarisinden örnek?

<!--
Konuşma notu: Cevaplar sitede açılır kutularda. Quiz-1 bu tarz sorular ve kısa kod okuma içerir.
-->

---

<!-- _class: baslik -->

# Gelecek hafta

**Hafta 2 — Bilgisayar Virüsleri ve Güvenlik Modelleri**

Kötü yazılım türleri · Bell–LaPadula, Biba, Clark–Wilson · CWE, OWASP, CVSS

Kaynak: Viega & Messier, Tarif 1, 3, 12.1, 13.2–13.3
