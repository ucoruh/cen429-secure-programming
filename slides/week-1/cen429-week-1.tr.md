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
| 1 | Ders tanıtımı · Güvenlik nedir? · Saldırgan · İlkeler · **Uygulama korumasına genel bakış** |
| 2 | Koruma planı · STRIDE ve risk puanı · Saldırı ağacı · **Uygulamalı örnek "Kasa"** · Sınıf alıştırması |
| 3 | **Demo 1–2** · Güvenli başlatma · Taşmalar · **Demo 3–4** · Bellek yönetimi · Bölümleme · Güvenli süreç · Proje |

**Öğrenme çıktıları:** ÖÇ.1 (zafiyetleri tanır ve sınıflandırır) · ÖÇ.5 (güvenli tasarım ilkeleriyle yazılım planı oluşturur)

<!--
Konuşma notu: Demoları önceden bir kez derleyin (Windows: code içinde .\build.ps1, WSL: ./build.sh) ki derste bekleme olmasın. Öğrencilere iki ortamın da aynı sonucu verdiğini gösterin; Visual Studio'da Klasör Aç ile code klasörünü açmak yeterli.
-->

---

# Bu derse nasıl başlıyoruz

- Bu, dersin **ilk haftası**; önceki bir haftaya dayanmıyoruz.
- Varsayılan ön bilgi: C'de fonksiyon, dizi, işaretçi; terminalde `cd`, `ls` (PowerShell ya da Linux).
- Aşağıdaki **"Bu haftanın kavramları"** tablosu, bu haftanın terimlerini birer cümleyle tanımlamak yerine, her birinin **hangi bölümde** öğretileceğini gösterir.
- Dönem boyunca izleyeceğimiz kalıp: **hatalı kod → saldırı → düzeltme.**

---

<!-- _class: yogun -->

# Bu haftanın kavramları

Her terim, gövdede ilk geçtiği yerde tanımlanır; burada yalnız **nerede** olduğunu işaretliyoruz.

| Kavram | Nerede |
| --- | --- |
| Güvenlik | Bölüm 1 |
| Varlık (asset) | Bölüm 1 |
| Tehdit ve zafiyet | Bölüm 1 |
| CIA üçlüsü | Bölüm 1 |
| Saldırgan modeli | Bölüm 1 |
| Beyaz kutu / MATE | Bölüm 1 |
| Güvenli tasarım ilkeleri | Bölüm 1 |
| Katmanlı savunma | Bölüm 2 |
| Ödünleşim (trade-off) | Bölüm 2 |
| Tehdit modelleme | Bölüm 3 |
| STRIDE | Bölüm 3 |
| Saldırı ağacı | Bölüm 3 |
| Veri akış diyagramı (DFD) | Bölüm 3 |

---

# Demolar nasıl çalışıyor?

- Tek kaynak, iki/üç ortam: **Windows** (Visual Studio 2022 Community ya da PowerShell), **WSL** ve **Linux**
- Derle: Windows `.\build.ps1` · WSL/Linux `./build.sh` — dersten önce bir kez derleyin
- Çalıştır: Windows `.\demo.ps1` · WSL/Linux `sh demo.sh`
- Visual Studio: **Dosya > Aç > Klasör** → `code` → yapılandırma **Windows (MSVC)** → **Derle > Tümünü Derle**
- Bu hafta 4 demo: `code/week-01` altında

> ⚠️ **Etik:** Bütün demolar yalnız kendi klasöründe çalışır, yönetici yetkisi istemez. Teknikleri yalnız **kendi bilgisayarınızda** deneyin.

---

<!-- _class: yogun -->

# Kısa tarihçe — güvenli programlama fikri

- **1975** — Saltzer & Schroeder: güvenli tasarımın **8 ilkesi** (en az ayrıcalık, derinlemesine savunma…)
- **1970–80'ler** — **CIA üçlüsü** ortak dil hâline gelir
- **1998–99** — Microsoft'ta **STRIDE**; Schneier **saldırı ağaçlarını** tanıtır
- **2001–03** — *Building Secure Software* ve **Secure Programming Cookbook** (dersin ana kaynağı)

> Bugünkü araçlar (CIA · saldırgan modeli · STRIDE · saldırı ağacı) bu çizginin ürünüdür.

---

# Güvenli programlamanın beş kararı — şema

![w:900](assets/h01-17-bes-karar.svg)

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

# Tehdit · zafiyet · varlık — şema

![w:950](assets/h01-01-tehdit-zafiyet-varlik.svg)

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

# CIA üçlüsü — şema

![w:1000](assets/h01-12-cia-uclusu.svg)

**Sorunun cevabı:** bakiye şifresiz → **C**; IBAN yolda değişiyor → **I**; bayram gecesi çöküyor → **A**.

---

# CIA üçlüsü — tipik önlemler ve komşu kavramlar

| Hedef | Tipik önlem |
| --- | --- |
| **Gizlilik** | Şifreleme, erişim denetimi |
| **Bütünlük** | Özet (hash), MAC, dijital imza |
| **Erişilebilirlik** | Yedeklilik, kaynak sınırlama |

\+ **Kimlik doğrulama:** sen gerçekten o musun? · **Yetkilendirme:** bunu yapmaya iznin var mı? · **İnkâr edilemezlik:** bunu kim yaptı, sonradan inkâr edebilir mi?

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

# Beyaz kutu / MATE

- **MATE (Man-At-The-End):** programa **sahip** saldırgan.
- Kodu okur, belleği görür, değiştirir.
- Mobil/masaüstü uygulamanın gerçek durumu (bu dersin ana teması).

---

# Saldırgan modelleri — şema

![w:950](assets/h01-02-saldirgan-modelleri.svg)

---

# Saldırganlar — gerçek hayattan örnek

| Saldırgan | Örnek |
| --- | --- |
| Uzaktaki | Web sunucusuna saldıran biri |
| Yerel kullanıcı | Paylaşılan sunucudaki başka bir öğrenci |
| İçeriden kişi | Görevini kötüye kullanan çalışan |
| **Cihazın sahibi (beyaz kutu)** | **Mobil ödeme uygulamasını kendi telefonunda kırmaya çalışan biri** |

Her satırı kendi projenize uygulayın: sizin saldırganınız hangisi?

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

# Saltzer ve Schroeder ilkeleri — şema

![w:900](assets/h01-18-saltzer-schroeder.svg)

---

<!-- _class: yogun -->

# Güvenli tasarım ilkeleri — örnekler (1/2)

| İlke | Örnek |
| --- | --- |
| En az ayrıcalık | Rapor programı yönetici değil, sıradan kullanıcıyla çalışır |
| Güvenli varsayılan | Yeni kullanıcının `yonetici` alanı 0 ile başlar |
| Tam aracılık | Yetki bir kez bakılıp önbelleğe yazılmaz |
| Açık tasarım | Kendi şifreleme algoritmanızı yazmazsınız |

Her ilke soyut değil; kodda somut bir kararla karşılık bulur.

---

<!-- _class: yogun -->

# Güvenli tasarım ilkeleri — örnekler (2/2)

| İlke | Örnek |
| --- | --- |
| Mekanizma ekonomisi | 20 satırlık açık denetim, 500 satırlık "akıllı" denetimden iyidir |
| Ayrıcalıkların ayrılması | Para transferi için hem parola hem SMS kodu |
| En az ortak mekanizma | Her oturumun kendi geçici dosyası olur |
| Psikolojik kabul edilebilirlik | Her 5 dakikada parola sormak, parolanın kâğıda yazılmasına yol açar |

Kullanılamayan güvenlik, **atlatılan** güvenliktir.

---

<!-- _class: bolum -->

# 2. Uygulama korumasına genel bakış

---

# Katmanlı savunma

- **Katmanlı savunma (defense in depth):** tek önlem değil, **birçok** önlem.
- Biri aşılırsa diğeri durdurur.
- "Güvenlik kabuğu" bu katmanların birleşimi.

---

# Neden tek bir önlem yetmez?

| Önlem | Neyi çözmez? |
| --- | --- |
| Hatasız kod | Saldırgan ikili dosyayı açıp **mantığı okur** |
| Gizlenmiş kod | Hata ayıklayıcıyla durdurup **belleği okur** |
| İzlenmeye karşı korunan bellek | Anahtar kodda **düz metin** → dize taraması yeter |
| Gizlenmiş anahtar | Tek bir denetimi değiştirip **korumayı atlar** |

➡️ Her katman bir öncekinin açığını kapatır; saldırgan hepsini **aynı anda** aşmalı

<!-- Konuşma notu: Bina benzetmesi: iyi kilit, açık pencere, paspas altındaki anahtar, şifresiz kasa. Öğrencilere her satırda "bunu kim yapar?" diye sorun. -->

---

<!-- _class: yogun -->

# Yedi katman: içten dışa

