---
marp: true
theme: cen429
paginate: true
lang: tr
title: "CEN429 Hafta 6 — Çalışma Zamanı Uygulama Öz Koruması (RASP)"
author: "Dr. Öğr. Üyesi Uğur CORUH"
header: "CEN429 Güvenli Programlama · Hafta 6"
footer: "RTEÜ Bilgisayar Mühendisliği · 2026-2027 Güz"
---

<!-- _class: baslik -->
<!-- _paginate: false -->

# Çalışma Zamanı Uygulama Öz Koruması (RASP)

**CEN429 Güvenli Programlama — Hafta 6**

Dr. Öğr. Üyesi Uğur CORUH · 23.10.2026

<!--
Konuşma notu: Bu hafta odak "programı sağlamlaştırma"dan "program çalışırken kendini koruma"ya kayıyor. Ana varsayım: cihazın sahibi saldırgan (MATE). Ana fikir: tek kontrole güvenme; algılama + tepki + cihaz bağlama.
-->

---

# Bugünün planı (3 saat)

| Saat | Konu |
| --- | --- |
| 1 | RASP nedir · bütünlük denetimi · anti-debug · **Demo 1–2** |
| 2 | Ortam/emülatör · kanca/preload · root · imza · **Demo 3–4, 6–7** |
| 3 | Kontrol akışı sayacı · tepki politikası · cihaz bağlama · **Demo 5, 8** |

**Öğrenme çıktısı:** ÖÇ.3 (kod sağlamlaştırma — RASP dâhil — C/C++ için uygular)

<!--
Konuşma notu: Laboratuvarı önceden derleyin. Windows build.ps1, WSL build.sh. Kripto ortak başlıktan (OpenSSL/BCrypt). Demo 4 yalnız WSL/Linux.
-->

---

# Demolar nasıl çalışıyor?

- Tek kaynak, iki platform: **Windows (Visual Studio 2022)** ve **WSL/Linux (GCC)**
- Bütünlük/imza demoları kripto için ortak başlık: **Linux → OpenSSL**, **Windows → BCrypt**
- Derle: Windows `.\build.ps1` · WSL `./build.sh` · Çalıştır: `.\demo.ps1` / `sh demo.sh`
- **Demo 4 yalnız WSL/Linux** (LD_PRELOAD)

> ⚠️ **Etik:** yama yalnız **kopya** üzerinde; hata ayıklayıcı yalnız **demonun kendi**
> sürecine; `LD_PRELOAD` yalnız **tek komut**. Sistem ayarı yok, yönetici yok.

---

<!-- _class: bolum -->

# 1. RASP nedir? Algılama → savunma → caydırma

---

# İlk 5 hafta: statik sağlamlaştırma. Şimdi?

- Girdi doğrulama (H1, H4), şifreleme (H3), gizleme (H4, H5)
- Hepsinin varsayımı: **program yazıldığı gibi çalışacak**
- Bu hafta o varsayımı **bırakıyoruz**: kullanıcı = cihazın sahibi = saldırgan
- Root, hata ayıklayıcı, kanca, yama... hepsi mümkün

**RASP:** uygulamanın içine gömülü, **çalışırken** kendini izleyen koruma.
Uygulama kendi muhafızıdır.

---

# RASP dış korumalardan farklı

| Koruma | Nerede | Neyi görür |
| --- | --- | --- |
| Ağ güvenlik duvarı | Ağ kenarı | Paketler |
| WAF | Uygulamanın **önü** | HTTP istekleri |
| **RASP** | Uygulamanın **içi** | Kendi kodu, belleği, ortamı |

WAF: "gelen istek zararlı mı?" · RASP: "**ben** kurcalandım mı, **beni** kim izliyor,
**hangi cihazdayım**?"

---

<!-- _class: sema -->

# Üçlü: algılama → savunma → caydırma

```text
  ALGILAMA ------> SAVUNMA ------> CAYDIRMA
  butunluk         fail-closed     decoy cikti
  debugger         sirri sil       gecikme
  kanca/ortam      cihaza bagla    telemetri/attestation
  root/imza        akis sayaci     saldirgani yavaslat
```

- **Algılama:** bir şey yanlış mı? (yama, debugger, emülatör, root)
- **Savunma:** anlamlı yanıt (sil, reddet, bağla)
- **Caydırma:** saldırıyı **pahalılaştır** (kırılmazlık değil!)

