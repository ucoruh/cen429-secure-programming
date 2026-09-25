---
marp: true
theme: cen429
paginate: true
lang: tr
title: "CEN429 Hafta 2 — Bilgisayar Virüsleri ve Güvenlik Modelleri"
author: "Dr. Öğr. Üyesi Uğur CORUH"
header: "CEN429 Güvenli Programlama · Hafta 2"
footer: "RTEÜ Bilgisayar Mühendisliği · 2026-2027 Güz"
---


<!-- _class: baslik -->
<!-- _paginate: false -->

# Bilgisayar Virüsleri ve Güvenlik Modelleri

**CEN429 Güvenli Programlama — Hafta 2**

Dr. Öğr. Üyesi Uğur CORUH · 25.09.2026

<!--
Konuşma notu: Geçen hafta güvenliğin dilini kurduk (varlık, tehdit, STRIDE, saldırı ağacı). Bu hafta üç sütunu dolduruyoruz: tehdit (zararlı yazılım), savunma (güvenlik modelleri), ortak dil (CWE/CVE/CVSS). Altı demo var; laboratuvarı WSL veya Visual Studio'da açık tutun.
-->

---

# Bugünün planı (3 saat)

| Saat | Konu |
| --- | --- |
| 1 | Zararlı yazılım: tarih, anatomi, türler · gizlenme |
| 2 | **Demo 1–2** · karşı önlemler · saldırı ağacı (**Demo 4**) · erişim ve modeller (**Demo 3, 6**) |
| 3 | CWE · OWASP · CVE · CVSS (**Demo 5**) · yaşam döngüsü · proje |

**Öğrenme çıktısı:** ÖÇ.1 (yaygın yazılım güvenlik açıklarını tanımlar ve sınıflandırır)

<!--
Konuşma notu: Demoları önceden bir kez derleyin (code/ içinde build.ps1 ya da build.sh). Derste bekleme olmasın diye ilk üç demoyu açık bırakın.
-->

---

# Önceki haftalardan gelenler

- **Varlık, tehdit, zafiyet, risk ve saldırgan modeli** — bir varlığın değerini, ona yönelik tehdidi, zafiyeti ve
  olasılık × etki olan riski ayırt etme dili **(Hafta 1)**
- **STRIDE ve saldırı ağacı** — bir arayüzdeki tehditleri STRIDE'ın altı harfiyle sorup kök hedeften dallara
  VE/VEYA mantığıyla ayrıştırma yöntemi **(Hafta 1)**

Bu hafta: bu dili zararlı yazılım (tehdit) ve erişim modelleri (savunma) üzerinden somutlaştırıyoruz; saldırı
ağacına **maliyet** ekleyip en ucuz saldırı yolunu hesaplıyoruz (Demo 04).

---

<!-- _class: yogun -->

# Bu haftanın kavramları

Her terim, gövdede ilk geçtiği yerde tanımlanır; burada yalnız **nerede** olduğunu işaretliyoruz.

| Kavram | Nerede |
| --- | --- |
| Zararlı yazılım (malware) | Bölüm 1 |
| Bir virüsün üç parçası | Bölüm 1 |
| Zararlı yazılım türleri | Bölüm 1 |
| Gizlenme: polimorfik/metamorfik | Bölüm 2 |
| Tespit yöntemleri | Bölüm 2 |
| Entropi | Bölüm 2 |
| Denetim kaydı (audit log) | Bölüm 3 |
| Erişim denetimi | Bölüm 4 |
| DAC / MAC / RBAC | Bölüm 4 |
| Bell–LaPadula, Biba, Clark–Wilson | Bölüm 4 |
| CWE | Bölüm 5 |
| CVE ve CVSS | Bölüm 5 |
| OWASP Top 10 ve MASVS | Bölüm 5 |
| Zafiyet yaşam döngüsü | Bölüm 5 |

---

# Demolar nasıl çalışıyor?

- Tek kaynak, iki platform: **Windows (Visual Studio 2022 Community, MSVC)** ve **WSL/Linux (GCC)**
- Özet/şifreleme gerektiren demolarda Windows'ta işletim sisteminin **BCrypt** kütüphanesi, Linux'ta **OpenSSL**
  kullanılır (`code/common/cen429_kripto.h`) — Windows'ta ayrıca OpenSSL kurmanız gerekmez
- Derle: Windows `.\build.ps1` · WSL/Linux `./build.sh`
- Çalıştır: her demo klasöründe Windows `.\demo.ps1` · WSL/Linux `sh demo.sh`
- **Demo 6** (TOCTOU) yalnız WSL/Linux'ta çalışır

> ⚠️ **Etik:** Hiçbir demoda gerçek zararlı yazılım, kendini çoğaltan kod, dosya silme/şifreleme ya da ağ
> saldırısı yoktur. Hepsi kendi klasöründe, yönetici yetkisi olmadan çalışan **güvenli benzetimlerdir**;
> öğrendiklerinizi yalnız kendi bilgisayarınızda deneyin.

---

<!-- _class: bolum -->

# 1. Zararlı yazılım: türler ve tarih

---

# "Virüs" her şey değildir

**Zararlı yazılım (malware):** sahibinin izni dışında zarar veren her program.

- Virüs, zararlı yazılımın **yalnızca bir türüdür.**
- Ayrım **nasıl yayıldığına** göre yapılır:
  - **Virüs:** başka dosyaya iliştirilir, taşıyıcı çalışınca yayılır
  - **Solucan:** kendi başına, ağ üzerinden yayılır
  - **Truva atı:** masum görünür, kendini kopyalamaz
  - **Fidye / rootkit / bot / silici:** yük ya da davranış türleri

<!--
Konuşma notu: Öğrencilere sorun: "Telefonunuza bulaşan bir şey duyduğunuzda ona ne dersiniz?" Çoğu "virüs" der. Bu haftadan sonra doğru terimi kullanacaklar.
-->

---

# Haftanın üç parçası — şema

![w:950](assets/h02-01-haftanin-resmi.svg)

- **Tehdit:** zararlı yazılım türleri ve gizlenmesi
- **Savunma:** erişim denetimi ve biçimsel modeller
- **Ortak dil:** CWE · CVE · CVSS · OWASP · MASVS

---

<!-- _class: yogun -->

# Kısa tarihçe — zararlı yazılım ve güvenlik modelleri

- **1949** — von Neumann: **kendini çoğaltan** otomata (virüsün matematiksel kökü)
- **1971** Creeper · **1986** Brain (ilk PC virüsü) · **1988** **Morris Worm** interneti durdurur
- **1973–77** — **Bell–LaPadula** (gizlilik), **Biba** (bütünlük); **1987** Clark–Wilson
- **1999 → 2006** — **CVE** · **CWE** · **CVSS**: ortak sınıflandırma dili

> İki ayrı kol: **zararlıyı tanıma** + **erişimi modelleme**. Bugün ikisini birden görüyoruz.

---

# Zararlı yazılımın kısa tarihi — şema

![w:900](assets/h02-09-zararli-tarihce.svg)

---

<!-- _class: yogun -->

# Kısa tarih: dönüm noktaları

| Yıl | Olay | Türü |
| --- | --- | --- |
| 1984 | Cohen'in tanımı | Kuram: "tam tespit imkânsız" |
| 1986 | Brain | İlk yaygın PC virüsü (önyükleme sektörü) |
| 1988 | Morris | İnternette yayılan ilk büyük solucan |
| 2000 | ILOVEYOU | E-posta ekiyle milyonlar |
| 2001 | Code Red | Ağ açığıyla bellekte yayılan solucan |
| 2010 | Stuxnet | Endüstriyel denetleyiciyi hedef alan solucan |
| 2017 | WannaCry | Kendi kendine yayılan fidye yazılımı |
| 2017 | NotPetya | Fidye gibi görünen **silici** (yıkıcı) |

<!--
Konuşma notu: Tarihleri doğru verin. WannaCry, yama çıktıktan SONRA güncellememiş makinelere yayıldı; bu "yama boşluğu"na dersin sonunda döneceğiz.
-->

---

# Cohen 1984: tespitin sınırı

> Bir virüs, kendini (belki değiştirerek) başka programlara **kopyalayabilen** programdır.

- Cohen kanıtladı: **"Bu program virüs mü?"** sorusunu her durumda doğru yanıtlayan genel bir algoritma **yoktur** (durma probleminden indirgenir).
- Pratik sonuç: hiçbir antivirüs %100 tespit edemez.
  - ✅ **Yanlış pozitif:** temiz dosyayı yakalar
  - ❌ **Yanlış negatif:** zararlıyı kaçırır

**Bunu Demo 01'de kendi gözümüzle göreceğiz.**

---

# Bir virüsün üç parçası

| Parça | İşi | Hastalık benzetmesi |
| --- | --- | --- |
| **Bulaştırıcı** | Kendini kopyalar | Hücreye girip çoğalma |
| **Tetikleyici** | "Ne zaman?" koşulu | Kuluçka süresi |
| **Yük** | Asıl zarar | Semptomlar |

- Tetikleyici koşulu bekleyip patlayan koda **mantık bombası** denir.
- Her parça zorunlu değildir: yalnız yayılan, yüksüz bir virüs de vardır (yine de zafiyettir).

---

# Virüsün üç parçası — şema

![w:950](assets/h02-02-virus-uc-parca.svg)

---

# Virüs alt türleri

- **Program (dosya) virüsü:** çalıştırılabilir dosyaya bulaşır; dosya çalışınca virüs de çalışır.
- **Makro virüsü:** ofis belgesinin makro diline yazılır; belge açılınca çalışır (Melissa, 1999).
- **Önyükleme sektörü virüsü:** diskin ilk sektörüne bulaşır, işletim sisteminden **önce** çalışır (Brain, 1986).
  - Modern **UEFI Secure Boot** bu sınıfı büyük ölçüde zorlaştırdı.

<!--
Konuşma notu: "Makroları etkinleştir" uyarısı hâlâ bir saldırı yoludur. Öğrencilere hiç tanımadıkları bir belgede makro etkinleştirmemelerini söyleyin.
-->

---

# Solucan, truva atı, fidye

| Tür | Yayılma | Örnek |
| --- | --- | --- |
| **Solucan** | Kendi başına, ağdan; kullanıcı gerekmez | Morris, Code Red, WannaCry |
| **Truva atı** | Masum görünür; kullanıcı çalıştırır; kopyalanmaz | "Bedava oyun", sahte güncelleme |
| **Fidye yazılımı** | Dosyaları şifreler, para ister | CryptoLocker, WannaCry |

**Solucanın tehlikesi hızdır:** dakikalar içinde yüz binlerce makine.

---

# Diğer türler

- **Rootkit:** kendini ve diğer zararlıları işletim sisteminden **gizler** (dosya/süreç/ağ listesinden siler). Tespiti en zor sınıf.
- **Bot / botnet:** uzaktan komut alan makineler ağı (DDoS, spam, madencilik).
- **Casus / reklam yazılımı:** veri toplar ya da reklam gösterir.
- **Silici (wiper):** fidye gibi görünür ama veriyi **kalıcı yok eder** (NotPetya). Amaç para değil, yıkım.

