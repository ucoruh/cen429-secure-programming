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

# Bugün

| Saat | Bölüm | Konu |
| --- | --- | --- |
| 1 | 1–3 | RASP nedir, RASP mimarisi · Bütünlük denetimi (self-hashing) **Demo 1** |
| 2 | 4–6 | Hata ayıklayıcı algılama **Demo 2** · Ortam/emülatör algılama **Demo 3** · Kanca/enstrümantasyon algılama **Demo 4** |
| 3 | 7–10 | Bellek koruması · Kök/imza doğrulama **Demo 6-7** · Kontrol akışı bütünlüğü **Demo 5** · Tepki politikası **Demo 8** · Proje |

**Öğrenme çıktısı (ÖÇ.3):** RASP denetimlerini (bütünlük, anti-debug, ortam, kanca) tanımak · tepki politikası ve cihaz bağlama tasarlamak · RASP'in sınırlarını ve etik çerçevesini açıklamak

> RASP = **Runtime Application Self-Protection**: uygulamanın çalışırken kendini **izlemesi** ve tehdide **tepki** vermesi. Algıla → savun → caydır. Ama tek denetim değil, **katman**.

<!-- Konuşma notu: Bu hafta çalışma anı korumalarını (RASP) işliyoruz. Sıfır ön bilgi; her terimi tanımlayacağız. Ana çerçeve: RASP algılar, savunur, caydırır; ama tek başına değil, katmanlı. -->

---

# Önceki haftalardan gelenler

- **Beyaz kutu saldırgan modeli** — cihazın sahibi olan kullanıcının aynı zamanda saldırgan olabildiği; belleği okuyup hata ayıklayıcı bağlayabildiği model **(Hafta 1)**
- **Özet, MAC ve HMAC** — özet bir veriden hesaplanan tek yönlü parmak izi; HMAC paylaşılan bir gizli anahtarla mesajın değişmediğini kanıtlar **(Hafta 3)**
- **Ana sırdan anahtar türetme (HKDF)** — bir ana sırdan Extract ve Expand adımlarıyla yeni anahtarlar türetme **(Hafta 3)**
- **Cihaz bağlama** — bir sırrın yalnızca belirli bir cihazda anlamlı olması, güvenlik kabuğunun en iç katmanı **(Hafta 3)**

Bu hafta: beyaz kutu modeli → **MATE** saldırgan modeli (Bölüm 1); HMAC → uygulamanın kendi kodunu doğrulamak (Bölüm 3); HKDF → cihaz parmak izinden anahtar türetmek (Bölüm 10); cihaz bağlama → bir RASP tepki politikasının parçası (Bölüm 10).

---

<!-- _class: yogun -->

# Bu haftanın kavramları

Her terim, gövdede ilk geçtiği yerde tanımlanır; burada yalnız **nerede** olduğunu işaretliyoruz.

| Kavram | Nerede |
| --- | --- |
| RASP (algıla/savun/caydır) | Bölüm 1 |
| MATE saldırgan modeli | Bölüm 1 |
| RASP mimarisi (ne zaman/nerede/nasıl) | Bölüm 2 |
| Bütünlük / self-hashing | Bölüm 3 |
| Hata ayıklayıcı (debugger) algılama | Bölüm 4 |
| Emülatör/VM algılama | Bölüm 5 |
| Kanca (hook) / LD_PRELOAD algılama | Bölüm 6 |
| Dinamik bellek koruması | Bölüm 7 |
| Kök (root) göstergesi | Bölüm 8 |
| Bileşen imza doğrulaması | Bölüm 8 |
| Kontrol akışı sayacı | Bölüm 9 |
| Tepki politikası ve cihaz bağlama | Bölüm 10 |

---

<!-- _class: bolum -->

# 1. RASP nedir?

---

<!-- _class: yogun -->

# Kısa tarihçe — uygulama kendini korur

- **1980'ler** — crack/anti-crack kültürü: **anti-debug** ve self-check kökeni
- **2000'ler** — DRM ve mobil bankacılık korumayı uygulamanın **içine** taşır
- **2012** — Gartner **RASP** terimini ortaya atar
- **bugün** — **OWASP MASVS-RESILIENCE** bunu denetlenebilir gereksinime çevirir

> RASP yeni bir fikir değil: **MATE saldırganına** verilen kurumsal cevabın adı.

---

# WAF ↔ RASP — şema

![w:950](assets/h06-06-waf-rasp.svg)

---

# WAF ↔ RASP karşılaştırması

| Koruma | Nerede durur | Neyi görür |
| --- | --- | --- |
| Ağ güvenlik duvarı | Ağ kenarında | Paketler |
| WAF (Web App Firewall) | Uygulamanın **önünde** | HTTP istekleri |
| **RASP** | Uygulamanın **içinde** | Kendi kodu, belleği, ortamı |

WAF "dışarıdan gelen istek zararlı mı?" sorar; RASP "**ben** kurcalandım mı?" sorar.

---

# Saldırgan modeli: MATE

- **MATE (Man-At-The-End):** uygulamanın **çalıştığı uç noktanın sahibi** olan saldırgan. Belleği okur, kodu değiştirir, hata ayıklayıcıyla izler. 11. haftadaki **beyaz kutu** modeliyle aynıdır.
- **Acı gerçek:** cihazın sahibi saldırgansa, **hiçbir istemci tarafı koruma nihai olarak kırılmaz değildir.**
- O hâlde RASP neden var? Amaç **kırılmazlık değil**; saldırıyı **ölçeklenemez ve pahalı** kılmak.

---

# Üç iş: algıla, savun, caydır

- **Algıla:** anormal ortamı/davranışı sez (debugger, emülatör, kurcalama).
- **Savun:** tehdit varsa işlevi kısıtla/durdur.
- **Caydır:** saldırıyı zahmetli kıl → saldırgan vazgeçsin.

---

# RASP döngüsü — algıla → savun → caydır

![w:1000](assets/h06-01-rasp-dongusu.svg)

---

# RASP neyi tamamlar?

- Statik korumalar (4–5. hafta) **çalışmadan** geçerli.
- Gizleme (9/11/14) **anlamayı** zorlaştırır.
- RASP, program **çalışırken** aktif savunma ekler.

> Gizleme RASP'ı gizler; RASP gizlemeyi çalışırken korur.

---

# RASP neden gerekli?

- Beyaz kutu saldırgan programı **çalıştırıp** izler (debugger, Frida).
- Statik gizleme bunu tek başına durdurmaz.
- RASP "beni izliyorlar mı?" diye bakıp tepki verir.

---

# Ana kural (baştan)

> RASP tek başına aşılmaz değildir; **katmanlı** ve **çeşitli** denetimlerle güç kazanır.

Tek bir "root mu?" denetimi kolayca atlanır; onlarca farklı denetim birlikte zorlaşır.

---

<!-- _class: bolum -->

# 2. RASP mimarisi

---

# Denetim ne zaman çalışır?

- **Başlangıçta:** açılışta ortam denetimi.
- **Kritik işlem öncesi:** ödeme/anahtar kullanımından hemen önce.
- **Periyodik:** arka planda düzenli.
- **Rastgele:** öngörülemez anlarda (saldırgan zamanlayamasın).

---

# Denetim nerede çalışır?

- **Native tarafta** (C/C++): tersine mühendisliği zor, tercih edilir.
- **Yönetilen tarafta** (Java): daha kolay okunur, ama gerekli.
- **Çapraz denetim:** iki taraf birbirini denetler.

---

# Çapraz denetim fikri

- Java tarafı, native kütüphanenin **özetini** denetler.
- Native taraf, Java tarafının **bütünlüğünü** denetler.
- Saldırgan **ikisini birden** atlamak zorunda.

---

# Çok noktalılık ve sahte parametreler

- **Çok noktalılık:** aynı denetim kodun **birçok yerinde**, her seferinde biraz farklı biçimde yapılır; bir nokta yamalanınca diğerleri hâlâ çalışır.
- **Korunan fonksiyonun içinde:** değerli bir fonksiyon (ör. anahtar türetme) kendi giriş noktasında **birkaç denetimi kendisi** yapar — sahada **on beşe yakın** denetime kadar çıkabilir.
- **Sahte parametreler:** giriş noktasında, okunabilirlik için gizlenen ve bir bütünlük denetimini tetikleyen ek parametreler bulunabilir (4. hafta).