---

# Saldırgan modeli: MATE

**Man-At-The-End:** saldırgan uygulamanın çalıştığı **uç noktanın sahibi**.

- Belleği okur, kodu değiştirir, adım adım izler → **her şeyi görür**
- Hafta 11'deki **beyaz kutu** ile aynı varsayım

> ⚠️ **Acı gerçek:** cihazın sahibi saldırgansa hiçbir istemci koruması **nihai
> olarak kırılmaz değildir.** Amaç kırılmazlık değil; saldırıyı **ölçeklenemez ve
> pahalı** kılmak + **sunucu tarafı** denetimle birleştirmek.

<!--
Konuşma notu: RASP tek başına yeterli değil; derinlemesine savunmanın çalışma zamanı katmanı. Kripto+gizleme+whitebox+sunucu ile birlikte.
-->

---

<!-- _class: bolum -->

# 2. Bütünlük denetimi: uygulama kendini doğrular

---

# "Ben değiştirildim mi?"

- Saldırgan bir kontrolü **yamalar** (`je → jmp`, H4)
- Savunma: uygulama kendi ikilisinin **özetini** çalışma zamanında hesaplar,
  **altın** değerle karşılaştırır → tek bayt değişse yakalar

| | Kitap (2003) | Bugün |
| --- | --- | --- |
| Yöntem | CRC32 (Tarif 12.2) | **HMAC-SHA-256 / imza** |
| Sorun | kriptografik değil, eşlenebilir | anahtar gerekir |

---

<!-- _class: sema -->

# Self-hashing akışı

```text
  Ikili dosya / korunan bolge
        |
        v
  HMAC-SHA-256 (gizli anahtar)
        |
        v
  altin deger == hesaplanan ?
     |               |
    evet            hayir
  TAMAM        YAMA ALGILANDI -> tepki
```

---

# Demo 1 — bütünlük ve yama tespiti

```c
oz_yol(yol, ...);  dosya_oku(yol, &veri, &boy);
kripto_hmac_sha256(RASP_ANAHTAR, 32, veri, boy, ozet);
// sabit zamanli karsilastirma
if (fark == 0) { /* TAMAM */ } else { /* YAMA */ }
```

```text
ADIM 2  yama yok  -> BUTUNLUK TAMAM
ADIM 3  kopyanin 1 bayti degistirilir (kendi cikti/ klasoru)
ADIM 4  Hesaplanan: 05fb4274...  != altin -> YAMA ALGILANDI
```

---

# Demo 1 — sınır: checker de yamalanır

⚠️ HMAC anahtarı ikilinin içinde → saldırgan:
1. Denetleyici **fonksiyonu** yamalar ("hep TAMAM")
2. Altın değeri de yeniden hesaplar