- **Arka kapı (backdoor):** gizli erişim bırakır.

---

# Solucan ne kadar hızlı yayılır?

**SI modeli** — duyarlı (S) ve enfekte (I) makineler:

```text
i(t+dt) = i(t) + beta * i(t) * (1 - i(t)/N) * dt
```

- `beta * i`: enfekte çoğaldıkça tarama hızlanır → **üstel** büyüme
- `(1 - i/N)`: duyarlı azaldıkça isabet düşer → **doygunluk**
- Sonuç: sessiz açılış → ani patlama → doygunluk (S eğrisi)

⚠️ Savunmacının tek penceresi **açılış evresi**

<!-- Konuşma notu: Önce formülü sözle anlatın: her enfekte makine rastgele adres tarar, duyarlıya denk gelirse bulaştırır. Sonra Code Red ve Slammer sayılarını verin. -->

---

# SI modeli: adım adım

- **S (duyarlı):** henüz bulaşmamış, savunmasız makine.
- **I (enfekte):** zaten bulaşmış, kendisi de tarayan makine.
- **N:** toplam savunmasız makine sayısı (S + I).
- Her enfekte makine birim zamanda **rastgele adres tarar**; adres duyarlıya denk gelirse onu da enfekte eder.

<!-- Konuşma notu: Önce harfleri tahtaya yazın: S, I, N. Sonra "her enfekte makine ne yapar?" diye sorun; cevap bu slaytta. -->

---

# Salgın modeli — şema

![w:950](assets/h02-03-salgin-modeli.svg)

---

<!-- _class: yogun -->

# Demo 09 — Salgın simülasyonu

`code/week-02/09-salgin-simulasyonu` · yalnız hesaplama, ağ yok

```text
Senaryo: Slammer benzeri (rastgele tarama, hizli UDP)
    54 s        78    0.1% |..............................|
   1.5 dk     1430    1.9% |#.............................|
   2.4 dk    45601   60.8% |##################............|
   3.3 dk    74429   99.2% |##############################|
%90 doygunluk:  Code Red ~13.3 sa · Slammer ~2.7 dk · Hitlist ~50 s
```

- Code Red (2001): ~359.000 sunucu · ikiye katlanma ~37 dk
- Slammer (2003): tek 404 baytlık UDP paketi · ~8,5 s'de ikiye katlanma
- ✅ Ders: insan hızında tepki yetişmez → **önceden yama, kapalı port, otomatik savunma**

<!-- Konuşma notu: beta değerini yarıya indirip yeniden çalıştırın; doygunluk süresinin nasıl uzadığını gösterin. Asıl nokta: ilk bulaşmayı mümkün kılan tek bir taşma hatası. -->

---

<!-- _class: yogun -->

# Gerçek sayılar: Code Red vs Slammer

| Olay | Giriş yolu | Hız |
| --- | --- | --- |
| Code Red (2001) | IIS `.ida` taşması (CVE-2001-0500) | ~359.000 sunucu; ikiye katlanma ~37 dk |
| SQL Slammer (2003) | SQL Server ayrıştırma hizmeti, tek 404 baytlık UDP paketi (CVE-2002-0649) | ~8,5 sn'de ikiye katlandı; ~10 dk'da %90 |

Slammer'ı hızlandıran iki şey: **tek paket** yeterliydi (bağlantı kurma yok), hedefi **olabildiğince hızlı** taradı.

---

# Slammer neden yavaşladı?

- İlk dakikadan sonra yayılma hızı düştü.
- Neden? **Savunma değil** — ağın **bant genişliği doldu**.
- Solucan kendi trafiğiyle kendi yayılma kanalını tıkadı.
- Ders: bazen saldırganın kendi başarısı, kendi sınırını yaratır.

---

# İkiye katlanma süresi

- Enfekte sayısının **iki katına çıkması** için geçen süre, bir salgının hızının en sezgisel ölçüsüdür.
- Code Red: ikiye katlanma ~**37 dakika**.
- Slammer: ikiye katlanma ~**8,5 saniye**.
- Aradaki fark ~260 kat — ikisi de "solucan" olsa da savunma penceresi **tamamen farklıdır**.

---

# Demo 09 çıktısını okurken: açılış evresi

- İlk 54 saniyede yalnız **78 makine** enfekte (%0.1).
- Grafikte neredeyse hiçbir şey görünmüyor.
- 1,5 dakika sonra patlama **başlıyor**.
- "Şimdilik az" demek, üstel büyümede **en pahalı yanılgıdır.**

---

# Demo 09 çıktısını okurken: hız ve hitlist

- **Hız (beta):** tarama hızını artırmak, doygunluğu **saatlerden dakikalara** indirir.
- Bu yüzden savunma **otomatik** olmalı: güvenlik duvarı kuralı, ağ bölümleme, önceden yama.
- **Hitlist:** saldırgan hazır hedef listesiyle başlarsa açılış evresi **atlanır**.
- Savunmacının zaten dar penceresi tamamen **kapanır**.

---

# Programcıya ders (salgın)

- Yayılma hızını programcı belirlemez.
- Ama **ilk bulaşmayı mümkün kılan hatayı** programcı yapar.
- Code Red, Slammer, Blaster — hepsi **sınır denetimsiz** bir taşma ile yayıldı.
- Her dinlenen ağ portu bir **saldırı yüzeyidir**; kullanılmayan hizmeti hiç açmayın.

---

# Kendiniz deneyin: beta yarıya inerse?

`salgin.c` içindeki `beta` değerini yarıya indirip yeniden çalıştırın.

**Soru:** Doygunluk süresi nasıl değişir? Hitlist senaryosunda `i0`'ı 100'e çıkarınca fark ne kadar kalır?

**Cevap:** Beta yarıya inince büyüme yavaşlar, doygunluk süresi **uzar**. Hitlist senaryosunda açılış evresi zaten atlandığı için `i0` artışının etkisi **daha küçüktür** — hitlist'in asıl gücü açılışı atlaması, başlangıç sayısı değil.

---

<!-- _class: bolum -->

# 2. Yayılma ve gizlenme

---

<!-- _class: yogun -->

# Gizlenme merdiveni

| Yöntem | Ne değişir? | Savunma |
| --- | --- | --- |
| **Şifreleme** | Gövde şifreli, **çözücü sabit** | Çözücüyü imzala |
| **Oligomorfizm** | Çözücünün birkaç biçimi | Hepsini imzala |
| **Polimorfizm** | Çözücü **her kopyada yeniden** üretilir | Emülasyonla çöz |
| **Metamorfizm** | Şifreleme yok, **kodun tamamı** yeniden yazılır | Davranışa bak |

**Anahtar fikir:** şifreli gövde her kopyada farklı görünür, **çözülünce hep aynıdır.**

---

<!-- _class: sema -->

# Şifreli / polimorfik virüsün yapısı

![w:900](assets/h02-04-polimorfik.svg)

**Emülasyon** tam da bu son kutuyu görmek için çözücüyü çalıştırır.

---

# Demo 01 — Oyuncak antivirüs

`code/week-02/01-imza-tarayici` · Kitap: Tarif 12.1

- Zararsız, çalıştırılamayan bir **"KAPSÜL"** biçimi: başlık + çözücü + gövde.
- Dört yöntem, dört sınır:

| Yöntem | Yakalar | Atlatılır |
| --- | --- | --- |
| **Hash** | Birebir aynı dosya | Tek bayt değişince |
| **Desen** | Küçük değişiklik | Çözücü değişince (polimorfizm) |
| **Sezgisel** | İmzasız | Yanlış pozitif/negatif |
| **Emülasyon** | Hepsi | Anti-emülasyon |

---

# Demo 01 — Hash kırılgan, desen dayanıklı

```text
ADIM 2 (hash):
  ornek_a.bin        YAKALANDI  Ornek.MaviKedi.A
  ornek_a_1bayt.bin  TEMIZ      <- tek bayt degisti, ozet bambaska

ADIM 3 (desen):
  poli_1.bin  YAKALANDI  Ornek.Cozucu.xs32
  poli_2.bin  YAKALANDI  Ornek.Cozucu.xs32
  poli_3.bin  TEMIZ      <- cozucu de degisti (polimorfizm)
```

**Hash** çığ etkisiyle tek baytta kırılır; **desen** çözücüyü yakalar ama polimorfizm onu da atlatır.

<!--
Konuşma notu: poli_1 ve poli_2 aynı algoritma (xs32) farklı tohum; poli_3 farklı algoritma (lcg8) + cop komut. Desen imzasi ALGO=xs32'yi ariyordu, poli_3'te yok.
-->

---

# Demo 01 — Sezgisel: iki tür hata

```text
ADIM 5 (sezgisel):
  ornek_a.bin  TEMIZ     puan=  0   <- YANLIS NEGATIF (kacirdi)
  poli_1.bin   SUPHELI   puan= 80
  arsiv.bin    SUPHELI   puan= 50   <- YANLIS POZITIF (zararsiz)
```

- İmza olmadan polimorfiği yakaladı ✅
- Ama zararsız yüksek-entropili dosyayı şüpheli sandı ❌
- Ve düz gövdeli örneği kaçırdı ❌

**Cohen'in belirsizliği tam burada.**

---

# Demo 01 — Emülasyon hepsini çözer

```text
ADIM 6 (emulasyon):
  poli_1.bin  YAKALANDI  ... | 5 komut, 0 BOS, xs32
  poli_2.bin  YAKALANDI  ... | 5 komut, 0 BOS, xs32
  poli_3.bin  YAKALANDI  ... | 8 komut, 4 BOS, lcg8
```

- Çözücüyü **güvenli sanal makinede** çalıştırır, açılan gövdeyi tarar.
- Üç polimorfik kopya da **aynı imzaya** döndü.
- Güçlü ama **pahalı**; zararlı "sanal makinedeyim" derse gizlenebilir.

**Sonuç: tek yöntem yetmez → katmanlı savunma.**

---

# Entropi: rastgelelik ölçüsü

$$ H = -\sum_{b=0}^{255} p(b)\,\log_2 p(b) \quad (0 \dots 8 \text{ bit/bayt}) $$

- **H ~ 0:** hep aynı bayt · **H ~ 4–5:** metin/kod
- **H ~ 6:** derlenmiş program · **H ~ 8:** şifreli/sıkışık/rastgele

Antivirüs: "paketli/şifreli kod?" · EDR: "dosyaları hızla şifreleyen süreç?" (fidye)

---

# Demo 02 — Entropi ölçer

`code/week-02/02-entropi`

```text
  tekduze.txt   0.00  |........................| tekduze
  belge.txt     4.17  |#############...........| dusuk
  kod.bin       6.23  |###################.....| orta
  sifreli.bin   7.95  |########################| YUKSEK
  rastgele.bin  7.95  |########################| YUKSEK
```