---

# Denetim nasıl çalışır? (gizli)

- Denetim kodu **gizlenir** (9. hafta): saldırgan denetimi kolayca bulamasın.
- Sonuç **opak** (düz true/false değil).
- Tepki **gecikmeli** olabilir (birazdan).

---

# Zayıf tasarım — tek karar noktası

```c
if (debugger_present() || is_rooted() || integrity_broken())
    return ERROR;         /* patching this one line
                             bypasses everything */
decrypt_key();
```

Tek bir karşılaştırmayı ters çeviren saldırgan **bütün korumayı** geçer.

---

# Güçlü tasarım — veri bağımlılığı

Denetim sonucu bir `if`'e değil, **sonraki hesabın verisine** karışır:

- Denetim sonuçları **anahtar türetmeye** katılır (temizse doğru anahtar, değilse farklı ama geçerli görünen anahtar).
- Denetim sonuçları **opak değerlerle** taşınır (4. hafta).
- Tepki, tetikleyiciden **zaman ve kod olarak uzak** bir yerde verilir.

---

# Katmanlı denetim ağı

- Tek denetim değil, **onlarca** farklı denetim.
- Birbirini denetleyen **ağ** (checker network).
- Birini atlamak diğerini tetikler.

---

# Katmanlar birbirini korur — şema

![w:950](assets/h06-02-katmanlar.svg)

---

# Mimari · özet şema

![w:900](assets/h06-05-rasp-motoru.svg)

---

# Bu bölümün kuralı (1–2)

> Denetimi **tek yerde, tek anda, tek `if`** ile yapmayın.

Çok noktalı, çapraz, gizli ve veri bağımlı denetimler **birlikte** bir RASP mimarisi kurar.

---

# Bölüm 1–2 — kısa sınama

1. RASP'in üç işi?
2. Çapraz denetim neden güçlü?
3. Neden tek denetim değil, ağ?

<!-- Konuşma notu: Sonra bütünlük denetimi. -->

---

# Bölüm 1–2 — cevaplar

1. **Algıla** (kurcalama/debug/emülatör), **Savun** (anahtar/veri koruma, işlevi kısıtla), **Caydır** (tepki: kapan/boz/bildir).
2. Denetimler **birbirini** kontrol eder; saldırgan birini kapatınca diğeri fark eder → tek noktayı susturmak yetmez.
3. Tek denetim **tek yamayla** atlanır; örtüşen ağ her düğümü ayrı kırmayı gerektirir → **saldırı potansiyelini** yükseltir.

---

<!-- _class: bolum -->

# 3. Bütünlük denetimi (self-hashing)

---

# Fikir

- Program, **kendi kod bölümlerinin** özetini hesaplar.
- Beklenen özetle karşılaştırır.
- Kurcalanmışsa özet **tutmaz** → tepki.

---

# Nasıl çalışır? · adım adım

1. Derleme sonrası, kritik kod bloklarının özeti **kaydedilir**.
2. Çalışırken program aynı blokların özetini **yeniden** hesaplar.
3. Kayıtlı özetle karşılaştırır.
4. Fark varsa → kurcalama → tepki.

---

# Adım 1 · özeti kaydet

- Derleme **bittikten sonra**, kritik kod/veri bölgesi belirlenir.
- Bu bölgenin özeti hesaplanır ve **altın (golden) değer** olarak saklanır.
- Bu değer, "kurcalanmamış hâlin" imzasıdır.

---

# Adım 2 · çalışırken yeniden hesapla

- Program **çalışırken**, kayıtlı olan aynı kod/veri bölgesinin özetini **yeniden** hesaplar.
- Bu hesaplama derleme anında değil, **çalışma anında** olur.
- Hesaplama bir kez değil, **periyodik** de yapılabilir.

---

# Adım 3 · karşılaştır

- Yeni hesaplanan özet, kayıtlı **altın değerle** karşılaştırılır.
- Karşılaştırma **sabit zamanlı** yapılmalı (`memcmp` değil): düz karşılaştırma ilk farklı baytta durup zamanlama sızdırır (3. hafta).
- Eşitse: bütünlük **tamam**.

---

# Adım 4 · tepki ver

- Özet **tutmuyorsa** → kurcalama (yama) algılanmıştır.
- Sonuç doğrudan bir `if`'e değil, bir **tepkiye** bağlanır (10. bölüm).
- "Hemen çök" yerine daha akıllı bir tepki tercih edilir.

---

# Self-hashing — şema

![w:950](assets/h06-03-self-hashing.svg)

---

# Neyi yakalar?

- Binary dosyaya yapılan **yama** (patch).
- Bir denetimi atlamak için değiştirilen baytlar.
- Enjekte edilmiş kod.

---

# Demo 1 · çalışma zamanı bütünlük denetimi

`code/week-06/01-integrity-hmac` — self-hashing, HMAC-SHA-256.

- Ders kitabı (Viega & Messier, Tarif 12.2) bunu **CRC32** ile yapar; **CRC32 kriptografik değildir**, saldırgan CRC'yi eşleyecek şekilde kolayca ayarlar. Biz **HMAC-SHA-256** kullanıyoruz (gizli anahtar gerekir).
- Program kendi binary dosyasının özetini hesaplayıp **altın değer** olarak kaydeder.
- Binary dosyanın bir **kopyası** alınır, bir baytı değiştirilir (yama simülasyonu); yamalı kopyanın özeti altın değerle karşılaştırılır.

---

# Demo 1 · özün kodu

```c
/* Find own path, read the file, compute HMAC */
self_path(path, sizeof(path));
read_file(path, &data, &size);
crypto_hmac_sha256(RASP_KEY, 32, data, size, digest);

/* constant-time comparison */
unsigned char diff = 0;
for (int i = 0; i < 32; i++)
    diff |= expected[i] ^ digest[i];
if (diff == 0) { /* TAMAM */ } else { /* YAMA */ }
```

---

# Bütünlük denetimi (animasyon)

<iframe class="dsanim" src="anim/integrity-hmac.html?mode=slide&lang=tr" title="Öz bütünlük denetimi: bir bayt yamalanınca"></iframe>

<!-- Konuşma notu: baytların tek tek nasıl bir özete katlandığını, sonra "altın" değerin yeniden okunan baytlarla nasıl karşılaştırıldığını gösterin. -->

---

# Bütünlük denetimi — uç durum: ilk bayt yamalı

<iframe class="dsanim" src="anim/integrity-hmac.html?mode=slide&lang=tr&example=edge-first-byte" title="Uç durum: tam 10 bayt, ilk bayt yamalı"></iframe>

<!-- Konuşma notu: yamanın dosyanın NERESİNDE olduğunun önemi yok — çığ etkisi baştan sona tüm özeti değiştiriyor. -->

---

<!-- _class: kucuk -->

# Demo 1 · gerçek çıktı

```text
STEP 2 - Normal run: integrity verifies OK (no patch)
Expected   : 5aeaf45226dbb29af7...b55115de4
Computed   : 5aeaf45226dbb29af7...b55115de4
RESULT: INTEGRITY OK - target unchanged.

STEP 3 - Attack: 1 byte of the copy is changed
STEP 4 - The patched copy's HMAC is compared
Expected   : 5aeaf45226dbb29af7...b55115de4
Computed   : c47c35687dc205b93a...aca0ec8a
RESULT: PATCH DETECTED - target was modified!
```

Tek bir baytı değiştirmek özeti **tamamen** değiştirdi (çığ etkisi).

---

# ⚠️ Self-hashing tek başına yeterli değil

- Saldırgan, **özet fonksiyonunu** bulup her zaman "tutuyor" dedirtebilir.
- Ya da donanım kesme noktalarıyla denetimi atlar (van Oorschot vd.).
- Bu yüzden: gizle, çeşitlendir, çapraz denetle.

---

# Güçlendirme

- Özet denetimi kodu **gizli** (9. hafta).
- **Birden çok** blok, örtüşen bölgeler.
- Sonuç düz karşılaştırma değil, **hesaba karışır** (denetim sonucu programın davranışını etkiler).

---

# Örtüşen denetim

