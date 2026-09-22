---
marp: true
theme: cen429
paginate: true
lang: tr
title: "CEN429 Hafta 4 — Kod Sağlamlaştırma: C/C++"
author: "Dr. Öğr. Üyesi Uğur CORUH"
header: "CEN429 Güvenli Programlama · Hafta 4"
footer: "RTEÜ Bilgisayar Mühendisliği · 2026-2027 Güz"
---





<!-- _class: baslik -->
<!-- _paginate: false -->

# Kod Sağlamlaştırma: C/C++

**CEN429 Güvenli Programlama — Hafta 4**

Dr. Öğr. Üyesi Uğur CORUH · 09.10.2026

<!--
Konuşma notu: Bu hafta kodun kendisini sağlamlaştırıyoruz: önce hatasız kod, sonra hata kaçarsa zararı sınırlayan korumalar, en son okumayı zorlaştıran gizleme.
-->

<!--
Konuşma notu: Bu hafta kodun kendisini sağlamlaştırıyoruz: önce hatasız kod, sonra hata kaçarsa zararı sınırlayan korumalar, en son okumayı zorlaştıran gizleme.
-->

---

# Bugünün planı (3 saat)

| Saat | Bölüm | Konu |
| --- | --- | --- |
| 1 | 0–2 | Temel kavramlar · sağlamlaştırma katmanları · SEI CERT · girdi doğrulama |
| 2 | 3–4 | Biçim dizisi · UAF · tamsayı/UB · hata/sinyal · statik analiz · sanitizer · fuzzing |
| 3 | 5–7 | Derleyici/OS korumaları · güvenli derleme hattı · kod gizlemeye giriş · proje |

<!-- Konuşma notu: Bu hafta kodun kendisini sağlamlaştırıyoruz. Öğrenciler C'yi biliyor ama güvenlik terimlerini bilmiyor varsayıyoruz; her terimi tanımlayacağız. Demolar code/week-04 altında. -->

---

<!-- _class: yogun -->

# Kısa tarihçe — bellek hataları ve savunmaların yarışı

- **1988** — **Morris Worm** tampon taşmasını dünyaya duyurur
- **1996** — *Smashing the Stack for Fun and Profit* sömürüyü herkese öğretir
- **1998 → 2004** — **kanarya** (StackGuard) · **ASLR** (PaX) · **DEP/NX** · FORTIFY
- **2012–13** — **AddressSanitizer** ve **fuzzing** (AFL) hataları otomatik yakalar

> Ders bu yarışı izler: hatayı yaz → araç yakalasın → derleyici/OS korusun.

---


# Bu hafta nereye oturuyor?

- **1–3. hafta:** güvenlik ilkeleri, tehdit modeli, kripto.
- **Bu hafta (4):** C/C++ kodunu **sağlamlaştırmak** — hatasız yaz, hata kaçarsa zararı sınırla, okumayı zorlaştır.
- **5. hafta:** aynı konu Java/yorumlanan diller.

---

# Öğrenme çıktısı

Bu hafta **ÖÇ.3** (ikili uygulama korumaları) üstünedir.

Sonunda yapabileceğiniz:

- Yaygın C/C++ zafiyetlerini tanımak ve düzeltmek
- Statik analiz, sanitizer, fuzzing kullanmak
- Derleyici/OS korumalarını açmak ve doğrulamak

---

# Üç katman, doğru sıra

Kod sağlamlaştırma üç katmandır. Sıra önemli:

1. **Önce hatasız kod** (güvenli kodlama)
2. **Sonra zararı sınırla** (derleyici/OS korumaları)
3. **En son okumayı zorlaştır** (gizleme)

> ⚠️ Gizleme, hatayı **düzeltmez.**

---

# Neden bu sıra?

- Hatalı koda koruma eklemek, çürük temele boya çekmek gibidir.
- Önce hatayı **kaldır**; sonra kaçanı **yakala**; en son tersine mühendisliği **yavaşlat**.
- Bu hafta üçünü de göreceğiz, bu sırayla.

---

<!-- _class: bolum -->

# 0. Temel kavramlar (sıfırdan)

<!-- Konuşma notu: C sözdizimini bildiklerini varsayıyoruz ama bellek/güvenlik kavramlarını sıfırdan tanımlıyoruz. -->

---

# Bellek: yığın ve öbek

- **Yığın (stack):** fonksiyon çağrılarının yerel değişkenlerini tuttuğu, otomatik yönetilen bellek.
- **Öbek (heap):** `malloc`/`new` ile **elle** ayrılan, `free`/`delete` ile bırakılan bellek.

İkisi de taşma ve hata kaynağı olabilir.

---

# İşaretçi (pointer)

- **İşaretçi:** bir bellek **adresini** tutan değişken.
- `p` bir adres; `*p` o adresteki değer.
- Yanlış adres → çökme ya da yanlış veri.

---

# Tampon (buffer) ve taşma

- **Tampon:** ardışık bellek bloğu (ör. `char ad[16]`).
- **Taşma (buffer overflow):** tampona **sığmayan** kadar veri yazmak → komşu belleği bozar.
- Klasik ve tehlikeli bir hata sınıfı.

---

# Neden taşma tehlikeli?

- Komşu değişkenleri, dönüş adresini bozabilir.
- Saldırgan bunu **denetim akışını** ele geçirmek için kullanabilir.
- Bu yüzden **sınır denetimi** hayatidir.

---

# Tanımsız davranış (UB) nedir?

- **Tanımsız davranış (undefined behavior):** C/C++ standardının "sonucu belirsiz" dediği durumlar.
- Örnek: işaretli tamsayı taşması, dizinin dışına erişim.
- Derleyici bunu **istediği gibi** ele alabilir — hatta ilgili denetimi **silebilir**.

---

# Derleyici bayrağı (flag)

- **Bayrak:** derleyiciye verilen seçenek.
- Örnek: `-O2` (optimizasyon), `-Wall` (uyarılar), `-fsanitize=address`.
- Doğru bayraklar birçok hatayı **derleme anında** yakalar.

---

# Uyarı (warning) vs hata (error)

- **Hata:** derleme durur.
- **Uyarı:** derleme sürer ama bir sorun bildirilir.
- Kural: uyarıları **hataya çevir** (`-Werror`) — görmezden gelinen uyarı, gelecekteki açıktır.

---

# CWE nedir?

- **CWE (Common Weakness Enumeration):** yazılım zayıflıklarının numaralı kataloğu.
- Örnek: CWE-416 = "use-after-free".
- Bir bulguyu CWE numarasıyla adlandırmak, onu **aranabilir** yapar.

---

# CERT nedir?

- **SEI CERT C/C++:** güvenli kodlamanın **kural kitabı**.
- Her kural: hatalı örnek + uyumlu çözüm + risk + CWE bağı.
- Örnek: `STR31-C` = dizgeye yeterli yer ayır.

---

# Statik vs dinamik analiz

