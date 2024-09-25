---
marp: true
theme: default
style: |
    img[alt~="center"] {
      display: block;
      margin: 0 auto;
    }
_class: lead
paginate: true
backgroundColor: #fff
backgroundImage: url('https://marp.app/assets/hero-background.svg')
header: 'Güvenli Programlama ve Veri Güvenliği'
footer: '![height:50px](http://erdogan.edu.tr/Images/Uploads/MyContents/L_379-20170718142719217230.jpg) RTEU CE407 Hafta-3'
title: "CE407 Güvenli Programlama Hafta-3"
author: "Yazar: Dr. Öğr. Üyesi Uğur CORUH"
date:
subtitle: "Veri Güvenliği: Kullanımda, Aktarımda ve Depolamada"
geometry: "left=2.54cm,right=2.54cm,top=1.91cm,bottom=1.91cm"
titlepage: true
titlepage-color: "FFFFFF"
titlepage-text-color: "000000"
titlepage-rule-color: "CCCCCC"
titlepage-rule-height: 4
logo: "http://erdogan.edu.tr/Images/Uploads/MyContents/L_379-20170718142719217230.jpg"
logo-width: 100 
page-background:
page-background-opacity:
links-as-notes: true
lot: true
lof: true
listings-disable-line-numbers: true
listings-no-page-break: false
disable-header-and-footer: false
header-left:
header-center:
header-right:
footer-left: "© Dr. Uğur CORUH"
footer-center: "Lisans: CC BY-NC-ND 4.0"
footer-right:
subparagraph: true
lang: tr-TR
math: katex
tags:
  - ce407-hafta-3
  - veri-güvenliği
  - kullanımda-veri-güvenliği
  - aktarımda-veri-güvenliği
  - depolamada-veri-güvenliği
ref_link: na
---

<!-- _backgroundColor: aquq -->

<!-- _color: orange -->

<!-- paginate: false -->

# CE407 Güvenli Programlama

## Hafta-3

#### Veri Güvenliği: Kullanımda, Aktarımda ve Depolamada

İndir [PDF](ce407-week-3.tr_doc.pdf), [DOCX](ce407-week-3.tr_word.docx), [SLIDE](ce407-week-3.tr_slide.pdf), [PPTX](ce407-week-3.tr_slide.pptx)

<iframe width=700, height=500 frameBorder=0 src="../ce407-week-3.tr_slide.html"></iframe>

---

### Outline

- Veri Güvenliği: Kullanımda, Aktarımda ve Depolamada
- Yazılım Geliştirme Süreçleri
  - Kullanımda Veri Güvenliği
  - Aktarımda Veri Güvenliği
  - Depolamada Veri Güvenliği
- Dinamik ve Statik Varlıkların Korunması

---

## **Hafta-3: Veri Güvenliği - Kullanımda, Aktarımda ve Depolama Halindeki Veri Güvenliği**

---

#### **Teorik Konu Başlıkları ve Uygulamalar**

---

## **Kullanımda Veri Güvenliği (Data-In-Use Security)**

### 1. **Çalışma Zamanı Uygulama Verisi Güvenliği (Runtime Application Data Security)**

#### Teorik Açıklama:

Kullanımda veri güvenliği, uygulama çalışırken bellekte tutulan hassas bilgilerin korunması ile ilgilenir. Bu güvenlik, özellikle bellekte geçici olarak bulunan verilerin kötü amaçlı yazılımlar tarafından ele geçirilmesini engellemek için kullanılır.

#### Uygulamalar:

1. **Bellek Şifreleme:** Bellekteki hassas verilerin şifrelenmesi.
2. **Kötüye Kullanım Tespiti:** Bellekteki şüpheli hareketlerin izlenmesi ve müdahale edilmesi.
3. **Veri Manipülasyonu Testleri:** Çalışma zamanındaki verilerin yanlışlıkla veya kasıtlı olarak değiştirilip değiştirilmediğini test etme.
4. **Dinamik Bellek Yönetimi:** Bellek sızıntılarını engellemek ve veri sızıntılarını minimize etmek.
5. **Sürekli Kimlik Doğrulama:** Kullanıcıların oturumları süresince kimliklerinin tekrar tekrar doğrulanması.
6. **Veri Maskelenmesi:** Hassas verilerin yalnızca yetkili süreçler tarafından görülebilir olması.
7. **Tamperproof Mekanizmaları:** Bellekteki verilerin manipüle edilip edilmediğini kontrol eden ve bu verilerin değiştirilmesi durumunda sistemin tepki vermesini sağlayan mekanizmalar.
8. **Güvenlik Protokollerinin İzlenmesi:** Uygulama çalışırken kullanılan güvenlik protokollerinin anormal davranışlarını izleme.
9. **Veri Güvenlik Duvarları:** Bellek içindeki hassas verilerin yalnızca yetkili süreçler tarafından erişilebileceği güvenlik katmanları ekleme.
10. **Gelişmiş Kayıt Tutma:** Bellekteki veriler üzerinde gerçekleştirilen tüm işlemlerin kayıt altına alınması.