- Bir denetim başka bir denetimin kodunu da kapsar.
- Saldırgan birini kapatınca diğeri **bozulur**.
- Tek noktadan atlamak zorlaşır.

---

# Bu bölümün kuralı (3)

> Kritik kod/veri bölgelerinin bütünlüğünü çalışma zamanında **kriptografik** bir özetle (HMAC/imza) doğrulayın, CRC ile değil.

Denetimi tek noktada ve yalnız başlangıçta yapmayın; **periyodik, çoklu ve örtüşen** yapın.

---

<!-- _class: bolum -->

# 4. Hata ayıklayıcı algılama

---

# Anti-debug yolları — şema

![w:950](assets/h06-07-antidebug.svg)

---

# Neden debugger tehlikeli?

- **Hata ayıklayıcı (debugger):** programı adım adım çalıştırıp durduran, belleği okuyan araç (gdb, lldb, x64dbg, WinDbg).
- Saldırgan programı **durdurup** belleği okur, değer değiştirir.
- Denetimleri tek tek atlayabilir.
- RASP "bana debugger bağlı mı?" diye bakar.

---

# Debugger algılama yolları (kavram)

- İşletim sisteminin "izleniyorum mu?" bilgisini sorma.
- Belirli hata ayıklama arayüzlerinin durumu.
- Zamanlama: bir işlem beklenenden **çok uzun** sürdüyse, biri adım adım çalıştırıyor olabilir.

---

<!-- _class: kucuk -->

# Platforma göre gösterge · neler eskidi

| Ortam | Gösterge |
| --- | --- |
| **Linux / WSL** | `/proc/self/status` → `TracerPid` (>0 ise izleniyoruz); ana sürecin adı gdb/strace mı |
| **Windows** | `IsDebuggerPresent` (PEB `BeingDebugged`); `CheckRemoteDebuggerPresent`; PEB `NtGlobalFlag` |

**2003'ten bugüne:** SoftICE öldü, yerine x64dbg/WinDbg/gdb/lldb/**Frida** geçti; `ptrace`+**TracerPid** hâlâ geçerli.

---

# Zamanlama tabanlı sezme

![w:900](assets/h06-08-zamanlama.svg)

Debugger adımlaması işi **yavaşlatır**.

---

# Demo 2 · hata ayıklayıcı algılama

`code/week-06/02-debugger-detection` — anti-debug, yalnız okuma.

- Program birden çok bağımsız sinyale bakar, **hiçbir şeyi değiştirmez**.
- Kendini `ptrace` ile de izlemez; yalnız `/proc` ve PEB alanlarını **okur**.
- `demo.sh` programı önce normal, sonra `gdb` altında çalıştırır.

```c
/* Read TracerPid from /proc/self/status */
long tp = tracer_pid();
if (tp > 0) suspicious++;   /* a process is watching us */
```

---

# Hata ayıklayıcı algılama (animasyon)

<iframe class="dsanim" src="anim/debugger-presence.html?mode=slide&lang=tr" title="Hata ayıklayıcı algılama: TracerPid + ana süreç adı"></iframe>

<!-- Konuşma notu: /proc/self/status'un satır satır taranışını, TracerPid bulununca taramanın nasıl durduğunu gösterin. -->

---

# Hata ayıklayıcı algılama — uç durum: gdb bağlı

<iframe class="dsanim" src="anim/debugger-presence.html?mode=slide&lang=tr&example=gdb-attached" title="Zor: gdb altında, iki sinyal de şüpheli"></iframe>

<!-- Konuşma notu: hem TracerPid hem ana süreç adı aynı anda tetiklenince "algılandı (2 sinyal)" çıkıyor. -->

---

<!-- _class: kucuk -->

# Demo 2 · gerçek çıktı (WSL)

```text
STEP 1 - Normal run (NO debugger)
1) /proc/self/status TracerPid : 0 (no tracer)
2) Parent process name         : sh
RESULT: clean - no tracing tool visible.

STEP 2 - Run under gdb
1) /proc/self/status TracerPid : 41885 (TRACED)
RESULT: a debugger/tracing TOOL was detected (2 signal(s)).
```

Hata ayıklayıcı yokken TracerPid **0**; gdb altında **41885** (>0) çıktı.

---

# ⚠️ Tespit–karşı-tespit yarışı

Anti-debug klasik bir **silah yarışıdır**: saldırgan `ptrace`'i `LD_PRELOAD` ile no-op yapabilir, `IsDebuggerPresent`'in dönüşünü yamalayabilir, PEB bayrağını temizleyebilir.

- Her tek yöntem bilinir ve **atlanabilir**.
- Güç: **birçok** farklı yöntem + gizleme + çeşitlendirme.
- Amaç yine **caydırma** ve **gecikme**.

---

# Tepki nasıl?

- Hemen çökme her zaman iyi değil (saldırgana "burada denetim var" der).
- Daha iyi: **gecikmeli**, **dolaylı** tepki (birazdan bölüm 10).

---

# Bu bölümün kuralı (4)

> Anti-debug'ı **tek bir** `if (IsDebuggerPresent()) exit();` olarak yazmayın.

Birden çok bağımsız sinyal toplayın, sonucu bir davranışa bağlayın, tepkiyi **geciktirin**.

---

# Bölüm 3–4 — kısa sınama

1. Self-hashing neyi yakalar?
2. Neden tek başına yetmez?
3. Zamanlama nasıl debugger'ı ele verir?

<!-- Konuşma notu: Sonra emülatör ve kanca algılama. -->

---

# Bölüm 3–4 — cevaplar

1. **Kod/binary baytlarının değişmesini** (yama, breakpoint/kod enjeksiyonu) — çalışırken kendi özetini hesaplayıp beklenenle karşılaştırır.
2. Saldırgan hash rutinini/beklenen değeri bulup **atlar** veya karşılaştırmayı NOP'lar; ayrıca yalnız **statik** değişikliği yakalar. Örtüşen denetim gerek.
3. Debugger/kesme noktası kodu **yavaşlatır**; iki nokta arası süre eşiği aşarsa hata ayıklama sezilir.

---

<!-- _class: bolum -->

# 5. Ortam algılama: emülatör/VM

---

# Emülatör yanlış pozitif — şema

![w:950](assets/h06-09-emulator.svg)

---

# Neden emülatör?

- **Emülatör/VM:** bir cihazı **taklit eden** yazılım ortamı (Android emülatör, QEMU).
- Saldırgan analizini gerçek cihaz yerine **emülatörde** yapar.
- Emülatörde durdurmak, izlemek, sıfırlamak kolaydır.
- RASP "gerçek cihazda mıyım?" diye bakar.

---

# Algılama ipuçları (kavram)

- Emülatöre özgü donanım/sensör eksiklikleri.
- Tipik sahte tanımlayıcılar.
- Gerçek cihazda beklenen özelliklerin yokluğu.

---

# Algılama teknikleri (somut)

| Teknik | Nasıl | Not |
| --- | --- | --- |
| **CPUID hipervizör biti** | `CPUID.1:ECX[31]` — "hypervisor present" | Bare-metal'de 0 |
| **Hipervizör satıcı imzası** | `CPUID` yaprak `0x40000000` → 12 karakter | Bazı hipervizörler gizler |
| **Zamanlama** | Bir işlemi ölç; ağır emülasyon çok yavaşlatır | Eşik makineye göre değişir |

---

# Demo 3 · VM/emülatör ve zamanlama

`code/week-06/03-environment-timing` — yalnız CPU komutu ve saat okur.

```text
(A) CPUID.1:ECX[31] hypervisor bit    : PRESENT
    Hypervisor vendor signature        : "Microsoft Hv"
(B) time for 2,000,000 iterations      : 0.662 ms
RESULT: a hypervisor was SEEN.
```

Bu çıktı **gerçek** bir Windows dizüstünde (Hyper-V) alındı.

---

# VM/emülatör algılama (animasyon)

<iframe class="dsanim" src="anim/environment-timing.html?mode=slide&lang=tr" title="VM/emülatör algılama: CPUID + zamanlama"></iframe>

<!-- Konuşma notu: hipervizör bitinin nasıl okunduğunu, sonra 12 baytlık satıcı imzasının bayt bayt nasıl birleştiğini gösterin. -->

---

# VM/emülatör algılama — uç durum: imza tamamen boş

