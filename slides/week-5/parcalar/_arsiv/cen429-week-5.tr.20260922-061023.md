---
marp: true
theme: cen429
paginate: true
lang: tr
title: "CEN429 Hafta 5 — Kod Sağlamlaştırma: Java ve Yorumlanan Diller"
author: "Dr. Öğr. Üyesi Uğur CORUH"
header: "CEN429 Güvenli Programlama · Hafta 5"
footer: "RTEÜ Bilgisayar Mühendisliği · 2026-2027 Güz"
---



<!-- _class: baslik -->
<!-- _paginate: false -->

# Kod Sağlamlaştırma: Java ve Yorumlanan Diller

**CEN429 Güvenli Programlama — Hafta 5**

Dr. Öğr. Üyesi Uğur CORUH · 16.10.2026

<!--
Konuşma notu: Bu hafta yönetilen dillere geçiyoruz: bellek güvenliği bedava gelir ama enjeksiyon, seri durumdan çıkarma, okunabilir bayt kodu ve bağımlılıklar yeni riskler getirir.
-->

<!--
Konuşma notu: Bu hafta yönetilen dillere geçiyoruz: bellek güvenliği bedava gelir ama enjeksiyon, seri durumdan çıkarma, okunabilir bayt kodu ve bağımlılıklar yeni riskler getirir.
-->

---

# Bugünün planı (3 saat)

| Saat | Konu |
| --- | --- |
| 1 | Yönetilen diller neyi çözer? · SEI CERT Oracle Java · Enjeksiyonun ortak kökü · SQL **Demo 1** |
| 2 | Komut **Demo 2** · Yol geçişi **Demo 3** · Seri durumdan çıkarma **Demo 7** · XXE, XSS, şablon |
| 3 | Bayt kodu **Demo 4** · ProGuard / R8 · Dize gizleme, yansıma **Demo 5** · SBOM **Demo 6** · Proje |

**Demolar:** `code/week-05` — Python 3 + JDK 17 · Windows `.\demo.ps1` · WSL / Linux `sh demo.sh`

<!-- Konuşma notu: İsteğe bağlı Java bölümleri için hazirla betiklerini (JDBC sürücüsü, ProGuard) ders öncesi çalıştırın; yalnız demo klasörüne indirirler. -->

---

<!-- _class: bolum -->

# 1. Yönetilen diller ve SEI CERT Java

---

<!-- _class: yogun -->

# Java neyi çözer?

| Hata | C/C++ | Java |
| --- | --- | --- |
| Arabellek taşması | Programcı | Her erişim denetlenir |
| UAF, çift bırakma | Programcı | Çöp toplayıcı |
| İlklendirilmemiş değişken | UB | Derleyici hatası / varsayılan değer |
| İşaretli taşma | UB | Tanımlı (sarar), mantık hatası sürer |
| `%n` biçim dizisi | Belleğe yazma | Yok (günlük enjeksiyonu sürer) |

---

<!-- _class: yogun -->

# Java neyi çözmez?

| Hata | Neden? | Demo |
| --- | --- | --- |
| **Enjeksiyon** | Veri ile komutun karışması = tasarım hatası | 1–3 |
| **Seri durumdan çıkarma** | Dilin kendi özelliği | 7 |
| **Gömülü sırlar** | Bayt kodu kolay okunur | 4 |
| **Tersine mühendislik** | Adlar, dizgeler korunur | 4–5 |
| **Zafiyetli bağımlılık** | Kodun çoğu başkasının | 6 |
| **Mantık/yetki hataları** | İş kuralı | 2. hafta |

⚠️ JNI ile çağrılan C/C++ → ilk dört haftanın **bütün riski** geri gelir

---

<!-- _class: yogun -->

# SEI CERT Oracle Java: bu haftanın kuralları

| Kural | Konu |
| --- | --- |
| IDS00-J | SQL enjeksiyonunu önle |
| IDS07-J | Güvenilmeyen veriyi `Runtime.exec()`'e verme |
| IDS16-J · IDS17-J | XML enjeksiyonu · XML dış varlık (XXE) |
| FIO16-J | Yolu doğrulamadan önce **kanonikleştir** |
| SER12-J | Güvenilmeyen verinin seri durumdan çıkarılmasını önle |
| MSC03-J | Koda gömülü hassas bilgi yok |
| ERR01-J · FIO13-J | İstisnada / günlükte hassas bilgi sızdırma |

