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

---

# Bugünün planı (3 saat)

| Saat | Konu |
| --- | --- |
| 1 | Kod sağlamlaştırmanın katmanları · SEI CERT C/C++ · Biçim dizisi **Demo 1** |
| 2 | Serbest bırakılmış bellek **Demo 2** · Tamsayılar ve tanımsız davranış **Demo 3** · Hata işleme, sinyaller · Sanitizer'lar · Fuzzing **Demo 4** |
| 3 | Derleyici ve OS korumaları **Demo 5** · Kod gizleme · Sembol, dize, günlük **Demo 6** · Kontrol akışı düzleştirme **Demo 7** · Proje |

**Demolar:** `code/week-04` — Windows `.\demo.ps1` · WSL / Linux `sh demo.sh` · Fuzzing için Linux'ta `clang`

<!-- Konuşma notu: Demoları önceden derleyin. Fuzzing demosu için WSL'de clang kurulu mu kontrol edin; yoksa demo ASan yeniden oynatıcıyla devam eder. -->

---

<!-- _class: bolum -->

# 1. Kod sağlamlaştırma ve SEI CERT

---

# Kod sağlamlaştırmanın üç katmanı

| Katman | Soru | Araçlar |
| --- | --- | --- |
| **2 · Güvenli kodlama** | Kodumda hata var mı? | CERT kuralları, sanitizer, fuzzing |
| **3 · Derleyici/OS** | Hata kaçarsa sömürü zor mu? | Kanarya, FORTIFY, ASLR, NX, RELRO, CFI |
| **4 · Gizleme** | Kodu okuyan anlayabiliyor mu? | Sembol/dize gizleme, günlük kaldırma, düzleştirme |

Sıra önemli: **önce hatasız kod** → sonra zararı sınırla → en son okumayı zorlaştır

⚠️ Gizleme hatayı **düzeltmez**

---

# Sahadan: şema gereksinimleri

- "Yaygın programlama zafiyetleri ele alınmalı: bellekteki hassas veri, enjeksiyon, arabellek taşması, dile özgü zayıflıklar"
- "Savunmacı programlama kodun **tamamında tutarlı** uygulanmalı"
- "Uygulama **statik ve dinamik tersine mühendisliğe** karşı korunmalı"

➡️ Sertifikalı bir kütüphanede yalnız native tarafta **18 sağlamlaştırma önlemi**

---

<!-- _class: yogun -->

# SEI CERT: bir kuralın anatomisi

| Bölüm | İçerik |
| --- | --- |
| Kimlik | `STR31-C`, `MEM50-CPP` |
| Başlık | Tek cümlelik özet |
| Hatalı örnek | Kuralı ihlal eden gerçekçi kod |
| Uyumlu çözüm | Aynı işi doğru yapan kod |
| Risk | Önem × olasılık × düzeltme maliyeti → **L1 / L2 / L3** |
| İlgili | CWE eşlemesi |

**Kural** = ihlali zafiyet, denetlenebilir · **Öneri** = iyi uygulama · İncelemeye **L1**'den başla

---

<!-- _class: yogun -->

# CERT kategorileri

| Kısaltma | Kategori | Örnek |
| --- | --- | --- |
| `INT` | Tamsayılar | INT32-C işaretli taşmaya izin verme |
| `ARR` / `STR` | Dizi / dizge | STR31-C yeterli yer ayır |
| `MEM` | Bellek | MEM30-C serbest bırakılmış belleğe erişme |
| `FIO` | Dosya G/Ç | FIO30-C kullanıcı girdisini biçim dizgesinden dışla |
| `ENV` | Ortam | ENV33-C `system()` çağırma |
| `SIG` | Sinyaller | SIG30-C işleyicide yalnız güvenli fonksiyonlar |
| `ERR` | Hata işleme | ERR33-C kütüphane hatalarını algıla |
| `CON` / `MSC` | Eşzamanlılık / çeşitli | CON43-C veri yarışı · MSC32-C PRNG tohumu |