---

## **Aktarımda Veri Güvenliği (Data-In-Transit Security)**

### 1. **Veri Aktarımı Sırasında Güvenlik Yöntemleri (Data Security Methods During Transportation)**

#### Teorik Açıklama:

Verilerin ağ üzerinden aktarılması sırasında, bu verilerin gizliliğinin ve bütünlüğünün korunması gerekir. Güvenli bir şekilde veri aktarımı sağlamak için şifreleme, kimlik doğrulama ve bütünlük kontrolleri uygulanır.

#### Uygulamalar:

1. **Oturum Anahtarı (Session Key):** İstemci ve sunucu arasında dinamik olarak oturum anahtarı oluşturma ve bu anahtar ile şifreleme yapma.
2. **Cihaz Bağlama (Device Binding):** Verilerin belirli bir cihaza bağlı olarak iletilmesini sağlayarak, verilerin farklı bir cihazda çözülmesini engelleme.
3. **Sürüm Bağlama (Version Binding):** Yalnızca belirli sürümlerin veri iletimine izin vererek, güvenlik açıkları barındıran eski sürümlerin veri almasını engelleme.
4. **Şifrelenmiş Yük (Confidential Payload):** Taşınan verinin şifrelenerek sadece yetkili taraflar tarafından okunabilir hale getirilmesi.
5. **Bütünlük Kontrolü (Integrity Control):** Veri aktarımı sırasında verilerin bozulmadan veya değiştirilmeden iletildiğini doğrulama.
6. **Kimlik Doğrulama (Authenticity Control):** Veri gönderenin ve alıcının kimliklerinin doğrulanması.
7. **Güvenli İletişim Kanalları (Secure Communication Channels):** SSL/TLS protokollerini kullanarak güvenli veri aktarımı gerçekleştirme.
8. **SSL Sertifikaları:** Sunucu doğrulamasında SSL sertifikaları kullanarak veri aktarımı sırasında güvenliği artırma.
9. **Veri İzleme (Data Monitoring):** Aktarım sırasında verinin izlenmesi ve anormal durumların tespiti.
10. **Şifreli İletişim Protokolleri:** HTTPS, SSH gibi şifreli protokoller üzerinden veri iletişimi yapma.

---

### 2. **Sunucu İletişimi (Server Communication)**

#### Teorik Açıklama:

Sunucu ile istemci arasındaki güvenli iletişim, verilerin güvenli bir şekilde sunucuya aktarılmasını sağlar. Bu süreçte sunucunun kimliğini doğrulamak ve iletilen verilerin şifrelenmesi büyük önem taşır.

#### Uygulamalar:

1. **Sunucu Kimlik Doğrulama Kodu (Server Authentication Code):** Sunucunun kimliğini doğrulayan özel bir kimlik doğrulama mekanizması geliştirme.
2. **Güvenli Sunucu İletişimi (Secure Server Communication):** Sunucu ve istemci arasında verilerin SSL/TLS ile şifrelenmesini sağlama.
3. **Oturum Anahtarı Şifreleme (Session Key Encryption):** Verilerin oturum anahtarları kullanılarak şifrelenmesini sağlama.
4. **Sunucu Üzerinde Veri İzleme (Data Monitoring):** Sunucuya gelen ve giden veri trafiğini izleyip anormallikleri tespit etme.
5. **Veri Bütünlüğü Doğrulama:** Verilerin sunucuya bozulmadan iletildiğini doğrulayan bütünlük kontrol mekanizmalarını kullanma.
6. **Verilerin Şifrelenmesi (Data Encryption):** Verileri sunucuya göndermeden önce istemci tarafında şifreleme.
7. **Sunucu Yanıtlarını İmzalama (Response Signing):** Sunucudan gelen yanıtları dijital imza ile doğrulama.
8. **Sunucu Yedekleme:** Sunucuda tutulan kritik verilerin düzenli olarak yedeklenmesi ve şifreli olarak saklanması.
9. **Güvenli Oturum Kapatma (Secure Session Termination):** Oturum sona erdiğinde oturum anahtarlarının güvenli bir şekilde temizlenmesi.
10. **Kimlik Doğrulama Loglama:** Sunucu tarafında tüm kimlik doğrulama işlemlerinin loglanması ve gerektiğinde izlenebilmesi.