CERT = "nasıl yazarım?" · OWASP Top 10 / ASVS / MASVS = "neyi test ederim?"

---

<!-- _class: bolum -->

# 2. Enjeksiyon

---

# Ortak kök: veri ile komut aynı kanalda

```text
 HATALI:  komut şablonu + kullanıcı verisi ──birleştir──▶ yorumlayıcı ayrıştırır
 DOĞRU:   komut şablonu (sabit) ──────────────────────▶ yorumlayıcı
          kullanıcı verisi ──parametre / argüman──────▶
```

- Özel karakterler: `'` (SQL) · `;` `&` (kabuk) · `../` (dosya) · `<` (HTML/XML) · `%` (printf)
- **Asıl düzeltme:** iki kanal · kaçış karakteri = ikinci savunma hattı
- Tarif 3.11 (SQL), 3.10 (XSS), 3.7 (yol), 1.7 (dış program)

---

<!-- _class: yogun -->

# Tek kanal → iki kanal

| Yorumlayıcı | ❌ Tek kanal | ✅ İki kanal |
| --- | --- | --- |
| SQL | `"… WHERE ad='" + ad + "'"` | `PreparedStatement` + `?` |
| Kabuk | `exec("sh -c 'ping " + host + "'")` | `ProcessBuilder("ping", host)` |
| Dosya | `new File(kok, istek)` | Kanonikleştir + kök denetimi |
| XML | Dize birleştirme | DOM / StAX API |
| HTML | `"<p>" + yorum + "</p>"` | Şablonun otomatik kaçışı |
| printf | `printf(girdi)` | `printf("%s", girdi)` |

---

<!-- _class: yogun -->

# SQL enjeksiyonu

```java
String sql = "SELECT id, rol FROM kullanicilar WHERE ad = '" + ad +
             "' AND parola_ozeti = '" + ozet + "'";
```

`ad = ayse' --` →

```sql
SELECT id, rol FROM kullanicilar WHERE ad = 'ayse' --' AND parola_ozeti = '...'
```

- `--` = yorum → parola denetimi **silindi**
- `UNION SELECT` ile başka tablolar · kayıt değiştirme/silme
- 20+ yıldır OWASP Top 10 · CWE-89

---

<!-- _class: yogun -->

# Doğrusu: PreparedStatement

```java
String sql = "SELECT id, rol FROM kullanicilar WHERE ad = ? AND parola_ozeti = ?";
try (PreparedStatement ps = baglanti.prepareStatement(sql)) {
    ps.setString(1, ad);
    ps.setString(2, ozet);
    try (ResultSet rs = ps.executeQuery()) { ... }
}
```

Sorgu metni **önce** derlenir · değerler ayrı kanaldan · `'`, `--`, `;` yalnız **değer**

---

<!-- _class: yogun -->

# Parametrenin yetmediği yerler

| Durum | Çözüm |
| --- | --- |
| `ORDER BY` sütunu, tablo adı | `?` yalnız **değer** yerine → **beyaz liste** eşlemesi |
| `LIKE` desenleri | Değer parametre + `%` `_` kaçışı |
| ORM içinde elle sorgu (JPQL/HQL) | `setParameter` |
| Saklı yordamda dinamik SQL | Yordam içinde de parametre |

**Derinlemesine:** en az ayrıcalıklı DB kullanıcısı · hata iletisi genel (ERR01-J) · beyaz liste doğrulaması (yerine geçmez)

---

<!-- _class: yogun -->

# Demo 1 — SQL enjeksiyonu

`code/week-05/01-sql-enjeksiyonu` · CWE-89 · IDS00-J · Tarif 3.11

| Adım | Ne olur? |
| --- | --- |
| 1 | Dürüst giriş: iki yol da çalışır |
| 2 | Parola alanına `' OR '1'='1` → parolasız giriş |
| 3 | Arama alanıyla yöneticinin satırı sızar |
| 4 | Parametreli sorgu: girdi yalnız değer → reddedilir |

Ana bölüm Python `sqlite3` (indirme yok) · isteğe bağlı JDBC `PreparedStatement`

<!-- Konuşma notu: Değerlendirici sorgu metnine değişken birleştiren her yeri arar; dinamik testte tırnak, yorum işareti, mantıksal ifadeler. sqlmap gibi araçlar yalnız izinli test ortamında. -->