| # | Katman | Soru | Hafta |
| --- | --- | --- | --- |
| 1 | Güvenli tasarım | Neyi, kime karşı? | 1–2 |
| 2 | Güvenli kodlama | Kodum hatasız mı? | 1, 4, 5 |
| 3 | Derleyici/OS korumaları | Hata kaçarsa sömürü zor mu? | 4 |
| 4 | Gizleme | Kodu okuyan anlayabiliyor mu? | 4, 5, 9, 14 |
| 5 | RASP | Saldırı altında olduğunu fark ediyor mu? | 6 |
| 6 | Kriptografi | Veri ele geçse bile anlamsız mı? | 3, 10, 11 |
| 7 | Güvence | Çalıştığını nasıl kanıtlıyoruz? | 12–13 |

<!-- Konuşma notu: İç katmanlar "doğru yaz", dış katmanlar "kod saldırganın elindeyken ne olacak" sorusu. Bu tablo dönemin yol haritası. -->

---

<!-- _class: yogun -->

# Yedi katman — şema (içten dışa)

![w:1000](assets/h01-03-yedi-katman.svg)

Bir hata dış katmanları geçse bile **bir sonraki** katman durdurmayı dener (derinlemesine savunma).

---

<!-- _class: yogun -->

# Yedi katman — tipik teknikler ve durdurduğu saldırgan

| # | Katman | Tipik teknikler | Durduğu saldırgan |
| --- | --- | --- | --- |
| 1 | Tasarım | Tehdit modeli, varlık/arayüz tabloları, en az ayrıcalık | Tasarım hatası arayan herkes |
| 2 | Kodlama | Girdi doğrulama, sınır denetimi, SEI CERT kuralları | Uzaktan girdi gönderen saldırgan |
| 3 | Derleyici/OS | Kanarya, ASLR, DEP/NX, CFI, `_FORTIFY_SOURCE` | Bellek hatasını kullanan saldırgan |
| 4 | Gizleme | Kontrol akışı düzleştirme, opak yüklem, sanallaştırma | Tersine mühendislik yapan analist |
| 5 | RASP | Hata ayıklayıcı/kanca/root algılama, bütünlük denetimi | Programı çalışırken inceleyen saldırgan |
| 6 | Kriptografi | Kimlik doğrulamalı şifreleme, anahtar hiyerarşisi, whitebox | Veriyi ele geçiren saldırgan |
| 7 | Güvence | Kod incelemesi, fuzzing, sızma testi, sertifikasyon | Denetçi ve değerlendirici |

---

# Güvenlik kabuğu: katmanların birleştiği yer

Hassas bir anahtar **aynı anda** birkaç katmanın içinde taşınır:

1. Diskte **şifreli** durur
2. Yalnız kullanılacağı an, yalnız gerektiği kadar **çözülür**
3. Çözüldüğü kod bölümü **gizlenmiş** ve **bütünlüğü denetlenmiş**
4. Süreçte **hata ayıklayıcı denetimi** çalışıyor

➡️ 3. haftada dört kabuklu bir tasarımı adım adım kuracağız

---

<!-- _class: yogun -->

# Hangi katman ne zaman? Saldırgan modeline göre

| Uygulama | Saldırgan nerede? | Öncelik |
| --- | --- | --- |
| Sunucu web hizmeti | Ağda; kod ve sunucuya erişimi yok | 1, 2, 3, 6, 7 |
| Masaüstü iş uygulaması | Kullanıcı bilgisayarında; kullanıcı saldırgan değil | 1, 2, 3, 6 |
| Mobil ödeme | **Cihaz saldırganın elinde** olabilir | Hepsi; özellikle 4, 5, 6 |
| Oyun, lisanslı yazılım | Kullanıcı saldırgan | 4, 5 |
| Gömülü cihaz | Fiziksel erişim | 2, 3, 6 + donanım |

**Beyaz kutu saldırgan:** programın kendisine sahip — kopyalar, açar, değiştirir, tekrar tekrar çalıştırır

---

# ⚠️ Gizleme doğru kodun yerine geçmez

- Gizleme saldırganı **yavaşlatır**, hatayı **düzeltmez**
- Gizlenmiş bir taşma hâlâ bir taşmadır
- Dış katmanlar ancak iç katmanlar sağlamsa anlam kazanır

> **Sunucu, istemciye asla güvenmez.** Gizlenmiş istemci bile sunucuya tutarsız veri gönderebilir.

<!-- Konuşma notu: Oyun hilesi örneği: istemci gizlenmiş, ama sunucu "bir saniyede 100 metre" hareketi kabul ediyor. -->

---

<!-- _class: yogun -->

# Beyaz kutu saldırganın altı yolu (1/2)

İstemci tarafında çalışan hassas bir kütüphane için altı satırlık bir **saldırı tablosu**:

| # | Saldırganın yolu | Örnek | Cevap veren katman |
| --- | --- | --- | --- |
| 1 | Platform denetimlerini aşmak | Root'lu cihaz, emülatör, değiştirilmiş OS | 5 (RASP) |
| 2 | Kodu tersine mühendislikle çözmek | Tersine derleyiciyle mantık/anahtar okumak | 4 (gizleme), 6 |
| 3 | Kodu değiştirmek | Bir `if` denetimini ters çevirip yeniden paketlemek | 5 (bütünlük), 4 |

---

<!-- _class: yogun -->

# Beyaz kutu saldırganın altı yolu (2/2)

| # | Saldırganın yolu | Örnek | Cevap veren katman |
| --- | --- | --- | --- |
| 4 | Arayüzleri kötüye kullanmak | Kütüphaneyi kendi programından çağırmak | 1 (tasarım), 5, 6 |
| 5 | Çalışma anında varlık çıkarmak | Bellek dökümü, hata ayıklayıcı, kanca | 2 (silme), 5, 6 (whitebox) |
| 6 | Çalışma anında akışı değiştirmek | Bir dalı atlamak, dönüş değerini değiştirmek | 5 (akış sayacı), 4 |

Bu tablo, koruma planındaki **tehdit** bölümünün başlangıç noktasıdır.

---

# Ödünleşim (trade-off)

- Her koruma bir **bedel** getirir: hız, karmaşıklık, maliyet.
- Güvenlik "sonsuz koruma" değil, **dengeli** koruma.
- Kalan riski açıkça yazarız.

---

# Korumanın bedeli

| Bedel | Örnek |
| --- | --- |
| **Performans** | Kontrol akışı düzleştirme bir fonksiyonu birkaç kat yavaşlatabilir |
| **Boyut** | Sanallaştırma, whitebox tabloları ikili dosyayı büyütür |
| **Bakım** | Gizlenmiş kodun çökme raporu okunmaz |
| **Yanlış pozitif** | Aşırı hassas root algılama meşru kullanıcıyı cezalandırır |

➡️ Her önlem **gerekçesiyle** yazılır: *şu varlığı, şu saldırgana karşı, şu maliyetle*

---

# Değerlendirici tabloyu tersten okur

1. Dize taraması → anahtar, URL, hata iletisi görünüyor mu?
2. İkili dosyayı açma → mantık okunuyor mu?
3. Hata ayıklayıcı bağlama → program fark ediyor mu?
4. Kodu değiştirme → bütünlük denetimi yakalıyor mu?
5. Bellek dökümü → sır bulunuyor mu?

Durdurulmadığı **her adım** raporda bir bulgu olur

<!-- Konuşma notu: Projenin güvenlik kılavuzu her katman için "hangi önlemi aldım, nasıl test ettim" sorusunu cevaplayacak. -->

---

# Kendini dene (3 dk)

1. **Çevrimdışı parola yöneticisi** için saldırgan modeli nedir? Hangi katmanlar önemli?
2. "Sunucuda çalışıyor, gizlemeye gerek yok" — ne zaman doğru, ne zaman yanlış?
3. Yalnız gizleme kullanan bir oyunda hangi yol açık kalır?

<!-- Konuşma notu: önce sordur, sonra bu slaytı aç. -->

---

<!-- _class: yogun -->

# Kendini dene — cevaplar

1. **Çevrimdışı parola yöneticisi:** saldırgan cihaza/dosyaya sahip (beyaz kutu). Önemli katmanlar: **kriptografi** (paroladan KDF + AEAD), **güvenli kodlama**, bir miktar gizleme/RASP.
2. **"Sunucuda çalışıyor":** istemciye hassas mantık/anahtar **gönderilmiyorsa doğru**; istemcide çalışan kod/anahtar varsa **yanlış** (beyaz kutu).
3. **Yalnız gizleme:** sunucu tarafı doğrulama yoksa, istemci hilesi (yamalı istemci) açık kalır — gizleme mantığı **düzeltmez**.

---

<!-- _class: bolum -->

# 3. Uygulama koruma planı ve tehdit modelleme

---

# Tehdit modelleme

- **Tehdit modelleme:** "neyi, kime karşı, nasıl koruyacağız?" sorusunu **sistemli** yanıtlamak.
- Varlıkları, tehditleri, önlemleri listeler.
- Bugün STRIDE ve saldırı ağaçlarıyla yapacağız.

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

# Adım 1 detay: Kapsam

**Soru:** Neyi değerlendiriyoruz?

- Yalnız **"sürüm 2.1"** demek yetmez
- Hangi **ikili dosya**, hangi **kaynak kod**, hangi **özet (hash)** değeri?
- Sertifikasyonda buna **değerlendirme hedefi** denir