C++: `MEM50-CPP`, `CTR50-CPP`, `STR50-CPP`, `EXP53-CPP`, `ERR50-CPP`

---

<!-- _class: yogun -->

# 1. haftadan bu haftaya on kural

| Kural | Nerede? |
| --- | --- |
| STR31-C · INT31-C · MSC06-C · ENV33-C | 1. hafta Demo 3 · 4 · 2 · 1 |
| FIO30-C | Bu hafta Demo 1 |
| MEM30-C · MEM31-C | Bu hafta Demo 2 |
| INT32-C | Bu hafta Demo 3 |
| ERR33-C · SIG30-C | Bu hafta hata işleme ve sinyaller |

**Otomatik denetim:** `-Wall -Wextra -Wformat=2 -Wconversion` · `clang-tidy cert-*` · `cppcheck --addon=cert` · MSVC `/analyze`

<!-- Konuşma notu: Değerlendirici önce statik analizi CERT kural setiyle çalıştırır, sonra dışarıdan veri alan her fonksiyonu elle okur. Bulgu, kural kimliğiyle yazılır. -->

---

<!-- _class: bolum -->

# 2. Biçim dizisi açığı

---

# `printf(girdi)`: kullanıcıya komut verdirmek

```c
printf(kullanici_girdisi);           /* HATALI: girdi = biçim dizgesi */
printf("%s", kullanici_girdisi);     /* DOĞRU: girdi yalnız veri */
```

| Belirteç | Saldırgan verirse |
| --- | --- |
| `%x`, `%p` | Yığındaki değerler okunur → **bilgi sızıntısı** |
| `%s` | Rastgele değer işaretçi sanılır → çökme / bellek okuma |
| `%n` | Belleğe **yazma** → bozulma |

Aynı hata: `syslog`, `fprintf`, `snprintf`, `err`/`warn` (Tarif 3.2)

---

<!-- _class: yogun -->

# Demo 1 — Biçim dizisi

`code/week-04/01-format-string` · CWE-134

| Adım | Ne görülür? |
| --- | --- |
| 0 Derleme | GCC/Clang `-Wformat-security` uyarır · MSVC C susar, `/analyze` yakalar |
| 2 `'%x.%x.%x…'` | Yığın dökülür, **gizli değer** görünür |
| 3 `'AAAA%n'` | Linux korumasız çöker · Windows CRT `%n`'i reddeder |
| 4 `sizinti_denetimli` | `_FORTIFY_SOURCE`: `%n in writable segment detected` |
| 5 `sizinti_guvenli` | Belirteçler yalnız metin |

<!-- Konuşma notu: Gizli değer sentetiktir; bütün okumalar programın kendi belleğindedir. Adım 2'de sızan değerin bir adres de olabileceğini ve ASLR'yi zayıflattığını söyleyin. -->

---

# Düzeltme ve katmanlar

1. **Biçim dizgesi hep sabit** (FIO30-C)
2. Uyarı: `-Wformat -Wformat-security -Werror=format-security` · `/analyze`
3. Kendi fonksiyonunuzu denetletin:

```c
void gunluk_yaz(int duzey, const char *bicim, ...)
    __attribute__((format(printf, 2, 3)));
```

4. Çalışma anı: `_FORTIFY_SOURCE=2` · MS CRT `%n` kapalı
5. Değişken argümanlarda sayıyı biçimden değil **açık parametreden** al (Tarif 13.4)

---

<!-- _class: bolum -->

# 3. Bellek, tamsayılar, hata işleme

---

# UAF: üç adım

1. Nesne öbekte, **iki işaretçi** gösteriyor
2. Biri `free` ediyor, diğeri **askıda** kalıyor
3. Ayırıcı aynı bloğu **başka nesneye** veriyor → askıdaki işaretçi yabancı veriyi okur/yazar