---

<!-- _class: yogun -->

# Komut enjeksiyonu

```java
Runtime.getRuntime().exec(new String[]{"sh", "-c", "echo Merhaba " + kullanici});
/* kullanici = "ayse; <başka komut>" → kabuk iki komut çalıştırır */
```

```java
if (!Pattern.matches("^[A-Za-z0-9_]{1,32}$", kullanici)) throw new IllegalArgumentException();
new ProcessBuilder("/usr/bin/printf", "Merhaba %s\n", kullanici).start();
```

1. **Kabuk yok** · 2. **Tam yol** (1. hafta PATH) · 3. **İzin listesi** · 4. En iyisi: dış programa **hiç** gerek bırakma

⚠️ **Argüman enjeksiyonu:** `-` ile başlayan girdi seçenek olur → `--` ve izin listesi

---

<!-- _class: yogun -->

# Demo 2 — Komut enjeksiyonu

`code/week-05/02-komut-enjeksiyonu` · CWE-78 · IDS07-J · Tarif 1.7–1.8

- Hatalı: `sh -c` / `cmd /c` / `Runtime.exec(String)` → `;` ya da `&` ikinci komutu başlatır
- Enjekte edilen komut yalnız **zararsız `echo`**
- Doğru: `ProcessBuilder` (Java) · `subprocess` argüman listesi (Python) · izin listesi `^[A-Za-z0-9_]+$`
- Aynı ders iki dilde

---

<!-- _class: yogun -->

# Yol geçişi (Tarif 3.7)

```java
Path dosya = kok.resolve(istek);          // istek = "../../etc/passwd" → kök dışı
```

```java
Path kok  = Paths.get("/srv/veri").toRealPath();
Path aday = kok.resolve(istek).normalize();
if (!aday.startsWith(kok)) throw new SecurityException();
Path gercek = aday.toRealPath();          // sembolik bağlantıları çözer
if (!gercek.startsWith(kok)) throw new SecurityException();
```

**Önce kanonikleştir, sonra denetle** (FIO16-J) · ham dizge denetimi atlatılır: `..%2f`, `....//`, `..\`, sürücü harfi, sembolik bağlantı

---

# Demo 3 — Yol geçişi ve Zip Slip

`code/week-05/03-yol-gecisi` · CWE-22

- Hatalı: `../gizli.txt` → kök dışındaki **sentetik** gizli dosya sızar
- Doğru: `normalize()` + `toRealPath()` (Python `resolve()`) + kök içinde mi? · mutlak yol ve sürücü harfi reddi
- Windows'ta `..\` ve `../` birlikte işlenir

**Zip Slip:** arşivdeki dosya adı da girdidir → `../../x` hedef klasörün dışına yazılır → her girdi için aynı denetim

---

<!-- _class: yogun -->

# Güvensiz seri durumdan çıkarma

- `ObjectInputStream` akışta adı geçen **her** serileştirilebilir sınıfı oluşturur ve metotlarını çalıştırır
- Akış güvenilmezse → **sınıf seçme yetkisi saldırganda**
- Sınıf yolundaki masum sınıflar zincirlenebilir → gerçek olaylarda uzaktan kod çalıştırma (2015, yaygın ortak kütüphane)
- CWE-502 · OWASP "yazılım ve veri bütünlüğü hataları"

**Bu derste zincir yazmıyoruz** — yalnız savunma

---

<!-- _class: yogun -->

# Savunma: izin listesi filtresi

| Sıra | Önlem |
| --- | --- |
| 1 | **Hiç kullanma:** JSON / Protobuf (yalnız veri) |
| 2 | `ObjectInputFilter` izin listesi (JEP 290, JEP 415) |
| 3 | Sınırlar: derinlik, dizi, bayt, nesne sayısı |
| 4 | Saklanan/taşınan veriye HMAC |
| 5 | Kullanılmayan kütüphaneyi kaldır |

```java
ObjectInputFilter f = ObjectInputFilter.Config.createFilter(
    "com.ornek.Ayar;java.base/*;maxdepth=5;maxbytes=65536;!*");