⚠️ Entropi tek başına "zararlı mı?" demez: `.zip`/`.png` de yüksektir. **Beklenmedik yerde** yüksekse ipucudur.

---

# Demo 02 — Sıcak bölge ve fidye izi

```text
Karma dosya (pencere 512):
   1024-1535  4.14  dusuk
   1536-2047  7.56  YUKSEK  <- gizli sifreli bolum
   2048-2559  7.66  YUKSEK

Fidye izi: belge.txt 4.17 --> sifreli.bin 7.95
```

- Paketlenmiş programın deseni: **küçük açıcı + yüksek entropili gövde.**
- Bir süreç kısa sürede çok dosyada bu sıçramayı yapıyorsa **davranış tabanlı** koruma alarm verir.

---

<!-- _class: yogun -->

# Karşı önlemler

| Yöntem | Güçlü | Zayıf |
| --- | --- | --- |
| İmza tabanlı | Hızlı, düşük yanlış pozitif | Bilinmeyeni/polimorfiği kaçırır |
| Sezgisel | İmzasız yeni örnek | Yanlış pozitif/negatif |
| Davranış tabanlı | Gizlenmeye dirençli | Zarar başlamış olabilir |
| Kum havuzu | Gerçek davranışı görür | Yavaş; anti-VM |
| Emülasyon | Çözücüyü açar | Anti-emülasyon |
| İtibar / bulut | Hızlı yayılan tehdide iyi | Gizlilik, bağlantı |

**Modern EDR hepsini birleştirir, davranışa ağırlık verir.**

---

# Karşı önlem katmanları — şema

![w:900](assets/h02-10-karsi-onlem-katmanlari.svg)

---

# EDR örneğinde davranış izi

- Süreç, kısa sürede **yüzlerce dosyayı** okuyup yüksek entropili haliyle geri yazıyor.
- İçeriğe hiç **bakmadan**, yalnız bu davranış neredeyse kesin bir **fidye yazılımı** belirtisidir.
- Davranış tabanlı koruma dosyanın "ne olduğuna" değil, "ne yaptığına" bakar.
- Bu ipucu Demo 02'deki entropi sıçramasıyla **aynı fikrin** çalışma zamanı hâlidir.

---

# Aynı alet kutusu: saldırgan ve savunmacı

- Bir zararlının **gizlenmek** için kullandığı teknik ile meşru yazılımın **kendini korumak** için kullandığı teknik çoğu zaman **aynıdır**.
- Fark **niyet ve bağlamdadır**: biri sizin varlığınızı korur, diğeri imzadan kaçar.
- Şifreli gövde + çözücü deseni: polimorfik virüste de, korumalı mobil uygulamada da var.
- Bu simetri dönem boyunca (9., 11. hafta) tekrar karşımıza çıkacak.

---

# Örnek: mobil ödeme neden şifreli sabit tutar?

- Tersine mühendisliği **yavaşlatmak** için hassas dizeler/sabitler şifreli tutulur, kullanım anında çözülür.
- Bir değerlendirici ikili dosyada **yüksek entropili bölge** görünce sorar:
  - Çözücü nerede?
  - Anahtarı nasıl buluyor?
  - Anahtar bellekte ne kadar açık kalıyor?
- Aynı entropi ölçümü hem antivirüsün hem değerlendiricinin **ortak aracıdır**.

---

# İtibar / bulut tabanlı tespit

- Dosyanın **yaygınlığı, kaynağı, dijital imzası** bulutta sorgulanır.
- "Milyonlarca kullanıcıda görülmüş ve temiz" ise güvenilir sayılır; "hiç görülmemiş, imzasız" ise şüphelidir.
- Güçlü yanı: **hızlı yayılan** tehdide karşı anında güncellenir.
- Zayıf yanı: **gizlilik** (dosya bilgisi buluta gider) ve internet **bağlantısı** gerektirir.

---

<!-- _class: yogun -->

# Demo 07 — Kural tabanlı tespit

`code/week-02/07-kural-motoru` · YARA benzeri mini motor, **kendi zararsız desenlerimiz**

```text
kural Kelime_Baglam {
  dizge $a = "indir"
  dizge $b = "calistir"
  dizge $sihir = "KAPSUL/1"
  kosul ($a and $b) and $sihir
}
```

| Adım | Sonuç | Ders |
| --- | --- | --- |
| Zararsız kılavuz | `Kelime_Cifti` eşleşti | ❌ Bağlamsız kural → **yanlış pozitif** |
| Değişmiş varyant | yalnız joker (`??`) desen yakaladı | ✅ Değişmeyen iskeleti hedefle |
| Bozuk kural dosyası | **REDDEDİLDİ** | ✅ Tespit aracı da bir ayrıştırıcıdır |

<!-- Konuşma notu: Dar kural kaçırır, geniş kural yanlış alarm verir. Kural yalnız bilineni yakalar; bu yüzden sezgisel ve davranış tabanlı yöntemlerle birlikte kullanılır. -->

---

# Kara liste vs beyaz liste

- **Kara liste:** "kötü olanı tanı" — bilinen zararlıyı listele, geri kalanına izin ver.
- **Beyaz liste:** "iyi olanı tanı" — bilinen iyiyi listele, **geri kalan her şeyden şüphelen**.
- Bütünlük izleme, beyaz listenin **dosya düzeyindeki** biçimidir.
- Sistem iyiyken her dosyanın özeti bir **manifeste** yazılır, sonra düzenli karşılaştırılır.

<!-- Konuşma notu: Tripwire, AppLocker/WDAC ve kod imzalama denetimleri hep bu fikre dayanır. -->

---

# Soru — hangi tür, hangi katman?

E-posta ekindeki **"fatura.pdf.exe"** açılınca çalışıp adres defterindeki herkese kendini yolluyor.

**Soru:** Bu hangi tür zararlı? İlk yakalayacak katman ne olurdu?

**Cevap:** Solucan/truva karışımı — kullanıcı **açar** (truva atı gibi başlar), sonra **kendi kendine yayılır** (solucan gibi). İlk yakalayacak katman: **imza/desen** (bilinen bir örnekse) ya da **sezgisel** (yeniyse).

---

# Soru — tedarik zinciri saldırısı

Bir yazılımın **resmî güncellemesine**, derleme sırasında arka kapı ekleniyor (SUNBURST benzeri).

**Soru:** İmza tabanlı tespit ve izin listesi (whitelisting) bunu yakalar mı?

**Cevap:** **Hayır, ikisi de başarısız olur.** Dosya **geçerli imzalıdır** ve izin listesinde zaten vardır (güncelleme resmî kaynaktan geliyor). Tedarik zinciri saldırısının korkutucu yanı tam budur: güvendiğiniz kaynağın kendisi ele geçirilmiştir.

---

# Demo 08 — Bütünlük izleme (beyaz liste)

`code/week-02/08-butunluk-izleme` · SHA-256 manifesti + **HMAC mühür**

```text
DEGISTI  kutuphane.bin  c603d7c6... -> 64b8f2b2... (49->65 B)
SILINDI  veri.txt       (manifestte var, klasorde yok)
YENI     gizli.bin      (taban cizgisinde yok)
-- saldirgan manifesti yeniden yazar --
SONUC: butunluk korunmus    <- izleyici KANDIRILDI
MUHUR GECERSIZ -> manifeste GUVENME
```

✅ Özet değişikliği yakalar · ⚠️ **beklenen değerler de korunmalı** (HMAC/imza, anahtar ayrı yerde)

Tarif 12.2: CRC32 → SHA-256/HMAC · 6. haftada çalışma zamanı bütünlük denetimi

<!-- Konuşma notu: Değerlendirici önce dosyayı, sonra beklenen değeri değiştirir. İkinci test geçilemiyorsa denetim yalnız kazaya karşı korur. -->

---

# Değerlendirici: bütünlük denetimini nasıl kırar?

İki adımlı test:

1. Önce izlenen bir **dosyayı** değiştirir → tespit edildi mi?
2. Sonra **beklenen değerleri** (manifest, gömülü özet) de değiştirmeye çalışır.

İkinci test geçilemiyorsa denetim yalnız **kazaya** karşı korur, **saldırgana** karşı değil.

---

# Sabit zamanlı karşılaştırma

- İki özeti karşılaştırırken **ilk farklı bayta** kadar mı, yoksa **hep aynı sürede** mi bakılıyor?
- Süre farkı, doğru baytların **sayısını sızdırabilir** (zamanlama yan kanalı).
- Bütünlük ve HMAC karşılaştırmaları **sabit zamanlı** yapılmalı.
- Demo 08'in HMAC mührü bu yüzden özel bir karşılaştırma kullanır.

---

# Neden CRC32 yeterli değil?

- **CRC32** hata tespiti için tasarlandı, **saldırgana karşı değil**.
- Aynı CRC32 değerini veren **farklı içerik** bulmak kolaydır (çakışma ucuz).
- Saldırgan dosyayı değiştirip CRC'yi **eski değere döndürebilir**.
- Bu yüzden bütünlük denetiminde **kriptografik özet** (SHA-256) ya da **imza** gerekir.

---

<!-- _class: yogun -->

# Olaylar: içeri nasıl girdiler?

| Olay | Giriş yolu | Hata sınıfı |
| --- | --- | --- |
| Morris (1988) | `fingerd` `gets()` taşması · `sendmail` DEBUG · `rsh` güveni | CWE-120/242 · 489 · 287 |
| Code Red (2001) | IIS `.ida` taşması (CVE-2001-0500) | CWE-120 |
| Slammer (2003) | SQL çözümleme hizmeti, tek UDP paketi (CVE-2002-0649) | CWE-121 |
| Blaster (2003) | RPC/DCOM taşması (CVE-2003-0352) | CWE-120 |
| Conficker (2008) | Server hizmeti yol işleme (CVE-2008-4250) · zayıf parola | CWE-119 · 521 |
| WannaCry (2017) | SMBv1 (CVE-2017-0144) · yama 2 ay önce çıkmıştı | bellek güvenliği |
| NotPetya (2017) | güncelleme sunucusu üzerinden dağıtım | CWE-494 |
| SUNBURST (2020) | derleme ortamına arka kapı | tedarik zinciri |

<!-- Konuşma notu: Tabloyu zararlının ne yaptığıyla değil, içeri nasıl girdiğiyle okuyun. 1988-2008 çoğunlukla tek bir taşma; 2017 sonrası güncelleme ve derleme süreçleri. -->

---

# Olay incelemelerinin iskeleti — şema

![w:900](assets/h02-11-olay-iskeleti.svg)

---

# Olaylardan programcıya dersler