- **Statik analiz:** kodu **çalıştırmadan** inceleme (derleyici uyarıları, clang-tidy).
- **Dinamik analiz:** kodu **çalıştırırken** izleme (sanitizer'lar).
- İkisi birbirini tamamlar.

---

# Sanitizer nedir?

- **Sanitizer:** programı çalıştırırken bellek/UB hatalarını yakalayan derleyici aracı.
- Örnek: **ASan** (adres), **UBSan** (tanımsız davranış).
- Sürüme gitmez; **test/CI**'da kullanılır.

---

# Fuzzing nedir?

- **Fuzzing:** programa **rastgele/beklenmeyen** girdiler verip çökme aramak.
- İnsanın düşünmediği girdileri bulur.
- Sanitizer'la birlikte çok güçlü.

---

# ASLR, NX/DEP, kanarya

- **ASLR:** bellek adreslerini **rastgeleleştirir** (saldırgan adresi tahmin edemesin).
- **NX/DEP:** veri bölgesindeki baytları **kod olarak çalıştırmayı** engeller.
- **Yığın kanaryası:** dönüş adresinden önce bir **nöbetçi değer**; taşma onu bozarsa program durur.

---

# Beyaz kutu saldırgan (hatırlatma)

- Programa sahip saldırgan (1. hafta MATE).
- Dizgeleri okur, fonksiyonları adıyla bulur, denetimi atlar.
- Gizleme bölümünde (bugün sonunda) buna döneceğiz.

---

# CI (sürekli entegrasyon)

- **CI (Continuous Integration):** her kod değişikliğinde otomatik derleme + test çalıştıran sistem.
- Güvenlik araçlarını (uyarı, statik analiz, sanitizer, fuzzing) **her birleştirmede** koşturur.

---

# Şimdi hazırız

Terimler:

yığın/öbek · işaretçi · tampon/taşma · UB · bayrak · uyarı/hata · CWE · CERT · statik/dinamik · sanitizer · fuzzing · ASLR/NX/kanarya · CI

Şimdi: kod sağlamlaştırmanın katmanları.

---

<!-- _class: bolum -->

# 1. Katmanlar ve SEI CERT

---

# Katman 2 · Güvenli kodlama

- **Soru:** kodumda hata var mı?
- **Araçlar:** CERT kuralları, sanitizer, fuzzing.
- **Amaç:** hatayı en baştan **yazmamak**.

---

# Katman 3 · Derleyici/OS

- **Soru:** hata kaçarsa sömürü zor mu?
- **Araçlar:** kanarya, FORTIFY, ASLR, NX, RELRO, CFI.
- **Amaç:** kalan hatanın **istismarını** pahalı kılmak.

---

# Katman 4 · Gizleme

- **Soru:** kodu okuyan anlıyor mu?
- **Araçlar:** sembol/dize gizleme, günlük kaldırma, düzleştirme.
- **Amaç:** tersine mühendisliği **yavaşlatmak**.

---

# Sahadan: şema gereksinimleri

Sertifikalı bir üründe:

- "Yaygın zafiyetler ele alınmalı: hassas veri, enjeksiyon, taşma, dile özgü zayıflıklar"
- "Savunmacı programlama **kodun tamamında tutarlı**"
- "Statik ve dinamik tersine mühendisliğe karşı koruma"

➡️ Yalnız native tarafta **18 sağlamlaştırma önlemi**.

---

# SEI CERT: bir kural neye benzer?

Her CERT kuralının parçaları:

- **Kimlik:** `STR31-C`, `MEM50-CPP`
- **Başlık:** tek cümle
- **Hatalı örnek** ve **uyumlu çözüm**
- **Risk düzeyi** (L1/L2/L3) ve **CWE** bağı

---

# Kural mı, öneri mi?

- **Kural (rule):** ihlali bir **zafiyettir**, denetlenebilir.
- **Öneri (recommendation):** iyi uygulama.
- İncelemeye **L1** (en yüksek risk) kurallarından başla.

---

# Risk düzeyi nasıl belirlenir?

Risk = **önem × olasılık × düzeltme maliyeti**.

- **L1:** yüksek risk, önce bunlar.
- **L2 / L3:** giderek düşer.

---

<!-- _class: yogun -->

# CERT kategorileri (1)

| Kısaltma | Kategori | Örnek |
| --- | --- | --- |
| INT | Tamsayılar | INT32-C: işaretli taşmaya izin verme |
| ARR/STR | Dizi/dizge | STR31-C: yeterli yer ayır |
| MEM | Bellek | MEM30-C: bırakılmış belleğe erişme |
| FIO | Dosya G/Ç | FIO30-C: girdiyi biçim dizgesinden dışla |

---

<!-- _class: yogun -->

# CERT kategorileri (2)

| Kısaltma | Kategori | Örnek |
| --- | --- | --- |
| ENV | Ortam | ENV33-C: `system()` çağırma |
| SIG | Sinyaller | SIG30-C: işleyicide yalnız güvenli fn. |
| ERR | Hata işleme | ERR33-C: kütüphane hatasını algıla |
| CON/MSC | Eşzamanlılık/çeşitli | CON43-C, MSC32-C |

C++: MEM50-CPP, CTR50-CPP, STR50-CPP, EXP53-CPP, ERR50-CPP.

---

# Otomatik CERT denetimi

- Uyarılar: `-Wall -Wextra -Wformat=2 -Wconversion`
- `clang-tidy cert-*`
- `cppcheck --addon=cert`
- MSVC `/analyze`

> Değerlendirici önce bu taramayı çalıştırır, sonra elle okur.

---

<!-- _class: bolum -->

# Girdi doğrulama

---

# Girdi nereden gelir?

Sandığınızdan çok yerden. Ve **hepsi güvenilmez**:

- Komut satırı, ortam değişkenleri
- Dosya, ağ
- IPC (aynı makinedeki başka süreç)
- Veritabanı, kütüphane arayüzü (JNI)

---

# Sık unutulan girdiler

- `argv[0]` bile saldırganın olabilir; `PATH`, `LANG`.
- Dosya biçimindeki **uzunluk alanları**.
- Ağ: "16 bayt" der, 1 bayt gönderir.
- "Kendi verimiz" sonradan değişmiş olabilir.

---

# Girdi doğrulamanın beş ilkesi

1. **Beyaz liste** (izin verilenleri say), kara liste değil.
2. Önce **kanonikleştir**, sonra doğrula.
3. **Uzunluk → tür → aralık → biçim** sırasıyla.
4. **Güven sınırında**, en erken noktada.
5. **Reddet**, "temizleyip" kullanma.

---

# İlke 1 · Beyaz liste

- **Kara liste:** "şunlar yasak" — hep bir şey unutulur.
- **Beyaz liste:** "yalnız şunlar serbest" — güvenli varsayılan.

Örnek: kullanıcı adı yalnız `[a-z0-9_]` olsun.

---

# İlke 2 · Kanonikleştir

- Aynı şeyin farklı yazımları: `/tmp/../etc`, `%2e%2e/`.
- Önce **tek biçime** indir (kanonikleştir), sonra denetle.
- Yoksa denetim atlatılır.

---

# İlke 3 · `atoi` değil `strtol`

```c
errno = 0;
long v = strtol(s, &son, 10);
if (son == s)        return -1;  /* rakam yok */
if (*son != '\0')    return -1;  /* "12abc" */
if (errno == ERANGE) return -1;  /* taştı */
if (v < en_az || v > en_cok) return -1;  /* iş kuralı */
```

---

# Neden `atoi` tehlikeli?

- `atoi("abc")` = 0 (hata sessiz)
- `atoi("99999999999")` = **tanımsız** (taşma)
- `atoi("12abc")` = 12 (fazlalık yok sayılır)

> `strtol` her hatayı **size bildirir**; `atoi` bildirmez.

---

# İlke 3 · uzunluk önekli kayıt

```c
if (kalan < 3) return -1;                  /* başlık yok */
uint16_t uzunluk = tampon[1] << 8 | tampon[2];
if (uzunluk > kalan - 3)      return -1;   /* KAYNAK: bildirilen > gelen */
if (uzunluk > sizeof k->veri) return -1;   /* HEDEF: sığmıyor */
memcpy(k->veri, tampon + 3, uzunluk);
```

---

# İki ayrı denetim, doğru sıra

- **Kaynak denetimi:** bildirilen uzunluk, gelen veriden büyük mü?
- **Hedef denetimi:** hedef tampona sığıyor mu?
- Sıra: `kalan - 3` **sarmasın** diye önce `kalan < 3`.
- Sahada: JNI'den gelen her dizi native tarafta **yeniden** doğrulanır.

---

# CERT çifti · STR31-C

```c
strcpy(kopya, ad);                              /* HATALI */
int n = snprintf(kopya, sizeof kopya, "%s", ad);/* UYUMLU */
if (n < 0 || (size_t)n >= sizeof kopya) { /* kesildi */ }
```

`strcpy` sınır bilmez; `snprintf` boyutu bilir ve **kesilmeyi** bildirir.

---

# CERT çifti · INT30-C

```c
size_t kalan = toplam - okunan;   /* HATALI: okunan>toplam → dev sayı */
if (okunan > toplam) return HATA; /* UYUMLU: önce sırala */
size_t kalan = toplam - okunan;
```

İşaretsiz çıkarma **sarar**; önce mantığı denetle.

---

# CERT çifti · MEM30-C

```c
for (d = bas; d; d = d->sonraki) free(d);       /* HATALI */
while (d) { Dugum *s = d->sonraki; free(d); d = s; }  /* UYUMLU */
```

`free(d)`'den sonra `d->sonraki` okumak = bırakılmış belleğe erişim.

---

# CERT çifti · ERR33-C

```c
FILE *f = fopen(yol,"rb"); fread(t,1,n,f);       /* HATALI */
if (!f) return HATA;
if (fread(t,1,n,f) < n && ferror(f)) return HATA;/* UYUMLU */
```

Her dönüş değerini **denetle**; `fopen` NULL dönebilir.

---

# Kural: bulguyu kimliğe bağla

Her bulguyu bir CERT kimliğiyle eşleştir:

> "Bu satır MEM30-C ihlali (CWE-416)."

Böylece bulgu **nesnel** ve **aranabilir** olur.

---

# Bölüm 1 — kısa sınama

1. Üç katman ve doğru sıra?
2. Kural ile öneri farkı?
3. `atoi` neden `strtol`'a göre tehlikeli?

<!-- Konuşma notu: Sonra biçim dizisi açığı. -->

---

# Bölüm 1 — cevaplar

1. **Sıra:** güvenli kod (kaynak) → **derleyici/araç** korumaları → **OS/çalışma zamanı** korumaları. Önce doğru yaz, sonra sertleştir, sonra çalışma anında savun.
2. **Kural** her zaman uygulanır, ihlali kusurdur; **öneri** bağlama göre iyi uygulamadır.
3. `atoi` hatayı **bildirmez** (taşma/geçersiz girdide tanımsız/0); `strtol` `endptr`+`ERANGE` ile **hatayı ve sınırı** kontrol ettirir.

---


<!-- _class: bolum -->

# 2. Biçim dizisi açığı

---

# Sorun · `printf(girdi)`

```c
printf(kullanici_girdisi);        /* HATALI */
printf("%s", kullanici_girdisi);  /* DOĞRU */
```

İlkinde kullanıcı girdisi bir **biçim dizgesi** olarak yorumlanır.

---

# Neden tehlikeli?

`printf` biçim dizgesindeki `%` belirteçlerini **komut** sayar.

Kullanıcı `%x`, `%s`, `%n` gönderirse programa iş yaptırır.

---

# Belirteç · `%x`, `%p`

- Yığındaki değerleri **okur** ve yazdırır.
- → **bilgi sızıntısı** (adresler, gizli değerler).
- ASLR'yi zayıflatır (adres sızarsa).

---

# Belirteç · `%s`

- Yığındaki bir değeri **işaretçi** sanar ve o adresteki dizgeyi okur.
- Rastgele adres → çökme ya da bellek okuma.

---

# Belirteç · `%n`

- Şimdiye kadar yazılan karakter sayısını bir adrese **yazar**.
- → belleğe **yazma** → bozulma, denetim ele geçirme.
- En tehlikelisi.

---

# Aynı hata başka yerlerde

Sadece `printf` değil:

`syslog`, `fprintf`, `snprintf`, `err`/`warn` — hepsi biçim dizgesi alır.

Kural: biçim dizgesi **her zaman sabit** (FIO30-C).

---

<!-- _class: yogun -->

# Demo 1 — biçim dizisi

`code/week-04/01-format-string` · CWE-134

| Adım | Ne görülür? |
| --- | --- |
| 0 | GCC `-Wformat-security` uyarır; MSVC `/analyze` yakalar |
| 2 `%x.%x…` | Yığın dökülür, **gizli (sentetik) değer** görünür |
| 3 `AAAA%n` | Linux korumasız çöker; Windows CRT `%n`'i reddeder |
| 4 | `_FORTIFY_SOURCE`: `%n in writable segment` |
| 5 | Belirteçler yalnız metin olarak görünür |

---

# Düzeltme · katman katman

1. Biçim dizgesi hep **sabit** (FIO30-C).
2. Uyarı: `-Wformat -Wformat-security -Werror=format-security`.
3. Kendi fonksiyonunuzu derleyiciye **denetlettirin**:

```c
void gunluk_yaz(int duzey, const char *bicim, ...)
    __attribute__((format(printf, 2, 3)));
```

4. Çalışma anı: `_FORTIFY_SOURCE=2`; MS CRT `%n` kapalı.

---

<!-- _class: bolum -->

# 3. Bellek: use-after-free

---

# UAF nedir? · adım 1

- Bir nesne öbekte.
- **İki işaretçi** aynı nesneyi gösteriyor.

---

# UAF · adım 2

- Biri `free` ediyor.
- Diğeri hâlâ o adresi tutuyor → **askıda (dangling)** işaretçi.

---

# UAF · adım 3

- Ayırıcı aynı bloğu **başka nesneye** veriyor.
- Askıdaki işaretçi artık **yabancı veriyi** okur/yazar.
- Nesnede **fonksiyon işaretçisi** varsa (C++ sanal tablo) risk büyür.

---

# UAF neden çok yaygın?

Tarayıcı/OS güncellemelerindeki "bellek bozulması düzeltildi" notlarının büyük kısmı bu sınıftır.

Karmaşık sahiplik → askıda işaretçi.

---

<!-- _class: yogun -->

# Demo 2 — UAF ve çift bırakma

`code/week-04/02-kullanim-sonrasi` · CWE-416/415 · MEM30-C

| Adım | Ne görülür? |
| --- | --- |
| 1 | Serbest blok dolar → rol `user` → `admin` |
| 2 ASan | `heap-use-after-free` + yerler |
| 3 | Çift `free` → tanımsız davranış |
| 4 ASan | `attempting double-free` |
| 5 | `free` + `NULL`, tek sahip → güvenli |

---

# ASan raporu · üç yığın izi

```text
ERROR: heap-use-after-free
  #0 oturum_kullan uaf.c:48   <- 1. KULLANIM
freed here:
  #1 oturum_kapat  uaf.c:31   <- 2. SERBEST BIRAKMA
allocated here:
  #1 oturum_ac     uaf.c:22   <- 3. AYIRMA
```

Düzeltme çoğunlukla **2. konumda**: sahiplik kararı orada yanlış.

---

# Çözüm · C tarafı

- `free`'den sonra işaretçiyi **`NULL`** yap.
- **Tek sahip**, tek bırakma noktası belirle.
- Sahiplik kuralını yaz: "bu belleği kim bırakır?"

---

<!-- _class: yogun -->

# Çözüm · C++ akıllı işaretçiler

| İhtiyaç | C++ |
| --- | --- |
| Tek sahip | `std::unique_ptr` |
| Paylaşılan | `std::shared_ptr` |
| Sahipsiz gözlem | `std::weak_ptr` → `lock()` |
| Dizi | `std::vector`, `std::array` |

```cpp
if (auto o = onbellek.lock()) kullan(*o);  // yoksa eski belleğe erişilmez
```

⚠️ `get()` ham işaretçi; `vector` büyüyünce yineleyici geçersizleşir.

---

<!-- _class: bolum -->

# Tamsayılar ve UB

---

# Dört tamsayı hatası

| Hata | Örnek | Sonuç |
| --- | --- | --- |
| İşaretsiz sarma | `0u - 1` = 4.294.967.295 | Mantık hatası |
| İşaretli taşma | `INT_MAX + 1` | **Tanımsız** |
| Dönüşüm kaybı | `long long`→`int` | Kesilme |
| Kaydırma | `1 << 31` | Tanımsız |

---

# Neden önemli? · çarpım taşması

```c
uint32_t boyut = adet * 4;   /* adet = 0x40000001 → boyut = 4 */
dizi = malloc(boyut);        /* küçük blok */
/* döngü adet kez yazar → öbek taşması */
```

Küçük ayrılan bloğa çok yazmak = taşma.

---

# UB · derleyici denetimi silebilir

```c
if (x + 100 < x)   /* "taşarsa küçülür" sanısı */
    return -1;     /* işaretli taşma UB → derleyici bu dalı SİLEBİLİR */
```

- `-O0`'da "çalışır", `-O2`'de denetim **yok olur**.
- UB'ye güvenilmez.

---

# Doğru: önce denetle

```c
if ((b > 0 && a > INT_MAX - b) ||
    (b < 0 && a < INT_MIN - b)) return false;   /* taşma öncesi */
if (__builtin_mul_overflow(a, b, &sonuc)) return false;  /* GCC/Clang */
/* C23: <stdckdint.h> ckd_add/ckd_mul · MSVC: <intsafe.h> */
```

Taşmayı **olmadan önce** yakala.

---

<!-- _class: yogun -->

# Demo 3 — UB ve UBSan

`code/week-04/03-tanimsiz-davranis` · CWE-190/758

- İşaretli taşma, geçersiz kaydırma, hizasız erişim
- x86'da çoğu **sessizce** yanlış sonuç
- `-fsanitize=undefined` → `signed integer overflow: 2147483647 + 1 ...`
- Windows: UBSan yok → `/RTC`, `/analyze`, CERT

⚠️ `-fwrapv` mantık hatasını **gizler**; tanı için kullanma.

---

<!-- _class: bolum -->

# Hata işleme ve sinyaller

---

# Denetlenmeyen dönüş değeri

| Çağrı | Denetlenmezse |
| --- | --- |
| `malloc` | NULL'a yazma |
| `setresuid` | Yetkili kalır |
| `RAND_bytes` | "Rastgele" anahtar sıfır |
| `EVP_DecryptFinal_ex` | Kurcalanmış veri doğrulanmış sanılır |

---

# Hata işleme kuralları

1. Her dönüşü denetle (ERR33-C); `[[nodiscard]]`.
2. Hatada **güvenli duruma** dön (`goto temizle`) — **fail-closed**.
3. İleti ipucu vermesin: "kullanıcı yok" ≠ "parola yanlış".

---

# Sahadan: opak dönüş değerleri

- Native fonksiyonlar ayrıntılı **hata kodu döndürmez**.
- Yalnız başarılı/başarısız, üstelik **opak** (9. hafta).
- Ayrıntılı kod = saldırgana "hangi denetimde takıldın" haritası.
- Tanı için ayrı, güvenli kanal → ödünleşim kaydı.

---

# Sinyal işleyici · kural

```c
static volatile sig_atomic_t durdur = 0;
static void isleyici(int s){ (void)s; durdur = 1; }  /* YALNIZ bayrak */
```

- İşleyicide `printf`, `malloc`, `free` **yok** (SIG30-C).
- Eşzamansız-güvenli olmayan fonksiyon çağırma.
- `signal()` yerine `sigaction()`.

---

# Gerçek olay: regreSSHion

- 2024 CVE-2024-6387: zaman aşımı **sinyal işleyicisi** güvensiz bir günlük fonksiyonu çağırıyordu.
- Sonuç: uzaktan kod çalıştırma riski.
- Ders: işleyicide yalnız bayrak set et.

---

# Bölüm 2–3 — kısa sınama

1. `%n` neden en tehlikelisi?
2. UAF raporundaki üç iz? Düzeltme hangisinde?
3. `if (x+100 < x)` neden silinebilir?
4. Sinyal işleyicide neden `printf` yok?

<!-- Konuşma notu: Ara sonrası statik analiz, sanitizer, fuzzing. -->

---

# Bölüm 2–3 — cevaplar

1. `%n` biçim belirtecinin yazdığı **bayt sayısını belleğe YAZAR** → saldırgan seçtiği adrese yazıp akışı ele geçirebilir.
2. **allocated-by · freed-by · use-here.** Düzeltme **freed↔use** arasında: `free` sonrası işaretçiyi `NULL` yap / yaşam süresini düzelt.
3. İmzalı taşma **tanımsız davranıştır**; derleyici "taşma olmaz" varsayar → koşul hep `false` → **siler**. Kontrolü `__builtin_add_overflow` ile yapın.
4. `printf` **async-signal-safe değil**; işleyicide yeniden girişte kilit/durum bozulur → kilitlenme/çökme. Yalnız `write` gibi güvenli çağrılar.

---


<!-- _class: bolum -->

# 4. Statik analiz, sanitizer, fuzzing

---

# Statik analiz nedir? (hatırlatma)

Kodu **çalıştırmadan** inceleyip hata arama.

Avantaj: çalışmayan yolları da görür.
Dezavantaj: **yanlış alarm** üretir.

---

<!-- _class: yogun -->

# Statik analiz · katman katman

| Düzey | Araç | Bulduğu |
| --- | --- | --- |
| Uyarılar | `-Wall -Wextra -Wconversion` | Dönüşüm, biçim |
| Analizci | `-fanalyzer`, `clang --analyze`, `/analyze` | NULL, sızıntı |
| Kural | `clang-tidy cert-*`, `cppcheck` | CERT ihlali |
| Anlamsal | CodeQL, Semgrep | Veri akışı |
| Ticari | Coverity, Klocwork | Derin analiz |

---

# Kirli veri: kaynak → hedef

```text
kaynak: recv(sock, buf, ...)
        len = buf[1]<<8 | buf[2]     (doğrulama yok)
hedef:  memcpy(out, buf+3, len)  → BULGU: CWE-787
```

Araç, **doğrulanmamış** verinin tehlikeli bir yere aktığını görür.

---

# Yanlış alarmla yaşamak

1. Önce **yüksek güvenilirlikli** kurallar.
2. Her bastırma **gerekçeli**: `// NOLINT(cert-err33-c): neden`.
3. Yeni kodda **sıfır uyarı** (CI zorlar).

> Değerlendirici geliştiricinin kendi tarama raporunu ister.

---

# Sanitizer nedir? (hatırlatma)

Programı **çalıştırırken** bellek/UB hatalarını yakalayan araç.

Yanlış alarm neredeyse **yok**; ama yalnız **çalışan yoldaki** hatayı bulur.

→ test + fuzzing ile birlikte.

---

<!-- _class: yogun -->

# Sanitizer ailesi

| Sanitizer | Bulduğu | Bayrak |
| --- | --- | --- |
| **ASan** | Taşma, UAF, çift bırakma | `-fsanitize=address` |
| **LSan** | Sızıntı | ASan ile |
| **UBSan** | Taşma, kaydırma, NULL | `-fsanitize=undefined` |
| **MSan** | İlklendirilmemiş okuma | `-fsanitize=memory` |
| **TSan** | Veri yarışı | `-fsanitize=thread` |

---

# ASan nasıl çalışır? · gölge bellek

- Her 8 bayt için 1 **gölge bayt**: ne kadarı geçerli?
- Dizilerin önüne/arkasına **zehirli bölge** (redzone).
- Serbest bloklar **karantinada** bekler.
- Her erişimden önce gölge denetimi.

---

# ASan'ın kör noktası

```c
struct { char ad[8]; long yetki; } k;
strcpy(k.ad, uzun_girdi);   /* ad → yetki taşar */
```

Aynı yapının **içinde** alandan alana taşma → arada zehirli bölge yok → ASan **görmez** (1. hafta Demo 3).

---

# Sanitizer sürüme gitmez

```bash
gcc -g -O1 -fno-omit-frame-pointer \
    -fsanitize=address,undefined p.c -o p_test
```

- Yavaşlatır (~2×), bellek kullanır.
- Yalnız **test/CI**'da; sürümde kapalı.

---

# Fuzzing nedir? · kapsam güdümlü

```text
tohum girdiler → değiştir (bit çevir, sil, ekle)
      ▲                │
      │                ▼
 yeni yol? ← çalıştır (sanitizer açık) → çökme? → kaydet
```

Yeni kod yolu açan girdi **saklanır** ve üzerinde çalışılır.

---

# Fuzzing ne bulur?

- Sihirli baytları, doğru uzunluk alanını **kendiliğinden** bulur.
- İnsanın düşünmediği girdileri.
- Araçlar: libFuzzer, AFL++, honggfuzz, OSS-Fuzz (on binlerce hata).

---

# Fuzz hedefi yazmak

```c
int LLVMFuzzerTestOneInput(const uint8_t *veri, size_t boyut) {
    ayristir(veri, boyut);   /* sınanacak fonksiyon */
    return 0;
}
```

```bash
clang -g -O1 -fsanitize=fuzzer,address fuzz.c ayristir.c -o f
./f corpus/ -max_total_time=10
```

---

# İyi fuzz hedefi

Dört özellik:

- **Hızlı** (ağ/disk yok)
- **Deterministik** (aynı girdi → aynı sonuç)
- **Durumsuz** (önceki çağrıdan etkilenmez)
- **Tek iş** (bir fonksiyonu sınar)

---

<!-- _class: yogun -->

# Demo 4 — fuzzing ile hata bulmak

`code/week-04/04-fuzzing` · CWE-125/787

| Adım | Ne olur? |
| --- | --- |
| 1 | `tohum/normal.bin` sorunsuz |
| 2 | libFuzzer ≤ 10 sn → çökerten girdi |
| 3 | ASan ile yeniden oynat → tam rapor |
| 4 | Düzeltilmiş sürüm → çökme yok |
| 5 | `cokerten.bin` güvenle reddedilir |

> "Şu fonksiyon şu süre fuzzlandı" = güçlü kanıt (S16).

---

# Bölüm 4 — kısa sınama

1. Statik ve dinamik analizin farkı?
2. ASan hangi taşmayı göremez?
3. İyi fuzz hedefinin dört özelliği?

<!-- Konuşma notu: Sonra derleyici ve OS korumaları. -->

---

# Bölüm 4 — cevaplar

1. **Statik:** kodu çalıştırmadan tüm yolları inceler (yanlış pozitif olabilir). **Dinamik:** çalıştırırken yalnız yürütülen yolda **gerçek** hatayı gözler.
2. ASan **redzone** koyduğu yerleri görür; bir nesnenin **içindeki** alanlar arası taşmayı ve **hiç çalışmayan** yolları göremez.
3. **Hızlı**, **deterministik**, **kendine yeterli** (dış duruma bağlı değil), **dar bir girdi yüzeyi** işleyen; çökmede net başarısızlık veren hedef.

---


<!-- _class: bolum -->

# 5. Derleyici ve OS korumaları

<!-- Konuşma notu: Bunlar "hata kaçarsa zararı sınırla" katmanı. Hiçbiri hatayı kaldırmaz; istismarı zorlaştırır. -->

---

# Katman 3 · fikir

Hata kaçtı diyelim.

- Sömürüyü **pahalı** kılan otomatik korumalar var.
- Çoğu bir **derleme bayrağıyla** açılır.
- Bedava değil ama ucuz.

---

# Yığın kanaryası

- Dönüş adresinden önce bir **nöbetçi değer** konur.
- Taşma bu değeri bozarsa, dönüşten önce fark edilir ve program **durur**.
- `-fstack-protector-strong` / MSVC `/GS`.

---

# Yığın taşması ve kanarya — şema

<svg viewBox="0 0 900 300" style="width:92%;height:auto;display:block;margin:2px auto" font-family="sans-serif">
  <text x="450" y="24" text-anchor="middle" font-size="16" fill="#555">Taşma tampondan aşağı, dönüş adresine doğru yazar →</text>
  <rect x="120" y="46" width="300" height="44" fill="#e8f6f7" stroke="#0a9396"/><text x="270" y="74" text-anchor="middle" font-size="16">char buf[8] (yerel tampon)</text>
  <rect x="120" y="90" width="300" height="44" fill="#fff3cd" stroke="#b5651d" stroke-width="2"/><text x="270" y="118" text-anchor="middle" font-size="15" font-weight="bold" fill="#8a4b12">KANARYA (rastgele nöbetçi)</text>
  <rect x="120" y="134" width="300" height="44" fill="#eef" stroke="#4054b2"/><text x="270" y="162" text-anchor="middle" font-size="15">saved rbp</text>
  <rect x="120" y="178" width="300" height="44" fill="#fde8e8" stroke="#c0392b" stroke-width="2"/><text x="270" y="206" text-anchor="middle" font-size="15" font-weight="bold" fill="#a01f1f">DÖNÜŞ ADRESİ</text>
  <line x1="470" y1="216" x2="470" y2="64" stroke="#c0392b" stroke-width="4" marker-end="url(#up4)"/>
  <text x="560" y="110" font-size="15" fill="#333">Dönüş adresine ulaşmak</text>
  <text x="560" y="134" font-size="15" fill="#333">için önce</text>
  <text x="560" y="158" font-size="15" fill="#8a4b12" font-weight="bold">KANARYA ezilmeli.</text>
  <text x="560" y="188" font-size="15" fill="#333">Dönüşte kanarya bozuksa</text>
  <text x="560" y="212" font-size="15" fill="#2e7d32" font-weight="bold">program durur.</text>
  <text x="450" y="268" text-anchor="middle" font-size="14" fill="#777">Durdurmaz: hedefli yazma · heap taşması · bilgi sızıntısı</text>
  <defs><marker id="up4" markerWidth="12" markerHeight="12" refX="4" refY="9" orient="auto"><path d="M4,0 L8,9 L0,9 Z" fill="#c0392b"/></marker></defs>
</svg>

---


# _FORTIFY_SOURCE

- Boyutu bilinen tampona fazla yazan **kütüphane çağrılarını** yakalar.
- `-D_FORTIFY_SOURCE=2` (+ en az `-O1`).
- Kendi döngülerinizi **korumaz**.

---

# PIE + ASLR

- **ASLR:** adresleri rastgeleleştirir.
- **PIE:** programın da rastgele yüklenmesini sağlar.
- `-fPIE -pie` / `/DYNAMICBASE /HIGHENTROPYVA`.

---

# DEP/NX ve RELRO

- **DEP/NX:** veri bölgesini çalıştırılamaz yapar (varsayılan).
- **RELRO:** GOT gibi tabloları salt-okunur yapar → `-Wl,-z,relro,-z,now`.

---

# CFI / CFG ve gölge yığın

- **CFI/CFG:** dolaylı çağrıların yalnız **geçerli** hedeflere gitmesini denetler.
- `-fcf-protection`, `-fsanitize=cfi` / `/guard:cf`.
- **Gölge yığın:** dönüş adreslerinin ikinci kopyası (CET).

---

<!-- _class: yogun -->

# Korumalar · tek tablo

| Koruma | GCC/Clang | MSVC |
| --- | --- | --- |
| Kanarya | `-fstack-protector-strong` | `/GS` |
| FORTIFY | `-D_FORTIFY_SOURCE=2` | Güvenli CRT |
| PIE/ASLR | `-fPIE -pie` | `/DYNAMICBASE` |
| NX | varsayılan | `/NXCOMPAT` |
| RELRO | `-Wl,-z,relro,-z,now` | — |
| CFI | `-fcf-protection` | `/guard:cf` |

---

# ⚠️ Her koruma sınırlıdır

| Koruma | Durdurur | Durdurmaz |
| --- | --- | --- |
| Kanarya | Dönüş adresine taşma | Öbek taşması, sızan kanarya |
| FORTIFY | Kütüphane çağrısı taşması | Kendi döngüleriniz |
| ASLR | Sabit adres varsayımı | **Adres sızıntısı** |
| NX | Veri bölgesinde kod | Kod yeniden kullanımı (ROP) |

---

# Ana kural

> Her koruma bir **tekniği** zorlaştırır, bir **hata sınıfını** kaldırmaz.

Mantık hatasına **hiçbiri** yetmez → önce güvenli kodlama.

---

<!-- _class: yogun -->

# Demo 5 — korumaları açıp kapatmak

`code/week-04/05-derleyici-korumalari` · CWE-121

- Aynı taşma: `giris_zayif` (kapalı) vs `giris_sert` (açık).
- Sert: `*** stack smashing detected ***` / Windows `0xC0000409`.
- Zayıf: sessiz bozulma ya da çökme.

```bash
readelf -h p | grep Type          # DYN = PIE
readelf -d p | grep BIND_NOW      # tam RELRO
readelf -s p | grep __stack_chk   # kanarya
```

---

# Önerilen sürüm bayrakları

**GCC/Clang:**

`-O2 -D_FORTIFY_SOURCE=2 -fstack-protector-strong -fPIE -pie -Wl,-z,relro,-z,now -fcf-protection -Wall -Wextra -Wformat=2 -Werror=format-security`

**MSVC:**

`/O2 /GS /sdl /guard:cf /DYNAMICBASE /HIGHENTROPYVA /NXCOMPAT /CETCOMPAT /W4`

---

# Koruma tablosu = kanıt

- Değerlendirici her ikili ve `.so` için **koruma tablosu** çıkarır.
- Kapalı koruma bir **bulgudur**; gerekçesi ödünleşim kaydında olmalı.
- Şema: uygulama, korumaların açık olduğunu **kendisi** de denetleyebilir.

---

# Güvenli derleme hattı (CI)

```text
PR → derle (-Werror) → statik analiz → test (ASan+UBSan)
   → kısa fuzzing → sürüm (korumalar açık)
   → ikili denetimi (checksec, strings) → birleştir
```

Her hatalı adım birleştirmeyi **durdurur**.

---

<!-- _class: yogun -->

# CI · başarısızlık ölçütü

| Aşama | Başarısızlık |
| --- | --- |
| Derleme | Tek uyarı |
| Sanitizer'lı test | Herhangi bir rapor |
| Fuzzing | Yeni çökme (eski corpus = regresyon) |
| İkili denetimi | Günlük dizgesi, sembol, kapalı koruma |

---

<!-- _class: yogun -->

# Dersin CMake kipleri

| Kip | Bayraklar |
| --- | --- |
| `korumasiz` | `-O0` |
| `optimize` | `-O2` |
| `asan` | `-O1 -fsanitize=address` |
| `denetimli` | `-O2 -D_FORTIFY_SOURCE=2` |
| `guvenli` | `-O2` + düzeltilmiş kaynak |

Koruma bayraklarının çoğu: Demo 5 `giris_sert`.

---

# Derleme ortamı da hedeftir

- Erişim kaydı; bağımlılık **sabitleme** (5. hafta SBOM).
- İmzalı sürüm; **yeniden üretilebilir** derleme.
- Derleme makinesi ele geçerse tüm ürün etkilenir.

---

# Bölüm 5 — kısa sınama

1. Kanarya neyi durdurur, neyi durdurmaz?
2. ASLR neden bir bilgi sızıntısıyla zayıflar?
3. Neden "hiçbir koruma mantık hatasına yetmez"?

<!-- Konuşma notu: Sonra kod gizlemeye giriş. -->

---

# Bölüm 5 — cevaplar

1. **Durdurur:** dönüş adresini ezen **ardışık** yığın taşmasını (kanarya bozulur). **Durdurmaz:** hedefli yazma, heap taşması, bilgi sızıntısı.
2. Tek bir **sızan adres** modülün taban adresini açığa çıkarır (offset sabit) → tüm rastgelelik çöker.
3. Korumalar **bellek** ihlalini yakalar; yanlış yetkilendirme/iş kuralı **geçerli** bellek erişimidir → hiçbir koruma tetiklenmez. Doğru tasarım + inceleme gerekir.

---


<!-- _class: bolum -->

# 6. Kod gizlemeye giriş

<!-- Konuşma notu: Gizlemenin giriş katmanı. Derinlik 9 ve 14. haftada. -->

---

# Katman 4 · neden?

- Beyaz kutu saldırgan: dizgeleri okur, fonksiyonları adıyla bulur, denetimi atlar.
- Gizleme: davranış aynı, **anlaşılması zor**.

---

# Gizlemenin amacı

İmkânsız kılmak değil, **pahalı** kılmak (Cookbook 12.1):

- maliyet > korunan değer
- otomasyonu zorlaştır (çeşitlendirme, 14. hafta)
- diğer katmanlara **zaman** kazandır

> Tek gelişmiş teknik yerine **birkaç basit teknik + veri gizleme**.

---

<!-- _class: yogun -->

# Gizleme haritası

| Aile | Neyi gizler? | Hafta |
| --- | --- | --- |
| Düzen | Adlar, yapı | 4 |
| Veri | Sabit, dize, değişken | 4, 9 |
| Kontrol akışı | Algoritma yapısı | 4, 9 |
| Önleyici | Analiz aracı | 9 |
| Sanallaştırma | Makine kodu | 9, 14 |

---

# Sahadan: native tarafta 18 önlem

Sembol görünürlüğü kapalı · ad anlamsızlaştırma · sabit aritmetik gizleme · dize şifreleme (kullanınca çöz, **hemen sil**) · opak boolean · kendi kütüphane fonksiyonları · sahte işlem/ölü dal · düzleştirme + rastgele çıkış · sürümde günlük **yok**.

➡️ Güç **birliktelikten** ve RASP'tan.

---

# Üç ucuz önlem

| Önlem | Nasıl? |
| --- | --- |
| Sembolleri gizle | `static`, `-fvisibility=hidden`, `strip -s` |
| Günlüğü kaldır | Makroyu derlemede **boşalt** |
| Dizgeleri gizle | Derlemede şifrele, kullanınca çöz, hemen sil |

---

# Günlük makrosu

```c
#ifdef GUNLUK_ACIK
#  define GUNLUK(...) fprintf(stderr, __VA_ARGS__)
#else
#  define GUNLUK(...) ((void)0)   /* dizge de çağrı da yok */
#endif
```

Sürümde `GUNLUK_ACIK` tanımlı değil → günlük **hiç derlenmez**.

---

# ⚠️ Çalışma anı bayrağı yetmez

```c
if (hata_ayikla) printf("...");  /* KÖTÜ */
```

- Dizge ikili dosyada **kalır**.
- Saldırgan bayrağı değiştirip günlüğü **yeniden açar**.
- Doğrusu: derleme anında **çıkar**.

---

# ⚠️ Dize gizleme ≠ anahtar saklama

- Çözülen dizge kullanım anında **bellekte açık**.
- Çözme anahtarı **programın içinde**.
- Durdurduğu: `strings` gibi **statik** taramalar.
- Çalışırken inceleyene → RASP (6). Gerçek anahtar → whitebox (11).

---

<!-- _class: yogun -->

# Demo 6 — sembol ve dize sızıntısı

`code/week-04/06-sembol-dize` · CWE-200/215

| Adım | Ne olur? |
| --- | --- |
| 1 | `gizli_acik` ve `gizli_kapali` aynı sonuç |
| 2 `strings` | Açıkta lisans dizgesi ve `[LOG]`; kapalıda yok |
| 3 `nm` | Açıkta `lisans_dogrula`; kapalıda sembol yok |
| 4 | Windows: adlar PDB'de; kapalı PDB üretmez |

---

# Kontrol akışı düzleştirme

```c
int durum = 1;
for (;;) switch (durum) {
  case 1: durum = 2; break;
  case 2: durum = (kosul ? 3 : 4); break;
  case 3: durum = 5; break;
  case 4: return BASARISIZ;
  case 5: return BASARILI;
}
```

Blokların doğal komşuluğu kaybolur; sıra yalnız **durum değişkeninde**.

---

# Düzleştirmeyi güçlendirenler

- **Durum değerlerini gizle** (aritmetik dönüşüm)
- **Sahte/ölü bloklar** (hangisi gerçek?)
- **Rastgele çıkış** (hata nerede yakalandı, okunmaz)
- **Opak değerler** (tek bayt çeviremez)

Tek başına şablon kısa sürede çözülür → 9. hafta derinlik.

---

<!-- _class: yogun -->

# Demo 7 — düzleştirme

`code/week-04/07-akis-duzlestirme`

| Adım | Ne olur? |
| --- | --- |
| 1 | `pin.c` ve `pin_duz.c` aynı sonuç (PIN sentetik) |
| 2 | `objdump`: düzleştirilmişte çok daha fazla dal |
| 3 | Süre: düzleştirmenin **maliyeti** |

➡️ 14. hafta Tigress `Flatten` ile otomatik; 9. hafta etkinliği ölçmek.

---

# Kavram: 9. haftaya bağlanan üç teknik

- **Fonksiyon adı gizleme:** dışa açık adlar anlamsız; okunabilirlik makroyla.
- **Bellek ayırma gizleme:** "32 bayt = anahtar" izini bulanıklaştır.
- **Dinamik şifreleme:** hassas kod ikilide şifreli; DEP/NX ile çatışır, seçici.

---

# Bölüm 6 — kısa sınama

1. Gizleme hatayı düzeltir mi?
2. Günlüğü çalışma anı bayrağıyla susturmak neden yetmez?
3. Düzleştirmeyi güçlendiren üç teknik?

<!-- Konuşma notu: Sonra proje ve çözümlü sınama. -->

---

# Bölüm 6 — cevaplar

1. **Hayır.** Gizleme yalnız tersine mühendisliği zorlaştırır; açık yerinde durur. **Önce düzelt, sonra gizle.**
2. Dize/kod ikili dosyada kalır; saldırgan bayrağı çevirir/dizeleri okur. Sürümde log'u **derleme zamanında** çıkarın (makro/ölü kod eleme).
3. **Opak yüklemler** + **sahte bloklar/ölü dallar** + **durum değişkeni şifreleme & rastgele çıkış** (ayrıca ad/dize gizleme).

---


<!-- _class: bolum -->

# 7. Proje ve kapanış

---

# Proje · S9 "Kod sağlamlaştırma" — 1

- [ ] Önerilen sürüm bayraklarıyla derle; koruma tablosunu ekle (`checksec`/`dumpbin`).
- [ ] `clang-tidy`/`cppcheck` ile CERT taraması; ≥ 5 bulguyu düzelt (kural kimliğiyle).

---

# Proje · S9 — 2

- [ ] Testleri ASan + UBSan ile çalıştır.
- [ ] En az bir fuzz hedefi, ≥ 10 dk.
- [ ] Sürümde günlük yok; hassas dizge `strings` çıktısında yok.

**Önlem kartı:** Açıklama → Uygulama → Doğrulama → Kalan risk.

---

<!-- _class: bolum -->

# Çözümlü kendini sınama

---

# Soru 1

**Üç katmandan hangisi hatayı gerçekten kaldırır?**

**Cevap:** Yalnız **güvenli kodlama** (katman 2). Derleyici/OS korumaları istismarı zorlaştırır; gizleme okumayı yavaşlatır — ikisi de hatayı **kaldırmaz**.

---

# Soru 2

**`printf(girdi)`'nin en hafif sonucu nedir?**

**Cevap:** **Bilgi sızıntısı** (`%x`/`%p` ile yığın okuma). En ağırı `%n` ile belleğe yazma.

---

# Soru 3

**UAF raporundaki üç yığın izi? Düzeltme hangisinde?**

**Cevap:** Kullanım, serbest bırakma, ayırma. Düzeltme çoğunlukla **serbest bırakma** noktasında (sahiplik kararı).

---

# Soru 4

**`if (x + 100 < x)` neden silinebilir?**

**Cevap:** İşaretli tamsayı taşması **tanımsız davranıştır**; derleyici "taşma olmaz" varsayıp denetimi optimize edip **silebilir**.

---

# Soru 5

**Sinyal işleyicide neden `printf` yok?**

**Cevap:** `printf`/`malloc` eşzamansız-güvenli değildir; işleyici bunları kesintiye uğramış bir durumda çağırırsa bozulma olur. Yalnız bir bayrak set edilir (SIG30-C).

---

# Soru 6

**ASan hangi taşmayı göremez?**

**Cevap:** Aynı yapının **içinde** alandan alana taşmayı (aralarında zehirli bölge yoktur).

---

# Soru 7

**İyi bir fuzz hedefinin dört özelliği?**

**Cevap:** Hızlı, deterministik, durumsuz, tek iş.

---

# Soru 8

**Kanarya neyi durdurur, neyi durdurmaz?**

**Cevap:** Durdurur: dönüş adresine ulaşan yığın taşması. Durdurmaz: öbek taşması, önceki değişkenlerin bozulması, sızan kanarya.

---

# Soru 9

**ASLR neden bir bilgi sızıntısıyla zayıflar?**

**Cevap:** Bir adres sızarsa, saldırgan diğer adresleri ona göre **hesaplayabilir**; rastgelelik avantajı kaybolur.

---

# Soru 10

**Günlüğü çalışma anı bayrağıyla susturmak neden yetmez?**

**Cevap:** Dizge ikili dosyada **kalır** ve saldırgan bayrağı değiştirip günlüğü yeniden açabilir. Derleme anında çıkarılmalı.

---

# Soru 11

**Düzleştirmeyi güçlendiren üç teknik?**

**Cevap:** Durum değerlerini gizleme, sahte/ölü bloklar, rastgele çıkış noktası (ve opak değerler).

---

# Soru 12

**Dize gizleme neden anahtar saklama değildir?**

**Cevap:** Çözülen dizge kullanımda bellekte açıktır ve çözme anahtarı programın içindedir; yalnız statik taramayı durdurur.

---

# Özet: bu haftanın tek cümlesi

> Önce **hatasız kod** (CERT + sanitizer + fuzzing), sonra **zararı sınırla** (derleyici/OS korumaları), en son **okumayı zorlaştır** (gizleme) — ve hiçbir koruma güvenli kodlamanın yerini tutmaz.

---

<!-- _class: bolum -->

# Gelecek hafta

**5. hafta — Kod sağlamlaştırma: Java ve yorumlanan diller**

Enjeksiyon (SQL, komut, yol), ProGuard/R8 ile gizleme, bağımlılık güvenliği ve SBOM.

Hazırlık: JDK 17+, Maven · `code/week-05`.

---

<!-- _class: bolum -->

# Ek A · Baştan sona bir açık

<!-- Konuşma notu: Tek bir taşmayı hatalı koddan saldırıya, oradan düzeltmeye kadar izliyoruz. Tahtada yapılabilir. -->

---

# Hatalı kod

```c
void selamla(const char *ad) {
    char tampon[16];
    strcpy(tampon, ad);          /* sınır yok */
    printf("Merhaba %s\n", tampon);
}
```

`ad` 16 bayttan uzunsa ne olur?

---

# Ne oluyor? · adım adım

- `tampon` yığında 16 bayt.
- `strcpy` `ad`'ı **sonuna kadar** kopyalar, sınıra bakmaz.
- 16'dan uzun `ad` → komşu bellek (dönüş adresi dahil) bozulur.

---

# Saldırı · sonuç

- Kısa taşma: komşu değişken bozulur (mantık hatası).
- Uzun taşma: **dönüş adresi** bozulur → çökme ya da denetim ele geçirme.
- Korumasızsa: ciddi açık (CWE-121).

---

# Düzeltme 1 · sınırlı kopyalama

```c
int n = snprintf(tampon, sizeof tampon, "%s", ad);
if (n < 0 || (size_t)n >= sizeof tampon) {
    /* ad kesildi: reddet ya da işaretle */
}
```

`snprintf` boyutu bilir ve **kesilmeyi bildirir**.

---

# Düzeltme 2 · katmanlar

- **Kodlama:** `snprintf` (STR31-C).
- **Derleyici:** `-fstack-protector-strong` (kanarya).
- **FORTIFY:** `-D_FORTIFY_SOURCE=2` kütüphane çağrısını denetler.
- **Test:** ASan uzun girdiyle taşmayı yakalar.

---

# Ders: tek satır, çok katman

- Bir hata: `strcpy`.
- Savunma: doğru fonksiyon + derleyici koruması + sanitizer testi.
- Ama **asıl** çözüm ilk satırda: sınırlı kopyalama.

---

<!-- _class: bolum -->

# Ek B · Sık yapılan hatalar

---

# Hata · uyarıları görmezden gelmek

- "Sadece uyarı" diye geçilen şey, yarınki açıktır.
- `-Werror` ile uyarıyı hataya çevir.

---

# Hata · dönüş değerini denetlememek

- `malloc`, `fread`, `RAND_bytes` NULL/hata dönebilir.
- Denetlenmezse sessiz felaket (ERR33-C).

---

# Hata · sanitizer'ı sürüme koymak

- Sanitizer test/CI içindir; yavaş ve bilgi sızdırır.
- Sürüm derlemesinde **kapalı**.

---

# Hata · `-fwrapv` ile UB'yi gizlemek

- Taşmayı "tanımlı" yapmak mantık hatasını **gizler**.
- Tanı için UBSan kullan, düzelt.

---

# Hata · gizlemeyle hatayı örtmek

- Gizleme hatayı **düzeltmez**, sadece saklar.
- Önce düzelt, sonra gizle.

---

# Hata · girdiyi "temizleyip" kullanmak

- Tehlikeli girdiyi düzeltmeye çalışmak yerine **reddet**.
- Beyaz liste + reddetme en güvenlisi.

---

<!-- _class: bolum -->

# Ek C · Hızlı başvuru

---

<!-- _class: yogun -->

# Sözlük

| Terim | Anlam |
| --- | --- |
| UB | Tanımsız davranış |
| UAF | Kullanım-sonrası-serbest |
| CERT/CWE | Kural kitabı / zayıflık kataloğu |
| Sanitizer | Çalışma anı hata dedektörü |
| Fuzzing | Rastgele girdiyle çökme arama |
| Kanarya/ASLR/NX | Derleyici/OS korumaları |

---

<!-- _class: yogun -->

# Sağlamlaştırma kontrol listesi

- [ ] `-Werror` ve CERT taraması temiz
- [ ] Her dönüş değeri denetli
- [ ] Testler ASan + UBSan ile geçiyor
- [ ] En az bir fuzz hedefi çalıştı
- [ ] Sürüm bayrakları açık (koruma tablosu)
- [ ] Sürümde günlük/hassas dize yok

---

# Son söz (4. hafta)

> Güvenli kod bir kez yazılmaz; **her derlemede** araçlarla denetlenir.

Önce doğru kod, sonra koruma, en son gizleme. Sıra önemlidir.