in.setObjectInputFilter(f);          // beklenmeyen → InvalidClassException
```

`!*` = varsayılan-reddet · unutulursa kara liste olur

---

<!-- _class: yogun -->

# Demo 7 — Güvenli seri durumdan çıkarma

`code/week-05/07-deserializasyon` · CWE-502 · SER12-J

| Sürüm | `Ayar` (beklenen) | `BaskaSinif` (beklenmeyen) |
| --- | --- | --- |
| Filtresiz | Kabul | **Kabul** |
| `ObjectInputFilter` | Kabul | **Reddedildi** (`InvalidClassException`) |

Saldırı zinciri **yok**; yalnız savunma

<!-- Konuşma notu: Değerlendirici ObjectInputStream, readObject, polimorfik tür özelliği açık JSON kütüphaneleri arar; ağ trafiğinde AC ED 00 05 sihirli baytlarını arar. -->

---

<!-- _class: yogun -->

# XXE, XSS, şablon, LDAP

| Tür | Savunma | CWE |
| --- | --- | --- |
| XML dış varlık (XXE) | DTD ve dış varlıkları kapat | 611 |
| XSS | Bağlama göre otomatik kaçış, CSP | 79 |
| Şablon enjeksiyonu | Veri yalnız **değişken**, şablon değil | 1336 |
| LDAP / XPath | Parametreli arayüz, kaçış | 90 / 643 |

```java
f.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
f.setFeature("http://xml.org/sax/features/external-general-entities", false);
f.setXIncludeAware(false);  f.setExpandEntityReferences(false);
```

Yorumlayıcının hangi özelliği açık? İhtiyacın olmayanı **kapat**

---

<!-- _class: yogun -->

# Python ve JavaScript'te aynı hatalar

| Hata | Python | Node.js |
| --- | --- | --- |
| SQL | `execute(f"... {ad}")` → `execute("... ?", (ad,))` | Şablon dizgesi → parametre bağlama |
| Komut | `shell=True` → liste, `shell=False` | `exec` → `execFile` / `spawn` |
| Kod çalıştırma | `eval`, `exec` | `eval`, `new Function` |
| Seri durumdan çıkarma | `pickle`, `yaml.load` → `json`, `yaml.safe_load` | Nesne çözücüler → `JSON.parse` + şema |

```python
deger = eval(girdi)               # HATALI
deger = ast.literal_eval(girdi)   # yalnız sabitler
deger = int(girdi)                # en iyisi: beklenen tür
```

---

<!-- _class: yogun -->

# ReDoS ve prototip kirlenmesi

**ReDoS** (CWE-1333): `^(a+)+$` + `"aaaa…a!"` → geri izleme **üstel** süre → tek istek işlemciyi kilitler

1. İç içe tekrar yok · 2. Önce **uzunluk** sınırı · 3. Doğrusal motor (RE2) · 4. Statik analiz kuralı

**Prototip kirlenmesi** (JS): derin birleştirmede `__proto__` → bütün nesnelere özellik → `if (k.yonetici)` beklenmedik doğru

→ `__proto__`, `constructor`, `prototype` anahtarlarını reddet · `Object.create(null)` / `Map` · **şema doğrulama**

---

<!-- _class: bolum -->

# 3. Bayt kodu, ProGuard ve gizleme

---

<!-- _class: yogun -->

# Bayt kodu neden kolay okunur?

| Bilgi | Makine kodu (strip) | Java bayt kodu / DEX |
| --- | --- | --- |
| Sınıf, metot, alan adları | Kaybolur | **Korunur** |
| Tipler | Kaybolur | **Korunur** |
| Dizge sabitleri | İkilide | **Sabit havuzunda düz metin** |
| Geri çevirme | Sözde C | Çoğu zaman **derlenebilir** Java |

Araçlar: `javap` (JDK) · jadx · CFR · Fernflower

---

<!-- _class: yogun -->

# Demo 4 — `.class` içinde ne var?

`code/week-05/04-bytecode-decompile` · CWE-798 · MSC03-J

```text
private static final java.lang.String GECERLI_PIN;
public boolean pinDogru(java.lang.String);
     1: ldc           #7        // String 4729
     3: invokevirtual #9        // Method java/lang/String.equals