---

# Adım 2 detay: Mimari ve arayüzler

**Soru:** Bileşenler neler, nasıl konuşuyor?

- Bileşenler **nelerdir**?
- Birbirleriyle **hangi kanaldan** konuşuyorlar?
- Her kanalda kimlik **nasıl doğrulanıyor**?

---

# Adım 3 detay: Varlıklar

**Soru:** Korunacak veri nerede, ne zaman?

- Korunacak her veri **tek tek** listelenir
- **Nerede** durur, **ne zaman** oluşur, **ne zaman** silinir?
- **Gizlilik (C)** mi, **bütünlük (I)** mü gerekir?

---

# Adım 4 detay: Tehditler

**Soru:** Saldırgan kim, nasıl ulaşır?

- Saldırgan **kim**? (bkz. saldırgan modelleri)
- Her varlığa **hangi yoldan** ulaşabilir?
- STRIDE ve saldırı ağacı burada devreye girer

---

# Adım 5 detay: Karşı önlemler

**Soru:** Hangi önlem, hangi katmanda?

- Her tehdit için **bir önlem** seçilir
- Önlem, yedi katmandan **hangisine** ait?
- Gerekçesiz önlem = **yanlış yerde** ya da **gereksiz**

---

# Adım 6 detay: Doğrulama

**Soru:** Çalıştığı nasıl kanıtlanıyor?

- Her önlem için bir **test** yazılır
- Birim testi mi, **atlatma denemesi** mi?
- Testi olmayan önlem, değerlendirici gözünde **yoktur**

---

# Adım 7 detay: Kalan risk

**Soru:** Neyi bilerek kabul ettik?

- Kapatılamayan ya da bilerek **kabul edilen** riskler
- Her biri için **neden** (ör. performans, kullanılabilirlik)
- Plan **bitmez**: ürün değiştikçe adım 1'e dönülür ve **güncellenir**

---

# Koruma planı — şema

![w:950](assets/h01-04-koruma-plani.svg)

---

<!-- _class: sema -->

# Örnek mimari: mobil ödeme uygulaması

![w:900](assets/h01-05-mimari-arayuzler.svg)

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

<!-- _class: yogun -->

# Arayüz tablosu — tam liste (mobil ödeme)

| Arayüz | Uçlar | Kimlik doğrulama | Gizlilik / bütünlük |
| --- | --- | --- | --- |
| A | Uygulama – Kütüphane (Java) | Çağıranın imzası doğrulanır | Aynı süreç içi; hassas veri geçmez |
| B | Kütüphane (Java) – native | Karşılıklı bütünlük denetimi | Şifreli ve örtülü geçer |
| C | native – yerel veritabanı | — | Şifreleme + MAC, anahtar cihaza bağlı |
| D | Kütüphane – arka uç sunucu | Sertifika sabitleme + sunucu doğrulama | **TLS + ayrıca mesaj düzeyi şifreleme** |
| E | Kütüphane – ödeme terminali | Ödeme protokolü | Tek kullanımlık ödeme anahtarı |

---

<!-- _class: yogun -->

# Varlık tablosu — tam liste (mobil ödeme)

| Varlık | Nerede | Oluşma → silinme | Koruma |
| --- | --- | --- | --- |
| Tek kullanımlık ödeme anahtarı | DB (şifreli), bellek | Sunucudan iner → kullanılır → silinir | C, I |
| Cihaz parmak izi | Bellek, iki ayrı parça | Açılışta hesaplanır | I |
| Oturum anahtarı | Yalnız bellek | Türetilir → oturum sonunda silinir | C, I |
| İşlem sayacı | Veritabanı | Her ödemede artar | I |
| Sunucu açık anahtarı | Uygulamaya gömülü | Derleme anında | I |

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

# Örnek sistem

Bir mobil bankacılık uygulaması:

- kullanıcı girişi
- bakiye görüntüleme
- para transferi

Her STRIDE harfini bu sisteme uygulayalım.

---

# S · Spoofing (sahtecilik)

- **Tehdit:** başkası gibi davranmak (sahte kullanıcı/sunucu).
- **Örnek:** sahte sunucu, çalınan oturum.
- **Önlem:** güçlü kimlik doğrulama, TLS + sertifika denetimi.

---

# T · Tampering (kurcalama)

- **Tehdit:** veriyi/kodu izinsiz değiştirmek.
- **Örnek:** transfer tutarını değiştirmek.
- **Önlem:** bütünlük (MAC/imza), bütünlük denetimi (RASP).

---

# R · Repudiation (inkâr)

- **Tehdit:** yaptığını inkâr etmek.
- **Örnek:** "ben o transferi yapmadım".
- **Önlem:** güvenli günlük, imza, denetim izi.

---

# I · Information disclosure (bilgi sızması)

- **Tehdit:** gizli verinin sızması.
- **Örnek:** bakiye/parola sızıntısı.
- **Önlem:** şifreleme, en az yetki, sızıntısız hata iletisi.

---

# D · Denial of service (hizmet reddi)

- **Tehdit:** hizmeti kullanılamaz kılmak.
- **Örnek:** aşırı istek, kaynak tüketimi.
- **Önlem:** hız sınırı, kaynak kotaları, girdi sınırı.

---

# E · Elevation of privilege (yetki yükseltme)

- **Tehdit:** izinsiz yetki kazanmak.
- **Örnek:** normal kullanıcı yönetici olur.
- **Önlem:** en az yetki, yetki denetimi, güvenli varsayılan.

---

# Bankacılık örneğinde STRIDE özeti

| Harf | Bu sistemde önlem |
| --- | --- |
| S | TLS + kimlik doğrulama |
| T | MAC/imza + RASP |
| R | Güvenli günlük |
| I | Şifreleme + en az yetki |
| D | Hız sınırı |
| E | Yetki denetimi |

---

# Kök · hedef

![w:900](assets/h01-06-saldiri-agaci.svg)

Saldırganın nihai amacı. Şimdi yolları bölelim.

---

# Saldırı ağacı: "Ödeme anahtarını ele geçir"

**HEDEF: Ödeme anahtarı** — *VEYA* (biri yeter)

1. **Veritabanını çöz** — *VE* (hepsi gerekir): root yetkisi al **+** veritabanı anahtarını bul
2. **Bellekten oku** — *VEYA*: hata ayıklayıcı bağla **|** bellek dökümü al **|** fonksiyona kanca at
3. **Trafiği dinle** — *VE*: TLS'i kır **+** mesaj düzeyi şifrelemeyi kır

---

# Saldırı ağacı — "Veritabanını çöz" dalı

**VE düğümü** (hepsi gerekir):

1. Root yetkisi al
2. **VE** veritabanı anahtarını bul

İkisi birden gerektiği için bu yol **pahalı**dır.

Bu, derinlemesine savunmanın **çalıştığının** kanıtıdır.

---

# Saldırı ağacı — "Bellekten oku" dalı

**VEYA düğümü** (biri yeter): üç alternatif

1. Hata ayıklayıcı bağla
2. **VEYA** bellek dökümü al
3. **VEYA** fonksiyona kanca at

Üç alternatif = **en zayıf nokta**: bellekteki anahtar.

→ Bu hafta Demo 2 · 6. hafta çalışma zamanı koruması · 11. hafta whitebox

---

# Saldırı ağacı — "Trafiği dinle" dalı

**VE düğümü** (hepsi gerekir):

1. TLS'i kır
2. **VE** mesaj düzeyi şifrelemeyi kır

İki katmanı **birden** kırmak gerekir → pahalı yol.

**Savunmacının hedefi:** saldırganı mümkün olduğunca çok **VE** düğümüne zorlamak.

---

# Saldırı ağacı — önlem eşlemesi

Saldırı ağacının yapraklarını doğrudan bir savunma katmanına bağlayalım:

| Yaprak | Önlem |
| --- | --- |
| Debugger | Anti-debug (6) |
| Bellek dökümü | Kısa ömür + koruma (6, 10) |
| İkiliden çıkar | Gizleme + whitebox (9, 11) |
| Ağdan sız | TLS + pin (10) |

---

# Veri akış diyagramı: beş sembol

| Sembol | Adı | Örnek |
| --- | --- | --- |
| ▭ Dikdörtgen | Dış varlık | Kullanıcı, ödeme terminali |
| ◯ Daire | Süreç | Giriş modülü, kripto kütüphanesi |
| ═ İki çizgi | Veri deposu | Veritabanı, yapılandırma dosyası |
| → Ok | Veri akışı | HTTP isteği, fonksiyon çağrısı |
| ┄ Kesikli çizgi | **Güven sınırı** | İnternet ↔ sunucu, uygulama ↔ OS |

➡️ Güven sınırını geçen her oku **kırmızıya** boyayın: incelemeye oradan başlayın

---

# Veri akış diyagramı ve güven sınırı — şema

![w:900](assets/h01-19-veri-akis-diyagrami.svg)

---

<!-- _class: yogun -->

# Hangi öğeye hangi harf?