<iframe class="dsanim" src="anim/environment-timing.html?mode=slide&lang=tr&example=edge-blank-vendor" title="Uç durum: hipervizör var ama satıcı imzası tamamen boş"></iframe>

<!-- Konuşma notu: hipervizör biti VAR olsa bile satıcı imzası bazen tamamen boş dönebilir — bu da tek başına bir kanıt değildir. -->

---

# ⚠️ En önemli ders: yanlış pozitif

- Yukarıdaki çıktı **hipervizör "PRESENT"** dedi VE satıcı imzası **görünür** (`"Microsoft Hv"`).
- Ama bu bir analiz ortamı **değil** — sıradan bir geliştirici makinesi!
- Modern Windows'ta **Hyper-V, WSL2, VBS** yüzünden çoğu makine hipervizör bildirir.

---

# Yanlış pozitifin bedeli

- Bu bit tek başına "saldırgan analiz ediyor" anlamına **gelmez**.
- Bir uygulama sırf hipervizör gördüğü için çalışmayı **reddetseydi**, milyonlarca **meşru** kullanıcıyı engellerdi.
- Meşru kullanıcı: geliştirici, kurumsal VM kullanıcısı, WSL2/Hyper-V/VBS'li sıradan Windows kullanıcısı.
- RASP daima **birden çok göstergeyi tartar** ve her birinin **atlatılabileceğini** kabul eder.

---

# Kural: risk skoru, ikili karar değil

- Ortam algılamayı bir **risk skoru** olarak kullanın.
- Birden çok göstergeyi **birleştirin**.
- Nihai kararı **sunucu tarafı risk motoruyla** birlikte verin.

---

# Sahada nasıl uygulanır?

- Mobil dünyada karşılığı **emülatör algılamadır**: `ro.kernel.qemu`, sahte sensörler, tipik IMEI/seri değerleri.
- Aynı ilke geçerlidir: sinyal, **kanıt değil**.
- Kombinasyon + sunucu tarafı denetim.

---

# Bu bölümün kuralı (5)

> Emülatör/VM algılamada **tek bir bit asla "saldırı" anlamına gelmez.**

Sert tepki yerine risk skoru; sonuç sunucu tarafı doğrulamayla birlikte değerlendirilir.

---

<!-- _class: bolum -->

# 6. Kanca ve enstrümantasyon algılama

---

# Kısa tarihçe — statikten dinamiğe

- **1990'lar** — IAT/PLT-GOT kancaları: elle yazılmış, hedefe özel araçlar.
- **2000'ler** — `LD_PRELOAD` / DLL enjeksiyonu: genel amaçlı ama **statik**.
- **2013–2014** — **Frida** ortaya çıktı: kanca kodu **JavaScript ile çalışma zamanında** yazılır, derleme gerekmez.

---

# Kanca algılama — şema

![w:950](assets/h06-10-hook.svg)

---

# Kanca (hook) tehdidi

- Saldırgan kritik bir fonksiyonu **kancalar**: çağrıyı araya girip değiştirir.
- Örnek: "imza geçerli mi?" fonksiyonunu her zaman "evet" döndürtmek.
- Araç: **Frida**, Xposed.
- **Enstrümantasyon:** çalışan programa kod enjekte edip davranışını izleme/değiştirme; Frida bunun en yaygın aracıdır.

---

# LD_PRELOAD kancası

- Linux'ta bir kütüphaneyi programdan önce yükletip fonksiyonları **değiştirme**.
- Kritik fonksiyon saldırganın sürümüyle değişir.
- RASP yüklenen kütüphaneleri denetler.

---

<!-- _class: kucuk -->

# Kanca teknikleri — tablo

| Teknik | Nasıl | Platform |
| --- | --- | --- |
| **LD_PRELOAD** | `.so`'yu önyükleyip fonksiyon değiştirme | Linux |
| **PLT/GOT kancası** | Çağrı tablosu girişini yönlendirme | Linux/ELF |
| **Satır içi (inline) kanca** | İlk baytları `jmp` ile ezme | Her yer |
| **Frida / Xposed** | Dinamik binary enstrümantasyon | Mobil/masaüstü |

---

# Kanca algılama yolları (kavram)

- Beklenmeyen yüklenmiş kütüphaneler/modüller.
- Bilinen enstrümantasyon araçlarının izleri (bellekte, portlarda).
- Fonksiyon adreslerinin beklenenden **sapması**.

---

# ⚠️ Zayıf yol: getenv

```c
if (getenv("LD_PRELOAD") == NULL) printf("temiz\n");
```

`getenv`'in kendisi de **kancalanıp** `NULL` döndürebilir. Bu yüzden **kaynağı doğrulamak** gerekir:

1. Kritik fonksiyonu **çöz** (`dlsym`) → 2. **geldiği modülü** bul (`dladdr`) → 3. **meşru** mu denetle → 4. **karar** ver.

---

# Adım 1 · fonksiyonu çöz

```c
void *p = dlsym(RTLD_DEFAULT, "time");
```

- `dlsym`, çalışma anında **hangi fonksiyonun** çağrılacağını bulur.
- Önyüklü bir kanca varsa, `dlsym` **onu** döndürür (manipüle edilmiş sonuç).

---

# Adım 2 · kaynağı bul

```c
Dl_info info;
dladdr(p, &info);   /* the .so that provides the function */
```

- `dladdr`, bir adresin **hangi paylaşımlı nesneden (.so)** geldiğini söyler.
- `getenv` sahteciliğine **dayanmaz** — doğrudan bellek adresine bakar.

---

# Adım 3 · meşru mu denetle

```c
int hook = !is_legitimate(info.dli_fname);
```

- Beklenen kaynak **libc**, **vDSO** ya da dinamik yükleyicidir.
- Yabancı bir `.so`'dan geliyorsa → **kanca var**.

---

# Adım 4 · karar ver

- Meşru kaynak listesinde **yoksa** → kanca bayrağı kaldırılır.
- Sonuç tek başına bırakılmaz; **tepki politikasına** bağlanır (10. bölüm).
- Birden çok fonksiyon için **tekrarlanır** (tek fonksiyon yetmez).

---

# Fonksiyon bütünlüğü

- Kritik fonksiyonun ilk baytları beklenen mi?
- Kanca genelde başa bir **atlama** yerleştirir → baytlar değişir.
- Değişmişse → kanca var.

---

# LD_PRELOAD sembol çözümleme sırası (animasyon)

<iframe class="dsanim" src="anim/preload-hook-resolution.html?mode=slide&lang=tr" title="LD_PRELOAD sembol çözümleme sırası"></iframe>

<!-- Konuşma notu: yüklü nesnelerin arama sırasını ve dinamik yükleyicinin `time`'ı bulmak için hangi sırayla denediğini gösterin. -->

---

# LD_PRELOAD sırası — uç durum: kanca vDSO'dan hemen sonra

<iframe class="dsanim" src="anim/preload-hook-resolution.html?mode=slide&lang=tr&example=edge-immediately-after-vdso" title="Uç durum: kanca vDSO'dan hemen sonra, libc'den önce yükleniyor"></iframe>

<!-- Konuşma notu: kancanın listede NEREDE olduğu önemli değil — libc'den önce gelen HERHANGİ bir kanca kazanır. -->

---

<!-- _class: kucuk -->

# Demo 4 · LD_PRELOAD kancası — gerçek çıktı

```text
STEP 1 - Normal run (no LD_PRELOAD)
   time     -> linux-vdso.so.1
   getenv   -> /lib/x86_64-linux-gnu/libc.so.6
RESULT: clean - no preload/hook visible.

STEP 2 - Attack: the fake hook is loaded ONLY into this process
   time     -> bin/linux/libfake_hook.so (HOOK!)
   time(NULL) returned : 1234567890 (fixed fake value)
RESULT: function hook / preload DETECTED (2 signal(s)).
```

Temiz koşuda `time`, çekirdeğin **vDSO**'sundan çözüldü — bu **meşrudur**, kanca değil.

---

# ⚠️ Kanca algılama da atlanabilir

- Gelişmiş araçlar izlerini gizler.
- Güç: çoklu yöntem + gizleme + sunucu tarafı denetim.

---

# Bu bölümün kuralı (6)