1. **Sınır denetimi:** 1988–2008 salgınlarının çoğu tek bir arabellek taşması (1. ve 4. hafta)
2. **Sürümde hata ayıklama kodu bırakma** (Morris / `sendmail` DEBUG)
3. **Gereksiz hizmeti açma:** her port bir saldırı yüzeyi (Slammer, Blaster)
4. **İmzalı güncelleme + istemcide doğrulama** (NotPetya) — 3. ve 10. hafta
5. **Derleme ortamı ve tedarik zinciri güvenliği** (SUNBURST) — 5. hafta SBOM
6. **Güncelleme mekanizması güvenlik özelliğidir:** yama gecikmesi = açık kapı

<!-- Konuşma notu: Tartışma sorusu: Office'in 2022'den beri internetten gelen belgelerde makroları varsayılan engellemesi hangi eski salgınların kapısını kapattı? -->

---

<!-- _class: yogun -->

# Stuxnet (2010): devlet düzeyinde saldırı

- Hedef: endüstriyel denetleyiciler (**PLC**) — bir uranyum zenginleştirme tesisi.
- Giriş: bir **kısayol (.lnk)** dosyasının görüntülenmesiyle kod yükleme + **dört** sıfırıncı gün açığı.
- **Çalınmış sürücü imzaları** kullanıldı — imzalı olduğu için güvenilir göründü.
- Programcıya ders: görüntüleme sırasında kod çalıştırmayın; imza anahtarlarını donanımda (HSM) koruyun.

---

# Eğilim: 1988–2008 vs 2017 sonrası

- **1988–2008:** salgınların çoğu **tek bir arabellek taşmasıyla** yayıldı (Morris → Conficker).
- **2017 sonrası:** giriş kapısı **güncelleme ve derleme süreçlerine** kaydı (NotPetya, SUNBURST).
- Saldırgan artık kodu kırmak yerine, kodun **size ulaştığı yolu** ele geçiriyor.
- İki savunma ucu: sınır denetimi (1., 4. hafta) + imzalı güncelleme/tedarik zinciri (3., 5., 10. hafta).

---

<!-- _class: yogun -->

# WannaCry: üç ders bir olayda

| Konu | WannaCry'da ne oldu? | Bu haftaki bağlantı |
| --- | --- | --- |
| **Yayılma** | SMB açığı (EternalBlue) ile kullanıcı hiçbir şey yapmadan solucan gibi yayıldı | Solucan tanımı, salgın modeli |
| **Yük** | Dosyaları şifreleyip fidye istedi | Entropi sıçraması (Demo 02) |
| **Yama boşluğu** | Yama saldırıdan **haftalar önce** çıkmıştı | Güncelleme = güvenlik özelliği |

Tek bir olay, bu haftanın üç ana konusunu birleştiriyor.

---

# Yama gecikmesi bir güvenlik açığıdır

- WannaCry'ın açığının yaması, saldırıdan **iki ay önce** yayımlanmıştı.
- Slammer'ınki de **aylar önceden** vardı.
- Sonuç: güncelleme mekanizması **güvenlik özelliğinin bir parçasıdır**.
- Güncellemesi zor/yavaş bir ürün, düzeltilmiş hataları bile **aylarca açık tutar**.

---

# Tartışma: makrolar neden varsayılan kapalı?

**Soru:** Office, 2022'den beri internetten gelen belgelerdeki makroları varsayılan engelliyor. Bu, Melissa ve ILOVEYOU gibi eski salgınların hangi zayıflığını kapatıyor?

**Cevap:** Kullanıcının "makroları etkinleştir" tuzağına düşmesine dayanan yayılma yolunu kapatıyor. **Varsayılan ayar**, kullanıcı eğitiminden daha güçlüdür: eğitim her kullanıcıda işe yaramayabilir, ama güvenli varsayılan **herkesi** aynı anda korur.

---

# Tedarik zinciri: SUNBURST'ten NotPetya'ya

- **NotPetya (2017):** bir muhasebe yazılımının güncelleme sunucusu ele geçirildi, on binlerce makineye yayıldı.
- **SUNBURST (2020):** bir izleme yazılımının **derleme ortamına** sızılıp imzalı kütüphaneye arka kapı eklendi.
- Ortak nokta: saldırgan **sizin güvendiğiniz kaynağı** hedef alıyor, sizi değil.
- Savunma: güncellemeleri imzala + istemcide doğrula, derleme ortamını koru (5. hafta SBOM).

---

<!-- _class: yogun -->

# Olaylardan çıkan tek satırlık dersler

| Olay | Programcı ne yapmalıydı? |
| --- | --- |
| Morris | Sınır denetimli okuma, hata ayıklama kodunu sürümde bırakmama |
| Code Red / Slammer / Blaster | Ağ girdisinin uzunluğunu doğrulama, gereksiz hizmeti kapatma |
| WannaCry | Ayrıştırıcıda sınır denetimi, eski protokolü kapatma, yamayı geciktirmeme |
| NotPetya | Güncellemeleri imzalama ve istemcide doğrulama |
| SUNBURST | Derleme ortamını koruma, tekrarlanabilir derleme |

---

<!-- _class: yogun -->

# Yanılgı: "Her zararlı bir virüstür"

**Yanılgı:** Bulaşan her şeye "virüs" denir.

**Gerçek:** Virüs yalnız **bir türdür** — taşıyıcıya iliştirilir, taşıyıcı çalışınca çalışır. Solucan taşıyıcı gerektirmez; truva atı kendini kopyalamaz.

Türü yanlış koymak, yanlış savunmayı seçtirir: solucana karşı **ağ yaması** gerekirken truva atına karşı **kullanıcı eğitimi** gerekir.

---

# Yanılgı: "İmza veritabanım güncel, güvendeyim"

**Yanılgı:** Güncel imza veritabanı yeterli korumadır.

**Gerçek:** İmza yalnız **bilineni** yakalar. Tek baytlık değişiklik özet imzasını, çözücüsü değişen polimorfik kopya **desen** imzasını atlatır (Demo 01).

İmza, savunmanın **başlangıcıdır**, bitmez.

---

# Yanılgı: "Yüksek entropi = zararlı"

**Yanılgı:** Yüksek entropili her dosya şüphelidir.

**Gerçek:** Şifreli, sıkıştırılmış ve rastgele veri hep **8'e yakındır**; `.zip`, `.png`, şifreli yedek de öyle.

Entropi yalnız **beklenmedik yerde** anlamlı bir ipucudur (Demo 02).

---

# Yanılgı: kum havuzu ve emülasyonun sınırı

**"Kum havuzunda temiz çıktı, o hâlde temiz."** Zararlı sanal ortamı **sezip uyuyabilir**; sonuç "bu koşullarda bir şey yapmadı" demektir, "zararsızdır" değil.

**"Emülasyon metamorfik zararlıyı da çözer."** Emülasyon şifreli gövdenin çözüldüğü anı yakalar; metamorfik kodda **sabit bir gövde yoktur**. Burada davranış tabanlı tespit gerekir.

---

# Yanılgı: "%100 tespit eden ürün alırız"

**Yanılgı:** Doğru ürünü seçersek hiçbir zararlı kaçmaz.

**Gerçek:** Cohen'in (1984) kanıtladığı gibi, "bu program virüs mü?" sorusunu **her durumda doğru** yanıtlayan genel bir algoritma **yoktur**.

Her tespit yöntemi yanlış pozitif ile yanlış negatif arasında bir **denge** kurar.

---

# Yanılgı: "Bütünlük izlemesini düz SHA-256 listesiyle yaptım"

**Yanılgı:** Bir dosya listesi + özetleri yeterli bütünlük denetimidir.

**Gerçek:** Saldırgan dosyayı değiştirdiği gibi **listeyi de** güncelleyebilir.

Beklenen değerler **anahtarlı** (HMAC) ya da **imzalı** olmalı ve saldırganın erişemeyeceği yerde durmalıdır (Demo 08).

---

# Yanılgı: "Yama yayımlandı, iş bitti"

**Yanılgı:** Yama çıktığı an risk biter.

**Gerçek:** WannaCry'ın kullandığı açığın yaması saldırıdan **yaklaşık iki ay önce** çıkmıştı.

Yama **uygulanana kadar** risk sürer; yayımlanan yama saldırgana da **yol gösterir**.

---

<!-- _class: yogun -->

# Kontrol listesi — zararlı yazılım ve tespit

- [ ] Virüs, solucan, truva atı, fidye, rootkit, bot, casus yazılım ve siliciyi **yayılma** ve **amaç** ile ayırabiliyorum.
- [ ] Bir virüsün bulaştırıcı, tetikleyici, yük parçalarını bir senaryoda gösterebiliyorum.
- [ ] Şifreli → oligomorfik → polimorfik → metamorfik merdiveninin her basamağını açıklayabiliyorum.
- [ ] Özet, desen, sezgisel, davranış/EDR, kum havuzu ve emülasyonun **güçlü/zayıf** yanını söyleyebiliyorum.
- [ ] SI salgın modelinde açılış/patlama/doygunluk evrelerini ve hitlist etkisini gösterebiliyorum.
- [ ] Morris, Code Red, Slammer, Stuxnet, WannaCry, NotPetya ve SUNBURST'ün **birer dersini** söyleyebiliyorum.

---

<!-- _class: bolum -->

# 3. Saldırı ağaçları ve denetim kaydı

---

# Saldırı ağacı = niceliksel tehdit

- Kök: saldırganın **hedefi** · Dallar: ona ulaşma yolları.
- **VEYA:** en ucuz çocuk yeter · **VE:** çocukların toplamı gerekir.
- Yapraklara **maliyet** yazarsak en ucuz saldırıyı buluruz.

![w:900](assets/h02-07-saldiri-agaci.svg)

---

# Saldırı ağacı kurma adımları — şema

![w:900](assets/h02-12-saldiri-agaci-kurulum.svg)

---

# Demo 04 — Savunma maliyeti artırır

`code/week-02/04-saldiri-agaci`

```text
ONCE:   EN UCUZ SALDIRI = 2  (bellekten oku)
SONRA:  EN UCUZ SALDIRI = 8  (RASP eklendi)
```

- "Bellekten oku" dalına **RASP** (anti-debug, anti-hook) eklendi.
- En ucuz saldırı **2 → 8** birime çıktı; en zayıf nokta **değişti.**
- Güvenlik yatırımını **sayıyla** gerekçelendirmenin yolu budur.

<!--
Konuşma notu: VE dugumleri saldirgani birden cok katmani birlikte kirmaya zorlar; derinlemesine savunmanin niceliksel hali.
-->

---

# Yanılgı: "VE ile VEYA fark etmez"

**Yanılgı:** Saldırı ağacında düğüm türü önemli değil.

**Gerçek:** **VEYA** düğümünde en ucuz çocuk yeter; **VE** düğümünde çocukların **toplamı** gerekir.

Karıştırmak en ucuz yolu **yanlış buldurur** ve savunma parası **yanlış dala** gider.

---

# Yanılgı: "En pahalı dalı güçlendirelim"

**Yanılgı:** Görünüşte en tehlikeli/karmaşık saldırı yolunu güçlendirmek en iyisidir.

