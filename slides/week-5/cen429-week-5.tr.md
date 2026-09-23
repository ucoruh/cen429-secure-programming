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

<!--
Konuşma notu: Bu hafta yönetilen dillere geçiyoruz: bellek güvenliği bedava gelir ama enjeksiyon, seri durumdan çıkarma, okunabilir bayt kodu ve bağımlılıklar yeni riskler getirir.
-->

---

# Bugünün planı (3 saat)

| Saat | Bölüm | Konu |
| --- | --- | --- |
| 1 | 0–3 | Temel kavramlar · yönetilen diller · CERT Java · enjeksiyonun kökü |
| 2 | 4–9 | SQL/komut/yol enjeksiyonu · seri durumdan çıkarma · XML/XXE · Python/JS |
| 3 | 10–16 | Bayt kodu · ProGuard/R8 · dize gizleme · Android · SBOM · proje |

<!-- Konuşma notu: 4. haftanın C/C++ karşılığını Java/yorumlanan dillerde işliyoruz. Sıfır ön bilgi varsayıyoruz; her terimi tanımlayacağız. -->

---

<!-- _class: yogun -->

# Kısa tarihçe — yönetilen diller ve kalan açıklar

- **1995** — **Java/JVM**: bellek hatalarının çoğu **dil düzeyinde** biter
- **1998** — SQL enjeksiyonu belgelenir · **2003** **OWASP Top 10**
- **2002** — **ProGuard** (sonra **R8**): bayt kod kolay geri çevrildiği için
- **2015** deserialization · **2020–21** SolarWinds ve **Log4Shell** → **SBOM** çağı

> Dil **bellek hatasını** çözer; **enjeksiyonu ve bağımlılık riskini çözmez**.

---


# Bu hafta nereye oturuyor?

- **4. hafta:** C/C++ sağlamlaştırma (bellek hataları).
- **Bu hafta (5):** Java/yorumlanan diller — bellek hataları çoğu **çözülmüş**, ama yeni sınıf: **enjeksiyon** ve **bağımlılık**.
- İkili koruma tarafı: **ProGuard/R8** ve **SBOM**.

---

# Öğrenme çıktısı

Bu hafta **ÖÇ.3 / ÖÇ.4** üstünedir.

Sonunda yapabileceğiniz:

- Enjeksiyon sınıfını tanımak ve önlemek (SQL, komut, yol, XML, seri durum)
- ProGuard/R8 ile gizleme ve `-keep` kurallarını yazmak
- Bir **SBOM** üretip bağımlılık riskini yönetmek

---

# Ana fikir

> Yönetilen dil bellek hatalarını büyük ölçüde **çözer**; ama **veri ile komutun karışması** (enjeksiyon) her dilde vardır.

Bugün bu ortak kökü ve dile özgü korumaları göreceğiz.

---

<!-- _class: bolum -->

# 0. Temel kavramlar (sıfırdan)

<!-- Konuşma notu: Java/web temel terimlerini sıfırdan tanımlıyoruz. -->

---

# Neden bu bölüm var?

Bu bölüm **hiçbir ön bilgi varsaymaz**.

- Haftanın geri kalanında kullanacağımız terimleri sıfırdan tanımlıyoruz.
- Bir terimi bilmiyorsanız önce **burayı** okuyun.
- Sonraki bölümler bu terimlerin **üzerine** kurulur.

---

# Yönetilen dil nedir?