> Kanca algılamada `getenv(LD_PRELOAD)` gibi **manipüle edilebilir** kaynaklara güvenmeyin.

Kritik fonksiyonların **kaynağını** (`dlsym`+`dladdr`) doğrulayın; birden çok fonksiyonu kontrol edin.

---

<!-- _class: bolum -->

# 7. Dinamik bellek koruması

---

# Kısa tarihçe — "yalnız RAM'de" yetmez

- **2008** — Halderman ve ortak yazarları, **"Cold Boot Attacks"** makalesinde DRAM'in güç kesilince bile
  **saniyeler-dakikalar** boyunca içeriğini koruduğunu gösterdi; bir dizüstünü soğutup yeniden başlatarak
  bellekteki tam disk şifreleme anahtarlarını kurtardılar.
- Bu, "kısa ömür" ve "asla açık tutma" önlemlerinin **doğrudan** motivasyonudur.

---

# Bellek koruma katmanları — şema

![w:900](assets/h06-13-bellek-koruma-katmanlari.svg)

---

# Sorun

- Hassas değerler (anahtar, sayaç) bellekte durur.
- Saldırgan belleği okuyup/değiştirip denetimi atlayabilir.

---

# Saldırgan bellekle ne yapar?

| Saldırı | Örnek | Hedef |
| --- | --- | --- |
| **Okuma** | Süreç belleğinin dökümünü almak, bilinen değeri aramak | Anahtar, PIN, çözülmüş veri |
| **Değiştirme** | Bir sayacı/bayrağı bellekte değiştirmek | Mantık ve denetimler |
| **İzleme** | Bir değer değiştiğinde haber veren araçlar | Değişkenlerin yerini keşfetmek |

Hepsi için saldırganın süreç belleğine **erişmesi** gerekir (debugger, OS arayüzü, enjekte kütüphane).

---

# Korunan sayaç fikri

- Kritik bir sayacı düz tutmak yerine:
  - bir **gölge kopya** + **özet** ile birlikte tut.
  - her okuma/yazmada tutarlılığı denetle.

---

# Korunan değer · kavram

```c
typedef struct { uint32_t value; uint32_t shadow; uint32_t mac; } Protected;
/* read: is value == ~shadow, and is mac correct? */
```

Saldırgan yalnız `value`'yi değiştirirse tutarsızlık yakalanır.

---

# Bellek izleme tespiti

- Hassas bölgelere beklenmedik erişim izleniyor mu?
- Bellek dökümü/tarama izleri.
- Amaç: canlı bellek analizi maliyetini artırmak.

---

# ⚠️ Bellek koruması sınırlı

- Kararlı saldırgan yine erişebilir.
- Amaç: **geciktirmek**, anahtarı kısa ömürlü kılmak (10. hafta).

---

# Bu bölümün kuralı (7)

> Bellekte **az, kısa ve dağınık** tutun; kritik değeri **gölge kopya + özetle** koruyun.

Tutarsızlık bir tepkiye bağlanmalı — sessizce yok saymak korumayı boşa çıkarır.

---

# Bölüm 5–7 — kısa sınama

1. Emülatör algılamada neden yanlış pozitif riski var?
2. Kanca (hook) fonksiyon baytlarını neden değiştirir?
3. Korunan sayaç neyi yakalar?

<!-- Konuşma notu: Sonra kök/imza, kontrol akışı bütünlüğü, tepki. -->

---

# Bölüm 5–7 — cevaplar

1. Meşru kullanıcı da **VM/emülatör/CI** kullanabilir; zayıf sinyaller gerçek cihazda da görülür → **suçsuzu engelleme** riski. Sertliği derecelendir.
2. Hook, hedefin **ilk baytlarını** bir atlama (jmp/trampoline) ile değiştirir ki çağrı saldırgan koduna sapsın → **prolog baytları** beklenenden farklı olur.
3. **Kontrol akışının atlanmasını:** kritik denetimler çalıştıkça sayaç artar; beklenen değere ulaşmazsa bir denetim **baypas** edilmiştir.

---

<!-- _class: bolum -->

# 8. Kök ortam ve imza doğrulama

---

# Kısa tarihçe — paket imzalama

- **Android 1.0 (2008)** — orijinal APK imzalama (v1): değiştirilmiş APK orijinal imzayı taşıyamaz.
- **Android 7.0 Nougat (2016)** — **APK Signature Scheme v2**: dosya dosya değil, APK'nin tamamı imzalanır.
- **Android 9 Pie (2018)** — **v3**, aynı ilkeye **anahtar döndürme** desteği ekledi.

---

# Kök göstergesinden karara — şema

![w:900](assets/h06-14-kok-gosterge-karar.svg)

---

# Köklü cihaz neden risk?

- Kök (root) = tam yetki.
- Korumalar zayıflar; saldırgan belleğe, dosyaya, sürece erişir.
- RASP "cihaz köklü mü?" diye bakar.

---

# Kök algılama (kavram)

- Bilinen kök araçlarının/dosyalarının varlığı.
- Normalde kısıtlı olan işlemlerin yapılabilmesi.
- Sistem bütünlüğü göstergeleri.

---

# ⚠️ Kök algılama atlanabilir

- Kök gizleyiciler (root hiding) vardır.
- Tek gösterge yetmez; **birçok** gösterge + sunucu denetimi.
- Tepki: kritik işlevi kısıtla, tümden engelleme (kullanıcı mağdur olmasın).

---

# Bileşen imza doğrulaması

- Çağıran/yüklenen bileşenin **dijital imzası** beklenen mi?
- Sahte/değiştirilmiş bir uygulama kütüphaneyi çağırıyorsa yakala.
- Örnek: yalnız beklenen imzalı ana uygulama SDK'yı kullanabilsin.

---

# İmza + özet birlikte

- İmza: bileşen **kim** tarafından yayımlandı?
- Özet: bileşen **değişti mi**?
- İkisi birlikte sahtekârlığı zorlaştırır.

---

# Kök/ayrıcalık gösterge taraması (animasyon)

<iframe class="dsanim" src="anim/root-indicator-scan.html?mode=slide&lang=tr" title="Kök/ayrıcalık gösterge taraması"></iframe>

<!-- Konuşma notu: 14 bilinen göstergenin taranışını ve ayrıcalık seviyesinin skora nasıl eklendiğini gösterin. -->

---

# Kök göstergesi — uç durum: birden çok işaret + yükseltilmiş

<iframe class="dsanim" src="anim/root-indicator-scan.html?mode=slide&lang=tr&example=edge-multiple-marks" title="Uç durum: birden çok gösterge + yükseltilmiş ayrıcalık"></iframe>

<!-- Konuşma notu: göstergeler birikince sinyal sayısı artar — hâlâ tek başına "kanıt" değil, ama risk skoruna daha çok katkı. -->

---

# Bileşen imzası doğrulama (animasyon)

<iframe class="dsanim" src="anim/component-signature.html?mode=slide&lang=tr" title="Bileşen imzası doğrulama: repackaging yakalama"></iframe>

<!-- Konuşma notu: üretim-zamanı imzalamayı ve yükleme-öncesi doğrulamayı yan yana gösterin. -->

---

# Bileşen imzası — uç durum: modül kısaltıldı

<iframe class="dsanim" src="anim/component-signature.html?mode=slide&lang=tr&example=edge-truncated" title="Uç durum: modül KISALTILDI (son bayt silindi)"></iframe>

<!-- Konuşma notu: yalnız bayt EKLEMEK değil, bayt SİLMEK de imzayı bozar — uzunluk da hesaba dahildir. -->

---

<!-- _class: kucuk -->

# Demo 6 ve 7 · gerçek çıktılar

```text
# Demo 7 (root/privilege indicator)
Privilege level : normal user
[FOUND] output\fake_su (extra indicator)
RESULT: an elevated/risky environment INDICATOR is present.

# Demo 6 (component signature)
Module signature DID NOT HOLD -> REPACKAGED.
Loading REJECTED.
```

Her iki demo da **yalnız okuyarak/doğrulayarak** çalışır; sistem değiştirmez.

---

# Bu bölümün kuralı (8)

> Kök/ayrıcalık göstergeleri **kanıt değil, sinyaldir** — kolayca sahtelenir.

Dinamik yüklenen her bileşeni yüklemeden **önce** kriptografik olarak doğrulayın; mümkünse karşılıklı doğrulama kurun.