✅ Gerçek RASP güçlendirir:
- **Örtüşen** denetleyiciler (biri diğerini kontrol eder)
- Sonucu **veri bağımlılığı** yap (Demo 5)
- Sunucu tarafı **attestation** (nonce'lu)

<!--
Konuşma notu: Yazarın CRC seçmesinin sebebi: asıl saldırı checksum kodunu yamalamak. Bu, bölümün ana tartışması.
-->

---

<!-- _class: bolum -->

# 3. Hata ayıklayıcı (debugger) algılama

---

# Debugger: saldırganın en güçlü aracı

| Ortam | Sinyal |
| --- | --- |
| **Linux/WSL** | `/proc/self/status` **TracerPid** (>0), ana sürec adı (gdb/strace) |
| **Windows** | `IsDebuggerPresent` (PEB), `CheckRemoteDebuggerPresent`, PEB `NtGlobalFlag` |

- SoftICE (12.15) **öldü** → x64dbg, WinDbg, gdb, lldb, **Frida**
- `IsDebuggerPresent` tek başına **zayıf** → çoğalt

---

# Demo 2 — anti-debug (yalnız okuma)

```text
ADIM 1 (debugger YOK):
  TracerPid: 0 (izleyen yok)  -> Temiz

ADIM 2 (gdb altinda):
  TracerPid: 2909 (IZLENIYOR) -> Algilandi (2 sinyal)
```

- Windows: Visual Studio **F5** → `IsDebuggerPresent` EVET
- Kendini `ptrace` ile izlemez (yan etkisiz, salt okuma)

> Tespit–karşı-tespit **yarışı**: her sinyalin bir karşı-tekniği var → **çoğalt**.

---

# Demo 2 — kural

❌ `if (IsDebuggerPresent()) exit(1);` — tek sinyal, doğrudan çıkış → yamalanır
✅ Birden çok bağımsız sinyal
✅ Sonucu bir davranışa/anahtara bağla (Demo 5)
✅ Tepkiyi **geciktir** (hemen çıkma, tetikleyiciyi ele verme)

---

<!-- _class: bolum -->

# 4. Ortam algılama: VM / emülatör

---

# Analiz çoğu zaman VM/emülatörde yapılır

| Teknik | Nasıl |
| --- | --- |
| CPUID hipervizör biti | `CPUID.1:ECX[31]` (bare-metal'de 0) |
| Satıcı imzası | CPUID `0x40000000` → `KVMKVMKVM`, `Microsoft Hv`... |
| Zamanlama | işlem ölç; tek adım/emülasyon çok yavaşlatır |

Yalnız CPU komutu + saat → güvenli, taşınabilir.

---

# Demo 3 — CPUID + zamanlama

```text
(A) CPUID.1:ECX[31] hipervizor biti : VAR
    Hipervizor satici imzasi        : (gizli/bos)
(B) 2.000.000 islem : 0.806 ms
SONUC: Hipervizor GORULDU. Ama WSL2/Hyper-V/VBS de boyle gorunur.
```

⚠️ **Yanlış pozitif dersi:** bu çıktı sıradan bir WSL2 makinesinden! Hipervizör
biti **tek başına** "analiz ortamı" demek **değil**.

<!--
Konuşma notu: Sırf hipervizör gördüğü için çalışmayı reddeden uygulama milyonlarca meşru kullanıcıyı engeller. Ortam = risk skoru, ikili karar değil.
-->

---

# Demo 3 — kural

✅ Ortam algılamayı bir **risk skoru** olarak kullan, ikili "çalış/çalışma" değil
✅ Birden çok göstergeyi birleştir
✅ Yanlış pozitifi (meşru VM/emülatör kullanıcıları) hesaba kat
✅ Nihai kararı **sunucu tarafı** risk motoruyla ver

> Mobil karşılığı: emülatör algılama (QEMU ipuçları, sahte sensörler).

---

<!-- _class: bolum -->

# 5. Kanca ve enstrümantasyon (LD_PRELOAD, Frida)

---

# Debugger'dan sinsi: fonksiyon kancalama

- Saldırgan programı durdurmadan **fonksiyonları değiştirir**
- Bizim anti-debug/anti-root kontrollerimizi **yalancıya çıkarır**

| Teknik | Nasıl |
| --- | --- |
| **LD_PRELOAD** | `.so` önyükle, standart fonksiyonu değiştir (interposition) |
| PLT/GOT | çağrı tablosunu yönlendir |
| Inline | fonksiyonun ilk baytlarını `jmp` ile ez |
| **Frida/Xposed** | dinamik enstrümantasyon |

---

# Nasıl algılanır?

- `getenv("LD_PRELOAD")` boş mu? → **zayıf** (getenv de kancalanır)
- Fonksiyon **hangi .so'dan** çözülüyor? `dlsym(RTLD_DEFAULT)` + `dladdr`
  → libc/vDSO/ld dışı bir modül = **KANCA**
- `/proc/self/maps` taraması, bilinen çerçeve göstergeleri

```c
void *p = dlsym(RTLD_DEFAULT, "time");
dladdr(p, &info);
int kanca = !mesru_mi(info.dli_fname);
```

---

# Demo 4 — LD_PRELOAD kancası (yalnız WSL/Linux)

```text
ADIM 1 (LD_PRELOAD yok):
  time -> linux-vdso.so.1   (mesru, kanca degil)
  SONUC: Temiz

ADIM 2 (LD_PRELOAD=libsahtekanca.so):
  time -> libsahtekanca.so (KANCA!)  time(NULL)=1234567890
  SONUC: Fonksiyon kancasi ALGILANDI
```

`LD_PRELOAD` **yalnız tek komutu** etkiler. Windows karşılığı: IAT/inline kanca tespiti.

<!--
Konuşma notu: Temiz koşuda time vDSO'dan geliyor; vDSO'yu yanlış pozitif saymamak için meşru kaynak sayarız. "Algılamayı DOĞRU yazmak, yazmaktan zor."
-->

---

<!-- _class: bolum -->

# 6. Root / ayrıcalık ve bileşen imzası

---

# Root / ayrıcalıklı ortam göstergesi

- Root'lu cihazda güvenlik varsayımları çöker
- Göstergeler: `su`, tehlikeli paketler, yazılabilir sistem yolları
- Masaüstü karşılığı: **yükseltilmiş yetki?** (`geteuid()==0`, elevated token)

```text
Demo 7:  [BULUNDU] cikti/sahte_su (ek isaret)
         SONUC: riskli ortam GOSTERGESI var
```

⚠️ **Sinyal, kanıt değil:** Magisk Hide sahteler; meşru root kullanıcısını engelleme
riski → modern yol: **platform attestation** (sunucu tarafı, nonce'lu).

---

# Bileşen/paket imza doğrulaması

Android: **APK imzası** yeniden paketlemeye karşı (v2/v3). Genel hâli: "yüklediğim
bileşen beklenen sürüm mü?"

```text
Demo 6:
  ADIM 3  modul degismedi -> imza TUTTU -> yuklenebilir
  ADIM 4  1 bayt eklenir  -> imza TUTMADI -> REDDEDILDI
```

> **Fark:** APK v2/v3 **açık anahtar (asimetrik)** imza kullanır; burada öğretim için
> **HMAC**. Asimetrik imza + sertifika: **Hafta 10**. İlke aynı: yüklemeden önce
> bütünlük + kaynak.

---

# Demo 6/7 — kural

✅ Dinamik yüklenen her bileşeni yüklemeden **önce** kriptografik doğrula
✅ **Karşılıklı** doğrulama (K6): native ↔ üst katman birbirini doğrular
✅ Root'u **risk skoru** olarak kullan; platform attestation ekle
✅ Uzun vadede **asimetrik imza** (dağıtım kolaylığı)

---

<!-- _class: bolum -->

# 7. Kontrol akışı bütünlüğü

---

# Tek bir `if` neden yetmez?

- Her kontrol bir yerde `if (tehlike) reddet;` der
- Saldırgan o **tek atlamayı** yamalar (`je → jmp`) ve es geçer

**Çözüm (K17):** kontrolleri bir **kontrol akışı sayacına / anahtar zincirine** bağla.
Kritik işlem doğru sonucu **ancak** bütün noktalardan **sırayla** geçilmişse üretir.

---

<!-- _class: sema -->

# Kontrol akışı sayacı = veri bağımlılığı

```text
  tohum
   |  acc = HMAC(acc,'0')   <- kontrol 0
   |  acc = HMAC(acc,'1')   <- kontrol 1
   |  acc = HMAC(acc,'2')   <- kontrol 2
   v
  KRITIK ISLEM: sirri 'acc' ile AC
     zincir dogru -> gercek sonuc
     zincir yanlis -> decoy
```

Kontrol atlanır/sırası bozulursa `acc` yanlış → sır açılmaz.

---

# Demo 5 — skip saldırısı

```text
SENARYO 1 normal    : kontrol 0,1,2 -> ODEME ONAYLANDI
SENARYO 2 atlat     : (sayac=0 iz=0x0) -> REDDEDILDI, decoy
SENARYO 3 kismi     : yalniz kontrol 0 -> REDDEDILDI, decoy
SENARYO 4 sirasiz   : 2,0,1 -> REDDEDILDI, decoy
```

✅ Tek `jmp` yaması **işe yaramaz**: kritik işlem doğru sonucu ancak doğru zincirle
üretir. Çift sayaç (sayac + iz biti) ek tutarlılık.

---

<!-- _class: bolum -->

# 8. Tepki politikası, cihaz bağlama, caydırma

---

# Kötü tepki saldırgana yol gösterir

`exit(1)` → saldırgana **hangi kontrolün** tetiklediğini söyler.

| Strateji | Ne yapar |
| --- | --- |
| Fail-closed | şüphede reddet |
| Sırrı sil | tamper anında güvenle sil (K15) |
| **Decoy** | çökme yerine sahte sonuç (K16) |
| Gecikmeli/örtük | tepkiyi tetikleyiciden ayır |
| **Cihaz/sürüm bağlama** | başka cihazda açılamaz (L1/L2) |
| Telemetri | sunucuya bildir |

---

<!-- _class: sema -->

# Demo 8 — RASP motoru (capstone)

```text
  algila (butunluk+debug+ortam+kanca+root)
        |
     tamper?
    /        \
  hayir       evet
  cihaz-bagli  sir SIL + tamper bayrak
  anahtarla    + DECOY dondur
  sirri AC     + sunucuya bildir
  kullan, SIL
```

---

# Demo 8 — üç senaryo

```text
1 normal      : kontrol OK + cihaz OK -> sir "ODEME-ANAHTARI-7C4A", sonra SIL
2 tamper      : bir kontrol basarisiz -> SIL + decoy (60797327...)
3 baska-cihaz : kontrol OK ama cihaz anahtari tutmaz -> decoy
```

Cihaz bağlama = Hafta 3 güvenlik kabuğunun **en iç katmanı**: anahtarlar kopyalansa
bile başka cihazda **açılamaz**.

<!--
Konuşma notu: Değerlendirici tek kontrolü atlatıp gerçek sonuca ulaşmaya çalışır; korumaların kombinasyon halinde kırılması gerektiğini raporlar = derinlemesine savunma çalışıyor.
-->

---

<!-- _class: yogun -->

# Yaygın yanlış anlamalar

- ❌ "RASP koydum, kırılmaz" → MATE'de her istemci koruması kırılabilir; sunucu şart
- ❌ "Tek güçlü kontrol yeter" → her kontrolün karşı-tekniği var; **kombinasyon**
- ❌ "Tespit edince hemen çök" → tetikleyiciyi ele verir; **decoy + gecikme**
- ❌ "VM ise saldırıdır" → WSL2/VBS meşru; **risk skoru**, ikili karar değil
- ❌ "RASP her yere" → maliyet; **varlığın değerine** göre ölçekle

---

# Proje: bu hafta (S12, S13)

- **S12 — RASP algılama envanteri:** her kritik işlem × kontroller (neyi algılar,
  nasıl atlatılır, nasıl güçlendirilir)
- **S13 — Tepki politikası:** hangi sır silinir, fail-closed/decoy, cihaz bağlama,
  sunucu bildirimi

Rubrik: **A2.4 RASP (15p)**, **F2.4 İkili korumalar (15p)** → ÖÇ.3
Gereksinim aileleri: `CEN429-RA / RT / BD / CF`

> Vize gösterimi (H7) ve Quiz-1 (H8, 1–6. hafta) bu haftayı kapsar.

---

# Sınıf etkinlikleri

1. **Kancayı kur:** Demo 4'te `getenv`'i de kancala → hangi sinyal kör, hangisi tutar?
2. **Tek `if`'i yamala:** Demo 5 `atlat` — anahtar zinciri neden yamayı bozar?
3. **Yanlış pozitif avı:** Demo 3/7 — hangi meşru kullanıcı mağdur olur?
4. **Tepki tasarımı:** root algılandı — çök / reddet / sessiz+bildir; hangisi en az bilgi verir?

<!--
Konuşma notu: Etkinlik 1 WSL'de. Etkinlik 3 ve 4 tartışma için en verimlisi.
-->

---

# Kendini sınama (örnek)

1. RASP nedir, WAF'tan farkı?
2. MATE saldırgan modeli?
3. Self-hashing neden CRC değil HMAC?
4. `dladdr` ile kanca nasıl yakalanır?
5. Kontrol akışı sayacı neyi çözer?
6. İyi tamper tepkisi neden `exit()` değildir?

> Tam liste (16 soru) + cevaplar ders sitesinde. Quiz-1 bu tarz + kod okuma.

---

<!-- _class: baslik -->

# Gelecek hafta

**Hafta 7 — Ara Proje Gösterimleri**

Güvenlik kılavuzunuzun vize bölümleri + demo
(güvenlik analizi · veri güvenliği · C/C++ hardening · **RASP**)

Sonra: Hafta 8 **Quiz-1** (1–6. haftalar)