| Öğe | S | T | R | I | D | E |
| --- | :-: | :-: | :-: | :-: | :-: | :-: |
| Dış varlık | ✔ | | ✔ | | | |
| Süreç | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Veri deposu | | ✔ | ✔¹ | ✔ | ✔ | |
| Veri akışı | | ✔ | | ✔ | ✔ | |

¹ Denetim kaydıysa · Veri akışının "kimliği" yoktur → **S sorulmaz**

<!-- Konuşma notu: Süreç altı tehdide de açıktır: taklit edilir, kodu değiştirilir, belleği okunur, çökertilir, yetkisi kötüye kullanılır. -->

---

<!-- _class: yogun -->

# Her harf için soru ve önlem

| Harf | Kendinize sorun | Tipik önlem |
| --- | --- | --- |
| **S** | Karşı taraf gerçekten o mu? | Kimlik doğrulama, imza, sertifika sabitleme |
| **T** | Değiştirilse fark eder miyim? | MAC/HMAC, imza, bütünlük denetimi |
| **R** | "Ben yapmadım" derse kanıtım var mı? | Kurcalamaya dayanıklı günlük, imzalı işlem |
| **I** | Diskte, ağda, bellekte, günlükte sızar mı? | Şifreleme, bellek temizleme, maskeleme |
| **D** | Çökertilebilir, tüketilebilir mi? | Girdi sınırı, oran sınırlama, kota |
| **E** | Az yetkili, çok yetkilinin işini yaptırabilir mi? | En az ayrıcalık, tam aracılık, bellek güvenliği |

Bir taşma = **D** (çöker) + **E** (akış ele geçer) + **I** (bitişik sır okunur)

---

# Risk puanı: olasılık × etki

| | Etki 1 | Etki 2 | Etki 3 |
| --- | :-: | :-: | :-: |
| **Olasılık 3** | 3 | 6 | **9 kritik** |
| **Olasılık 2** | 2 | 4 | 6 |
| **Olasılık 1** | 1 | 2 | 3 |

- **Olasılık:** fiziksel erişim mi, internetten mi? Uzmanlık? Otomatikleşir mi?
- **Etki:** hangi varlık, kaç kullanıcı, parasal/hukuki sonuç?
- Daha ayrıntılı: **CVSS** (2. hafta), **saldırı potansiyeli** (13. hafta)

---

# Tehdide dört yanıt

1. **Azalt** — önlem ekle (en sık)
2. **Ortadan kaldır** — özelliği hiç yazma (en güçlü)
   *"Parolayı hatırla" yoksa, diskteki parola tehdidi de yok*
3. **Aktar** — kart verisini saklama, ödeme sağlayıcısına bırak
4. **Kabul et** — gerekçesiyle **kalan risk** listesine yaz

⚠️ Plana yazılmamış risk kabul edilmiş değil, **gözden kaçmıştır**

---

<!-- _class: bolum -->

# 4. Uygulamalı örnek: "Kasa" parola kasası

---

# Adım 0–1: Uygulama ve kapsam

**Kasa:** C++ masaüstü parola kasası

- Ana parola → türetilen anahtar → kayıtlar tek dosyada şifreli
- Panoya kopyalama · isteğe bağlı bulut yedek · otomatik güncelleme

| Alan | Değer |
| --- | --- |
| Değerlendirme hedefi | `kasa` 1.0 + `kasa_cekirdek` + yapılandırma |
| Kapsam dışı | Yedek sunucusunun kendisi, işletim sistemi |
| Güvenlik amacı | Ana parolayı bilmeyen için **okunamaz ve fark edilmeden değiştirilemez** |

---

<!-- _class: yogun -->

# Adım 2: Mimari ve arayüzler

| Arayüz | Uçlar | Kimlik doğrulama | Gizlilik / bütünlük |
| --- | --- | --- | --- |
| A | Kullanıcı → Arayüz | Ana parola | Ekranda gösterilmez |
| B | Arayüz → Çekirdek | Aynı süreç | Parola çağrı sonrası silinir |
| C | Çekirdek → Kasa dosyası | — | AES-GCM, anahtar paroladan |
| D | Çekirdek → Pano | — | 30 s sonra temizlenir |
| E | Çekirdek → Yedek sunucu | Sertifika + belirteç | TLS + zaten şifreli dosya |
| F | Arayüz → Güncelleme | **Paket imzası** | TLS; asıl güvence imza |

<!-- Konuşma notu: Tahtaya diyagramı çizin; E ve F güven sınırını geçen oklar. -->

---

# Kasa mimarisi — şema

![w:950](assets/h01-07-kasa-mimari.svg)

---

<!-- _class: yogun -->

# Adım 3: Varlıklar

| # | Varlık | Nerede | Oluşma → silinme | Koruma |
| --- | --- | --- | --- | --- |
| V1 | Ana parola | Yalnız bellek | Yazılır → türetilir → **hemen silinir** | C |
| V2 | Kasa anahtarı | Yalnız bellek | Türetilir → kilitlenince silinir | C, I |
| V3 | Çözülmüş kayıt | Bellek | Görüntülenir → kapanınca silinir | C |
| V4 | Kasa dosyası | Disk, yedek | Kalıcı | C, I |
| V5 | Tuz, türetme parametresi | Dosya başlığı | Oluşturulurken | I |
| V6 | Güncelleme açık anahtarı | Uygulamaya gömülü | Derlemede | I |

Koruma sınıfları: **C** gizlilik · **I** bütünlük · **I+** bütünlük + hesap verebilirlik · **N** yok

---

<!-- _class: yogun -->

# Adım 4: Tehditler

| # | Nerede | Harf | Tehdit | Risk |
| --- | --- | :-: | --- | :-: |
| T1 | C / V4 | I | Çalınan dosya, zayıf parola çevrimdışı denenir | **9** |
| T2 | B / V1-2 | I | Parola/anahtar bellekte kalır → döküm, takas | 6 |
| T3 | D / V3 | I | Panodaki parolayı başka uygulama okur | 6 |
| T5 | C / V5 | T | Yineleme sayısı 1'e düşürülür | 3 |
| T6 | F / V6 | T, E | Sahte güncelleme kurulur | 6 |
| T8 | Süreç | T | Kasa ayrıştırıcısında bellek hatası | 6 |

---

<!-- _class: yogun -->

# Adım 3-4 (devam): eksik kalan varlık ve tehditler

| # | Varlık/Tehdit | Ayrıntı | Değer |
| --- | --- | --- | --- |
| V7 | Yedekleme belirteci | Disk (OS anahtar deposu); bağlanınca oluşur → iptalde silinir | C |
| T4 | C / V4, **T** | Kasa dosyası değiştirilir; bozuk kayıt fark edilmeden kullanılır | Risk 4 |
| T7 | E, **S** | Sahte yedekleme sunucusu belirteci çalar | Risk 4 |
| T9 | A, **S** | Ana parola ekrandan görülür (omuz sörfü) | Risk 3 |

Dokuz tehdidin **hepsi** tabloda olmalı; atlanan tehdit kapatılmamış demektir.

---

<!-- _class: yogun -->

# Adım 5: Karşı önlemler

| Tehdit | Önlem | Katman |
| --- | --- | --- |
| T1 | **Yavaş** türetme (Argon2id / yüksek yinelemeli PBKDF2) + parola gücü şartı | 6, 2 |
| T2 | Güvenli silme, `mlock`, döküm kapatma | 2 |
| T3 | Pano 30 s sonra temizlenir | 1 |
| T4-5 | Kimlik doğrulamalı şifreleme; başlık = **AAD**; en düşük yineleme kodda sabit | 6, 2 |
| T6 | İmzayı doğrulamadan **asla** çalıştırma; geri almayı reddet | 6 |
| T8 | Uzunluk doğrulama + fuzzing + derleyici korumaları | 2, 3, 7 |

---

# Adım 5 (devam): T7 ve T9 önlemleri

| Tehdit | Önlem | Katman |
| --- | --- | --- |
| T7 | Sertifika doğrulama + ana makine adı denetimi, isteğe bağlı sertifika sabitleme | 6 |
| T9 | **Kabul et:** ekranda parolayı gizle; fiziksel gözetim kapsam dışı | — |

T9 örneği önemli: her tehdide önlem **eklemek** gerekmez, bazen **kabul etmek** doğru karardır.

---

# Adım 6–7: Doğrulama ve kalan risk

| Önlem | Test | Beklenen |
| --- | --- | --- |
| Türetme | Süre ölçümü | ≥ 250 ms |
| Silme | Kilitten sonra bellek dökümünde parola ara | Bulunmaz |
| Bütünlük | Dosyanın bir baytını değiştir | "Bozuk" der, açmaz, çökmez |
| İmza | Bozuk imzalı paket | Reddedilir, günlüğe yazılır |

**Kalan risk:** kasa açıkken aynı kullanıcıyla çalışan zararlı · omuz sörfü · çok zayıf parola

⚠️ Testi olmayan önlem değerlendirici gözünde **yoktur**

---

<!-- _class: yogun -->

# Adım 6 (devam): T5 ve T8 testleri

| Önlem | Test | Beklenen |
| --- | --- | --- |
| T5 parametre | Başlıktaki yineleme sayısı 1 yapılır | Uygulama dosyayı reddeder |
| T8 ayrıştırıcı | 24 saat fuzzing (4. hafta) | Çökme yok; sanitizer bulgusu yok |