---

<!-- _class: bolum -->

# 9. Kontrol akışı bütünlüğü

---

# Kısa tarihçe — kurcalamaya dayanıklılıktan CFI'ye

- **1996** — Aucsmith: birbirini **çapraz doğrulayan** dağıtık bütünlük kontrolleri fikri.
- **2001** — Collberg/Thomborson taksonomisi; Chang/Atallah **"guard"** (bekçi) fikri — birden çok denetleyici.
- **2005** — Abadi, Budiu, Erlingsson, Ligatti: **Control-Flow Integrity (CFI)**'yi akademik olarak tanımladı.

---

# Tek `if` neden yetmez?

```c
if (signature_valid()) proceed();   /* single point */
```

- Saldırgan bu tek dalı **yamalar** → denetim atlanır.
- 9. haftadaki opak boolean + rastgele çıkış burada kritik.

---

# Kontrol akışı sayacı

- Kritik denetimler doğru **sırayla** geçilmeli.
- Her denetim bir **sayacı** günceller.
- Sonda sayaç beklenen değilse → biri atlandı.

---

# Kontrol akışı sayacı — şema

![w:950](assets/h06-04-akis-sayaci.svg)

---

# Çift sayaç

- `count` (kaç kontrol noktası çalıştı) + `visited_mask` (hangi kontrol noktaları çalıştı, bit kümesi).
- İkisi de HMAC zincirinden **ayrı**, okunabilir bir teşhis verir — ama kararı tek başına vermez.
- Saldırgan bunları yamalasa bile gerçek anahtar hâlâ **HMAC zincirinden** türer (Demo 5).

---

# Sonucu davranışa bağla

- Denetim sonucu düz bir `if` değil.
- Sonuç, bir sonraki adımın **hesabına** girer (ör. bir anahtar türetmesine).
- Atlanırsa program **yanlış** çalışır (sessizce bozulur).

---

# Kontrol akışı sayacı (animasyon)

<iframe class="dsanim" src="anim/flow-counter.html?mode=slide&lang=tr" title="Kontrol akışı sayacı: beklenen yol ve atlanan kontrol"></iframe>

<!-- Konuşma notu: aşamaların altın zinciri nasıl oluşturduğunu, sonra gerçek çalışan sırayla karşılaştırıldığını gösterin. -->

---

# Kontrol akışı sayacı — uç durum: yanlış sırada

<iframe class="dsanim" src="anim/flow-counter.html?mode=slide&lang=tr&example=edge-reordered" title="Uç durum: bütün aşamalar var ama YANLIŞ SIRADA"></iframe>

<!-- Konuşma notu: bütün aşamalar çalışsa bile SIRA yanlışsa zincir farklı çıkıyor — çift sayaç bunu tek başına yakalayamaz, HMAC zinciri yakalar. -->

---

<!-- _class: kucuk -->

# Demo 5 · skip saldırısı — gerçek çıktı

```text
SCENARIO 1 - normal: every checkpoint runs in order
RESULT: PAYMENT APPROVED -> "PAYMENT-APPROVAL-TOKEN-4242"

SCENARIO 2 - skip: the checks are SKIPPED entirely
   (warning: count=0 visited_mask=0x0 expected=3/0x7)
RESULT: PAYMENT DENIED (wrong chain key). a decoy is returned

SCENARIO 4 - reorder: the checks run in the WRONG ORDER
RESULT: PAYMENT DENIED (wrong chain key). a decoy is returned
```

Kontroller atlanınca ya da sırası bozulunca zincir farklı çıktı; **gerçek sonuç üretilemedi**.

---

# Bu bölümün kuralı (9)

> Kritik kararları **tek bir boolean**'a bağlamayın (yamalanır).

Güvenlik kontrollerini bir **kontrol akışı sayacına** ve mümkünse bir **veri bağımlılığına** bağlayın.

---

<!-- _class: bolum -->

# 10. Tepki politikası ve caydırma

---

# "Hemen çök" neden kötü?

- **Tepki politikası:** RASP bir tehdit görünce **ne yapacağına** karar vermesidir.
- Saldırgana "işte tam burada denetim var" der.
- Denetimi bulup atlamayı kolaylaştırır.
- Daha akıllı tepkiler gerekir.

---

# İyi tepki örnekleri

- **Gecikmeli:** tehdidi sonra, başka yerde tetikle (kaynağı gizle).
- **Dolaylı:** işlevi sessizce bozar (yanlış sonuç üret).
- **Sunucuya bildir:** risk skoru artır, işlemi sunucuda reddet.

---

<!-- _class: kucuk -->

# Tepki stratejileri — tablo

| Strateji | Ne yapar |
| --- | --- |
| **Fail-closed** | Şüphede işlemi reddet, güven deposuna düşme |
| **Sırrı sil** | Tamper anında değerli veriyi güvenle sil |
| **Decoy (sahte) çıktı** | Çökmek yerine rastgele/sahte sonuç döndür |
| **Gecikmeli/örtük tepki** | Tepkiyi zaman/mesafe olarak tetikleyiciden ayır |
| **Cihaz/sürüm bağlama** | Sırrı cihaza/sürüme bağla |
| **Telemetri/attestation** | Olayı sunucuya bildir; sunucu risk motoru karar versin |

---

# Tepki tasarımı

- Kullanıcı deneyimini bozma (yanlış pozitif riski).
- Sert tepki yalnız **yüksek güvenli** göstergede.
- Çoğu durumda: kısıtla + sunucu denetimi.

---

# Algıla → karar → tepki döngüsü

Demo 8 (`code/week-06/08-tamper-response`) bu döngüyü tek bir **öz koruma motorunda** birleştirir:

1. Bir dizi kontrol **çalışır** (bütünlük, anti-debug, ortam…).
2. Sır, cihaz-bağlı bir anahtarla (HKDF + AES-GCM) **sarılıdır**.
3. Başarısız kontrol sayısı (ve cihaz uyuşup uyuşmadığı) dört durumlu bir **tepki politikasına**
   (`NORMAL`/`WARN`/`DEGRADE`/`LOCK`) çevrilir — ikili bir "temiz/tamper" kararı değil.

---

# RASP hattı: algıla → karar ver → tepki ver (animasyon)

<iframe class="dsanim" src="anim/rasp-pipeline.html?mode=slide&lang=tr" title="RASP hattı: algıla → karar ver → tepki ver"></iframe>

<!-- Konuşma notu: kontrollerin nasıl bir "başarısız sayısına" indirgendiğini, sonra bu sayının nasıl bir duruma ve somut bir tepkiye çevrildiğini gösterin. -->

---

# RASP hattı — uç durum: cihaz uyuşmuyor ama kontroller geçti

<iframe class="dsanim" src="anim/rasp-pipeline.html?mode=slide&lang=tr&example=edge-device-mismatch-all-pass" title="Uç durum: bütün kontroller geçti ama cihaz uyuşmuyor → yine LOCK"></iframe>

<!-- Konuşma notu: cihaz uyuşmazlığı kaç kontrolün geçtiğinden BAĞIMSIZ olarak doğrudan LOCK'a sıçrar. -->

---

<!-- _class: kucuk -->

# Adım A · algıla (senaryo 1 — normal)

```text
SCENARIO 1 - normal: 0 failed checks, device matches -> NORMAL
RESULT: NORMAL. The secret opened and is in use
        -> "PAYMENT-KEY-7C4A"
(the secret was safely wiped from memory after use)
```

Kontroller **geçti**, cihaz doğruydu → sır açıldı, kullanıldı, hemen **silindi**.

---

<!-- _class: kucuk -->

# Adım B · karar (senaryo: warn/degrade)

```text
SCENARIO 2 - warn: 1 failed check -> WARN
RESULT: WARN. One weak signal is not worth degrading
        service over. The secret still opened.

SCENARIO 3 - degrade: 2 failed checks -> DEGRADE
RESULT: DEGRADE. Multiple signals -> full trust withdrawn.
RESULT-VALUE: PAYM**** (redacted)
```

Bir kontrol başarısız → motor **hâlâ** sırrı açtı, yalnız kaydetti (`WARN`). İki kontrol başarısız → sır silindi, **sansürlü** sonuç döndü (`DEGRADE`).