```

Sabit + anlamlı adlar + mantık → kaynak olmadan okunur

⚠️ **İstemcide sır yoktur:** gerekmiyorsa sunucuda tut, istemci kısa ömürlü belirteç kullansın

---

<!-- _class: yogun -->

# ProGuard / R8: dört aşama

| Aşama | Ne yapar? | Güvenlik katkısı |
| --- | --- | --- |
| Küçültme | Kullanılmayanı siler (kütüphaneler dahil) | Saldırı yüzeyi azalır |
| İyileştirme | Satır içi alma, ölü kod, sabit katlama | Yapı kaynaktan uzaklaşır |
| Gizleme | Adlar → `a`, `b`, `c` | Anlamlı adlar kaybolur |
| Ön doğrulama | Eski JVM'ler için | — |

R8 = Android'in varsayılanı, ProGuard kurallarıyla uyumlu

🚨 `mapping.txt` gizlemeyi **geri alır** → dağıtma, açık depoya koyma, sürüm başına erişimi sınırlı sakla

---

<!-- _class: yogun -->

# `-keep`: neyin adı korunmalı?

- Giriş noktaları (manifest'teki etkinlikler, `main`) · yansımayla çağrılanlar · JNI / `native` · serileştirilen alanlar · kütüphane API'si

| Kural | Ne yapar? |
| --- | --- |
| `-keep class X { <methods>; }` | Tut + adını koru |
| `-keepclassmembers` | Sınıf küçülebilir, üyeler korunur |
| `-keepnames` | Silinebilir, kalanın adı korunur |
| `-keepclasseswithmembers` | Belirli üyeli sınıfları koru |

⚠️ `-keep class com.ornek.** { *; }` = gizlemeyi **fiilen kapatmak** · en **dar** kuralı yaz

---

<!-- _class: yogun -->

# Sahadan: gelişmiş kurallar

| Kural | Neden? |
| --- | --- |
| `-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*` | Güvenli iyileştirmeler açık |
| `-optimizationpasses 5` | Her tur yeni fırsat → yapı uzaklaşır |
| `-allowaccessmodification` · `-repackageclasses` | Paket yapısı kaybolur |
| `-useuniqueclassmembernames` | Tutarlı adlar, çökme ayıklaması |
| `-keepattributes Exceptions` | Kaynak dosya adı ve satır no **sürüme girmez** |
| `-assumenosideeffects class android.util.Log { *; }` | Günlük çağrıları **silinir** |

Kütüphane kendi kodunu gizler; **üst uygulama da kendi gizlemesini yapmalı** (kılavuzda devredilen gereksinim)

---

# ProGuard'ın yapmadıkları

- **Dizgeleri gizlemez:** `// String 4729` gizlemeden sonra da durur
- Kontrol akışını yalnız iyileştirme kadar değiştirir
- Kurcalamaya karşı denetim yok

➡️ Dize şifreleme, akış gizleme, kurcalama denetimi: ticari araçlar (DexGuard, iXGuard) ya da kendi yöntemleriniz

---

<!-- _class: yogun -->

# Dize gizleme ve dinamik çağrı

**Statik dize gizleme:** düz metin yerine şifreli/karıştırılmış bayt dizisi, kullanımda çöz

- XOR: `javap`/`strings` durur ama anahtar da uygulamada → **engel, kilit değil**
- Sahada: derleme öncesi **AES** ile şifrele → yapılandırmaya gömülü şifreli sabit → çözme native tarafta, korumalı tek fonksiyon → kullanım sonrası **sil**

**Dinamik çağrı (yansıma):**

```java
Method m = Hesap.class.getDeclaredMethod(adiCoz(ADI_BAYTLARI), String.class);
m.setAccessible(true);  sonuc = (String) m.invoke(null, girdi);
```

Çağrı bağlantısı gizlenir; metot hâlâ sınıfta · asıl güç ProGuard ile birlikte · yavaş, tip denetimi kaybolur

---

<!-- _class: yogun -->

# Sahadan: JNI adları ve ayrık parmak izi

- JNI arayüzünde metot adları anlamsız (`native byte[] ced(...)`) → iki tarafı birden korur
- Cihaz parmak izi **iki farklı özetle iki farklı yerde** (yerel veritabanı + tercih dosyası)
- Arka plan iş parçacığı ikisini karşılaştırır; tutarsızlık ya da root → **kartlar silinir**
- Tek yerdeki değeri değiştirmek **yetmez**

---

<!-- _class: yogun -->

# Demo 5 — Dize gizleme, yansıma, ProGuard

`code/week-05/05-gizleme` · Tarif 12.11, 12.9 (kavram)