Nesnede **fonksiyon işaretçisi** varsa (C++'ta sanal tablo) risk büyür

Tarayıcı/OS güncellemelerindeki "bellek bozulması düzeltildi" notlarının büyük kısmı bu sınıf

---

<!-- _class: yogun -->

# Demo 2 — UAF ve çift serbest bırakma

`code/week-04/02-kullanim-sonrasi` · CWE-416/415 · MEM30-C

| Adım | Ne görülür? |
| --- | --- |
| 1 `uaf uaf` | Serbest blok dolar → rol `user` → `admin` |
| 2 `uaf_asan uaf` | `heap-use-after-free` + ayırma/bırakma/kullanım yerleri |
| 3 `uaf cift` | Ayırıcı bozulmayı fark eder / tanımsız davranış |
| 4 `uaf_asan cift` | `attempting double-free` |
| 5 `uaf_guvenli` | `free` + `NULL`, tek sahip, tek bırakma noktası |

Fonksiyon işaretçisi yalnız programın **kendi** panelini çağırır; dışarıdan kod yok

---

<!-- _class: yogun -->

# ASan UAF raporu: üç yığın izi

```text
ERROR: AddressSanitizer: heap-use-after-free
READ of size 8 ...
    #0 in oturum_kullan  uaf.c:48    <- 1. KULLANIM
freed by thread T0 here:
    #1 in oturum_kapat   uaf.c:31    <- 2. SERBEST BIRAKMA
previously allocated by thread T0 here:
    #1 in oturum_ac      uaf.c:22    <- 3. AYIRMA
```

➡️ Düzeltme çoğunlukla **2. konumda**: sahiplik kararı orada yanlış verildi

---

<!-- _class: yogun -->

# C++: sahipliği türe yazmak

| İhtiyaç | C++ |
| --- | --- |
| Tek sahip | `std::unique_ptr` — kopyalanamaz, taşınır |
| Paylaşılan | `std::shared_ptr` |
| Sahip olmadan gözlem | `std::weak_ptr` → `lock()` boşsa nesne yok |
| Dizi | `std::vector`, `std::array` |

```cpp
std::weak_ptr<Oturum> onbellek = aktif;
aktif.reset();
if (auto o = onbellek.lock()) kullan(*o);   // yoksa ESKİ belleğe erişilmez
```

⚠️ `get()` ile alınan ham işaretçi · `vector` büyüyünce geçersizleşen yineleyiciler (CTR51-CPP)

---

<!-- _class: yogun -->

# Dört tamsayı hatası

| Hata | Örnek | Sonuç | CERT |
| --- | --- | --- | --- |
| İşaretsiz sarma | `0u - 1` → 4.294.967.295 | Tanımlı ama mantık hatası | INT30-C |
| İşaretli taşma | `INT_MAX + 1` | **Tanımsız davranış** | INT32-C |
| Dönüşüm kaybı | `long long` → `int` | Kesilme / işaret değişimi | INT31-C |
| Kaydırma | `1 << 31`, `x << 32` | Tanımsız davranış | INT34-C |

```c
uint32_t boyut = adet * 4;     /* adet = 0x40000001 → boyut = 4 */
dizi = malloc(boyut);          /* küçük blok → döngüde öbek taşması */
```

---

<!-- _class: yogun -->

# Tanımsız davranış: derleyici denetimi silebilir

```c
if (x + 100 < x)      /* "taşarsa küçülür" */
    return -1;        /* işaretli taşma UB → derleyici bu dalı SİLEBİLİR */
```

`-O0`'da "çalışır", `-O2`'de denetim yok olur

```c
if ((b > 0 && a > INT_MAX - b) || (b < 0 && a < INT_MIN - b)) return false;  /* önce denetle */
if (__builtin_mul_overflow(a, b, &sonuc)) return false;   /* GCC/Clang */
/* C23: ckd_add / ckd_mul (<stdckdint.h>) · MSVC: <intsafe.h> */
```

---

<!-- _class: yogun -->

# Demo 3 — Tanımsız davranış ve UBSan

`code/week-04/03-tanimsiz-davranis` · CWE-190/758

- İşaretli taşma (`INT_MAX + 1`) · geçersiz kaydırma · hizasız erişim
- x86'da çoğu **sessizce** yanlış sonuç verir
- `-fsanitize=undefined` → `ub.c:27: runtime error: signed integer overflow: 2147483647 + 1 cannot be represented in type 'int'`
- Windows: UBSan yok → `/RTC`, `/analyze`, CERT kuralları

Bayraklar: `-Wconversion -Wsign-conversion` · `-ftrapv` · `-fwrapv` (mantık hatasını gizler!)

---

<!-- _class: yogun -->

# Hata işleme: denetlenmeyen dönüş değeri

| Çağrı | Denetlenmezse |
| --- | --- |
| `malloc` | NULL'a yazma |
| `setresuid` | Yetkili kalır ama bıraktığını sanır |
| `RAND_bytes` | "Rastgele" anahtar sıfır |
| `EVP_DecryptFinal_ex` | Kurcalanmış veri doğrulanmış sanılır |
| `snprintf` ≥ boyut | Kesilmiş yol/komut |

1. Her dönüşü denetle (ERR33-C) · `[[nodiscard]]` / `warn_unused_result`
2. Hatada güvenli duruma dön (`goto temizle`) · **fail-closed**
3. İleti ipucu vermesin: "kullanıcı yok" ≠ "parola yanlış" → kullanıcı adı tahmini

---

# Sahadan: opak dönüş değerleri

- Native fonksiyonlar ayrıntılı **hata kodu döndürmez**
- Yalnız başarılı / başarısız — üstelik **opak** biçimde (düz 0/1 değil)
- Ayrıntılı kod = saldırgana "hangi denetimde takıldın" haritası
- Destek ekibi için tanı: ayrı, güvenli bir kanal → **ödünleşim kaydı**

---

<!-- _class: yogun -->

# Değişken argümanlar ve sinyaller

```c
printf("%d\n", buyuk_long_long);   /* tür uyuşmazlığı */
printf("%s\n");                    /* argüman yok → yığından okur */
```

```c
static volatile sig_atomic_t durdur = 0;
static void isleyici(int s) { (void)s; durdur = 1; }   /* YALNIZ bayrak */
/* sigaction(SIGTERM, &sa, NULL); while (!durdur) { ... } temizle(); */
```

- İşleyicide `printf`, `malloc`, `free` **yok** (SIG30-C)
- 2024 "regreSSHion" (CVE-2024-6387): zaman aşımı işleyicisi güvensiz günlük fonksiyonu çağırıyordu
- `signal()` yerine `sigaction()`

---

<!-- _class: bolum -->

# 4. Sanitizer'lar ve fuzzing

---

<!-- _class: yogun -->

# Sanitizer ailesi

| Sanitizer | Bulduğu | Bayrak | Yavaşlama |
| --- | --- | --- | --- |
| **ASan** | Taşma, UAF, çift bırakma | `-fsanitize=address` · `/fsanitize=address` | ~2× |
| **LSan** | Sızıntı | ASan ile (Linux) | Düşük |
| **UBSan** | İşaretli taşma, kaydırma, NULL, hizasız | `-fsanitize=undefined` | Düşük |
| **MSan** | İlklendirilmemiş okuma | `-fsanitize=memory` (Clang) | ~3× |
| **TSan** | Veri yarışı | `-fsanitize=thread` | 5–15× |

Yanlış alarm neredeyse yok · ama yalnız **çalışan** yoldaki hatayı bulur → test + fuzzing ile

---

# ASan nasıl çalışır? Gölge bellek

- Her 8 bayt için 1 baytlık **gölge bayt**: ne kadarı geçerli?
- Dizilerin önüne/arkasına **zehirli bölge** (redzone)
- Serbest bloklar **karantinada** bekler
- Her erişimden önce gölge denetimi

⚠️ Aynı yapının içinde alandan alana taşma → arada zehirli bölge yok → **görülmez** (1. hafta Demo 3)

```bash
gcc -g -O1 -fno-omit-frame-pointer -fsanitize=address,undefined p.c -o p_test
```

Sanitizer'lı derleme **sürüme gitmez** → CI'da her birleştirmede

---

# Fuzzing: kapsam güdümlü

```text
 tohum girdiler ──▶ değiştir (bit çevir, sil, ekle, birleştir)
        ▲                     │
        │                     ▼
  yeni yol? ◀── hedefi çalıştır (sanitizer açık) ──▶ çökme? → girdiyi kaydet
```

- Yeni kod yolu açan girdi **saklanır** ve üzerinde çalışılır
- Sihirli baytları, doğru uzunluk alanını kendiliğinden bulur
- libFuzzer · AFL++ · honggfuzz · OSS-Fuzz: on binlerce hata

---

<!-- _class: yogun -->

# Fuzz hedefi yazmak

```c
int LLVMFuzzerTestOneInput(const uint8_t *veri, size_t boyut)
{
    ayristir(veri, boyut);
    return 0;
}
```

```bash
clang -g -O1 -fsanitize=fuzzer,address fuzz.c ayristir.c -o fuzz_ayristir
./fuzz_ayristir corpus/ -max_total_time=10
```

İyi hedef: **hızlı** (ağ/disk yok) · **deterministik** · **durumsuz** · **tek iş**

---

<!-- _class: yogun -->

# Demo 4 — Fuzzing ile hata bulmak

`code/week-04/04-fuzzing` · CWE-125/787 · Tarif 3.1

| Adım | Ne olur? |
| --- | --- |
| 1 | `tohum/normal.bin` sorunsuz |
| 2 | libFuzzer ≤ 10 sn → çökerten girdi |
| 3 | ASan ile yeniden oynat → tam rapor |
| 4 | Düzeltilmiş sürüm aynı süre → çökme yok |
| 5 | `tohum/cokerten.bin` güvenle reddedilir |

Clang yoksa libFuzzer atlanır, ASan yeniden oynatıcı gösterir · Windows: `/fsanitize=fuzzer`

<!-- Konuşma notu: Güvenlik kılavuzuna "şu fonksiyon şu süre sanitizer'la fuzzlandı, şu kapsama ulaşıldı" satırı güçlü bir kanıttır. -->

---

<!-- _class: bolum -->

# 5. Derleyici ve işletim sistemi korumaları

---

<!-- _class: yogun -->

# Korumalar ve bayraklar

| Koruma | GCC/Clang | MSVC |
| --- | --- | --- |
| Yığın kanaryası | `-fstack-protector-strong` | `/GS` |
| `_FORTIFY_SOURCE` | `-D_FORTIFY_SOURCE=2` (+ `-O1`↑) | Güvenli CRT `_s` |
| PIE + ASLR | `-fPIE -pie` | `/DYNAMICBASE /HIGHENTROPYVA` |
| DEP / NX | varsayılan | `/NXCOMPAT` |
| RELRO | `-Wl,-z,relro,-z,now` | — |
| CFI / CFG | `-fcf-protection`, `-fsanitize=cfi` | `/guard:cf`, `/CETCOMPAT` |
| Gölge yığın | `-fsanitize=safe-stack`, CET | CET gölge yığını |

Kitap (Tarif 3.3) yalnız kanaryayı anar; gerisi 2003 sonrası

---

<!-- _class: yogun -->

# Neyi durdurur, neyi durdurmaz?

| Koruma | Durdurur | Durdurmaz |
| --- | --- | --- |
| Kanarya | Dönüş adresine ulaşan taşma | Önceki değişkenler, öbek taşması, sızan kanarya |
| FORTIFY | Boyutu bilinen tampona fazla yazan kütüphane çağrısı | Kendi döngüleriniz |
| ASLR | Sabit adres varsayımı | **Adres sızıntısı** (biçim dizisi!) |
| NX | Veri bölgesindeki kodu çalıştırma | Programın kendi kod parçalarının yeniden kullanımı |
| CFI/CFG | Geçersiz dolaylı hedef | Geçerli hedefler arasında yanlışı; veri bozulması |

➡️ Her koruma bir **tekniği** zorlaştırır, **hata sınıfını** kaldırmaz · mantık hatasına hiçbiri yetmez

---

<!-- _class: yogun -->

# Demo 5 — Korumaları açıp kapatmak

`code/week-04/05-derleyici-korumalari` · CWE-121

- Aynı taşma: `giris_zayif` (kapalı) ve `giris_sert` (açık)
- Sert: `*** stack smashing detected ***: terminated` · Windows `0xC0000409`
- Zayıf: sessiz bozulma ya da çökme
- Koruma denetimi: Linux `readelf`, Windows `dumpbin`

```bash
readelf -h p | grep Type            # DYN = PIE
readelf -l p | grep -A1 GNU_STACK   # RW = NX açık
readelf -d p | grep BIND_NOW        # tam RELRO
readelf -s p | grep __stack_chk     # kanarya
```

---

# Önerilen sürüm bayrakları

**GCC/Clang:**
`-O2 -D_FORTIFY_SOURCE=2 -fstack-protector-strong -fPIE -pie -Wl,-z,relro,-z,now -fcf-protection -Wall -Wextra -Wformat=2 -Werror=format-security`

**MSVC:**
`/O2 /GS /sdl /guard:cf /DYNAMICBASE /HIGHENTROPYVA /NXCOMPAT /CETCOMPAT /W4`

Dersin CMake `guvenli` kipi bunları açar · OpenSSF *Compiler Options Hardening Guide*

<!-- Konuşma notu: Değerlendirici her ikili ve .so için koruma tablosu çıkarır; kapalı koruma bulgudur, gerekçesi ödünleşim kaydında olmalı. Şema gereksinimi: uygulama OS korumalarının açık olduğunu kendisi denetlemeli. -->

---

<!-- _class: bolum -->

# 6. Kod gizlemeye giriş

---

# Gizleme ne verir?

- Beyaz kutu saldırgan: dizgeleri okur, fonksiyonları adıyla bulur, denetimi atlar
- Gizleme: davranış aynı, **anlaşılması zor**
- Amaç imkânsız değil **pahalı** kılmak (Tarif 12.1):
  - maliyet > korunan değer
  - otomasyonu zorlaştırmak (çeşitlendirme, 14. hafta)
  - diğer katmanlara **zaman** kazandırmak

Kitap: tek gelişmiş teknik yerine **birkaç basit teknik + veri gizleme**

---

<!-- _class: yogun -->

# Gizleme haritası

| Aile | Neyi gizler? | Örnek | Hafta |
| --- | --- | --- | --- |
| Düzen | Adlar, yapı | Sembol gizleme, ad anlamsızlaştırma, günlük kaldırma | 4 |
| Veri | Sabit, dizge, değişken | Dizge şifreleme, sabit dönüşümü, opak boolean | 4, 9 |
| Kontrol akışı | Algoritma yapısı | Düzleştirme, opak yüklem, sahte/ölü dal | 4, 9 |
| Önleyici | Analiz aracı | Tersine derleyiciyi yanıltma | 9 |
| Sanallaştırma | Makine kodu | Özel sanal makine bayt kodu | 9, 14 |

---

<!-- _class: yogun -->

# Sahadan: native tarafta 18 önlem

Sembol görünürlüğü kapalı · fonksiyon, dosya ve parametre adları anlamsız (asıl adlar iç belgede) · sabitler aritmetik dönüşümle gizli · statik dizgeler derleme öncesi şifreli, kullanımda çözülüp **hemen silinir** · opak boolean ve yalnız başarılı/başarısız dönüşleri · standart kütüphane yerine kendi fonksiyonları · sahte işlemler ve ölü dallar · kontrol akışı düzleştirme + rastgele çıkış noktası · sürümde günlük **yok**

➡️ Hiçbiri tek başına güçlü değil; güç **birliktelikten** ve RASP'tan

---

<!-- _class: yogun -->

# Sembol, dize, günlük: üç ucuz önlem

| Önlem | Nasıl? |
| --- | --- |
| Sembolleri gizle | `static`, `-fvisibility=hidden`, `strip -s`, PDB dağıtma |
| Günlüğü kaldır | Makroyu derleme anında **boşalt** |
| Dizgeleri gizle | Derlemede şifrele, kullanımda çöz, hemen sil (Tarif 12.11) |

```c
#ifdef GUNLUK_ACIK
#  define GUNLUK(...) fprintf(stderr, __VA_ARGS__)
#else
#  define GUNLUK(...) ((void)0)      /* dizge de çağrı da yok */
#endif
```

⚠️ Çalışma anı bayrağıyla susturmak yetmez: dizge kalır, bayrak değiştirilir

---

# ⚠️ Dize gizleme anahtar saklama değildir

- Çözülen dizge kullanım anında **bellekte açık**
- Çözme anahtarı da **programın içinde**
- Durdurduğu: `strings` gibi **statik** taramalar
- Çalışırken inceleyene karşı → **RASP** (6. hafta)
- Gerçek anahtarlar için → **whitebox** (11. hafta)

Sahada gizleme anahtarı da parçalanır, çözme fonksiyonu ek denetimlerle korunur

---

<!-- _class: yogun -->

# Demo 6 — Sembol ve dize sızıntısı

`code/week-04/06-sembol-dize` · CWE-200/215 · Tarif 12.11

| Adım | Ne olur? |
| --- | --- |
| 1 | `gizli_acik` ve `gizli_kapali` aynı sonucu verir |
| 2 | `strings`: açıkta lisans dizgesi ve `[LOG]` · kapalıda yok |
| 3 | `nm`: açıkta `lisans_dogrula` · kapalıda sembol yok |
| 4 | Windows: adlar PDB'de; kapalı sürüm PDB üretmez |

---

<!-- _class: yogun -->

# Kontrol akışı düzleştirme

```c
int durum = 1;
for (;;) {
    switch (durum) {
    case 1: /* 1. adım */         durum = 2; break;
    case 2: /* 2. adım */         durum = (kosul ? 3 : 4); break;
    case 3: /* başarı yolu */     durum = 5; break;
    case 4:                       return BASARISIZ;
    case 5:                       return BASARILI;
    }
}
```

Bloklar arasındaki doğal komşuluk kaybolur; sıra yalnız **durum değişkeninde**

---

# Düzleştirmeyi güçlendirenler

- **Durum değerlerini gizle:** ardışık 1, 2, 3 yerine aritmetik dönüşüm (Tarif 12.5)
- **Sahte ve ölü bloklar:** hangisi gerçek?
- **Rastgele çıkış noktası:** hata **nerede** yakalandı, akıştan okunmaz
- **Opak değerler:** kritik doğru/yanlış tek bayt değiştirilerek çevrilemez (Tarif 12.8)

Tek başına şablon kısa sürede geri çözülür

---

<!-- _class: yogun -->

# Demo 7 — Kontrol akışı düzleştirme

`code/week-04/07-akis-duzlestirme` · Tarif 12.3

| Adım | Ne olur? |
| --- | --- |
| 1 | `pin.c` ve `pin_duz.c` aynı sonucu verir (PIN sentetik) |
| 2 | `objdump` / `dumpbin`: düzleştirilmiş sürümde çok daha fazla dal |
| 3 | Süre ölçümü: düzleştirmenin **maliyeti** |

➡️ 14. hafta: Tigress `--Transform=Flatten` ile otomatik · 9. hafta: etkinliği ölçmek

---

<!-- _class: yogun -->

# Kavram: ad, bellek ayırma, dinamik şifreleme

| Teknik | Fikir |
| --- | --- |
| Fonksiyon adı gizleme | Dışa açık kalması gereken giriş noktalarının adları anlamsız; okunabilirlik makroyla |
| Bellek ayırma gizleme | "32 bayt = anahtar" izini bulanıklaştırmak: boyut, sıra, sahte ayırma, kullanım sonrası rastgele doldurma |
| Dinamik şifreleme | En hassas kod ikili dosyada şifreli, yalnız çalışacağı an çözülür; DEP/NX ile çatışır, seçici kullanılır |

Ayrıntılar 9. haftada

<!-- Konuşma notu: Değerlendirici gizlemeyi var/yok değil zamanla ölçer: hassas fonksiyonu bulmak, anlamak, denetimi atlatmak ne kadar sürdü? Saldırı potansiyeli puanlaması (13. hafta) buradan beslenir. -->

---

<!-- _class: bolum -->

# 7. Proje ve kapanış

---

<!-- _class: yogun -->

# Proje: S6 "Kod sağlamlaştırma" taslağı

- [ ] `guvenli` kipte derle; koruma tablosunu ekle (`checksec` / `dumpbin`)
- [ ] `clang-tidy` / `cppcheck` ile CERT taraması; ≥ 5 bulguyu düzelt, kural kimliğiyle yaz
- [ ] Testleri ASan + UBSan ile çalıştır
- [ ] En az bir fuzz hedefi, ≥ 10 dk
- [ ] Sürümde günlük yok, hassas dizge `strings` çıktısında yok

**Önlem kartı:** Açıklama → Uygulama → Doğrulama → Kalan risk

---

# Kendi başına çalış (not verilmez)

1. Uyarıları hata yap (`-Werror` / `/WX`); her uyarıyı düzelt ya da gerekçelendir
2. Kendi günlük fonksiyonuna `format` özniteliği ekle
3. `malloc(n*s)` vs `__builtin_mul_overflow` vs `calloc`: `n = SIZE_MAX/2`
4. Demo 3'e dördüncü bir UB ekle; hangi sanitizer yakalıyor?
5. Kendi ayrıştırıcın için fuzz hedefi; 10 dk, `cov:` değeri
6. `korumasiz` vs `guvenli`: koruma tablosu, boyut, süre
7. Sinyal işleyicisini SIG30-C'ye göre düzelt
8. Kendi fonksiyonunu düzleştir; maliyeti ödünleşim kaydına yaz

---

# Kendini sınama

1. Üç katmandan hangisi hatayı **gerçekten** kaldırır?
2. `printf(girdi)`'nin en hafif sonucu nedir?
3. UAF raporundaki üç yığın izi? Düzeltme hangisinde?
4. `if (x + 100 < x)` neden silinebilir?
5. Sinyal işleyicide neden `printf` yok?
6. ASan hangi taşmayı göremez?

<!-- Konuşma notu: 1) Güvenli kodlama. 2) Bilgi sızıntısı. 3) Kullanım/bırakma/ayırma; bırakma. 4) İşaretli taşma UB. 5) Eşzamansız güvenli değil. 6) Aynı yapı içindeki alanlar arası. -->

---

# Kendini sınama (devam)

7. İyi bir fuzz hedefinin dört özelliği?
8. Kanarya neyi durdurur, neyi durdurmaz?
9. ASLR neden bir bilgi sızıntısıyla zayıflar?
10. Günlüğü çalışma anı bayrağıyla susturmak neden yetmez?
11. Düzleştirmeyi güçlendiren üç teknik?
12. Dize gizleme neden anahtar saklama değildir?

<!-- Konuşma notu: 7) Hızlı, deterministik, durumsuz, tek iş. 8) Dönüş adresine ulaşan taşma / öbek, önceki değişkenler, sızan kanarya. 9) Adres sızarsa diğerleri hesaplanır. 10) Dizge kalır, bayrak değişir. 11) Durum gizleme, sahte/ölü blok, rastgele çıkış, opak değer. 12) Kullanımda açık, anahtar programda. -->

---

# Gelecek hafta

**Hafta 5 — Kod Sağlamlaştırma: Java ve yorumlanan diller**

- Girdi doğrulama ve enjeksiyon (SQL, komut, yol geçişi)
- ProGuard / R8 ile gizleme, dize koruma
- Bağımlılık güvenliği ve SBOM

Hazırlık: JDK 17+, Maven · `code/week-05`