**Gerçek:** Saldırgan her zaman **en ucuz** yolu seçer. Savunma köke giden **en ucuz yolu** pahalılaştırmıyorsa, en ucuz saldırının maliyeti hiç **değişmez** (Demo 04).

---

# Yanılgı: "Önlem eklemek yeter"

**Yanılgı:** Ağaca bir savunma düğümü eklemek riski kapatır.

**Gerçek:** Her önlemin kendisi de **atlatılabilir**. Önlem düğümünün altına onu aşma yollarını (**karşı-karşı önlem**) yazmadan hesap **iyimser** çıkar.

---

# Saldırı ağacı vs denetim kaydı: iki soru

- **Saldırı ağacı:** "Saldırgan **nereden** gelir?" — önceden, planlama sorusu.
- **Denetim kaydı (audit log):** "**Geldi mi**, ne yaptı?" — sonradan, kanıt sorusu.
- Bir olaydan sonra ne olduğunu anlamanın, sorumluyu bulmanın tek yolu **güvenilir kayıttır**.
- Kitap bunu Tarif 13.11'de işler; öneriler bugün de geçerli, yalnız araçlar güncellendi.

---

# Denetim kaydı: ne yazılır, ne yazılmaz?

| ✅ Kaydet | ❌ Asla kaydetme |
| --- | --- |
| Giriş denemeleri (kim, ne zaman, nereden) | Parola, PIN, belirteç, özel anahtar |
| Yetki ve ayar değişiklikleri | Kart numarasının tamamı, kişisel veri |
| Hassas işlemler (onay, dışa aktarma, silme) | Çözülmüş gizli veri |
| Güvenlik denetimi sonuçları | Sürümde hata ayıklama çıktısı |

Tarif 13.11 · günlüğü **saldırganın da okuyacağını** varsayarak tasarla

---

# Denetim kaydı — şema

![w:900](assets/h02-13-denetim-kaydi.svg)

---

<!-- _class: yogun -->

# Demo 10 — Günlük enjeksiyonu (CWE-117)

`code/week-02/10-gunluk-enjeksiyonu`

```text
GUVENSIZ:
  DENETIM giris kullanici=kayra
  DENETIM giris kullanici=admin sonuc=BASARILI ...  <- SAHTE satir
  DENETIM giris kullanici=deniz^[[2K^Mgizli ...     <- ekran silme
GUVENLI:
  DENETIM giris kullanici=kayra\x0A2026-... (tek satir)
  sahte 'admin BASARILI' satiri: 0
```

✅ Kaçışla (`\xNN`) · ✅ uzunluğu sınırla · ✅ `syslog(LOG_INFO, "%s", girdi)` — girdi asla biçim dizgesi değil

<!-- Konuşma notu: Kullanıcı adına gömülü tek bir satır sonu, hiç yaşanmamış bir yönetici girişini günlüğe yazdırdı. Biçim dizgesi tuzağını 4. haftaya köprü olarak anın. -->

---

# Zafiyetli kod: günlük enjeksiyonu ve biçim dizisi

```c
fprintf(log, "giris: %s\n", kullanici_adi);  /* CWE-117 */
```

```c
syslog(LOG_INFO, kullanici_girdisi);  /* CWE-134 */
```

Kullanıcıdan gelen veri günlükte **kaçışsız satır sonu** ya da **doğrudan biçim dizgesi** olarak kullanılmamalı:
`syslog(LOG_INFO, "%s", girdi)`.

---

# Özet zinciri: basit ama kırılabilir

- Fikir: her kayıt, **bir önceki kaydın özetini** içerir.
- Ortadan bir kaydı değiştirmek, sonraki **tüm zinciri** bozar.
- Sorun: saldırgan **anahtarsız** — bütün zinciri baştan yeniden hesaplayabilir.
- Çözüm: özeti **anahtarlı** yapmak → HMAC zinciri (bir sonraki slayt).

---

# Sürüm derlemesinde günlük neden kaldırılır?

- Kayıt, bir **saldırganın da okuyabileceği** varsayılarak tasarlanır.
- Günlüğe yazılan her sır, günlük dosyasına erişen **herkese** verilmiş demektir.
- Kapalı bir bayrakla **susturulmuş** hata ayıklama kodu, ikili dosyada **kalır**.
- Hem dizgeleriyle bilgi sızdırır hem de **yeniden açılabilir** — bu yüzden sürüm derlemesinde tamamen **çıkarılmalıdır**.

---

<!-- _class: yogun -->

# Demo 11 — Kurcalamaya dayanıklı günlük

`code/week-02/11-kurcalamaya-dayanikli-gunluk` · HMAC zinciri + **anahtar evrimi**

| Saldırı | Anahtar evrimli | Statik anahtar |
| --- | --- | --- |
| Kayıt değiştirme | ✅ MAC:BOZUK | ✅ yakalanır |
| Kayıt silme / sıra değiştirme | ✅ SIRA:BOZUK | ✅ yakalanır |
| Ele geçirilen anahtarla geçmişi yeniden yazma | ✅ **KURCALANMIŞ** | ❌ **BÜTÜNLÜKLÜ** görünür |

Anahtar her kayıtta tek yönlü evrilir, eski anahtar silinir → ele geçirmeden **önceki** kayıtlar korunur

<!-- Konuşma notu: Schneier–Kelsey 1999. Doğrulayıcı başlangıç anahtarını çevrimdışı tutar. En güçlü kanıt, saldırganın ulaşamadığı uzak kopyadır. -->

---

# İleriye güvenlik: anahtar neden evrilir?

- Her kayıttan sonra anahtar **tek yönlü** bir fonksiyonla değişir; eski anahtar **silinir**.
- Saldırgan makineyi ele geçirdiğinde yalnız **o anki** anahtarı bulur.
- O andan **geriye**, önceki kayıtları mühürleyen anahtarlara **dönemez**.
- Sonuç: ele geçirmeden **önceki** kayıtlar korunur (Schneier–Kelsey, 1999).

---

# Soru — sondan kesme yakalanır mı?

Demo 11'in ürettiği zincirden **son üç satırı silin**.

**Soru:** Doğrulayıcı bunu fark eder mi? Neden?

**Cevap:** Yalnızca zincirin **son değeri** ya da **kayıt sayısı** ayrıca (uzak bir sunucuda) tutuluyorsa fark eder. Zincirin kendisi yalnız dosyada tutulursa, sondan kesme **iç tutarlılığı bozmaz** — çünkü silinen kayıtlardan sonra gelen hiçbir kayıt yoktur ki tutarsızlık göstersin.

---

# Kural (özet): denetim kaydı

- Kullanıcı verisini **kaçışlayarak ve sınırlayarak** yazın.
- Sırları (parola, anahtar) **asla** yazmayın.
- Günlüğü **anahtarlı bir zincirle** mühürleyin; anahtarı her kayıtta **evriltin**.
- Doğrulama anahtarını günlüğün bulunduğu **makinede tutmayın**.
- Mümkünse kayıtları **anında** ayrı bir sunucuya gönderin.

---

# Sahada nasıl uygulanır? — mobil günlük

- Mobil uygulamalarda **cihaz üzerindeki** günlük en az tutulur, hassas alan içermez.
- Güvenlik olayları (bütünlük hatası, hata ayıklayıcı algılama) **sunucuya raporlanır**.
- Bu, 6. haftada göreceğimiz **RASP** önlemlerinin "raporlama" ayağıdır.
- Cihazdaki günlük saldırganın elindedir; asıl kanıt **uzaktaki** kopyadır.

---

# Yanılgı: "Denetim kaydına her şeyi yazalım"

**Yanılgı:** Daha çok bilgi, daha iyi kanıt demektir.

**Gerçek:** Parola, PIN, anahtar ve **tam kart numarası** kayda **asla** girmez (CWE-532).

Kayıt, olayı yeniden kurmaya **yetecek kadar** bilgi taşır: kim, ne, ne zaman, nerede, sonuç.

---

# Yanılgı: "Kullanıcı adını olduğu gibi yazdım"

**Yanılgı:** Kullanıcıdan gelen alan doğrudan günlüğe yazılabilir.

**Gerçek:** İçinde satır sonu olan bir girdi **sahte kayıt satırı** üretir (CWE-117, Demo 10).

Denetim karakterleri **kaçışlanmalı** ya da yapılandırılmış (alan alan) kayıt kullanılmalıdır.

---

# Yanılgı: "Kayıt sonuna özet ekledim, kurcalama anlaşılır"

**Yanılgı:** Dosyanın sonuna bir özet eklemek yeterli korumadır.

**Gerçek:** Anahtarsız özeti saldırgan **yeniden hesaplar**.

HMAC zinciri araya ekleme/değiştirmeyi yakalar; **sondan kesmeyi** yakalamak için son zincir değeri ayrıca (**uzak sunucuda**) tutulmalıdır (Demo 11).

---

<!-- _class: yogun -->

# Kontrol listesi — saldırı ağacı ve denetim kaydı

- [ ] Bir saldırı ağacını **VE/VEYA** kurallarıyla aşağıdan yukarı çözüp en ucuz yolu bulabiliyorum.
- [ ] Bir savunmanın en ucuz yolu **nasıl değiştirdiğini** sayıyla gösterebiliyorum (Demo 04).
- [ ] Bir denetim kaydı satırında **olması ve olmaması** gerekenleri sayabiliyorum.
- [ ] Günlük enjeksiyonunun (CWE-117) nasıl önlendiğini açıklayabiliyorum.
- [ ] HMAC zincirinin ve anahtar evriminin neyi yakalayıp **neyi yakalayamadığını** söyleyebiliyorum.

---

<!-- _class: bolum -->

# 4. Erişim denetimi ve modeller

---

# Özne, nesne, hak — ve matris

- **Özne** (kullanıcı/süreç) · **Nesne** (dosya/kayıt) · **Hak** (oku/yaz/çalıştır).

| | `odeme_anahtari` | `gunluk` |
| --- | --- | --- |
| **uygulama** | — | yaz |
| **kutuphane** | oku, yaz | yaz |
| **saldirgan** | — | — |

Matris iki biçimde saklanır: **ACL** (sütun: nesne kimin erişeceğini tutar) · **Yetenek** (satır: özne biletleri).

---

<!-- _class: yogun -->

# DAC · MAC · RBAC

| Model | Kararı kim verir? | Örnek |
| --- | --- | --- |
| **DAC** | Nesnenin **sahibi** | Unix `chmod`, Windows DACL |
| **MAC** | **Sistem/politika** (sahip değiştiremez) | Bell–LaPadula, SELinux |
| **RBAC** | İzinler **rollere**, kullanıcı role atanır | "Muhasebeci" rolü |

Gerçek sistemler üçünü **birlikte** kullanır; etkin karar çoğu zaman **kesişimdir.**

DAC **esnek** ama sızıntıya açık; MAC **katı** (askeri/etiketli); RBAC **kurumsal**, rol bazlı ve yönetimi kolaydır.

---

# DAC ve MAC — şema

![w:900](assets/h02-14-dac-mac.svg)