---

## **Depolamada Veri Güvenliği (Data-At-Rest Security)**

### 1. **Depolama Halindeki Veriler İçin Güvenlik Yöntemleri (Data Security Methods During Stored State)**

#### Teorik Açıklama:

Veriler sabit disklerde, veri tabanlarında veya bulut ortamlarında depolandığında, bu verilerin korunması gerekir. Şifreleme ve bütünlük kontrolü gibi yöntemler, depolanan verilerin izinsiz erişimlere ve saldırılara karşı korunmasını sağlar.

#### Uygulamalar:

1. **Whitebox AES:** Depolama alanında AES algoritmasını whitebox yöntemiyle uygulayarak verilerin daha güvenli bir şekilde korunmasını sağlama.
2. **Whitebox DES:** Whitebox DES algoritmasıyla verilerin şifrelenmesi ve güvenlik testlerinin yapılması.
3. **Güvenlik Kabuk Matrisi (Security Shell Matrix):** Verilerin güvenli bir şekilde depolanmasını sağlamak için dosya sisteminde güvenlik kabuğu oluşturma.
4. **Anahtar Yönetimi:** Şifreleme anahtarlarının güvenli bir şekilde saklanması ve düzenli olarak değiştirilmesi.
5. **Şifreli Veritabanı:** Veritabanındaki hassas verilerin şifrelenmesi ve sadece yetkili kullanıcıların erişebilmesi.
6. **Depolanan Verilerin Şifrelenmesi:** Tüm verilerin şifreli bir formatta saklanması ve yetkisiz erişimlerin engellenmesi.
7. **Dosya Bütünlüğü Kontrolleri:** Depolanan dosyaların izinsiz değiştirilip değiştirilmediğini kontrol eden mekanizmalar.
8. **Veri Yedekleme:** Kritik verilerin düzenli olarak yedeklenmesi ve yedeklerin şifreli olarak saklanması.
9. **Güvenli Silme:** Depolama alanındaki verilerin silinmesi gerektiğinde, verilerin geri alınamaz şekilde silinmesi.
10. **Bütünlük Kontrolleri:** Dosyaların bütünlüğünü doğrulayan ve yetkisiz değişiklikleri tespit eden mekanizmalar kullanma.

---

## **Statik ve Dinamik Varlıkların Korunması (Protection of Static and Dynamic Assets)**

### 1. **Statik Varlıkların Korunması (Protection of Static Assets)**

#### Teorik Açıklama:

Statik varlıklar, veritabanında veya sabit depolama ortamında değişmeden duran verilerden oluşur. Bu varlıkların korunması, veri bütünlüğünü sağlamak ve izinsiz erişimleri engellemek için son derece önemlidir.

#### Uygulamalar:

1. **Anahtarların Şifrelenmesi:** Statik anahtarların güvenli bir şekilde depolanması için şifreleme yöntemleri kullanma.
2. **Kaynak Kodları Koruma:** Kaynak kodlarının izinsiz kopyalanmasını ve değiştirilmesini engelleyen mekanizmalar geliştirme.
3. **Statik Dosyaların Bütünlük Kontrolü:** Sabit dosyaların bütünlüğünü sağlayarak izinsiz değişikliklerin önlenmesi.
4. **Veri İmzası:** Depolanan verilerin değiştirilemeyeceğini doğrulamak için dijital imza kullanma.
5. **Veritabanı Bütünlüğü:** Veritabanında bulunan kritik verilerin şifrelenmesi ve bütünlüğünün korunması.
6. **Dosya Erişim Kontrolü:** Statik dosyaların yetkisiz erişimlere karşı korunması için erişim kontrol mekanizmalarını devreye sokma.
7. **Gizli Anahtar Yönetimi:** Statik anahtarların güvenli bir şekilde saklanması ve yönetilmesi.
8. **Veritabanı Şifreleme:** Statik verilerin şifrelenerek veri tabanında güvenli bir şekilde saklanmasını sağlama.
9. **İmza ve Şifreleme Kombinasyonu:** Statik dosyaların bütünlüğünü sağlamak ve şifreleme ile birlikte dijital imza kullanarak güvenliği artırma.
10. **Dosya Güvenlik Duvarı:** Statik dosyaların korunması için dosya güvenlik duvarı oluşturma.

