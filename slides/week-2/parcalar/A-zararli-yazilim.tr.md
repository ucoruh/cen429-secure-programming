<!-- _class: bolum -->

# Zararlı yazılım: türler ve tarih

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

<!-- _class: bolum -->

# Yayılma ve gizlenme

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

```text
  +------------------+     +-------------------+
  |  Çözücü kod      | --> |  Şifreli gövde    |
  | (poli: her kopya |     | (her kopyada      |
  |  farklı)         |     |  farklı baytlar)  |
  +------------------+     +---------+---------+
                                     | çöz
                                     v
                           +-------------------+
                           |  Açık gövde       |
                           |  (HER ZAMAN AYNI) | --> imza burada tutar
                           +-------------------+
```

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

# Olaylardan programcıya dersler

1. **Sınır denetimi:** 1988–2008 salgınlarının çoğu tek bir arabellek taşması (1. ve 4. hafta)
2. **Sürümde hata ayıklama kodu bırakma** (Morris / `sendmail` DEBUG)
3. **Gereksiz hizmeti açma:** her port bir saldırı yüzeyi (Slammer, Blaster)
4. **İmzalı güncelleme + istemcide doğrulama** (NotPetya) — 3. ve 10. hafta
5. **Derleme ortamı ve tedarik zinciri güvenliği** (SUNBURST) — 5. hafta SBOM
6. **Güncelleme mekanizması güvenlik özelliğidir:** yama gecikmesi = açık kapı

<!-- Konuşma notu: Tartışma sorusu: Office'in 2022'den beri internetten gelen belgelerde makroları varsayılan engellemesi hangi eski salgınların kapısını kapattı? -->