- **Yönetilen dil:** belleği **otomatik** yöneten dil (Java, C#, Python, JS).
- Programcı `malloc`/`free` yapmaz; **çöp toplayıcı** (GC) hallreder.
- → çoğu bellek hatası (taşma, UAF) **ortadan kalkar**.

---

# JVM ve bayt kodu

- **JVM (Java Virtual Machine):** Java'yı çalıştıran sanal makine.
- **Bayt kodu:** Java kaynağının derlendiği ara biçim (`.class` dosyaları).
- Bayt kodu makineden bağımsız; JVM onu çalıştırır.

---

# Çöp toplayıcı (GC)

- **GC (Garbage Collector):** artık kullanılmayan nesneleri otomatik temizler.
- Programcı belleği elle bırakmaz.
- Bu yüzden UAF/çift bırakma Java'da **yok denecek kadar az**.

---

# Enjeksiyon nedir?

- **Enjeksiyon:** kullanıcı **verisinin** bir **komut** olarak yorumlanması.
- Örnek: kullanıcı adı diye girilen metnin SQL sorgusuna komut olarak sızması.
- Bu haftanın ana teması.

---

# SQL ve veritabanı

- **SQL:** veritabanı sorgulama dili (`SELECT ... WHERE ...`).
- Uygulama, kullanıcı girdisini sorguya koyar.
- Yanlış konursa → **SQL enjeksiyonu**.

---

# Parametreli sorgu

- **Parametreli sorgu (prepared statement):** sorgu iskeleti sabit, veriler ayrı **parametre** olarak verilir.
- Veri asla komut olarak yorumlanmaz.
- SQL enjeksiyonuna karşı **asıl** çözüm.

---

# Seri durum (serialization)

- **Serileştirme:** bir nesneyi bayt dizisine çevirme (kaydetmek/göndermek için).
- **Seri durumdan çıkarma (deserialization):** baytları geri nesneye çevirme.
- Güvenilmez baytları çıkarmak **tehlikeli** (kod çalıştırma).

---

# XML ve XXE

- **XML:** yapılandırılmış veri biçimi (etiketlerle).
- **XXE (XML External Entity):** XML'in "dış varlık" özelliğinin kötüye kullanımı → dosya okuma, SSRF.
- XML ayrıştırıcıda dış varlıklar **kapatılır**.

---

# Yol geçişi (path traversal)

- **Yol geçişi:** `../` ile izin verilen klasörün **dışına** çıkma.
- `dosyalar/../../etc/passwd` gibi.
- Kanonikleştirme + kök denetimiyle önlenir.

---

# ProGuard ve R8

- **ProGuard / R8:** Java/Android bayt kodunu **küçülten, adları gizleyen** araçlar.
- R8, Android'in varsayılan aracı.
- Ad gizleme + ölü kod eleme + küçültme.

---

# `-keep` kuralı

- **`-keep`:** ProGuard/R8'e "bu sınıf/metodun adını **değiştirme**" demek.
- Reflection ile ada göre çağrılan kod korunmalı.
- Yanlış `-keep` → ya çökme ya zayıf gizleme.

---

# Reflection nedir?

- **Reflection:** bir sınıfı/metodu **çalışma anında adıyla** bulup çağırma.
- `Class.forName("...")`, `getMethod("...")`.
- Gizleme bunu bozabilir → `-keep` gerekir.

---

# SBOM nedir?

- **SBOM (Software Bill of Materials):** yazılımın **malzeme listesi** — hangi kütüphaneler, hangi sürümler.
- Bir kütüphanede açık çıkınca "etkilendik mi?" sorusunu **hızlı** yanıtlar.
- Biçimler: CycloneDX, SPDX.

---

# Bağımlılık (dependency)

- **Bağımlılık:** projenizin kullandığı dış kütüphaneler.
- Kendi kodunuz güvenli olsa bile, bir bağımlılıktaki açık sizi etkiler.
- Tedarik zinciri güvenliği.

---

# Şimdi hazırız

Terimler:

yönetilen dil · JVM/bayt kodu · GC · enjeksiyon · SQL/parametreli sorgu · serileştirme · XML/XXE · yol geçişi · ProGuard/R8 · `-keep` · reflection · SBOM · bağımlılık

Şimdi: yönetilen diller neyi çözer, neyi çözmez?

---

<!-- _class: bolum -->

# 1. Yönetilen diller ve enjeksiyonun kökü

---

# Yönetilen dil neyi çözer?

- Otomatik bellek yönetimi (GC) → taşma, UAF, çift bırakma **büyük ölçüde yok**.
- Dizi erişimi sınır denetimli → `ArrayIndexOutOfBounds` (çökme, sömürü değil).
- Tür güvenliği daha sıkı.

---

# Yönetilen dil neyi ÇÖZMEZ?

- **Enjeksiyon** (veri = komut) — her dilde var.
- **Mantık hataları**, yetki hataları.
- **Bağımlılık** açıkları.
- **Seri durumdan çıkarma** saldırıları.

> Bellek hatası azaldı; yeni cephe: enjeksiyon ve tedarik zinciri.

---

# Yönetilen dil: çözer / çözmez — şema

![w:950](assets/h05-02-yonetilen-dil.svg)

---

# SEI CERT Oracle Java

- Java için ayrı bir **kural kitabı** (CERT Oracle Coding Standard for Java).
- Aynı yapı: hatalı örnek + uyumlu çözüm + risk.
- Örnek alanlar: enjeksiyon, seri durum, eşzamanlılık, hassas veri.

---

# CERT Oracle Java — şema

![w:900](assets/h05-11-cert-java.svg)

---

<!-- _class: yogun -->

# SEI CERT · bu haftaya dokunan kurallar

| Kısaltma | Kategori | Kural (örnek) |
| --- | --- | --- |
| `IDS` | Girdi doğrulama | IDS00-J SQL · IDS07-J `Runtime.exec` · IDS16/17-J XML |
| `FIO` | Girdi/çıktı | FIO16-J: yol adını kanonikleştir |
| `SER` | Serileştirme | SER12-J: güvenilmeyen veriyi seri durumdan çıkarma |
| `MSC` | Çeşitli | MSC03-J: koda gömülü hassas bilgi kullanma |
| `ERR` | Hata işleme | ERR01-J: istisnada hassas bilgi sızdırma |

Kimlikler `-J` sonekiyle biter.

---

# Java'da hassas veri

- Java `String` **değişmezdir** (immutable) → bellekten silinemez.
- Parola/anahtar için `char[]` kullan, işi bitince **doldur** (`Arrays.fill`).
- GC ne zaman toplayacağını **garanti etmez**.

---

# Enjeksiyonun ortak kökü

> Enjeksiyon = **veri** ile **komutun** karışması.

- Kullanıcı verisi bir yorumlayıcıya (SQL, kabuk, XML) **komut** olarak gider.
- Kök aynı; hedef (SQL/kabuk/XML) değişir.

---

# Enjeksiyonun kökü — veri mi, kod mu?

![w:1000](assets/h05-01-enjeksiyon-koku.svg)

---


# Çözümün ortak kökü

Her enjeksiyon türünde aynı ilke:

- **Veriyi koddan ayır** (parametreli API).
- Veriyi asla **string birleştirmeyle** komuta gömme.
- Beyaz liste + bağlama uygun kaçış (son çare).

---

<!-- _class: yogun -->

# Tek kanal mı, iki kanal mı? — tablo

| Yorumlayıcı | Tek kanal (hatalı) | İki kanal (doğru) |
| --- | --- | --- |
| SQL motoru | `"...WHERE ad='" + ad + "'"` | `PreparedStatement` + `?` |
| Kabuk | `exec("sh -c '...' " + host)` | `ProcessBuilder(...)` — kabuk yok |
| Dosya sistemi | `new File(kok, istek)` | Kanonikleştir + kök denetimi |
| XML | Dize birleştirerek XML kurmak | DOM/StAX API'siyle öğe oluşturmak |

Aynı ilke, dört farklı yorumlayıcı.

---

# Enjeksiyon aileleri (bugün)

- SQL enjeksiyonu
- Komut enjeksiyonu
- Yol geçişi
- Seri durumdan çıkarma
- XML/XXE, şablon, XSS

Hepsinin kökü ve çözümü **aynı mantık**.

---

# Bu bölümün kuralı

> Yönetilen dil **bellek** hatasını çözer; **enjeksiyonu** çözmez.

- Enjeksiyonun kökü hep aynı: veri = komut.
- Çözüm hep aynı: veriyi koddan **ayır**.
- Bu ilkeyi şimdi tek tek enjeksiyon türlerinde göreceğiz.

---

# Bölüm 1 — kısa sınama

1. Yönetilen dil hangi hata sınıfını büyük ölçüde çözer?
2. Neyi çözmez?
3. Enjeksiyonun ortak kökü nedir?

<!-- Konuşma notu: Sonra SQL enjeksiyonu. -->

---

# Bölüm 1 — cevaplar

1. **Bellek güvenliği** hatalarını (tampon taşması, use-after-free, çift/sarkan işaretçi) — GC + sınır denetimiyle.
2. **Mantık/enjeksiyon/yetkilendirme**, güvensiz deserialization, zayıf kripto, **bağımlılık** açıkları — bunlar dil-üstü, çözülmez.
3. Güvenilmeyen **VERİ** ile **KOD/komutun** aynı kanalda karışması; yorumlayıcı veriyi **komut** olarak ayrıştırır.

---


<!-- _class: bolum -->

# 2. SQL enjeksiyonu

---

# Hatalı kod

```java
String q = "SELECT * FROM kul WHERE ad = '" + ad + "'";
stmt.executeQuery(q);   // HATALI: ad komuta karışır
```

`ad` içine tırnak ve SQL koyulursa?

---

# Saldırı · örnek

Kullanıcı `ad` olarak şunu girer:

```text
' OR '1'='1
```

Sorgu şuna döner:

```sql
SELECT * FROM kul WHERE ad = '' OR '1'='1'
```

`'1'='1'` her zaman doğru → **tüm satırlar** döner.

---

# Neden oldu?

- `ad`, sorgu **metnine** birleştirildi.
- Tırnak, veriyi bitirip **komut** kısmına geçmeyi sağladı.
- Veri ile komut **karıştı**.

---

# SQL enjeksiyonu adım adım — şema

![w:950](assets/h05-03-sql-enjeksiyon.svg)

---

# Doğru · parametreli sorgu

```java
PreparedStatement ps =
    con.prepareStatement("SELECT * FROM kul WHERE ad = ?");
ps.setString(1, ad);    // ad yalnız VERİ
ps.executeQuery();
```

`?` bir **parametre**; `ad` asla komut olarak yorumlanmaz.

---

# Neden çalışır?

- Sorgu iskeleti **önceden** veritabanına gönderilir (derlenir).
- `ad` sonradan **veri** olarak bağlanır.
- Tırnak koysa bile veri olarak kalır.

---

# Diğer katmanlar

- **En az yetki:** uygulamanın DB kullanıcısı yalnız gerekeni yapsın.
- **Girdi doğrulama:** yine de beyaz liste.
- **ORM** kullanıyorsanız da parametreli API'yi kullanın (string birleştirme değil).

---

# ⚠️ Kaçış (escaping) son çaredir

- Elle tırnak kaçırmak **hataya açık**; her DB farklı.
- Öncelik **her zaman** parametreli sorgu.
- Kaçış yalnız parametrelenemeyen yerlerde, dikkatle.

---

# SQL enjeksiyonu · bu bölümün kuralı

- Sorguyu **asla** string birleştirmeyle kurma.
- **Her zaman** parametreli sorgu (`PreparedStatement`, `?`).
- Ad/sütun gibi tanımlayıcılar için **beyaz liste**.
- Kaçış (escaping) yalnız son çare.

---

<!-- _class: bolum -->

# 3. Komut enjeksiyonu

---

# Kabuk var mı yok mu — şema

![w:950](assets/h05-04-komut-enjeksiyon.svg)

---

# Hatalı kod

```java
Runtime.getRuntime().exec("ping " + host);  // HATALI
```

`host` içine kabuk metakarakteri koyulursa?

---

# Saldırı · örnek

`host` olarak:

```text
example.com; rm -rf veri
```

Kabuk bunu **iki komut** olarak çalıştırır: `ping` **ve** `rm`.

*(Örnek sentetik; asla çalıştırmayın.)*

---

# Neden oldu?

- Komut bir **kabuğa** metin olarak verildi.
- `;`, `|`, `&&` kabukta **komut ayırıcı**.
- Veri, komut satırına karıştı.

---

# Doğru · argüman dizisi

```java
new ProcessBuilder("ping", "-c", "1", host).start();
```

- Kabuk **yok**; `host` tek bir **argüman**.
- Metakarakterler yorumlanmaz.

---

# Ek kurallar

- Mümkünse dış komut **hiç** çalıştırma; kütüphane API'si kullan.
- Çalıştıracaksan: sabit yol, argüman dizisi, beyaz liste.
- `ENV33-C` benzeri: `system()`/kabuk çağırma.

---

# Komut enjeksiyonu · bu bölümün kuralı

- Mümkünse dış komut **hiç** çalıştırma.
- Çalıştıracaksan: kabuksuz **argüman dizisi** (`ProcessBuilder`).
- Sabit yol + beyaz liste; `-` ile başlayan girdiye dikkat (argüman enjeksiyonu).

---

<!-- _class: bolum -->

# 4. Yol geçişi

---

# Yol geçişini kapatan iki adım — şema

![w:950](assets/h05-05-yol-gecisi.svg)

---

# Hatalı kod

```java
File f = new File("yuklenen/" + adi);  // HATALI
```

`adi` içine `../` koyulursa?

---

# Saldırı · örnek

`adi` olarak:

```text
../../etc/passwd
```

Sonuç: `yuklenen/../../etc/passwd` → izin verilen klasörün **dışı**.

---

# Neden oldu?

- `adi`, dosya yoluna **doğrudan** eklendi.
- `../` dizisi, yorumlayıcı (dosya sistemi) tarafından "üst klasöre çık" olarak okundu.
- Denetim yoktu: hangi klasörün **dışına** çıkıldığı hiç sorulmadı.

---

# Doğru · kanonikleştir + kök denetimi

```java
Path kok = Paths.get("yuklenen").toRealPath();
Path hedef = kok.resolve(adi).normalize().toRealPath();
if (!hedef.startsWith(kok)) throw new SecurityException();
```

Kanonik yol **kökün altında** mı? Değilse reddet.

---

# Neden çalışır?

- Önce yol **kanonik** (tek, kesin) hale getirilir.
- Sonra kanonik yolun kök **içinde** olup olmadığı denetlenir.
- `../`, kodlanmış biçim (`..%2f`) ya da sembolik bağlantı — hepsi kanonikleştirmeden **sonra** aynı gerçek yola iner; hiçbiri denetimden kaçamaz.

---

# Yol geçişi · ek

- Dosya adını **beyaz listeyle** sınırla (`[a-zA-Z0-9_.-]`).
- Sembolik bağlantılar (`symlink`) kanonikleştirmeyle çözülür.
- Kullanıcı adını **doğrudan** dosya adı yapma.

---

# Yol geçişi · bu bölümün kuralı

- Ham dizgeye **asla** güvenme (`contains("..")` yetmez).
- Önce **kanonikleştir**, sonra **kök içinde mi** diye denetle.
- Sembolik bağlantıları da çöz (`toRealPath()`); denetimi dosya açıldıktan sonra da tekrarla.

---

# Üç enjeksiyon · ortak ders

| Tür | Yanlış | Doğru |
| --- | --- | --- |
| SQL | String birleştirme | Parametreli sorgu |
| Komut | Kabuğa metin | Argüman dizisi |
| Yol | `../` birleştirme | Kanonikleştir + kök denetimi |

Kök aynı: **veriyi koddan/komuttan ayır**.

---

# Bölüm 2–4 — kısa sınama

1. `' OR '1'='1` neden tüm satırları döndürür?
2. `ProcessBuilder` argüman dizisi neden güvenli?
3. Yol geçişini hangi iki adım kapatır?

<!-- Konuşma notu: Sonra seri durumdan çıkarma ve XML. -->

---

# Bölüm 2–4 — cevaplar

1. Dizeye katılınca `WHERE` koşulunu **her zaman doğru** yapar → tüm satırlar (veri, kod olarak ayrıştırıldı).
2. Argümanlar **kabuğa değil** programa ayrı ayrı geçer; `;` `|` gibi meta-karakter yorumu yok → komut enjeksiyonu kapanır.
3. (1) **Kanonik yola** çevir (`realpath`/normalize), (2) izinli **kök dizin** içinde mi doğrula (allowlist). Kullanıcı girdisini yola doğrudan koyma.

---


<!-- _class: bolum -->

# 5. Güvensiz seri durumdan çıkarma

---

# Hatalı kod

```java
Object o = new ObjectInputStream(giris).readObject();  // TEHLİKELİ
```

`giris` güvenilmeyen bir kaynaktan geliyorsa?

---

# Deserialization gadget zinciri — şema

![w:950](assets/h05-06-deserialization.svg)

---

# Sorun

- Güvenilmez baytları bir nesneye çevirmek **tehlikelidir**.
- Java'da `ObjectInputStream.readObject()` çıkarken **kod** çalıştırabilir (gadget zincirleri).
- Sonuç: uzaktan kod çalıştırma.

---

# Neden bu kadar kötü?

- Çıkarma sırasında nesnelerin **kurucuları/metotları** çalışır.
- Uygun kütüphaneler varsa (gadget), zincirlenip komut çalıştırılabilir.
- Girdi "sadece veri" sanılır ama **kod** gibi davranır.

---

# Doğru · en iyisi: hiç yapma

- Güvenilmez veriyi **native serileştirmeyle** çıkarma.
- Onun yerine **JSON/veri** biçimi + katı şema.
- Yalnız beklediğiniz alanları okuyun.

---

# Zorundaysanız · filtre

```java
ObjectInputFilter f = ObjectInputFilter.Config
    .createFilter("com.uygulama.*;!*");  // yalnız izinli sınıflar
ois.setObjectInputFilter(f);
```

- **Beyaz liste**: yalnız beklenen sınıflar.
- Derinlik/boyut sınırı da koyun (DoS'a karşı).

---

# Deserialization · bu bölümün kuralı

- Güvenilmeyen bayt akışını çıkarmak, saldırgana **sınıf seçme** yetkisi vermektir.
- En iyisi: **hiç yapma** (JSON + katı şema).
- Zorundaysan: **izin listesi filtresi**, derinlik/boyut sınırı.

---

<!-- _class: bolum -->

# 6. XML, şablon, XSS

---

# XXE · sorun

- XML'de **dış varlık** tanımlanabilir; ayrıştırıcı onu **çözer**.
- Saldırgan bununla dosya okutabilir ya da sunucudan istek yaptırabilir (SSRF).

---

# XXE — şema

![w:950](assets/h05-07-xxe.svg)

---

# XXE · doğru

```java
dbf.setFeature(
  "http://apache.org/xml/features/disallow-doctype-decl", true);
// ya da dış varlıkları kapat
```

- **Dış varlıkları kapat**, DOCTYPE'ı reddet.
- Çoğu kütüphanede tek satırlık ayar.

---

# Şablon enjeksiyonu (SSTI)

- Şablon motoruna kullanıcı girdisini **şablon** olarak vermek.
- Motor onu kod gibi çalıştırabilir.
- Kural: kullanıcı girdisi **veri**, şablon **sabit**.

---

# XSS (kısaca)

- **XSS:** kullanıcı verisinin bir web sayfasına **HTML/JS** olarak sızması.
- Çözüm: çıktı **bağlama uygun kodlama** (HTML-encode), CSP.
- Kök yine aynı: veri ≠ kod.

---

# XML/şablon/XSS · bu bölümün kuralı

- Yorumlayıcının **hangi özelliği açık**, bil ve gereksizini kapat.
- XML: dış varlık + DOCTYPE kapalı.
- Şablon: kullanıcı verisi yalnız **değişken**, asla şablonun kendisi.
- HTML: çıktıyı **bağlama uygun** kodla.

---

<!-- _class: bolum -->

# 7. Python ve JavaScript'te aynı hatalar

---

# Yorumlanan dillerde aynı hatalar — şema

![w:900](assets/h05-12-yorumlanan-diller.svg)

---

# Aynı kök, farklı dil

- Enjeksiyon her dilde: Python `os.system`, JS `child_process`.
- Çözüm aynı: argüman dizisi, parametreli sorgu.

---

# Python · örnekler

- `os.system("cmd " + x)` → komut enjeksiyonu; `subprocess.run([...])` kullan.
- `eval(girdi)` / `pickle.loads(güvenilmez)` → **asla** güvenilmez veriyle.
- SQL: parametreli (`cursor.execute("... ?", (x,))`).

---

# Python · `eval` örneği (kod)

```python
deger = eval(girdi)                 # HATALI: herhangi bir Python ifadesi

import ast
deger = ast.literal_eval(girdi)     # Daha iyi: yalnız sabitler
deger = int(girdi)                  # En iyisi: beklenen türü ayrıştır
```

Kural: kullanıcı verisi `eval`'e **asla** ulaşmamalı.

---

# ReDoS (düzenli ifade DoS)

- Kötü bir **regex**, belirli girdilerde **üstel** zaman harcayabilir.
- Saldırgan bununla CPU'yu kilitler.
- Çözüm: güvenli regex, girdi uzunluğu sınırı, zaman aşımı.

---

# ReDoS · somut örnek

```text
Desen:  ^(a+)+$
Girdi:  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaa!"
```

- Motor, eşleşmeyi kanıtlamak için **milyonlarca** yol dener.
- Tek istek, işlemciyi saniyelerce/dakikalarca kilitler (CWE-1333).

---

# JavaScript · prototype pollution

- **Prototype pollution:** saldırgan `__proto__` üzerinden tüm nesnelerin **ortak** özelliğini bozar.
- Beklenmedik davranış, yetki atlatma.
- Çözüm: güvenli birleştirme, `Object.create(null)`, kütüphane güncelliği.

---

# Yorumlanan diller · ortak kural

- `eval`, `exec`, `pickle`, dinamik `require` → güvenilmez veriyle **kullanma**.
- Girdi doğrulama + parametreli API + güncel bağımlılık.

---

# Bölüm 5–9 — kısa sınama

1. Güvensiz deserialization neden kod çalıştırabilir?
2. XXE'yi hangi ayar kapatır?
3. ReDoS nedir, nasıl azaltılır?

<!-- Konuşma notu: Sonra bayt kodu ve gizleme. -->

---

# Bölüm 5–9 — cevaplar

1. Nesne kurulurken sınıfların yan etkili yöntemleri (`readObject`/**gadget zinciri**) tetiklenir → saldırgan nesne grafiğiyle akış kurar.
2. **Dış varlıkları ve DOCTYPE'ı** kapatan ayrıştırıcı ayarı (`disallow-doctype-decl`, external entities kapalı).
3. **ReDoS:** katastrofik geri izlemeli regex; kötü girdi **üstel** zaman → CPU kilitlenir. Azaltma: doğrusal-zaman motoru (RE2), iç içe niceleyiciden kaçın, uzunluk/zaman sınırı.

---


<!-- _class: bolum -->

# 8. Bayt kodu ve tersine derleme

---

# Bayt kod vs makine kodu — şema

![w:950](assets/h05-08-bayt-kod.svg)

---

# Java bayt kodu kolay okunur

- `.class`/`.jar` bayt kodu, kaynağa **çok yakın** geri çevrilebilir.
- Araçlar: `javap` (sökme), JD-GUI/CFR/Procyon (tersine derleme).
- Adlar, dizgeler, yapı büyük ölçüde **görünür**.

---

# `javap` örneği

```bash
javap -c -p Uygulama.class    # bayt kodunu sök
```

- Metot adları, çağrılar, sabitler görünür.
- Bu yüzden Java'da gizleme **daha da** gerekli.

---

<!-- _class: kucuk -->

# `javap` çıktısı — ne görünüyor?

```text
private static final java.lang.String GECERLI_PIN;
public boolean pinDogru(java.lang.String);
  Code:
     0: aload_1
     1: ldc           #7    // String 4729
     3: invokevirtual #9    // String.equals
     6: ireturn
```

Kaynak kod yok, ama **sabit** (`4729`), **ad** (`GECERLI_PIN`, `pinDogru`) ve **mantık** ("girdiyi bu sabitle karşılaştır") açıkça görünüyor.

---

# Neden C'den daha kolay?

- Bayt kodu **yüksek seviyeli** ve tür bilgisi taşır.
- Değişken/metot adları çoğunlukla korunur.
- → tersine mühendislik ucuz; gizleme şart.

---

# ⚠️ İstemcide sır yoktur

- Gizleme bunu **zorlaştırır**, ama sırrı gerçekten **saklamaz**.
- İstemcide durmak zorunda olmayan anahtar/parola → **sunucuda** tutulur.
- İstemcide durmak **zorunda** olan sır → whitebox kriptografi ister (11. hafta).

---

<!-- _class: bolum -->

# 9. ProGuard ve R8

---

# R8 ve ölçme adımları — şema

![w:900](assets/h05-14-r8-olcme.svg)

---

# ProGuard/R8 ne yapar?

Üç iş:

- **Küçültme (shrink):** kullanılmayan kodu atar.
- **İyileştirme (optimize):** kodu sadeleştirir.
- **Gizleme (obfuscate):** adları anlamsızlaştırır (`a`, `b`, `c`).

---

<!-- _class: yogun -->

# ProGuard/R8 · dört aşama — tablo

| Aşama | Ne yapar? | Güvenlik katkısı |
| --- | --- | --- |
| Küçültme | Kullanılmayan kodu atar | Saldırı yüzeyi azalır |
| İyileştirme | Satır içi alma, sabit katlama | Yapı kaynaktan uzaklaşır |
| Gizleme | Adları `a`, `b`, `c` yapar | Anlamlı adlar kaybolur |
| Ön doğrulama | Eski JVM için doğrulama bilgisi | — |

---

# Ad gizleme örneği

```text
LisansDenetleyici.dogrula()  →  a.b()
```

- Anlamlı adlar kaybolur.
- Tersine mühendis için harita zorlaşır.
- Ölü kod atılınca ikili küçülür.

---

# `-keep` neden gerekir?

- Reflection ile **adıyla** çağrılan kod (API, giriş noktaları, JNI) korunmalı.
- Gizleme adı değiştirirse çağrı **kırılır**.

```proguard
-keep class com.uygulama.Api { public *; }
```

---

# -keep dengesi — şema

![w:950](assets/h05-09-keep-dengesi.svg)

---

# `-keep` dengesi

- **Çok az `-keep`:** uygulama çöker (reflection kırılır).
- **Çok fazla `-keep`:** gizleme zayıflar (her şey açık kalır).
- Yalnız **gerçekten gereken** giriş noktalarını tut.

---

# Eşleme dosyası (mapping)

- R8 bir `mapping.txt` üretir: gizli ad → gerçek ad.
- **Gizli tutulur** (dağıtılmaz), ama çökme izlerini çözmek için saklanır.
- Sürüm kimliğiyle birlikte arşivlenir.

---

<!-- _class: kucuk -->

# Eşleme dosyası · örnek (`mapping.txt`)

```text
com.ornek.odeme.KartYoneticisi -> com.ornek.a:
    android.content.Context baglam -> a
    boolean varsayilanKartiAyarla(java.lang.String) -> b
```

Eski ad → yeni ad. Bu dosya, gizlemeyi **tamamen** geri alır.

---

# ProGuard/R8 · bu bölümün kuralı

- Küçült + iyileştir + gizle; **dizgeleri gizlemez**.
- `-keep` yalnız **gerçekten** reflection/JNI ile çağrılana.
- `mapping.txt` bir **sır**: sakla, dağıtma.

---

<!-- _class: bolum -->

# 10. Dize gizleme ve reflection

---

# Dize gizleme ve dinamik çağrı — şema

![w:900](assets/h05-13-dize-gizleme.svg)

---

# Java'da dizgeler açık

- `.class` içindeki sabit dizgeler **düz** görünür (`strings`, tersine derleyici).
- Hassas URL, anahtar parçası, mesajlar sızar.

---

# Dize gizleme

- Dizgeler derlemede **kodlanır**, kullanımda çözülür.
- 4. haftadaki kuralla aynı: `strings`'i durdurur, **anahtar saklamaz**.
- Çözme kodu da bytecode'da → sınırlı koruma.

---

# ⚠️ Reflection ile gizleme çatışması

- Ada göre çağrı (`getMethod("dogrula")`) gizlemeden **sonra** kırılır.
- Çözüm: ya `-keep` ya reflection'ı bırakıp doğrudan çağrı.
- Reflection'ı azaltmak hem güvenlik hem gizleme için iyidir.

---

<!-- _class: bolum -->

# 11. Android R8 ve ölçme

---

# Android'de R8

- R8, Android derlemesinin **varsayılan** küçültücü/gizleyicisi.
- `minifyEnabled true` + `proguard-rules.pro`.
- DEX (Android bayt kodu) üretir.

---

<!-- _class: kucuk -->

# Sürüm derlemesinde R8 açmak

```gradle
android { buildTypes { release {
    minifyEnabled true
    shrinkResources true
    proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'),
                  'proguard-rules.pro'
}}}
```

Hata ayıklama (debug) derlemesi **gizlenmez**; dağıtılan sürümün **release** olduğunu doğrulayın.

---

# Gizlemenin etkisini ölçmek

- Gizleme öncesi/sonrası:
  - anlamlı ad oranı
  - düz metin hassas dize sayısı
  - APK boyutu
- Ölç ve S9'a yaz (9. haftadaki ölçme mantığı).

---

<!-- _class: yogun -->

# Ölçüm tablosu — genişletilmiş

| Ölçüt | Beklenen değişim |
| --- | --- |
| Sınıf/metot sayısı | Küçültmeyle azalır |
| Anlamlı ad oranı | Gizlemeyle çok düşer |
| Düz metin hassas dizge | Dize gizlemeyle sıfıra iner |
| Paket boyutu | Küçültmeyle azalır |
| Günlük çağrısı sayısı | Sürümde sıfır |
| Denetimi bulma süresi | Artar (insan deneyi) |

---

# Java için statik analiz

- SpotBugs, Error Prone, SonarQube.
- CERT Java kurallarına yakın denetimler.
- CI'da her birleştirmede.

---

# Bölüm 8–13 — kısa sınama

1. Java bayt kodu neden C'den kolay okunur?
2. `-keep` dengesi nedir?
3. Reflection gizlemeyle neden çatışır?

<!-- Konuşma notu: Sonra SBOM ve bağımlılık güvenliği. -->

---

# Bölüm 8–13 — cevaplar

1. Bayt kod **yüksek seviyeli**; tip ve **ad meta verisi** (sınıf/alan/metot) korunur → decompiler neredeyse kaynağı verir. C, adları atarak makine koduna derlenir.
2. **-keep dengesi:** çok keep → gizleme zayıflar; az keep → reflection/serileştirme kırılır. Yalnız **dış giriş noktalarını** keep et.
3. Reflection adları **dizeyle** çağırır; gizleyici adı değiştirince dize eşleşmez → çalışma anında hata. O adları keep etmek gerekir (gizleme boşluğu).

---


<!-- _class: bolum -->

# 12. Bağımlılık güvenliği ve SBOM

---

# Sorun · tedarik zinciri

- Kendi kodunuz kusursuz olsa bile, kullandığınız **kütüphanelerdeki** açık sizi etkiler.
- Modern uygulama yüzlerce bağımlılık içerir.
- "Hangi sürüm bende var?" sorusu kritik.

---

# Gerçek örnekler

- Log4Shell (Log4j): tek bir kütüphane açığı, milyonlarca sistemi etkiledi.
- Kötü niyetli paket (typosquatting): benzer adlı sahte paket.
- Bakımsız/terk edilmiş bağımlılık.

---

# Log4Shell · somut örnek (Aralık 2021)

- Log4j 2'de günlüğe yazılan özel bir ifade, **uzaktaki** bir adresten sınıf yükletip çalıştırıyordu.
- CVE-2021-44228, CVSS **10.0** (en yüksek skor).
- Asıl kriz yamayı uygulamak değildi: **hangi sistemde hangi sürüm var** sorusuydu.

---

# SBOM nedir? (hatırlatma)

- Yazılımın **malzeme listesi**: hangi bileşen, hangi sürüm, hangi lisans.
- Bir açık duyurulunca "etkilendim mi?" **hızlı** yanıtlanır.

---

# SBOM biçimleri

- **CycloneDX** (OWASP) — güvenlik odaklı, yaygın.
- **SPDX** (Linux Foundation) — lisans odaklı da güçlü.
- Araçlarla otomatik üretilir (derleme adımında).

---

<!-- _class: kucuk -->

# CycloneDX örneği (JSON, sentetik)

```json
{
  "bomFormat": "CycloneDX",
  "components": [{
    "type": "library", "name": "ornek-json", "version": "1.2.0",
    "purl": "pkg:maven/com.ornek/ornek-json@1.2.0"
  }]
}
```

Her bileşen: ad, sürüm, **purl** (ekosistemden bağımsız tekil kimlik), özet değeri.

---

# VEX nedir?

- **VEX (Vulnerability Exploitability eXchange):** "bu açık bende var ama **sömürülebilir değil**" bilgisini paylaşır.
- Gürültüyü azaltır: her CVE panik değil.
- SBOM'a eşlik eder.

---

# Bağımlılık yönetimi kuralları

- Sürümleri **sabitle** (pin); rastgele "en son" çekme.
- Bilinen açıkları tara (`dependency-check`, `npm audit`, `pip-audit`).
- Güvenli güncelleme süreci; kritik yamaları hızlı uygula.

---

# SBOM üretimi · örnek akış

![w:900](assets/h05-10-sbom.svg)

Her sürümün SBOM'u sürüm kimliğiyle saklanır.

---

# Projeye bağ

- **S13:** güvenli geliştirme süreci + SBOM.
- Her sürüm için güncel SBOM ve bağımlılık taraması.
- Devredilen gereksinimler: "güvenli güncelleme" üst uygulamaya (13. hafta).

---

# SBOM · bu bölümün kuralı

- Kendi kodun kusursuz olsa da **bağımlılığın açığı seni etkiler**.
- SBOM = malzeme listesi; VEX = "gerçekten etkilendim mi?" cevabı.
- Sürümü **sabitle**, sürekli **tara**, kritik yamayı hızlı uygula.

---

# Bölüm 14 — kısa sınama

1. SBOM ne işe yarar?
2. VEX neden gürültüyü azaltır?
3. Bağımlılık sürümlerini neden sabitleriz?

<!-- Konuşma notu: Sonra proje ve çözümlü sınama. -->

---

# Bölüm 14 — cevaplar

1. **SBOM** = bileşen/bağımlılık envanteri; yeni açık çıkınca "bende var mı?" sorusunu **hızla** yanıtlar.
2. **VEX** açığın üründe gerçekten **sömürülebilir** olup olmadığını bildirir; etkilenmeyenler "not affected" → yanlış alarm azalır.
3. Sabit sürüm = **yeniden üretilebilir** derleme + tedarik zinciri güvenliği; beklenmedik/zararlı güncellemeyi engeller.

---


<!-- _class: bolum -->

# Proje ve kapanış

---

# Proje · S9/S13 (Java tarafı)

- [ ] Enjeksiyona açık noktaları parametreli API'ye çevir (SQL, komut, yol).
- [ ] Güvensiz deserialization varsa filtre/şema.
- [ ] R8/ProGuard ile gizleme; `-keep` yalnız gereken giriş noktaları.
- [ ] Dize gizleme; hassas dize `strings`/tersine derlemede yok.
- [ ] SBOM üret + bağımlılık taraması (S13).

---

<!-- _class: bolum -->

# Çözümlü kendini sınama

---

# Soru 1

**Yönetilen dil hangi hata sınıfını çözer, neyi çözmez?**

**Cevap:** Bellek hatalarını (taşma, UAF) büyük ölçüde çözer. Enjeksiyon, mantık/yetki hataları, bağımlılık ve deserialization saldırılarını **çözmez**.

---

# Soru 2

**`' OR '1'='1` neden tüm satırları döndürür?**

**Cevap:** Girdi string birleştirmeyle sorguya girer; tırnak veriyi bitirir, `OR '1'='1'` her zaman doğru olur. Parametreli sorgu bunu engeller.

---

# Soru 3

**Komut enjeksiyonunu `ProcessBuilder` nasıl önler?**

**Cevap:** Kabuk kullanmadan argümanları **dizi** olarak verir; metakarakterler (`;`, `|`) yorumlanmaz, girdi tek argüman kalır.

---

# Soru 4

**Yol geçişini hangi iki adım kapatır?**

**Cevap:** Kanonikleştirme (`normalize`/`toRealPath`) + kök denetimi (`startsWith(kok)`). Ayrıca dosya adı beyaz listesi.

---

# Soru 5

**Güvensiz deserialization neden tehlikelidir? Çözüm?**

**Cevap:** Çıkarma sırasında nesne metotları çalışır; gadget zinciriyle kod çalıştırılabilir. Çözüm: native serileştirme yerine veri biçimi + şema; zorunda kalınırsa `ObjectInputFilter` beyaz listesi.

---

# Soru 6

**XXE nedir, hangi ayar kapatır?**

**Cevap:** XML dış varlıklarının kötüye kullanımı (dosya okuma/SSRF). Dış varlıkları ve DOCTYPE'ı kapatan ayrıştırıcı ayarı kapatır.

---

# Soru 7

**ReDoS ve prototype pollution nedir?**

**Cevap:** ReDoS: kötü regex'in üstel zaman harcaması (DoS). Prototype pollution: JS'te `__proto__` üzerinden tüm nesneleri bozma. İkisi de girdi denetimi + güvenli API ister.

---

# Soru 8

**Java bayt kodu neden gizlemeye daha çok ihtiyaç duyar?**

**Cevap:** Bayt kodu yüksek seviyeli, tür ve ad bilgisi taşır; kaynağa çok yakın tersine derlenir. Adlar/dizgeler açık görünür.

---

# Soru 9

**`-keep` dengesi nedir?**

**Cevap:** Çok az `-keep` → reflection kırılır, uygulama çöker. Çok fazla → gizleme zayıflar. Yalnız gerçekten reflection'la çağrılan giriş noktaları tutulur.

---

# Soru 10

**Dize gizleme Java'da anahtar saklar mı?**

**Cevap:** Hayır. `strings`/statik taramayı durdurur ama çözülen dize bellekte açıktır ve çözme kodu bytecode'dadır. Anahtar için farklı koruma gerekir.

---

# Soru 11

**SBOM ve VEX ne işe yarar?**

**Cevap:** SBOM bileşen listesidir; açık duyurulunca etkilenip etkilenmediğinizi hızla söyler. VEX, açığın sömürülebilir olup olmadığını belirtir, gürültüyü azaltır.

---

# Soru 12

**Tüm enjeksiyon türlerinin ortak kökü ve çözümü?**

**Cevap:** Kök: veri ile komutun karışması. Çözüm: veriyi koddan **ayırmak** (parametreli/argüman dizisi API), string birleştirmeyle komut kurmamak.

---

# Özet: bu haftanın tek cümlesi

> Yönetilen dil bellek hatalarını çözer ama **enjeksiyon her dilde vardır**; çözüm her zaman veriyi komuttan ayırmak,
> koruma tarafında ise gizleme (R8) ve **bağımlılık/SBOM** yönetimidir.

---

<!-- _class: bolum -->

# Gelecek hafta

**6. hafta — RASP ve çalışma anı korumaları**

Kurcalama/hata ayıklama tespiti, bütünlük denetimi, tepki politikası ve katmanlı savunma.

---

<!-- _class: bolum -->

# Ek A · Bir enjeksiyonu baştan sona

<!-- Konuşma notu: Tek bir SQL enjeksiyonunu hatalı koddan saldırıya, düzeltmeye ve katmanlı savunmaya kadar izliyoruz. -->

---

# Bağlam · giriş formu

Kullanıcı adı ve parola ile giriş yapan bir uygulama.

```java
String q = "SELECT * FROM kul WHERE ad='" + ad +
           "' AND parola='" + p + "'";
```

Nerede yanlış?

---

# Adım 1 · saldırgan girdisi

`ad` alanına:

```text
yonetici' --
```

`--` SQL'de **yorum** başlatır; sonrası yok sayılır.

---

# Adım 2 · sorgu ne oluyor?

```sql
SELECT * FROM kul WHERE ad='yonetici' -- ' AND parola='...'
```

Parola denetimi **yorumda** kaldı → parolasız `yonetici` girişi.

---

# Adım 3 · etki

- Kimlik doğrulama **atlatıldı**.
- Daha ileri: `UNION SELECT` ile başka tabloları okuma.
- `; DROP TABLE` (yığın sorgu destekliyse) veri kaybı.

---

# Adım 4 · düzeltme

```java
PreparedStatement ps = con.prepareStatement(
  "SELECT * FROM kul WHERE ad=? AND parola_ozet=?");
ps.setString(1, ad);
ps.setString(2, ozetle(p));
```

`ad` ve parola artık **veri**; `--` etkisiz.

---

# Adım 5 · katmanlı savunma

- **Parolayı düz saklama:** özet + tuz (3. hafta).
- **En az yetki:** DB kullanıcısı yalnız `SELECT`.
- **Girdi doğrulama:** kullanıcı adı beyaz liste.
- **Günlük/izleme:** başarısız giriş denemeleri.

---

# Ders

- Tek kök: veri komuta karıştı.
- Asıl çözüm: parametreli sorgu.
- Ama derinlemesine savunma her katmanda.

---

<!-- _class: bolum -->

# Ek B · Deserialization mini vaka

---

# Kurgu

Bir uygulama, kullanıcının gönderdiği "oturum nesnesini" native serileştirmeyle çıkarıyor:

```java
Object o = new ObjectInputStream(giris).readObject();  // TEHLİKELİ
```

---

# Ne olabilir?

- Saldırgan, sınıf yolunda bulunan kütüphanelerden bir **gadget zinciri** hazırlar.
- Çıkarma sırasında bu zincir çalışır → komut çalıştırma.
- Girdi "veri" sanıldı, ama kod gibi davrandı.

---

# Düzeltme 1 · biçim değiştir

- Native serileştirme yerine **JSON** + katı şema.
- Yalnız beklenen alanlar okunur.
- Nesne grafiği "canlanmaz".

---

# Düzeltme 2 · zorundaysan filtre

```java
ois.setObjectInputFilter(ObjectInputFilter.Config
  .createFilter("com.uygulama.Oturum;!*"));  // yalnız bu sınıf
```

- Beyaz liste + derinlik/boyut sınırı.

---

# Vaka · ders

- Güvenilmez veriyi "canlı nesneye" çevirmek risklidir.
- En güvenlisi: hiç yapmamak (veri biçimi kullan).
- Zorunda kalınca: katı beyaz liste.

---

<!-- _class: bolum -->

# Ek C · Dil dil enjeksiyon

---

<!-- _class: yogun -->

# Aynı hata, üç dil

| Tehlike | Java | Python | JS |
| --- | --- | --- | --- |
| Komut | `Runtime.exec(str)` | `os.system(str)` | `exec(str)` |
| Güvenli | `ProcessBuilder([...])` | `subprocess.run([...])` | `execFile([...])` |

---

<!-- _class: yogun -->

# Aynı hata, veri çıkarma

| Tehlike | Java | Python | JS |
| --- | --- | --- | --- |
| Kod çalıştırma | `readObject` | `pickle.loads`, `eval` | `eval`, `Function` |
| Güvenli | JSON + şema | `json.loads` | `JSON.parse` |

Kök hep aynı: veri ≠ kod.

---

# Üç dil · tek kural

- Dinamik "çalıştır" (`eval`, `exec`, `pickle`, `readObject`) → güvenilmez veriyle **asla**.
- Komut → argüman dizisi.
- SQL → parametreli.
- Girdi → beyaz liste + reddetme.

---

# Ek A–C · özet

- Enjeksiyon dile bağlı değil; **kalıba** bağlı.
- Kalıbı tanı: "kullanıcı verisi bir yorumlayıcıya komut olarak mı gidiyor?"
- Tanıdıysan çözüm hazır: ayır.

---

<!-- _class: bolum -->

# Ek D · R8 gizleme adım adım

---

# Adım 1 · aç

`build.gradle`:

```gradle
buildTypes { release {
    minifyEnabled true
    proguardFiles(..., 'proguard-rules.pro')
}}
```

Sürüm derlemesinde küçültme + gizleme açılır.

---

# Adım 2 · giriş noktalarını koru

```proguard
-keep class com.uygulama.PublicApi { public *; }
-keepclassmembers class * {
    @com.uygulama.Reflected *;
}
```

Yalnız reflection/JNI ile çağrılanları tut.

---

# Adım 3 · derle ve doğrula

- APK'yı tersine derle; adların `a`, `b` olduğunu gör.
- `mapping.txt`'i **sakla** (dağıtma).
- Reflection kullanan akışları **test et** (çökme yok mu?).

---

# Adım 4 · ölç

- Anlamlı ad oranı: önce %90 → sonra %10.
- Düz hassas dize sayısı: önce N → sonra 0.
- APK boyutu: küçüldü mü?

Ölçümü S9'a yaz.

---

# Adım 5 · dize gizleme ekle

- Hassas dizgeleri kodla, kullanımda çöz, hemen sil.
- `strings`/tersine derlemede görünmemeli.
- Anahtar değil; yalnız statik tarama önlemi.

---

<!-- _class: bolum -->

# Ek E · SBOM adım adım

---

# Adım 1 · üret

```bash
# örnek: CycloneDX eklentisi
mvn org.cyclonedx:cyclonedx-maven-plugin:makeBom
```

Derlemede bir `bom.json`/`bom.xml` üretilir.

---

# Adım 2 · tara

```bash
dependency-check --scan . --format HTML
```

Bilinen açıkları (CVE) bağımlılıklara eşler.

---

# Adım 3 · değerlendir (VEX)

- Her açık için: bende **var mı**? **sömürülebilir mi**?
- Sömürülemezse VEX ile işaretle (gürültü azalır).
- Sömürülebilirse: güncelle ya da azalt.

---

# Adım 4 · arşivle

- SBOM + tarama raporu, **sürüm kimliğiyle** saklanır.
- Yeni açık çıkınca: "hangi sürümde bu bağımlılık vardı?" hızlı yanıt.

---

# Adım 5 · süreç

- Sürümleri sabitle; otomatik "en son" çekme.
- Kritik yamaları hızlı uygula.
- Güvenli güncellemeyi karşılayamıyorsan → **devret** (13. hafta).

---

<!-- _class: bolum -->

# Ek F · Hızlı başvuru

---

# Sık yapılan hatalar

- String birleştirmeyle SQL/komut kurmak.
- Güvenilmez veriyle `eval`/`pickle`/`readObject`.
- XML'de dış varlıkları açık bırakmak.
- `-keep *` ile her şeyi korumak (gizleme boşa).
- Bağımlılıkları taramamak.

---

<!-- _class: yogun -->

# Sözlük

| Terim | Anlam |
| --- | --- |
| Enjeksiyon | Veri = komut karışması |
| Parametreli sorgu | Veri ayrı bağlanır |
| Deserialization | Bayt → nesne (riskli) |
| XXE | XML dış varlık kötüye kullanımı |
| R8/ProGuard | Küçültme + ad gizleme |
| SBOM/VEX | Bileşen listesi / sömürülebilirlik |

---

<!-- _class: yogun -->

# Kontrol listesi

- [ ] SQL parametreli, komut argüman dizisi
- [ ] Yol kanonik + kök denetimi
- [ ] Deserialization filtreli/şemalı
- [ ] XXE kapalı
- [ ] R8 açık, `-keep` minimal, ölçüldü
- [ ] SBOM üretildi, bağımlılık taraması temiz

---

# Son söz (5. hafta)

> Dil bellek hatasını çözse de **enjeksiyon ve tedarik zinciri** sizin sorumluluğunuzdadır.

Veriyi koddan ayır; ikiliyi R8 ile gizle; bağımlılığı SBOM ile yönet.