| Bölüm | Ne görülür? |
| --- | --- |
| A | Gizli dizge XOR'lu bayt dizisi → `javap`'ta **görünmez** |
| B | Metot adı çalışma anında → bayt kodunda doğrudan çağrı **yok** |
| C | ProGuard: giriş noktası kalır, kullanılmayan özel üye silinir, adlar kısalır |

<!-- Konuşma notu: Değerlendirici paketi geri derleyiciyle açar: anlamlı adlar, düz dizgeler, günlük çağrıları, eşleme dosyası. Güvenlik denetimlerini bulmanın süresini ölçer. -->

---

<!-- _class: yogun -->

# Android'de R8 ve retrace

```groovy
release {
    minifyEnabled true              // küçült + iyileştir + gizle
    shrinkResources true            // kullanılmayan kaynakları da sil
    proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
}
```

```proguard
-keepclasseswithmembernames class * { native <methods>; }     # JNI
```

- Debug derlemesi **gizlenmez** ve debuggable → dağıtılan paket sürüm derlemesi mi?
- Çökme raporu `a.b.c(Unknown Source)` → `retrace` + eşleme dosyası (güvenli yüklenir)

---

<!-- _class: yogun -->

# Gizlemeyi ölç, Java için statik analiz

| Ölçüt | Beklenen |
| --- | --- |
| Sınıf/metot sayısı · paket boyutu | Küçültmeyle azalır |
| Anlamlı ad oranı | Çok düşer |
| Düz metin hassas dizge | Sıfır (dize gizleme) |
| Günlük çağrısı | Sürümde sıfır |

**Araçlar:** `javac -Xlint:all` · SpotBugs + **Find Security Bugs** · Semgrep / CodeQL · Android Lint · Dependency-Check

Öncesi/sonrası tablosu kılavuza → "gizleme yapıldı" iddiası **kanıt** olur

---

<!-- _class: bolum -->

# 4. Bağımlılıklar ve SBOM

---

# Log4Shell (Aralık 2021)

- Log4j 2: günlüğe yazılan dizgedeki özel ifade → uzaktan sınıf yükleyip çalıştırma
- CVE-2021-44228 · CVSS **10.0**
- Günlüğe kullanıcı verisi yazan **her** uygulama etkilendi
- Asıl kriz: **"hangi sistemde hangi sürüm var?"** — başka kütüphanelere gömülü kopyalar günlerce arandı

➡️ 2. haftanın günlük enjeksiyonu + bu haftanın bağımlılık güvenliği

---

<!-- _class: yogun -->

# SBOM: yazılımın içindekiler listesi

| Alan | Örnek |
| --- | --- |
| Ad, sürüm | `log4j-core 2.14.1` |
| **purl** | `pkg:maven/org.apache.logging.log4j/log4j-core@2.14.1` |
| Özet | SHA-256 |
| Lisans | Apache-2.0 |
| İlişkiler | Kimin neye bağlı olduğu (geçişli) |

**CycloneDX** (OWASP, güvenlik) · **SPDX** (Linux Vakfı, ISO/IEC 5962) · ABD 2021 kararnamesi · AB Siber Dayanıklılık Yasası

---

<!-- _class: yogun -->

# SBOM'dan zafiyete: SCA ve VEX

| Araç | Tür |
| --- | --- |
| OWASP Dependency-Check | Proje taraması |
| OWASP Dependency-Track | SBOM toplayıp sürekli izleme |
| Dependabot · `npm audit` · `pip-audit` · OSV-Scanner | Depo/ekosistem uyarısı |
| CycloneDX eklentileri | SBOM üretimi |

Eşleşme ≠ etkilenme → **VEX**: "CVE-X var ama ürünümüz etkilenmiyor, çünkü …"

---

<!-- _class: yogun -->

# Bağımlılık hijyeni

- [ ] Sürümleri **kilit dosyasıyla** sabitle
- [ ] **Özetleri doğrula** (Gradle/Maven doğrulama, `pip --require-hashes`)
- [ ] Kullanılmayanı **kaldır** (seri durumdan çıkarma zincirleri için de)
- [ ] SBOM'u her sürümde üret, **sürekli izle**
- [ ] Ad benzetme (`reqeusts`) ve bağımlılık karışıklığına karşı **kaynağı sabitle**
- [ ] Derleme bütünlüğü: SLSA