---

<!-- _class: kucuk -->

# Adım C · tepki (senaryo: lock / başka cihaz)

```text
SCENARIO 4 - lock: 3 failed checks -> LOCK
RESULT: LOCK -> detection checks failed (tamper)

SCENARIO 5 - other-device: checks pass, device key
             does not hold -> LOCK
RESULT: LOCK -> device/version binding failed (cloned?)
```

Kontroller geçse **bile** cihaz-bağlı anahtar tutmadı → sır **açılamadı**; üç kontrol başarısız olunca da aynı `LOCK` durumuna gidilir. Bu, Hafta 3'teki güvenlik kabuğunun en iç katmanıdır.

---

# Tepki politikası durum makinesi (animasyon)

<iframe class="dsanim" src="anim/tamper-response-policy.html?mode=slide&lang=tr" title="Tepki politikası durum makinesi: uyar → düşür → kilitle"></iframe>

<!-- Konuşma notu: bir izleme zaman çizelgesindeki her çağrının dört durumdan birine nasıl sınıflandırıldığını gösterin. -->

---

# Durum makinesi — uç durum: her zaman LOCK

<iframe class="dsanim" src="anim/tamper-response-policy.html?mode=slide&lang=tr&example=edge-all-device-mismatch" title="Uç durum: kontroller hep geçiyor ama cihaz HİÇ uyuşmuyor → hep LOCK"></iframe>

<!-- Konuşma notu: kontrol sayısı sıfır başarısız olsa bile cihaz uyuşmazlığı HER ZAMAN LOCK'a gider. -->

---

# Cihaz bağlama — şema

![w:950](assets/h06-12-cihaz-baglama.svg)

---

# Cihaz bağlama

- Anahtar/veri yalnız **belirli cihazda** anlamlı.
- Kopyalanırsa (başka cihaz) işe yaramaz.
- Kod sökmeye (9/11. hafta) karşı.

---

# Cihaz bağlama akışı · adım adım

**Adım 1 — parmak izini oku:** cihazın donanım/OS parmak izi okunur (5. hafta).

**Adım 2 — anahtar türet:** parmak izi + sürüm dizesinden **HKDF** ile bir anahtar türetilir; sır bu anahtarla **AES-GCM** ile sarılır.

**Adım 3 — taşınırsa aç:** dosya başka bir cihaza kopyalansa bile, o cihazın parmak izi **farklı** olduğundan türetilen anahtar tutmaz → sır **açılamaz**.

---

# Caydırma · nihai amaç

> RASP saldırıyı **imkânsız** kılmaz; **zahmetli ve riskli** kılar.

Yeterince katman + sunucu denetimi → saldırgan vazgeçer ya da yakalanır.

---

# Tepki: nasıl karar verilir?

1. **Gösterge ne kadar güvenilir?** Çok güvenilir → reddet + sunucuya bildir. Belirsiz → devam et, risk skorunu artır.
2. **Kullanıcı deneyimi etkilenir mi?** Yanlış pozitif riski yüksekse **sert tepki verme**; sessiz kısıtlama + sunucu denetimi tercih et.
3. **Tepki denetimi ele verir mi?** Hemen çökme kaynağı gösterir; **gecikmeli/dolaylı** tepki kaynağı gizler.

---

<!-- _class: yogun -->

# Tepki akışı · tek bakış

![w:900](assets/h06-11-tepki.svg)

---

# Bu bölümün kuralı (10)

> Tepkiyi tetikleyiciden **ayırın**: hemen `exit()` saldırgana yol gösterir.

Tamper anında sırrı **silin**, çökmek yerine **decoy** döndürün, olayı sunucuya bildirin, sırrı cihaza bağlayın.

---

# Bölüm 8–10 — kısa sınama

1. Köklü cihaz neden risk?
2. Tek `if`'i sayaç neden güçlendirir?
3. Neden "hemen çök" kötü bir tepki olabilir?

<!-- Konuşma notu: Sonra sınırlar, etik, proje. -->

---

# Bölüm 8–10 — cevaplar

1. **Root/jailbreak** bellek okuma/yazma, hook, sertifika enjeksiyonu engellerini kaldırır → RASP varsayımları ve izolasyon çöker.
2. Tek `if` bir NOP/yama ile atlanır; **sayaç** denetimin gerçekten çalıştığını sonradan doğrular (dağıtık kanıt) → tek yama yetmez.
3. "Hemen çök" saldırgana denetimin **tam yerini** gösterir ve yanlış pozitifte meşru kullanıcıyı vurur. **Gecikmeli/sessiz/aldatıcı** tepki daha iyi.

---

<!-- _class: bolum -->

# 11. Sınırlar ve etik

---

# RASP'in sınırları

- Her tek denetim **atlanabilir**.
- Köklü cihazda güç azalır.
- Yanlış pozitif → gerçek kullanıcı mağdur olabilir.
- Bakım maliyeti yüksek (araçlar gelişir).

---

# RASP'in sınırları — şema

![w:900](assets/h06-15-rasp-sinirlari.svg)

---

# O yüzden RASP...

- **Katmanlı** (çok denetim), **çeşitlendirilmiş**, **gizli**.
- **Sunucu tarafı** denetimle birlikte (asıl güvence).
- Tek başına "aşılmaz" iddiası **yanlıştır**.

---

# Etik ve kullanıcı

- RASP kullanıcının cihazında çalışır; **aşırı veri toplama** etik değil.
- Yanlış pozitif kullanıcıyı hizmetten edebilir → dikkatli tepki.
- Şeffaflık ve gizlilik dengesi.

---

# ⚠️ Güvenli örnek kuralı

- Ders demoları öğrenci cihazına **zarar vermez**.
- Gerçek kök/sistem değişikliği yok; sentetik göstergeler.
- Amaç kavramı öğretmek, saldırı aracı yapmak değil.

---

# Uçtan uca: bir RASP katmanı kurmak

Sentetik bir "lisans denetimi"ni RASP ile koruyalım:

- bütünlük denetimi
- hata ayıklayıcı denetimi
- akıllı tepki

<!-- Konuşma notu: Sentetik bir örnekte bütünlük + anti-debug + tepki adım adım kuruyoruz. -->

---

# Adım 1 · korunacak nokta

```c
int license_is_valid(void) {
    /* ... check ... */
    return result;   /* the attacker's target */
}
```

Bu fonksiyon ve onu çağıran akış kritik.

---

# Adım 2 · bütünlük denetimi ekle

- Derleme sonrası bu bölgenin özetini kaydet.
- Çalışırken yeniden hesapla, karşılaştır.
- Fark → kurcalama bayrağı.

---

# Adım 3 · anti-debug ekle

- Zamanlama + OS göstergesiyle "izleniyor muyum?".
- Sonucu tek başına bırakma; başka denetimle **birleştir**.

---

# Adım 4 · sonucu davranışa bağla

- `license_is_valid` sonucu düz true/false değil.
- Bütünlük + anti-debug göstergeleri, sonucun **hesabına** girer.
- Kurcalama varsa fonksiyon **yanlış** çalışır.

---

# Adım 5 · tepki

- Hemen çökme yerine: bayrağı sunucuya bildir, işlevi kısıtla.
- Gecikmeli tetik: kaynağı gizle.

---

# Adım 6 · gizle ve çeşitlendir

- Denetim kodunu gizle (9. hafta).
- Her sürümde farklı yerleştirme (çeşitlendirme).
- Çapraz denetim ekle.

---

# Adım 7 · ölç ve belgele

- Kaç denetim, nerede, hangi tepki?
- Başarım maliyeti (denetimler yavaşlatır).
- S10'a yaz.

---

<!-- _class: bolum -->

# Saldırgan ile savunmacı: bir diyalog

<!-- Konuşma notu: Her denetim için "saldırgan ne yapar → savunma ne ekler" döngüsünü gösteriyoruz. Bu, katmanlı savunmanın neden gerekli olduğunu somutlaştırır. -->

---

# Neden bu diyalog?

Güvenlik bir **hamle-karşı hamle** oyunudur.

Her savunmaya bir saldırı, her saldırıya yeni savunma.

Katmanlı savunma bu yüzden gereklidir.

---

# Bütünlük · diyalog