---

### 2. **Dinamik Varlıkların Korunması (Protection of Dynamic Assets)**

#### Teorik Açıklama:

Dinamik varlıklar, uygulama çalışırken oluşturulan ve sürekli değişen verilerdir. Bu verilerin korunması, özellikle oturum bilgileri ve dinamik anahtarlar gibi hassas bilgilerin güvenliğini sağlar.

#### Uygulamalar:

1. **Dinamik Anahtarların Güvenliği:** Dinamik anahtarların yalnızca belirli oturumlar sırasında kullanılması ve güvenli bir şekilde değiştirilmesi.
2. **Oturum Bilgisi Şifreleme:** Kullanıcı oturumlarının gizliliğini sağlamak için oturum bilgilerini şifreleme.
3. **Cihaz Parmak İzlerinin Korunması:** Cihaz parmak izlerinin yalnızca yetkili taraflarca doğrulanmasını sağlama.
4. **Oturum Verisi Koruması:** Dinamik oturum verilerinin şifrelenerek güvence altına alınması.
5. **Dinamik Anahtar Yönetimi:** Oturum sırasında kullanılan dinamik anahtarların güvenli bir şekilde oluşturulması ve yönetilmesi.
6. **Oturum Zaman Aşımı:** Kullanıcı oturumları için otomatik zaman aşımı mekanizması uygulayarak güvenliği artırma.
7. **Verilerin Sürekli İzlenmesi:** Dinamik verilerin şifrelenerek izlenmesi ve güvenlik ihlallerinin anında tespit edilmesi.
8. **Veri Manipülasyonu Engelleme:** Dinamik verilerin manipüle edilmesini engelleyen güvenlik mekanizmaları kurma.
9. **Dinamik Veri İmzası:** Oturum sırasında değiştirilen verilerin bütünlüğünü doğrulamak için dijital imza kullanma.
10. **Gerçek Zamanlı Veri Analizi:** Oturum sırasında oluşan dinamik verileri analiz eden güvenlik protokollerini devreye sokma.

---

## **Varlık Özellikleri (Property of Assets)**

#### Teorik Açıklama:

Bir varlığın özellikleri, onun adını, tanımını, konumunu, kaynağını, boyutunu, oluşturulma ve silinme zamanını içerir. Ayrıca, bir varlığın gizlilik (Confidentiality), bütünlük (Integrity) ve doğrulama (Authentication) gibi güvenlik gereksinimlerine karşı nasıl korunacağını belirlemek önemlidir.

#### Uygulamalar:

1. **Varlık İsmi (Asset Name):** Varlığın adını belirleyerek bu varlığın ne olduğunu tanımlama.
2. **Tanım (Description):** Varlığın ne işlev gördüğünü ve hangi bilgileri içerdiğini açıklama.
3. **Konum (Location):** Varlığın bulunduğu veri tabanı, tablo veya kolon gibi fiziksel konumunu belirleme.
4. **Kaynak (Source):** Varlığın kaynağını belirleyerek hangi süreç veya veri kaynağından geldiğini tanımlama.
5. **Boyut (Size):** Varlığın boyutunu belirleyerek depolama ihtiyaçlarını optimize etme.
6. **Oluşturulma Zamanı (Creation Time):** Varlığın oluşturulduğu tarihi ve zamanı belirleyerek log kayıtlarını tutma.
7. **Silinme Zamanı (Destroy Time):** Varlığın ne zaman imha edileceğini ve bu sürecin nasıl yönetileceğini belirleme.
8. **Varsayılan Değer (Default Value):** Varlığın varsayılan değerini tanımlayarak, ilk durumda nasıl olacağını belirtme.
9. **Gizlilik, Bütünlük ve Doğrulama:** Varlıkların güvenlik gereksinimlerine göre koruma seviyelerini tanımlama (C - Confidentiality, I - Integrity, A - Authentication).
10. **Varlık Koruma Şeması:** Her varlığın güvenlik ihtiyaçlarına göre özel bir koruma planı oluşturarak, hangi önlemlerin alınması gerektiğini belirleme.

---

## **Haftanın Özeti ve Gelecek Hafta**

### Bu Hafta:

- **Kullanımda, Aktarımda ve Depolamada Veri Güvenliği**
- **Statik ve Dinamik Varlıkların Korunması**

### Gelecek Hafta:

- **Sertifikalar ve Şifreleme Yöntemleri**
- **Kimlik Doğrulama ve Veri Bütünlüğü**

---

$$
3.Hafta-Sonu
$$