---

<!-- _class: yogun -->

# Adım 7 (devam): kalan risk — tam tablo

| Risk | Neden kabul edildi? | Yeniden değerlendirme |
| --- | --- | --- |
| Kasa açıkken bilgisayarda zararlı çalışıyorsa bellek okunabilir | Aynı kullanıcı yetkisiyle çalışan zararlıya karşı tam koruma mümkün değil; kilitleme süresi kısa tutuldu | Her sürüm |
| Omuz sörfü (T9) | Fiziksel ortam kapsam dışı | — |
| Çok zayıf ana parola | Kullanıcı uyarılıyor ama zorla engellenmiyor | Kullanıcı geri bildirimine göre |

---

# Sık yapılan hatalar

- **Varlık unutmak:** anahtarlar, belirteçler, sayaçlar, yapılandırma, **kodun kendisi**
- **Güven sınırını yanlış çizmek:** kendi istemcinizi "güvenilir" saymak
- **Önlemi tehditle eşleştirmemek:** "TLS kullanıyoruz" — hangi tehdidi kapatıyor, hangisini kapatmıyor?
- **Testsiz önlem:** "siliyoruz" deyip derleyicinin silmeyi kaldırdığını fark etmemek (Demo 2)

<!-- Konuşma notu: Bu yedi adım dönem projesinin güvenlik kılavuzu iskeleti. Bu hafta adım 0-4 bekleniyor. -->

---

<!-- _class: bolum -->

# 5. Program başlarken ve bellekte kalan sırlar

---

# Sır bellekten nasıl sızar — şema

![w:900](assets/h01-21-bellekten-sizma-yollari.svg)

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

# PATH ile kandırma — şema

![w:950](assets/h01-08-path-kandirma.svg)

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

<!-- _class: yogun -->

# Güvenli başlatma: ne devralınıyor?

| Devralınan | Tehlike | Tarif |
| --- | --- | --- |
| Ortam değişkenleri | `PATH`, `LD_PRELOAD` yüklenecek programı/kütüphaneyi değiştirir | 1.1 |
| Açık dosya tanıtıcıları | Ebeveynin gizli dosyası sızar; 0–2 kapalıysa ilk dosya "stdout" olur | 1.5 |
| `umask` | `000` → herkese yazılabilir dosyalar | 2.7 |
| Kaynak sınırları | Çekirdek dökümü açık → bellek diske | 1.9 |
| Kimlik ve yetkiler | setuid: gereğinden fazla yetki | 1.3 |

**Kural:** kendi kurmadığın hiçbir şeye güvenme

---

# Programın devraldığı durum — şema

![w:900](assets/h01-20-devralinan-durum.svg)

---

<!-- _class: yogun -->

# Devralınan diğer riskler: çalışma dizini, sinyal, dlopen

- **Çalışma dizini:** Göreli yollar (`./ayar.ini`) saldırganın seçtiği bir klasöre işaret edebilir
- **Sinyal ayarları:** Ebeveynin yok saydığı sinyaller **çocukta da** yok sayılır
- **`dlopen("lib.so")`:** `LD_LIBRARY_PATH` ve arama yollarından etkilenir → tam yol kullanın; `LD_*` Adım 1'de temizlenmiş olmalı

Kural aynı: **programın kendisinin kurmadığı hiçbir şeye güvenme.**

---

<!-- _class: yogun -->

# Adım 1–2: Ortam ve tanıtıcılar

```c
/* Ortam: kara liste değil BEYAZ liste */
clearenv();                            /* önce korunacakları kopyala! */
setenv("PATH", "/usr/bin:/bin", 1);

/* 0-2 kapalıysa /dev/null'a bağla, gerisini kapat */
for (int fd = 0; fd <= 2; fd++)
    if (fcntl(fd, F_GETFD) == -1 && open("/dev/null", O_RDWR) != fd) abort();
close_range(3, ~0U, 0);                /* Linux 5.9+ */
```

- `getenv` işaretçisi `clearenv` sonrası **geçersiz**
- Kendi dosyalarınızda her zaman `O_CLOEXEC`

---

<!-- _class: yogun -->

# Adım 3–4: İzinler ve çökme dökümü

```c
umask(077);                                   /* rw------- */
int fd = open(yol, O_WRONLY | O_CREAT | O_EXCL, 0600);

struct rlimit r = { 0, 0 };
setrlimit(RLIMIT_CORE, &r);                   /* döküm boyutu 0 */
prctl(PR_SET_DUMPABLE, 0, 0, 0, 0);           /* + ptrace ile bağlanılamaz */
```

- Windows: `SetErrorMode(SEM_FAILCRITICALERRORS | SEM_NOGPFAULTERRORBOX)`
- Asıl savunma: döküm alınsa bile içinde **sır kalmamalı**

<!-- Konuşma notu: PR_SET_DUMPABLE'ın ikinci etkisini vurgulayın: aynı kullanıcının hata ayıklayıcısı bile bağlanamaz. 6. haftaya köprü. -->

---

<!-- _class: yogun -->

# Adım 5: Yetkiyi kalıcı bırak ve doğrula

```c
if (setresgid(g, g, g) != 0) abort();   /* 1. önce GRUP */
if (setresuid(u, u, u) != 0) abort();   /* 2. sonra kullanıcı: r/e/s üçü de */
getresuid(&r, &e, &s);
if (r != u || e != u || s != u) abort();  /* 3. DOĞRULA */
```

- `seteuid()` geçicidir: saklı kimlik yetkili kalır (2. hafta Demo 13)
- Windows: **kısıtlanmış belirteç** (`CreateRestrictedToken`)
- Daha iyisi: **ayrıcalık ayrımı** — küçük yetkili süreç + büyük yetkisiz süreç (Tarif 1.4)

---

<!-- _class: yogun -->

# Adım 6: Program ve kütüphane yüklerken

| ❌ Hatalı | ✅ Doğrusu |
| --- | --- |
| `system("convert " + dosya)` | `execve("/usr/bin/convert", argv, temiz_ortam)` |
| `execvp("convert", ...)` | Tam yolla `execve` |
| `CreateProcess(NULL, "C:\Program Files\...")` | `lpApplicationName` = tam yol, komut satırı tırnaklı |
| `LoadLibrary("yardimci.dll")` | `SetDefaultDllDirectories(LOAD_LIBRARY_SEARCH_DEFAULT_DIRS)` + tam yol |

Windows DLL arama sırası = `PATH` sorununun ikizi (CWE-427)

---

# Hepsi bir arada: `guvenli_baslat()`

```c
int main(int argc, char **argv)
{
    tanitici_duzenle();   /* 1. tanıtıcılar  */
    ortami_temizle();     /* 2. ortam        */
    umask(077);           /* 3. izinler      */
    dokumu_kapat();       /* 4. döküm        */
    yetkiyi_birak();      /* 5. yetki        */
    /* ... asıl iş ... */
}
```

**Sıra önemli:** başka hiçbir şey yapmadan önce

<!-- Konuşma notu: Değerlendirici programı kapalı stdout, zehirli PATH/LD_PRELOAD ve umask 000 ile başlatır. Sahada native katman getenv'in kancalanıp kancalanmadığını setenv/getenv ile sınar. -->

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

**Kullanılmayan yazmanın silinmesi** (dead store elimination): hız için iyi, **sırlar için felaket**.

| Platform | Kaldırılamayan silme |
| --- | --- |
| Linux (glibc) | `explicit_bzero` |
| Windows | `SecureZeroMemory` |
| C11 Ek K | `memset_s` |
| OpenSSL | `OPENSSL_cleanse` |

\+ `setrlimit(RLIMIT_CORE, 0)` · `mlock` · sırrı **kısa** tut, **kopyalama**

---

<!-- _class: bolum -->

# 6. Süreç belleği ve taşmalar

---

# Süreç belleği

![w:900](assets/h01-13-surec-bellegi.svg)

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

Az anlamlı bayt önce (little-endian): en düşük bayt en düşük adreste.

---

# Bellekteki yapı ve taşma — şema

![w:950](assets/h01-14-yapi-bellekte.svg)

---

# Arabellek taşması nedir?

Bir diziye **ayrılan boyuttan fazla** veri yazmak → taşan baytlar **komşu değişkenlerin** üzerine

C neden bu kadar kolay taşar?

1. Dizi **boyutunu bilmez**
2. Fonksiyona yalnız **başlangıç adresi** gider
3. Dize (string) = `'\0'` ile biten dizi; `strcpy` hedefi **sormaz**
4. Derleyici sınır denetimi **eklemez**

CWE-787 "sınırlar dışına yazma": CWE Top 25'in hep ilk sıralarında

---

<!-- _class: yogun -->

# Yığında bir taşma

```c
void selamla(const char *ad) {
    int  yetkili = 0;
    char tampon[16];
    strcpy(tampon, ad);          /* ad > 15 karakter? */
}
```

![w:900](assets/h01-15-yiginda-tasma.svg)