- **Savunma:** self-hashing ekle.
- **Saldırgan:** özet fonksiyonunu bul, hep "tutuyor" dedirt.
- **Savunma:** özeti gizle, örtüştür, sonucu davranışa bağla.

---

# Anti-debug · diyalog

- **Savunma:** debugger denetimi ekle.
- **Saldırgan:** denetimi bul, atla.
- **Savunma:** çok yöntem + zamanlama + gizleme; tepkiyi gecikmeli yap.

---

# Hook · diyalog

- **Savunma:** fonksiyon baytlarını denetle.
- **Saldırgan:** kancayı gizle, baytları geri düzelt.
- **Savunma:** çapraz denetim + sunucu tarafı doğrulama.

---

# Kök · diyalog

- **Savunma:** kök göstergelerini denetle.
- **Saldırgan:** kök gizleyici kullan.
- **Savunma:** çok gösterge + sunucu risk skoru; sert tepki değil kısıtlama.

---

# Diyalogdan ders

- Tek savunma her zaman aşılır.
- Güç: **çokluk + gizlilik + çeşitlilik + sunucu**.
- Amaç: saldırıyı **ekonomik olmaktan çıkarmak**.

---

<!-- _class: yogun -->

# RASP denetim kataloğu (1)

| Denetim | Ne yakalar | Sınır |
| --- | --- | --- |
| Bütünlük (self-hash) | Binary yama | Özet fn. atlanabilir |
| Anti-debug | Debugger bağlı | Bilinen yöntemler atlanır |
| Emülatör | Sahte ortam | Yanlış pozitif |

---

<!-- _class: yogun -->

# RASP denetim kataloğu (2)

| Denetim | Ne yakalar | Sınır |
| --- | --- | --- |
| Hook/Frida | Fonksiyon kancası | Gizli araçlar |
| Kök | Yetki yükseltme | Kök gizleyiciler |
| İmza | Sahte bileşen | Anahtar sızarsa |
| CFI sayacı | Denetim atlama | Karmaşık yama |

---

# Katalogdan ders

- Her denetimin bir **kör noktası** var.
- Tek başına hiçbiri yeterli değil.
- Katalogdan **birçoğunu** seç, birleştir, çeşitlendir.

---

# Denetim seçimi

- Varlığın değerine göre kaç katman?
- Platforma göre hangi denetimler anlamlı?
- Başarım bütçesi ne kadar?

Kararı ve gerekçesini S10'a yaz.

---

# Sık yapılan hatalar

- Tek denetime güvenmek.
- Denetimi gizlememek (kolay bulunur).
- "Hemen çök" tepkisi (kaynağı ele verir).
- Sert tepki + yüksek yanlış pozitif (kullanıcı mağdur).
- Sunucu denetimini atlamak (asıl güvence orada).

---

<!-- _class: bolum -->

# 12. Proje: bu hafta (S10)

---

# Proje · S10 (RASP + tepki)

- [ ] En az iki farklı RASP denetimi (ör. bütünlük + anti-debug).
- [ ] Denetimler **gizli** ve **çeşitlendirilmiş**.
- [ ] Çapraz denetim (Java ↔ native) varsa belgele.
- [ ] Denetimlerin **ne zaman/nerede** çalıştığını belgele.
- [ ] Tepki politikası **akıllı** (gecikmeli/dolaylı — "hemen çök" değil).
- [ ] Cihaz bağlama kararı ve gerekçesi.
- [ ] Sunucu tarafı doğrulama var mı?
- [ ] Yanlış pozitif planı.
- [ ] Sınır ve kalan risk (neyi korumaz).

---

# Değerlendirici gözüyle

- "RASP var" yetmez; **kaç katman, nasıl gizli, nasıl tepki**?
- Sunucu denetimiyle nasıl birleşiyor?
- Yanlış pozitif riski nasıl yönetiliyor?

---

<!-- _class: bolum -->

# Çözümlü kendini sınama

---

# Soru 1

**RASP'in üç işi nedir?**

**Cevap:** Algıla (anormal ortam/kurcalama), savun (işlevi kısıtla/durdur), caydır (maliyeti yükselt).

---

# Soru 2

**Self-hashing neyi yakalar, neden tek başına yetmez?**

**Cevap:** Binary'ye yapılan yamayı/kurcalamayı yakalar. Saldırgan özet fonksiyonunu bulup atlatabildiği için tek başına yetmez; gizleme + çapraz + örtüşen denetim gerekir.

---

# Soru 3

**Çapraz denetim neden güçlüdür?**

**Cevap:** Java native'i, native Java'yı denetler; saldırgan **ikisini birden** atlamak zorunda kalır.

---

# Soru 4

**Zamanlama tabanlı anti-debug nasıl çalışır?**

**Cevap:** Küçük bir iş beklenenden çok uzun sürdüyse, biri programı adım adım çalıştırıyor (debugger) olabilir.

---

# Soru 5

**Tek `if` denetimini kontrol akışı sayacı neden güçlendirir?**

**Cevap:** Denetimlerin doğru sırayla geçtiğini sayar; tek bir dalı yamalamak sayacı bozar, atlanma yakalanır.

---

# Soru 6

**"Hemen çök" neden her zaman iyi bir tepki değildir?**

**Cevap:** Saldırgana denetimin tam yerini gösterir. Gecikmeli/dolaylı tepki + sunucu bildirimi daha iyidir.

---

# Soru 7

**Emülatör algılamada yanlış pozitif riski neden önemli?**

**Cevap:** Gerçek cihaz/geliştirici ortamı emülatör gibi görünebilir; sert tepki gerçek kullanıcıyı mağdur eder.

---

# Soru 8

**RASP'in temel sınırı nedir?**

**Cevap:** Her tek denetim atlanabilir; köklü cihazda zayıflar. Güç katmandan, çeşitlilikten ve sunucu denetiminden gelir.

---

<!-- _class: bolum -->

# Quiz-1 tarzı örnek sorular

---

# Örnek · çoktan seçmeli

**RASP çapraz denetiminde amaç nedir?**

A) Kodu küçültmek
B) İki tarafı da atlamayı zorunlu kılmak ✓
C) Şifreleme hızını artırmak
D) Günlüğü kapatmak

---

# Örnek · kısa cevap

**Bir bütünlük denetimini güçlendiren üç yöntem yazın.**

Gizleme · çoklu/örtüşen blok · çapraz denetim · sonucu davranışa bağlama.

---

<!-- _class: yogun -->

# Sözlük

| Terim | Anlam |
| --- | --- |
| RASP | Çalışma anı öz-koruma |
| MATE | Uçtaki saldırgan (cihazın sahibi) |
| Self-hashing | Kendi kodunun özetini denetleme |
| Hook/Frida | Fonksiyon çağrısını araya girip değiştirme |
| CFI sayacı | Denetim sırasını sayarak doğrulama |
| Cihaz bağlama | Veriyi belirli cihaza (HKDF ile) bağlama |
| Decoy | Çökmek yerine dönen sahte sonuç |
| Fail-closed | Şüphede işlemi reddetme |
| Attestation | Bütünlüğün sunucu tarafı kanıtı |

---

<!-- _class: baslik -->

# Bir sonraki hafta

**7. hafta — Ara proje gösterimleri (RAP1)** ve **8. hafta — Quiz-1**

Hafta 7'de bu haftaki RASP kontrollerinizi (bütünlük denetimi, hata ayıklayıcı/ortam/kanca algılama, kontrol akışı sayacı, tepki politikası) projenizde canlı göstereceksiniz. Hafta 8, 1–6. haftaları kapsayan Quiz-1'dir.

Ardından **Hafta 9 — Gelişmiş gizleme ve çeşitlendirme**, bu haftanın hata ayıklayıcı/ortam algılama ve "gizleme/caydırma kırılmazlık değildir" fikirlerini kod gizleme tarafında derinleştirerek sürer.

> Bu haftanın özeti: RASP program çalışırken kendini izler ve tehdide tepki verir; tek denetim değil, **katmanlı, çeşitlendirilmiş, gizli** denetimler ve **sunucu tarafı** doğrulama ile güç kazanır. Gerçek güvence: katmanlı RASP + gizleme + kısa ömürlü anahtarlar + **sunucu tarafı doğrulama** — saldırganla oynanan bir **zaman** oyunudur.