---

<!-- _class: yogun -->

# Demo 6 — SBOM üret ve eşleştir

`code/week-05/06-sbom` · CWE-1104

| Adım | Ne olur? |
| --- | --- |
| 1 | `cikti/lib/` jar'ları taranır; ad/sürüm/SHA-256 → CycloneDX 1.5 JSON |
| 2 | Her bileşen için `pkg:maven/...@sürüm` purl |
| 3 | Sentetik zafiyet listesiyle eşleştirme → iki uyarı |

İnternete bağlanmaz; jar'lar ve zafiyet listesi **sentetik**

<!-- Konuşma notu: Sertifikasyon belgelerinde üçüncü taraf bileşenler sürüm ve kullanım gerekçesiyle listelenir; değerlendirici bunu SBOM gibi okur. Listede olmayan bileşenin pakette bulunması bulgudur. -->

---

<!-- _class: bolum -->

# 5. Proje ve kapanış

---

# Proje: bu hafta

- [ ] **SBOM:** bütün bağımlılıklar CycloneDX (vcpkg/Conan desteği ya da elle) + OSV taraması
- [ ] **Girdi doğrulama tablosu:** her giriş noktası → biçim, uzunluk sınırı, doğrulayan fonksiyon
- [ ] Dosya yolu / SQL / dış program varsa: kanonikleştirme + kök · parametreli sorgu · argüman listesi
- [ ] Betik ya da Java bileşeni varsa: gizleme gereksinimi ve `-keep` kuralları → S6

---

# Kendi başına çalış (not verilmez)

1. Demo 1'i parametreli yap; `ORDER BY` için beyaz liste
2. Bozuk sorgunun hata iletisi neyi sızdırıyor?
3. Demo 2'ye `-` ile başlayan girdi: argüman enjeksiyonu ve `--`
4. Demo 3'e `..%2f`, `....//`, `..\`, mutlak yol, sembolik bağlantı
5. Demo 7'de `!*`'ı kaldır; `maxbytes`/`maxdepth` sınırını bul
6. Demo 4–5'i CFR / jadx ile aç
7. `proguard.pro`'daki en dar `-keep` kuralı
8. Açık kaynak bir Java projesi için gerçek SBOM + tarama

---

# Kendini sınama

1. Java hangi hata sınıflarını kaldırır, hangilerini kaldırmaz?
2. Enjeksiyonların ortak kökü ve ortak düzeltmesi?
3. `ORDER BY` sütunu neden `?` ile verilemez?
4. `ProcessBuilder` tek başına her şeyi çözer mi?
5. Neden önce kanonikleştir, sonra denetle?
6. Seri durumdan çıkarmada saldırganın yetkisi nedir?

<!-- Konuşma notu: 1) Bellek hataları / enjeksiyon, seri durumdan çıkarma, sırlar, tersine mühendislik, bağımlılık, mantık. 2) Aynı kanal; iki kanal. 3) Yalnız değer; beyaz liste. 4) Hayır: argüman enjeksiyonu. 5) Birçok yazılış; kanonik tek. 6) Sınıf seçme. -->

---

# Kendini sınama (devam)

7. `ObjectInputFilter`'daki `!*` ne işe yarar?
8. Bayt kodu neden kolay geri çevrilir?
9. ProGuard'ın dört aşaması? Hangisi dizgeleri gizler?
10. `mapping.txt` neden sırdır?
11. `-assumenosideeffects ... Log` ne yapar?
12. SBOM'da purl ve özet neden var? VEX nedir?

<!-- Konuşma notu: 7) Varsayılan-reddet. 8) Adlar, tipler, dizgeler korunur. 9) Küçültme, iyileştirme, gizleme, ön doğrulama; hiçbiri. 10) Gizlemeyi geri alır. 11) Günlük çağrılarını siler. 12) Tek biçimli kimlik ve bütünlük; zafiyetin ürünü etkileyip etkilemediği. -->

---

# Gelecek hafta

**Hafta 6 — Çalışma zamanı uygulama öz koruması (RASP)**

- Root ve emülatör algılama, imza doğrulama
- Çalışma anında kod bütünlüğü denetimi
- Hata ayıklayıcı ve kanca algılama
- Müdahale algılandığında verilecek yanıtlar

Hazırlık: `code/week-06`