<!-- Konuşma notu: Gerçek yerleşim derleyiciye göre değişir. Bu derste sömürü tekniğine değil, hatanın nasıl oluştuğuna, nasıl bulunduğuna ve nasıl önlendiğine odaklanıyoruz. -->

---

<!-- _class: yogun -->

# Taşma türleri

| Tür | Tipik neden | CWE |
| --- | --- | --- |
| Yığın (stack) taşması | `strcpy`, `gets`, sınırsız `scanf("%s")` | 121 |
| Öbek (heap) taşması | Yanlış uzunluklu `memcpy` | 122 |
| Bir fazla (off-by-one) | `<=` yerine `<`; `'\0'` için yer yok | 193 |
| Sınır dışı **okuma** | Karşı tarafın bildirdiği uzunluğa güvenmek | 125 |
| Tamsayı kaynaklı | `n * boyut` taşar → küçük blok, büyük kopya | 190 → 787 |

---

# Heartbleed (2014): hiçbir şey yazılmadı

- İstemci: "1 bayt gönderiyorum, **64 KB** diye bildiriyorum"
- Sunucu: bildirilen uzunluğu **denetlemeden** 64 KB geri yolladı
- Sızan: parolalar, oturumlar, hatta sunucunun **özel anahtarı**
- CVE-2014-0160 · CWE-125 · Düzeltme: **tek bir uzunluk denetimi**

➡️ Sınır dışı okuma da yazma kadar tehlikeli; üstelik **çökmez, iz bırakmaz**

---

<!-- _class: yogun -->

# Bir fazla hatası

```c
char ad[8];
for (int i = 0; i <= 8; i++)      /* 9 kez: ad[8] dışarıda */
    ad[i] = kaynak[i];

strncpy(ad, kaynak, sizeof ad);   /* kaynak >= 8 → '\0' YOK */
printf("%s\n", ad);               /* dizinin sonundan okumaya devam */
```

- `strncpy` güvenli `strcpy` **değildir**
- Tek bayt taşma bile komşu değişkenin en düşük baytını değiştirir

---

<!-- _class: yogun -->

# Tehlikeli fonksiyonlar → yerine

| ❌ | ✅ |
| --- | --- |
| `gets(s)` | `fgets(s, sizeof s, stdin)` — `gets` C11'de **kaldırıldı** |
| `strcpy(d, s)` | Uzunluk denetimi + `memcpy`, `snprintf`, `strlcpy` (glibc 2.38+) |
| `strcat(d, s)` | Kalan yeri hesapla; `snprintf`, `strlcat` |
| `sprintf(d, ...)` | `snprintf(d, sizeof d, ...)` + dönüş değeri denetimi |
| `scanf("%s", s)` | `scanf("%15s", s)` |
| `memcpy(d, s, n)` | **Önce** `n <= sizeof d` |
| `char a[n]` (VLA), `alloca` | Sabit üst sınır ya da `malloc` |

Tarif 3.3–3.4 bugün: `snprintf`/`strlcpy`, MSVC `strcpy_s`, C++ `std::string`/`span`

---

<!-- _class: yogun -->

# Doğru kalıp: önce doğrula, sonra sınırlı kopyala

```c
int selamla(const char *ad)
{
    char tampon[16];
    size_t n = strnlen(ad, sizeof tampon);   /* en fazla 16 bayt oku */
    if (n == sizeof tampon)                  /* uzunsa REDDET */
        return -1;
    memcpy(tampon, ad, n);
    tampon[n] = '\0';                        /* sonlandırıcı her zaman */
    printf("Merhaba %s\n", tampon);
    return 0;
}
```

Neden kesmek yerine reddetmek? `/home/ayse/gizli_rapor.txt` → `/home/ayse/gizli`

---

# C++: boyutu tür taşır — ama dikkat

```cpp
void selamla(const std::string &ad) {
    if (ad.size() > 15) throw std::invalid_argument("ad cok uzun");
    std::cout << "Merhaba " << ad << '\n';
}
```

- `vector::operator[]` sınır **denetlemez** → `at()` denetler
- `c_str()` ile alınan işaretçiye yazmak → C'nin bütün sorunları geri gelir

---

<!-- _class: yogun -->

# Taşmayı kim yakalar?

| Katman | Araç | Ne zaman? |
| --- | --- | --- |
| Kod | Sınır denetimi, güvenli API | Her zaman |
| Uyarı | `-Wall -Wextra -Wformat-security` · `/W4 /sdl` | Geliştirme |
| Statik analiz | `clang --analyze`, `cppcheck`, `/analyze` | CI |
| Sanitizer | `-fsanitize=address` · `/fsanitize=address` | Test |
| Fuzzing | libFuzzer, AFL++ | Test (4. hafta) |
| Derleyici | Kanarya `-fstack-protector-strong` · `/GS`, `_FORTIFY_SOURCE` | Sürüm |
| OS / donanım | DEP/NX, ASLR · Intel CET, ARM PAC | Sürüm |

⚠️ Koruma sömürüyü **zorlaştırır**, hatayı **gidermez** — kanarya programı sonlandırır = hizmet engelleme

---

<!-- _class: yogun -->

# ASan raporunu okumak

```text
ERROR: AddressSanitizer: stack-buffer-overflow
WRITE of size 21 at 0x7ffd... thread T0
    #0 in strcpy
    #1 in selamla  ornek.c:7
    #2 in main     ornek.c:15
  This frame has 1 object(s):
    [32, 48) 'tampon' <== Memory access at offset 48 overflows this variable
```

1. **Ne?** yığın taşması, 21 bayt yazma
2. **Nerede?** `ornek.c:7`, `strcpy`
3. **Hangi değişken?** `tampon` (16 bayt), erişim tam sınırın ötesinde

Yaklaşık 2× yavaş → yalnız **test** derlemesinde

<!-- Konuşma notu: Değerlendirici önce grep ile tehlikeli fonksiyonları arar, sonra dışarıdan gelen her uzunluk alanının doğrulanıp doğrulanmadığına bakar; checksec / dumpbin ile korumaları denetler. -->

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

# İşaretli uzunluk hatası — şema

![w:900](assets/h01-22-isaretli-donusum.svg)

---

<!-- _class: bolum -->

# 7. Bellek yönetimi, bölümleme ve güvenli süreç

---

# Dinamik belleğin yaşam döngüsü

**Ayır → doğrula → kullan → sırrı sil → bir kez serbest bırak → işaretçiyi unut**

| Adım | Unutulursa | CWE |
| --- | --- | --- |
| Doğrula | `malloc` NULL döner, denetlenmez → çökme | 476 |
| Kullan | Sınır dışı yazma | 787 |
| Sırrı sil | Blok bir sonraki `malloc`'la başka koda gider | 226 |
| Bir kez bırak | Çift serbest bırakma | 415 |
| İşaretçiyi unut | Serbest bırakıldıktan sonra kullanma (UAF) | 416 |
| Hiç bırakmamak | Sızıntı → hizmet engelleme | 401 |

---

<!-- _class: yogun -->

# Belleğin dört ömrü

| Ömür | Nasıl oluşur? | Ne zaman biter? | Tipik hata |
| --- | --- | --- | --- |
| **Statik** | Genel değişken, `static` yerel | Program bitince | Aynı anda birden fazla iş parçacığının yazması |
| **Otomatik** | Fonksiyon içi yerel değişken | Fonksiyon dönünce | Yerel değişkenin adresini döndürmek |
| **Dinamik** | `malloc`/`calloc`/`new` | `free`/`delete` çağrılınca | Sızıntı, çift serbest bırakma, UAF |
| **İş parçacığı** | `_Thread_local` / `thread_local` | İş parçacığı bitince | — |

Bu haftanın taşma ve UAF örnekleri hep **dinamik** ömürle ilgili; sırf onu bilmek yetmez.

---

# Belleğin ömrü ve CWE'ler — şema

![w:950](assets/h01-09-bellek-omru.svg)

---

<!-- _class: yogun -->

# UAF: neden bu kadar tehlikeli?

```c
Kullanici *aktif = malloc(sizeof *aktif);
Kullanici *onbellek = aktif;              /* ikinci sahip */
free(aktif);  aktif = NULL;               /* onbellek hâlâ eski adreste */

char *not = malloc(sizeof(Kullanici));    /* aynı blok geri verilebilir */
strcpy(not, "....");
if (onbellek->yetki) { ... }              /* 'not'un baytlarını okuyor */
```

- `free` belleği OS'e vermez, **boş listeye** koyar → aynı blok yeniden verilir
- ✅ **Sahiplik kuralı:** her bloğun **tek sahibi** var, yalnız o serbest bırakır

---

<!-- _class: yogun -->

# Düzeltilmiş kalıplar

```c
Kayit *k = calloc(n, sizeof(Kayit));          /* çarpım taşmasını denetler + sıfırlar */
if (k == NULL) return HATA_BELLEK;

Kayit *yeni = reallocarray(k, n2, sizeof(Kayit));
if (yeni == NULL) { free(k); return HATA_BELLEK; }   /* k'yi kaybetme */
k = yeni;
```

❌ `tampon = realloc(tampon, n);` → başarısızsa eski blok kaybolur