---

# Demo 03 — Salt DAC (matris)

`code/week-02/03-erisim-modeli`

```text
  kutuphane OKU odeme_anahtari   => IZIN
  uygulama  OKU odeme_anahtari   => RED  (matriste yok)
  saldirgan OKU odeme_anahtari   => RED
  saldirgan YAZ gunluk           => RED
```

Uygulamanın bile ödeme anahtarına **doğrudan erişimi yok** → **en az ayrıcalık.**

---

# Bell–LaPadula: gizlilik

Seviyeler: Genel < Gizli < Çok Gizli

- **Yukarı okuma yok:** kendinden gizli olanı okuyamaz.
- **Aşağı yazma yok (\*-özellik):** kendinden az gizli olana yazamaz.

> **"Read down, write up"** — gizli bilgi **aşağı sızamaz.**

Örnek: "Gizli" etiketli bir kullanıcı "Çok Gizli" bir belgeyi **okuyamaz**; "Çok Gizli" bir süreç "Genel" bir dosyaya **yazamaz** (sızıntı böyle önlenir).

<!--
Konuşma notu: Askeri kokenli (1973). "Asagi yazma yok" ilk bakista tuhaf gelir; amac cok gizli bilgiyi memurun gorebilecegi bir yere yazmayi engellemek.
-->

---

# Biba: bütünlük (BLP'nin tersi)

Seviyeler: Dış < Uygulama < Çekirdek (güvenilirlik)

- **Aşağı okuma yok:** kendinden az güvenilir veriyi okuyamaz.
- **Yukarı yazma yok:** kendinden güvenilir veriye yazamaz.

> **"Read up, write down"** — kirli bilgi **yukarı çıkamaz**, temizi bozamaz.

---

<!-- _class: sema -->

# BLP ve Biba: ters yönler

![w:900](assets/h02-05-blp-biba.svg)

**Ters yönler:** BLP gizliliği (yukarı okuma + aşağı yazma yok), Biba bütünlüğü (aşağı okuma + yukarı yazma yok) korur.

Bir veri hem gizli hem güvenilir olmalıysa → yalnız **kendi seviyesinde** işlenir.

---

# Clark–Wilson: ticari bütünlük

Askeri seviye yerine **iyi biçimli işlem + görev ayrılığı** (1987, banka):

- **CDI:** bütünlüğü korunacak veri (bakiye).
- **TP:** CDI'ye yalnız **onaylı işlemler** dokunur (doğrudan yazma yok).
- **IVP:** tutarlılığı düzenli denetler ("borç = alacak").
- **Görev ayrılığı:** başlatan ≠ onaylayan.

> "Veriye doğrudan değil, **doğrulanmış işlemlerle** dokun."

---

# Demo 03 — BLP ve Biba çıktısı

```text
BLP:  memur   OKU operasyon  BLP:RED  => RED  (yukari okuma)
      general YAZ ilan       BLP:RED  => RED  (asagi yazma)

Biba: aglayici YAZ kayit     BIBA:RED => RED  (yukari yazma)
      islemci  OKU gelen     BIBA:RED => RED  (asagi okuma)
```

DAC her ikisinde **VAR**; reddi getiren **sistem (MAC)** kuralıdır.

---

# Unix erişim modeli

`-rwxr-x---` → sahip / grup / diğerleri, her biri **oku-yaz-çalıştır**.

- Üç kimlik: **effective / real / saved** UID.
- **setuid:** program **sahibinin** (çoğu zaman root) yetkisiyle çalışır — güçlü ama tehlikeli.
- **sticky bit:** `/tmp`'te başkasının dosyasını silememe.

Kitap: Tarif 2.1

---

# Unix izin bitleri — şema

![w:950](assets/h02-08-unix-izinleri.svg)

---

<!-- _class: yogun -->

# Windows erişim modeli

| Kavram | Unix | Windows |
| --- | --- | --- |
| Kimlik | UID/GID | SID |
| İzin | Mod bitleri | **DACL** içindeki ACE'ler |
| Denetim | syslog (harici) | **SACL** (yerleşik) |
| "Herkese açık" | `chmod 777` | **NULL DACL** |

- **DACL:** kim ne yapabilir (ACE = SID + hak + izin/reddet).
- Modern Windows: **MIC** ve **AppContainer** (Biba benzeri). Kitap: Tarif 2.2

---

# Demo 06 — TOCTOU yarışı (CWE-367)

`code/week-02/06-toctou` (yalnız WSL/Linux) · Kitap: Tarif 2.3

```text
GUVENSIZ (once lstat, sonra fopen):
  >>> SALDIRI BASARILI: yazi gizli_hedef.txt'e yonlendirildi!
GUVENLI (O_NOFOLLOW ile tek adim):
  reddedildi: hedef sembolik bag
```

**Denetim ile kullanım arasındaki boşluk** bir yarıştır. Çözüm: tek atomik adım (`O_NOFOLLOW`, `O_EXCL`), fd üzerinden çalış.

---

<!-- _class: yogun -->

# Demo 12 — ACE değerlendirme algoritması

`code/week-02/12-ace-degerlendirme` · Tarif 2.2

```text
1a kanonik:  RET Herkes TAM | IZIN Pazarlama YAZ  => RED
1b bozuk:    IZIN Pazarlama YAZ | ... RET Herkes  => IZIN
2a NULL DACL (yabanci hesap) => IZIN (SAHIP_AL, IZIN_YAZ dahil!)
2b BOS DACL  (ayni hesap)    => RED
3b kalitim kesildi           => RED (liste bitti)
```

- Sıra önemli: **açık RET → açık İZİN → miras RET → miras İZİN**
- ❌ NULL DACL = herkese **her** hak · ✅ gerekli hakları açıkça ver
- Sahip, DACL ne derse desin izinleri değiştirebilir

<!-- Konuşma notu: 1a ve 1b'de ACE'ler aynı, yalnız sıra farklı. Son adımda icacls ile demonun kendi dosyasının gerçek ACL'ini gösterin. -->

---

<!-- _class: yogun -->

# Demo 13 — Unix izinleri, umask, setuid

`code/week-02/13-unix-izin-umask` · Tarif 2.1, 2.7, 1.3

```text
ayse   oku paradoks.txt ---rwxrwx  sahip -> RED
zeynep oku paradoks.txt ---rwxrwx  diger -> IZIN
0666 & ~umask:  000 -> rw-rw-rw-   022 -> rw-r--r--   077 -> rw-------
seteuid(1001)  r/e/s = 1001/1001/0   <- sakli UID hala 0!
```

- **İlk eşleşen sınıf** karar verir (sahip → grup → diğerleri)
- `fopen()` 0666 ister → hassas dosya: `open(..., 0600)`
- Kalıcı bırakma: `setresuid()` + doğrula

<!-- Konuşma notu: Benzetimdir; gerçek setuid dosyası oluşturulmaz, sudo gerekmez. Sistemdeki setuid programlar yalnız listelenir. -->

---

<!-- _class: yogun -->

# Demo 14 — RBAC, görev ayrılığı, Clark–Wilson

`code/week-02/14-rbac-clark-wilson` · banka benzetimi

```text
ATA cem GISE                 SSD(GISE,ONAYCI)  -> RED
OTURUM deniz GISE,DENETCI    DSD(GISE,DENETCI) -> RED
OTURUM deniz DENETCI         -> TAMAM
deniz IVP: beklenen 20250, bulunan 20250
```

- **SSD:** çelişen iki role atanamaz · **DSD:** aynı oturumda ikisi etkin olamaz
- CDI'ya yalnız **sertifikalı TP** dokunur; büyük havale → **ikinci kişi onayı**
- ⚠️ Hatalı TP sertifikalanırsa kurallar görmez, **IVP yakalar**

<!-- Konuşma notu: Sahada karşılığı: dört göz ilkesi, bölünmüş bilgi ve çift denetim, günlük mutabakat. -->

---

# Yanılgı: "Kimliği doğruladık, yetkiyi de doğrulamış olduk"

**Yanılgı:** Giriş yapabilen kullanıcı, her şeyi yapabilir.

**Gerçek:** **Kimlik doğrulama** "sen kimsin?" sorusudur; **yetkilendirme** "bunu yapabilir misin?" sorusudur — ayrı adımlardır.

2025 CWE Top 25'te dördüncü sıradaki **CWE-862** (eksik yetkilendirme) tam bu hatadır.

---

# Yanılgı: "Hata olursa izin verelim"

**Yanılgı:** Politika okunamıyorsa ya da belirsizse, kullanıcı mağdur olmasın diye **izin verilmeli**.

**Gerçek:** **Güvenli varsayılan** ilkesi tam tersini söyler: politika okunamıyorsa cevap **ret** olmalıdır (CWE-636, "fail-open" hatası).

"Fail-closed" (hata olunca kapat) güvenli sistemlerin varsayılanıdır.

---

# Yanılgı: "NULL DACL ile boş DACL aynı"

**Yanılgı:** İkisi de "izin yok" gibi görünür.