❌ Sır tutan tamponda `realloc` → taşınan eski blok **sıfırlanmaz**

---

<!-- _class: yogun -->

# Sırları silmek (Tarif 13.2)

| Platform | Fonksiyon |
| --- | --- |
| Linux, BSD | `explicit_bzero(p, n)` |
| Windows | `SecureZeroMemory(p, n)` |
| C11 Ek K / C23 | `memset_s` / `memset_explicit` |
| Hiçbiri | `volatile` işaretçiyle bayt bayt |

Sırrın **gizli kopyaları:** değerle geçirilen yapılar · `realloc`'un eski bloğu · `std::string` (SSO, silmeden yok olur) · G/Ç tamponları · takas ve hazırda bekletme dosyası

<!-- Konuşma notu: Sahada oturum verisi işlem biter bitmez rastgele değerlerle doldurularak silinir; uzun sıfır dizisi bile "burada sır vardı" izi bırakır. -->

---

<!-- _class: yogun -->

# Diske düşmesin (Tarif 13.3) ve RAII

```c
mlock(anahtar, sizeof anahtar);          /* Windows: VirtualLock */
/* ... kullan ... */
cen429_sil(anahtar, sizeof anahtar);
munlock(anahtar, sizeof anahtar);
```

```cpp
class GizliAnahtar {                     /* yıkıcı otomatik siler */
  ~GizliAnahtar() { cen429_sil(v_.data(), v_.size()); }
  GizliAnahtar(const GizliAnahtar&) = delete;   /* kopya = ikinci sır */
};
```

Kilitleme **sayfa** düzeyinde, miktar sınırlı → yalnız küçük anahtar bölgesi

---

<!-- _class: yogun -->

# Bellek hatası avcıları

| Araç | Bulduğu | Kullanım |
| --- | --- | --- |
| AddressSanitizer | Taşma, UAF, çift bırakma | `-fsanitize=address` · `/fsanitize=address` |
| LeakSanitizer | Sızıntı | ASan ile (Linux) |
| MemorySanitizer | İlklendirilmemiş okuma | Clang `-fsanitize=memory` |
| Valgrind | Hepsi (yavaş) | `valgrind --leak-check=full ./prog` |
| CRT hata ayıklama öbeği | Sızıntı | MSVC `_CrtSetDbgFlag` |

**Değerlendirici:** işlem bittikten sonra döküm alır, test parolasını arar

---

# Korunan kod bölümleme: TCB'yi küçült

**Güvenilir hesaplama tabanı (TCB):** "hatalıysa güvenlik çöker" dediğimiz kodun tamamı

- 200.000 satırlık uygulama, 2.000 satırlık **korunan çekirdek**
- İnceleme, gizleme, bütünlük denetimi yalnız çekirdeğe → maliyet de yalnız orada

![w:900](assets/h01-10-bolumleme.svg)

---

<!-- _class: yogun -->

# Bölümleme seçenekleri

| Seçenek | Yalıtım | Örnek |
| --- | --- | --- |
| Aynı süreçte ayrı modül | Düşük | Java uygulamasında native kütüphane |
| Ayrı süreç | Orta | Tarayıcı kum havuzu, yetkili yardımcı süreç (Tarif 1.4) |
| OS hizmeti | Orta–yüksek | DPAPI, Anahtarlık, Android Keystore |
| Donanım | Yüksek | Güvenli eleman, TPM, TEE |
| Sunucuya taşıma | En yüksek | Sır hiç istemciye gitmez, HSM'de kalır |

En güçlüsü **sırrı istemciden kaldırmak**; olmazsa donanım; o da yoksa **yazılım koruması** (bu dersin konusu)

---

<!-- _class: yogun -->

# Arayüz: dar, doğrulanmış, sırsız

```c
typedef struct KasaAnahtari KasaAnahtari;     /* opak tür */

int  kasa_ac(const char *parola, size_t n, const unsigned char tuz[16],
             KasaAnahtari **cikti);           /* parolayı siler */
int  kasa_coz(KasaAnahtari *a, const unsigned char *sifreli, size_t n,
              unsigned char *acik, size_t kapasite, size_t *yazilan);
void kasa_kapat(KasaAnahtari *a);             /* anahtarı siler */
```

1. **Sırrı dışarı verme, iş yaptır** (tutamaç)
2. Sınırı geçen her şeyi **doğrula**
3. Sınırdan **açık veri** geçirme

---

<!-- _class: yogun -->

# Kâhin ve kod sökme

- **Şifre çözme kâhini:** saldırgan `kasa_coz`'u kendi verisiyle çağırır — anahtara gerek yok
- **Kod sökme (code lifting):** korunan fonksiyonu olduğu gibi kopyalayıp kara kutu gibi çalıştırır

| Önlem | Fikir |
| --- | --- |
| Cihaza/örneğe bağlama | Başka ortamda doğru sonuç çıkmaz |
| Sürüme bağlama | Eski/değiştirilmiş sürümde anahtar çözülmez |
| Bağlam denetimi | Çağıranın bütünlüğü ve akış sırası doğrulanır |
| Ortak statik anahtar yok | Bir kopyanın kırılması diğerlerini etkilemez |

---

<!-- _class: yogun -->

# Şifreleme ile güvenli işleme: açıklık penceresi

```text
Kötü: [aç] ██████████████████████████████████ [kapat]   anahtar hep açık
İyi:  [aç] ░░░░░██░░░░░░░░██░░░░░░░░░░░██░░░░ [kapat]   yalnız işlem anında
```

1. **Tam zamanında çözme** → fonksiyon dönmeden sil
2. **Örtme:** anahtar XOR rastgele maske — bellekte iki anlamsız parça
3. **Parçalama:** farklı yerlerde, kullanımda birleştir
4. **Kod şifreleme:** fonksiyon kodu çalışma anında çözülür (4, 9. hafta)
5. **Whitebox:** anahtar hiç açılmaz (11. hafta)

<!-- Konuşma notu: Sahada tek statik anahtar yarım bayt düzeyinde parçalanıp onlarca fonksiyona dağıtılır; parmak izi iki farklı özetle iki farklı yerde saklanıp karşılaştırılır. Örtme tek başına kale değil; diğer katmanlarla değer kazanır. -->

---

# Bellekte örtme — kod örneği

```c
typedef struct {
    uint8_t maske[32];    /* açılışta rastgele üretilir */
    uint8_t ortulu[32];   /* anahtar XOR maske */
} OrtuluAnahtar;

static void anahtari_ac(const OrtuluAnahtar *o, uint8_t gecici[32])
{
    for (size_t i = 0; i < 32; i++)
        gecici[i] = o->ortulu[i] ^ o->maske[i];
}
```

Bellekte **anahtarın kendisi değil**, iki anlamsız parça durur; birleştirme yalnız kullanım anında.

---

# Açıklık penceresi — şema

![w:950](assets/h01-16-aciklik-penceresi.svg)

---

<!-- _class: yogun -->

# Güvenli geliştirme yaşam döngüsü

| Aşama | Etkinlik | Hafta |
| --- | --- | --- |
| Gereksinim | Standartlardan güvenlik gereksinimi | 13 |
| Tasarım | Tehdit modeli, koruma planı | 1–2 |
| Gerçekleştirme | Kodlama kuralları, yasaklı fonksiyonlar, statik analiz | 4–5 |
| Doğrulama | Sanitizer, fuzzing, sızma testi | 4, 12 |
| Yayın | İmzalı derleme, **benzersiz sürüm kimliği** | 1, 10 |
| Yanıt | Zafiyet bildirimi, acil güncelleme | 12 |

Microsoft SDL · NIST SSDF (SP 800-218)

---

<!-- _class: yogun -->

# Benzersiz sürüm kimliği

**İncelenen ile dağıtılan aynı mı?** → `1.4.2` + git kimliği + ikili dosyanın SHA-256'sı

```cmake
execute_process(COMMAND git rev-parse --short=12 HEAD
                OUTPUT_VARIABLE GIT_KIMLIK OUTPUT_STRIP_TRAILING_WHITESPACE)
target_compile_definitions(kasa PRIVATE SURUM="1.4.2" GIT_KIMLIK="${GIT_KIMLIK}")
```

`Get-FileHash .\kasa.exe -Algorithm SHA256` · `sha256sum ./kasa`

Sahada sürüm, **anahtar türetmeye** de katılır → sürüm geri alma saldırısı çalışmaz

---

# Değişiklik yönetimi: yedi adım

1. Temel çizgi → 2. Değişiklik talebi → 3. Sınıflandırma → 4. Onay ve planlama → 5. Geliştirme ve test → 6. Yayın → 7. Doğrulama

- 3 ile 4 arasında **güvenlik etki analizi:** hangi varlık, arayüz, tehdit, önlem?
- Yalnız değişen kısmın incelenmesi = **delta değerlendirme** (13. hafta)
- Depo: korumalı dallar · en az bir gözden geçiren · imzalı etiket · MFA

---

# Değişiklik yönetimi — şema

![w:950](assets/h01-11-degisiklik-yonetimi.svg)

---

<!-- _class: yogun -->

# Ödünleşim kaydı

| Karar | Seçilen | Gerekçe | Kalan risk |
| --- | --- | --- | --- |
| Sürümde günlükleme | Derleme makrosuyla **tamamen kaldırıldı** | Susturulmuş kod dize olarak kalır | Sahada tanı zor |
| Hata kodları | Yalnız başarılı/başarısız (**opak**) | Ayrıntı saldırgana ipucu | Ayrı tanı kanalı |
| Native "debuggable" bayrağı | **Açık** (gerekçeli istisna) | Bütünlük denetimi kendi belleğini okumalı | Debugger algılama ile telafi |
| Parola türetme süresi | 250 ms | Bekleme ↔ kaba kuvvet dengesi | Çok zayıf parola |

Yazılmamış ödünleşim = değerlendiricinin gözünde **hata**

<!-- Konuşma notu: Bütünlük denetimi gibi önlemler derleme hattını da değiştirir: özet gömülür, yeniden derlenir; sahada beş turlu imzalı derleme. Korumaların maliyeti de ölçülür: kritik işlemi 20 kez çalıştırıp en kısa, en uzun, ortalama süre. -->

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

# Haftanın araç kutusu — şema

![w:900](assets/h01-23-arac-kutusu.svg)

---

<!-- _class: bolum -->

# 8. Proje ve kapanış

---

# Proje: bu hafta yapılacaklar

1. **Takım** (bireysel ya da en çok 4 kişi) ve **konu**
2. GitHub deposu + **proje planı** (iş paketleri, takvim) → onaylat
3. Güvenlik kılavuzu taslağı:
   - **S0** kapak ve sürüm geçmişi · **S2** ürün genel bakışı
   - **S3** mimari ve **arayüz tablosu**
   - **S4** saldırgan modeli · **STRIDE** · **saldırı ağacı**

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

# Uçtan uca: Kasa'nın savunmasını tamamlamak

Bölüm 4'te "Kasa"nın tehdit tablosunda iki madde vardı; bu haftanın geri kalanı onları **somut kodla** kapatıyor:

| Kasa'nın tehdidi | Bu haftaki karşılık |
| --- | --- |
| T2 — parola/anahtar bellekte kalır | Bölüm 5: `explicit_bzero`/`SecureZeroMemory`, `mlock`, döküm kapatma (Demo 2) |
| T8 — ayrıştırıcıda bellek hatası | Bölüm 6–7: sınır denetimi, ASan, güvenli kalıp (Demo 3–4) |

> Güvenlik bir **his** değil, **süreçtir:** varlığı tanı, tehdidi modelle, katmanla koru, kalan riski yaz. Bu çerçeveyi dönem boyunca kullanacağız.

---

<!-- _class: yogun -->

# Klasik hatalar — özet

| Hata | Bölüm | Kural |
| --- | --- | --- |
| PATH/ortama güvenmek (CWE-426) | 5 | Mutlak yol + temiz ortam + kabuksuz çalıştırma |
| Sır bellekte kalır (CWE-14) | 5 | `explicit_bzero`/`SecureZeroMemory`, derleyicinin silemeyeceği biçimde |
| Arabellek taşması (CWE-121/787) | 6 | Önce doğrula, sonra sınırlı kopyala; tehlikeli fonksiyonları kullanma |
| Bir fazla hatası (CWE-193) | 6 | `<=` değil `<`; sonlandırıcıya her zaman yer bırak |
| İşaretli/işaretsiz tamsayı (CWE-195) | 6 | Boyutları `size_t` tut; alt **ve** üst sınırı denetle |
| Sızıntı, çift serbest bırakma, UAF (CWE-401/415/416) | 7 | Her bloğun tek sahibi olsun; `free` sonrası işaretçiyi `NULL` yap |

Altı hatanın hepsi bu destede bir demo ya da kod örneğiyle işlendi; burada tek bakışta toparlıyoruz.

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

<!-- önce sordur, sonra cevap slaytını aç; tam çözüm eklerde -->

---

<!-- _class: yogun -->

# Kendini sınama — cevaplar (1–10)

1. **Varlık** korunacak değerli şey; **tehdit** zarar verebilecek olası olay/aktör; **zafiyet** tehdidin kullanabileceği kusur.
2. **Bütünlük (Integrity)** — yoldaki IBAN'ın değişmesi veri bütünlüğü ihlalidir.
3. **Beyaz kutu (MATE)** programa **sahiptir** (belleği/anahtarı okur, kodu değiştirir); ağ saldırganı yalnız **dışarıdan** bağlanır.
4. **E = Elevation of Privilege** (yetki yükseltme) → ayrıcalık bırakma / `setuid` demosu.
5. **VE (AND)** savunmaya iyi: hedef tüm alt adımları ister, **birini** kesmek saldırıyı durdurur. VEYA saldırgana kolaylık.
6. `system` **kabuğu** yorumlar → komut enjeksiyonu/PATH ele geçirme. Düzelt: `execvp` ile **doğrudan** çağır (kabuksuz), **tam yol**, girdi allowlist.
7. Derleyici **ölü mağaza** olarak sildi (sonra okunmuyor). `memset_s`/`explicit_bzero`/`volatile` kullan.
8. Taşma **redzone**'a ulaşmadı / o kod yolu çalışmadı; ASan yalnız **enstrümante** bölgeyi görür.
9. `-1`, `size_t`'te **SIZE_MAX**'e döner → devasa kopya → taşma/çökme.
10. Ödeme: TLS+pinning (aktarım) · AEAD (bekleme) · RASP/anti-debug · whitebox/HSM anahtar · sunucu denetimi — **katman**.

---

# Kendini sınama (devam)

1. Bir veri akışına neden **S** sorulmaz?
2. Tehdide dört yanıt nedir? "Ortadan kaldırma"ya örnek verin
3. setuid programda neden **önce grup** bırakılır?
4. `strncpy` neden güvenli `strcpy` değildir?
5. Heartbleed neden hiçbir şey çökmeden veri sızdırdı?

<!-- önce sordur, sonra cevap slaytını aç -->

---

# Kendini sınama — cevaplar (devam 1–5)

1. Veri akışına **S sorulmaz**: akışın kimliği yoktur (sahtecilik uçlara/varlıklara sorulur).
2. **Azalt · kaldır · aktar · kabul et.** "Kaldırma" örneği: "parolayı hatırla" özelliğini **hiç sunmamak**.
3. `setuid`'de **önce grup** bırakılır; kullanıcı önce bırakılırsa grubu değiştirecek **yetki kalmaz**.
4. `strncpy` uzun kaynakta sonuna sonlandırıcı **koymaz** → sonlandırılmamış dize.
5. Heartbleed yalnız **okudu**; okunan bellek sürecin kendi **geçerli** belleğiydi → çökmeden sızdı.

---

# Kendini sınama (devam)

6. Kanarya taşmayı fark edince ne yapar? Neden hâlâ sorun?
7. `free(p); p = NULL;` neyi önler, neyi önlemez?
8. `mlock` neyi önler, neyi önlemez?
9. "Şifre çözme kâhini" nedir? Bir karşı önlem?
10. Benzersiz sürüm kimliğinin üç bileşeni?

<!-- önce sordur, sonra aç -->

---

# Kendini sınama — cevaplar (devam 6–10)

6. Kanarya bozulunca programı **sonlandırır** (hizmet reddi); bitişik değişkene taşmayı **görmez**.
7. `free(p); p=NULL;` **çift bırakma/UAF**'ı önler; **takma adları** (aynı adrese başka işaretçi) korumaz.
8. `mlock` belleğin **takasa** yazılmasını önler; **okunmasını** ve silinmemiş sırrı önlemez.
9. **Şifre çözme kâhini:** anahtarsız çözdürme imkânı. Karşı önlem: bağlam/bütünlük denetimi, çağrı sınırı, **cihaza bağlama**.
10. Benzersiz sürüm: **anlamsal sürüm + git kimliği + ikili SHA-256**.

---

<!-- _class: yogun -->

# Sözlük

| Terim | Anlam |
| --- | --- |
| CIA | Gizlilik/bütünlük/erişilebilirlik |
| MATE | Programa sahip saldırgan |
| STRIDE | Altı tehdit sınıfı |
| Saldırı ağacı | Hedefi alt adımlara bölme |
| DFD | Veri akış diyagramı |
| Katmanlı savunma | Çok önlem birlikte |

---

<!-- _class: baslik -->

# Bir sonraki hafta

**2. hafta — Bilgisayar virüsleri ve güvenlik modelleri**

Bu hafta kurduğumuz tehdit modelleme (STRIDE, saldırı ağacı) ve saldırgan modeli araçlarını, gelecek hafta somut bir tehdit sınıfına — zararlı yazılıma — uygulayacağız: bir virüsün nasıl yayıldığını, nasıl gizlendiğini ve hangi erişim denetimi modelleriyle (DAC/MAC/RBAC) durdurulduğunu göreceğiz.

Bu haftaki bellek güvenliği hataları için gördüğümüz CWE sınıflandırması, 2. haftada CVE ve CVSS ile birlikte derinleşecek.