**Gerçek:** **NULL DACL** (hiç DACL yok) **herkese tam erişim** verir — sahiplik alma dahil. **Boş DACL** (ACE'siz liste) ise **kimseye hiçbir hak vermez**.

İlki ciddi bir zafiyettir (CWE-732); ikisini karıştırmak tehlikelidir (Demo 12).

---

# Yanılgı: "ACE sırası önemli değil"

**Yanılgı:** Aynı ACE'ler farklı sırada yazılsa da sonuç aynıdır.

**Gerçek:** Windows ACE'leri **sırayla** değerlendirir ve **ilk belirleyici** girdide durur.

Kanonik sırada açık ret girdileri izinlerden önce gelir; elle yanlış sıralanmış bir DACL, niyet edilen reddi **etkisiz bırakabilir** (Demo 12).

---

# Yanılgı: "chmod 777 ile sorun çözüldü"

**Yanılgı:** "Erişim reddedildi" hatasını `chmod 777` ile geçiştirmek pratik bir çözümdür.

**Gerçek:** Sorun izinlerin herkese açılmasıyla **çözülmez, büyütülür**.

Sırlar `0600` ile oluşturulmalı, `umask` programın başında **bilinçli** ayarlanmalıdır (Demo 13).

---

# Yanılgı: "RBAC kurduk, görev ayrılığı kendiliğinden gelir"

**Yanılgı:** Rol tabanlı erişim denetimi kurmak, görev ayrılığını otomatik sağlar.

**Gerçek:** Aynı kişiye hem "iade başlat" hem "iade onayla" rolü verilirse RBAC görev ayrılığını **sağlamaz**.

Statik (**SSD**) ya da dinamik (**DSD**) görev ayrılığı kısıtı **ayrıca** tanımlanmalıdır (Demo 14).

---

# Mobil izin modeli ve en az ayrıcalık

- Her uygulama kendi **kum havuzunda** çalışır — diğer uygulamaların verisine varsayılan olarak erişemez.
- Hassas kaynaklar (kamera, konum, kişiler) **çalışma anı izni** ister; kullanıcı onaylamadan erişilmez.
- Bu, DAC (kullanıcı onayı) ile MAC'e (sistemin zorunlu kum havuzu sınırı) benzer bir **karma modeldir**.
- En az ayrıcalık ilkesinin (Hafta 1) günümüz mobil işletim sistemlerindeki **somut hâlidir**.

---

<!-- _class: yogun -->

# Kontrol listesi — erişim denetimi

- [ ] DAC, MAC ve RBAC'ı "**kararı kim verir?**" sorusuyla ayırabiliyorum.
- [ ] BLP, Biba ve Clark–Wilson kurallarını bir senaryoya uygulayabiliyorum.
- [ ] Kimlik doğrulama ile yetkilendirme **farkını** bir örnekle açıklayabiliyorum.
- [ ] `ls -l` çıktısını, setuid/sticky bitlerini ve umask hesabını yorumlayabiliyorum.
- [ ] NULL DACL, boş DACL ve ACE sırasının neden **kritik** olduğunu gösterebiliyorum.
- [ ] RBAC'ta SSD/DSD ile görev ayrılığının nasıl **ayrıca** kurulduğunu açıklayabiliyorum.

---

<!-- _class: bolum -->

# 5. Zafiyet sınıflandırma

---

# CWE: zayıflık türleri kataloğu

- **CWE** = zayıflığın **türü** (SQL enjeksiyonu → CWE-89).
- **CWE Top 25:** o yıl en çok görülen/tehlikeli 25 zayıflık.

| CWE | Zayıflık |
| --- | --- |
| CWE-787 | Sınır dışına yazma |
| CWE-79 | XSS |
| CWE-89 | SQL enjeksiyonu |
| CWE-367 | TOCTOU (Demo 06) |
| CWE-798 | Gömülü kimlik/anahtar |

Hiyerarşik: pillar → class → base → variant. **En somut** CWE'yi seç.

---

# Yanılgı: "CWE ile CVE aynı şey"

**Yanılgı:** İkisi de aynı anlama gelir, birbirinin yerine kullanılabilir.

**Gerçek:** **CWE** zayıflığın **türüdür** (SQL enjeksiyonu → CWE-89). **CVE** belirli bir üründeki belirli açığın **kimliğidir** (Heartbleed → CVE-2014-0160).

Bir CVE, bir ya da birden çok CWE türüne **aittir**.

---

# Yanılgı: "En genel CWE'yi seçmek güvenlidir"

**Yanılgı:** Emin olmadığımda en üst düzey (genel) CWE'yi yazmak daha güvenlidir.

**Gerçek:** CWE-20 (girdi doğrulama) gibi üst düzey girdiler **düzeltmeyi anlatmaz**.

Kural: mümkün olan **en somut** (tercihen base düzeyi) CWE'yi seçin.

---

# OWASP Top 10 ve MASVS

| Belge | Kapsam | Türü |
| --- | --- | --- |
| CWE / Top 25 | Tüm yazılım | Katalog / öncelik |
| OWASP Top 10 | Web | Farkındalık / öncelik |
| OWASP ASVS | Web | Doğrulama standardı |
| OWASP **MASVS** + MASTG | **Mobil** | Doğrulama + test |

**MASVS-RESILIENCE** = tersine mühendisliğe direnç → bu dersin kod gizleme (H9, H14), RASP (H6), whitebox (H11) konuları.

---

# OWASP ve MASVS — şema

![w:900](assets/h02-16-owasp-masvs.svg)

---

# Yanılgı: "OWASP Top 10 bir kontrol listesidir"

**Yanılgı:** Top 10'daki 10 maddeyi karşılıyorsam güvenliyim demektir.

**Gerçek:** Top 10 bir **farkındalık** belgesidir, doğrulama standardı değil.

Doğrulanabilir gereksinimler web için **ASVS'de**, mobil için **MASVS ve MASTG'dedir**.

---

# CVE ve CVSS

- **CVE:** belirli üründeki belirli açığın **kimliği** (CVE-2014-0160 = Heartbleed). Bir **isim**, ciddiyet değil.
- **CVSS:** açığın **ciddiyeti** 0.0–10.0. Üç grup: **Temel** (değişmez), Zamansal, Çevresel.

Bir CVE bir ya da birden çok **CWE türüne** aittir.

---

# CWE, CVE, CVSS — şema

![w:900](assets/h02-15-cwe-cve-cvss.svg)

---

<!-- _class: yogun -->

# CVSS v3.1 Temel puan metrikleri

| Metrik | Sorusu | Değerler |
| --- | --- | --- |
| **AV** | Nereden? | Ağ / Bitişik / Yerel / Fiziksel |
| **AC** | Ne kadar zor? | Düşük / Yüksek |
| **PR** | Yetki gerekir mi? | Yok / Düşük / Yüksek |
| **UI** | Kurban gerekir mi? | Yok / Gerekli |
| **S** | Kapsam aşılıyor mu? | Değişmedi / Değişti |
| **C/I/A** | Etki? | Yüksek / Düşük / Yok |

**v4.0:** kapsam yerine ayrı VC/VI/VA + SC/SI/SA; temel puan = CVSS-B.

---

# Demo 05 — CVSS hesaplayıcı

`code/week-02/05-cvss` (Python)

```text
AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H  = 9.8  Kritik
              ... S:U -> S:C          = 10.0 Kritik
AV:L (yerel) /PR:L/... C:H/I:H/A:H    = 7.8  Yuksek
```

- **Uzaktan + kimliksiz** en yüksek; kapsam değişince 10.0.
- ⚠️ Temel puan **bağlamı bilmez**: 4.0'lık açık tam sizin varlığınızı vuruyorsa sizin için 9.8'den önemli olabilir.

---

<!-- _class: yogun -->

# CVSS puanı → ciddiyet bandı

| Puan | Bant |
| --- | --- |
| 0.0 | Yok |
| 0.1–3.9 | Düşük |
| 4.0–6.9 | Orta |
| 7.0–8.9 | Yüksek |
| 9.0–10.0 | Kritik |

Aynı etki (C:H/I:H/A:H) olsa bile **uzaktan + kimliksiz** açık, **yerel + yetkili** açıktan daha yüksek bant alır.

---

# CVSS v4.0 kısaca

- 2023'te geldi; v3.1'in bazı zayıflıklarını giderir.
- Temel puan artık **CVSS-B** olarak anılır.
- **Kapsam (S)** metriği kaldırıldı; yerine ayrı **Zafiyet Etkisi** (VC/VI/VA) ve **Sonraki Sistem Etkisi** (SC/SI/SA).
- Sömürü olgunluğu (E) ve tehdit/çevre metrikleriyle **CVSS-BTE** hesaplanabiliyor.
- Bu derste hesap makinesi v3.1 için yazıldı; sahada hâlâ en yaygın odur.

---

# Yanılgı: "v3.1 vektörünü v4.0'a girerim"

**Yanılgı:** CVSS v3.1 vektörü, v4.0 hesap makinesinde de doğrudan çalışır.

**Gerçek:** v4.0'da **Kapsam (S)** yoktur; **AT, VC/VI/VA, SC/SI/SA** metrikleri vardır ve UI üç değer alır (N/P/A).

Vektörler birbirine **çevrilmez**, yeniden **kurulur**.

---

# CVSS'in sık yapılan hatası

**Yanılgı:** "CVSS 9.8, hemen yamalayalım; 4.0, beklesin."

- Temel puan **bağlamı bilmez**: açığın kendi özelliklerini ölçer.
- 4.0'lık bir açık, tam sizin **en değerli varlığınızın** kapısıysa sizin için 9.8'den önemli olabilir.
- Bunun için **Çevresel** metrikler ve **varlık tablonuz** (S5) vardır.
- Puan önceliklendirmeye **başlangıçtır**, son söz değildir.

---

<!-- _class: yogun -->

# Değerlendirici: bulgudan puana

Bir bulguyu **tekrarlanabilir** biçimde derecelendirmenin somut soruları:

- Saldırgan bunu **ağdan** mı, yoksa yalnız **cihaz elindeyken** mi kullanabiliyor (AV)?
- Önceden bir **yetki** ya da **kullanıcı etkileşimi** gerekiyor mu (PR, UI)?
- Etki açığın olduğu bileşende mi kalıyor, dışına mı taşıyor (S)?

Bu dersin bağlamında (program saldırganın cihazında) çoğu bulgu **yerel (AV:L)** çıkar; puan düşse de risk düşmez.

---

# CVSS'in ötesi: EPSS

- **EPSS** (Exploit Prediction Scoring System): bir açığın **30 gün içinde istismar edilme olasılığı** (0–1 arası).
- **CVSS ciddiyeti** ölçer, **EPSS olasılığı** ölçer — ikisi **farklı sorulara** cevap verir.
- "EPSS yüksek, o hâlde CVSS de yüksektir" **yanlıştır**; ikisi birbirinden bağımsız ölçülür.
- İkisi **birlikte** okunduğunda öncelik sırası netleşir.

---

# CVSS'in ötesi: KEV

- **KEV** (Known Exploited Vulnerabilities): **kanıtlanmış** biçimde istismar edilen açıkların kataloğu.
- Her kayıt: CVE kimliği, istismar kanıtı, açık düzeltme yönergesi.
- "KEV'de yoksa istismar edilmiyordur" **yanlıştır** — listede olmamak güvenlik kanıtı değildir.
- KEV'deki bir açık, düşük CVSS puanı alsa bile **öncelikli** ele alınmalıdır.

---

<!-- _class: yogun -->

# SSVC: karar noktaları

Bir bulguyu **karara** çeviren beş soru:

- İstismar var mı? · Otomatikleştirilebilir mi?
- Teknik etki nedir? · Görev ne kadar yaygın etkilenir?
- Kamu esenliği nasıl etkilenir?

Sonuç dört karardan biri: **Track / Track\* / Attend / Act**

---

<!-- _class: kucuk -->

# Örnek: beş bulgu, iki sıralama

| No | Bulgu | Sistem | EPSS | KEV |
| --- | --- | --- | --- | --- |
| B1 | Ayrıştırıcıda uzunluk denetimi yok, uzaktan kod çalıştırma | İnternete açık | 0,62 | Evet |
| B5 | Sürücüde yerel yetki yükseltme | Çalışan bilgisayarları | 0,41 | Evet |
| B4 | Çerezde `Secure` bayrağı yok | İnternete açık | 0,08 | Hayır |

Yalnız CVSS'e göre sıralama ile EPSS+KEV eklenmiş sıralama **farklı** çıkabilir; B5, CVSS'te ortalarda kalsa da KEV'de olduğu için **öne çıkar**.

---

# Yanılgı: "Cihazdaki açıklar düşük puan alıyor, önemsiz"

**Yanılgı:** `AV:L` (yerel erişim) çıkan bir açık, düşük puanlıysa göz ardı edilebilir.

**Gerçek:** Bu dersin saldırgan modelinde **cihaz zaten saldırganın elindedir** (beyaz kutu).

Puan düşse bile risk **azalmaz**; puanın yanına **saldırı potansiyeli** (süre, uzmanlık, ekipman) de yazılmalıdır.

---

# Pratik: vektörü siz kurun

**Soru:** Bir saldırgan **ağdan**, **kimlik doğrulamadan**, **kullanıcı etkileşimi olmadan** bir sistemi tamamen ele geçiriyor (gizlilik, bütünlük, erişilebilirlik hepsi tam bozuluyor). CVSS v3.1 vektörü ve puanı nedir?

**Cevap:** `AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H` → **9.8 (Kritik)**. Kapsam da değişseydi (S:C) puan **10.0**'a çıkardı.

---

# Zafiyet yaşam döngüsü

![w:900](assets/h02-06-zafiyet-yasam-dongusu.svg)

- **Zero-day:** satıcının bilmediği/yamasının olmadığı açık.
- **Sorumlu ifşa:** önce satıcıya bildir, ~90 gün bekle, sonra açıkla.
- **Yama boşluğu:** yama çıkınca açık kamuya açılır; güncellemeyen savunmasız (WannaCry).

---

# Yaşam döngüsü: dört aşama

1. **Keşif:** açık bulunur (araştırmacı, saldırgan ya da satıcı).
2. **Bildirim:** araştırmacı satıcıya bildirir (ya da saldırgan sessizce kullanır).
3. **Yama:** satıcı düzeltmeyi yazıp yayımlar.
4. **Yayın:** yama kullanıcıya ulaşır, **uygulanırsa** risk biter.

Her ok arasında geçen süre, saldırgana verilen **zaman penceresidir**.

---

# Açığın yaşam çizgisi — şema

![w:900](assets/h02-17-acik-yasam-cizgisi.svg)

---

<!-- _class: yogun -->

# Sorumlu ifşa vs tam ifşa

| | Sorumlu ifşa (coordinated) | Tam ifşa (full) |
| --- | --- | --- |
| Kim önce bilir? | Satıcı | Herkes aynı anda |
| Bekleme | ~90 gün (yama için) | Yok |
| Amaç | Kullanıcıyı korurken satıcıyı harekete geçirmek | Satıcıyı zorlamak |
| Risk | Düşük (yama varken açıklanır) | Yüksek (yama yokken açık bilinir) |

Sektörde tartışmalı olan **tam ifşadır**.

---

# Hata ödül programları (bug bounty)

- Şirketlerin, açığı **sorumlu biçimde** bildiren araştırmacılara **ödül** verdiği programlar.
- Amaç: araştırmacıyı tam ifşa yerine **sorumlu ifşaya** yönlendirmek.
- Araştırmacı için kazanç; şirket için **erken uyarı**.
- Büyük teknoloji şirketlerinin çoğunda artık standart bir uygulamadır.

---

# Sahada süreç: bir açık bildirilirse ne olur?

Bir ürün ekibi için yaşam döngüsü bir **süreçtir**:

- Bildirim **kanalı:** `security.txt`, güvenlik e-postası.
- Bir **sorumlu** kişi/ekip.
- Yama **SLA'sı:** ne kadar sürede düzeltilecek?
- Sürüm/yama **duyuru** mekanizması.

Bir değerlendirme yalnız kodu değil, bu **süreci** de sorar.

---

# Tam ifşa neden tartışmalı?

**Soru:** Tam ifşa (full disclosure) neden riskli kabul edilir?

**Cevap:** Açık, **yama yokken** herkese duyurulur. Satıcıyı harekete geçirmeye zorlar, ama aynı zamanda saldırganlara da **hazır bir yol haritası** verir — kullanıcılar savunmasızken.

---

<!-- _class: yogun -->

# Kontrol listesi — zafiyet sınıflandırma

- [ ] CWE'nin soyutlama düzeylerini (pillar, class, base, variant) ve "en somut girdi" kuralını biliyorum.
- [ ] CWE, CVE ve CVSS'i birer cümleyle **ayırabiliyorum**.
- [ ] Bir bulguya CVSS v3.1 vektörü kurup puanı **elle** hesaplayabiliyorum.
- [ ] EPSS, KEV ve CVSS'in **farklı sorulara** cevap verdiğini açıklayabiliyorum.
- [ ] Zafiyet yaşam döngüsünü, sıfırıncı gün, yama boşluğu ve sorumlu ifşayı anlatabiliyorum.

---

# Dönem projesi: bu hafta (S4)

- [ ] S4 saldırı/tehdit tablonuzdaki **her satıra bir CWE** ekleyin.
- [ ] En kritik varlığa bir **saldırı ağacı** (Demo 04 biçimi); en ucuz yol + en etkili önlem.
- [ ] Kullandığınız bileşenlerin **CVE**'lerini bulup **CVSS** puanlayın.
- [ ] Uygun **erişim modelini** (DAC / MAC / RBAC) gerekçelendirin.

```text
| ID | Tehdit | Varlik | Yol | CWE | Onlem | Bolum |
```

---

# Sınıf etkinlikleri

1. **Zararlıyı sınıfla, katmanı seç:** altı senaryoda tür ve ilk yakalayan katman
2. **Saldırı ağacı düellosu:** karşı grup, ağaçta olmayan daha ucuz bir yol arar
3. **Matristen modele:** aynı politikayı ACL, yetenek listesi, BLP/Biba etiketiyle yaz
4. **Bulgudan yama sırasına:** CWE + CVSS + EPSS + KEV + SSVC ile beş bulguyu sırala
5. **Denetim kaydını kurcala:** Demo 11 zincirinde değiştirme/silme/sondan kesmeyi dene
6. **Kod okuma turnuvası:** dört koda CWE, saldırı ve düzeltme yaz
7. **Olay otopsisi:** Heartbleed/WannaCry/Log4Shell için CVE-CWE-CVSS-tarih doldur

<!-- Konuşma notu: Grupları 3-4 kişi yapın; süre notu için ders notundaki etkinlik kutularına bakın. -->

---

# Kendini sınama (seçme)

1. Virüs, solucan, truva atı farkı?
2. Polimorfizm ≠ metamorfizm: fark?
3. Yüksek entropi zararlıyı **kanıtlar** mı?
4. BLP iki kuralı ve neyi korur?
5. Biba, BLP'den nasıl ayrılır?
6. DAC ile MAC farkı?
7. CWE ile CVE farkı?
8. CVSS Temel puan neyi ölçmez?

<!-- Konuşma notu: önce sordur, sonra iki cevap slaytını aç. -->

---

<!-- _class: yogun -->

# Kendini sınama — cevaplar (1–4)

1. **Virüs** başka programa bulaşır; **solucan** kendi başına ağdan kopyalar; **truva atı** faydalı görünüp gizli zararlı taşır.
2. **Polimorfik** her kopyada kendini farklı **şifreler**; **metamorfik** kodunu **yeniden yazar**.
3. **Hayır.** Yüksek entropi bir **ipucudur** (şifreli/paketli); tek başına zararlıyı kanıtlamaz (meşru sıkıştırma da yüksek entropili).
4. **BLP:** yukarı okuma yok + aşağı yazma yok → **gizliliği** korur.

---

<!-- _class: yogun -->

# Kendini sınama — cevaplar (5–8)

5. **Biba** BLP'nin tersidir: aşağı okuma yok + yukarı yazma yok → **bütünlüğü** korur.
6. **DAC** izinleri sahibi belirler (esnek, sızıntıya açık); **MAC** sistemin zorunlu etiketli kuralları (katı).
7. **CWE** zayıflık **türü** (ör. CWE-416); **CVE** belirli bir üründeki **somut** açık.
8. **CVSS Temel puan** olabilirliği/etkiyi ölçer ama **istismarın sahada gerçekleşme olasılığını** (tehdit/ortam) tek başına ölçmez.

---

# Kendini sınama (devam)

9. İmza ve sezgisel tespitin güçlü/zayıf yanı?
10. Günlük enjeksiyonu (CWE-117) nasıl önlenir?
11. Sorumlu ifşa nedir?

<!-- önce sordur, sonra cevap slaytını aç -->

---

# Kendini sınama — cevaplar (9–11)

9. **İmza** hızlı ama yeniyi kaçırır; **sezgisel** yeniyi bulur ama yanlış alarm üretir.
10. Günlüğe yazılan kullanıcı verisindeki satır sonu/kontrol karakterlerini **temizle/kaçır**; yapılandırılmış
    günlük kullan.
11. Açığı önce **üreticiye bildirip** yama için süre tanımak, sonra **kamuya açıklamak**.

---

<!-- _class: yogun -->

# Sözlük

| Terim | Anlam |
| --- | --- |
| Polimorfik | Her kopyada farklı şifreli |
| İmza/sezgisel | Bilinen iz / şüpheli davranış |
| Entropi | Rastgelelik ölçüsü |
| DAC/MAC/RBAC | Erişim denetim modelleri |
| BLP/Biba | Gizlilik / bütünlük modeli |
| CWE/CVE/CVSS | Tür / somut açık / puan |

---

<!-- _class: yogun -->

# Sözlük (devam)

| Terim | Anlam |
| --- | --- |
| EPSS | Açığın 30 gün içinde istismar edilme **olasılığı** |
| KEV | **Kanıtlanmış** istismar edilen açıklar kataloğu |
| SSVC | İstismar/etki/yaygınlık ile Track–Act kararı |
| Sorumlu / tam ifşa | Önce satıcıya bildirme / hemen kamuya açma |
| Kimlik doğrulama / yetkilendirme | "Sen kimsin?" / "Bunu yapabilir misin?" |
| Güvenli varsayılan | Politika belirsizse cevap **ret** (fail-closed) |

---

<!-- _class: baslik -->

# Bir sonraki hafta

**3. hafta — Veri Güvenliği: Aktarımda, Beklemede, Kullanımda**

Bu hafta zararlı yazılımı tespit ederken kullandığımız **entropi** ölçütünü, gelecek hafta kriptografik rastgele
sayı üretecinin (CSPRNG) girdisindeki düzensizliği değerlendirmek için yeniden kullanacağız. 3. haftada
şifreleme temellerini, TLS 1.3 ve sertifika sabitlemeyi, AES-GCM ile yerel şifrelemeyi ve güvenli silmeyi
işleyeceğiz (Kaynak: Viega & Messier, Tarif 9.1–9.3, 10.7–10.9, 4.9–4.11, 13.2).

> Bu haftanın özeti: tehdidi **sınıflandır**, erişimi **modelle**, açığı **kataloglarla** (CWE/CVE) izle ve
> ciddiyetini (**CVSS**) ölç. Bu çerçeve, sonraki haftalardaki teknik korumaların zeminidir.

Bu hafta CWE ve CVSS ile önceliklendirdiğimiz zafiyet dili, **12. haftada** sızma testi planlamasının girdisi
olarak yeniden karşımıza çıkacak.
