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
header: 'Güvenli Programlama ve Beyaz Kutu Kriptografisi'
footer: '![height:50px](http://erdogan.edu.tr/Images/Uploads/MyContents/L_379-20170718142719217230.jpg) RTEU CEN429 Hafta-10'
title: "CEN429 Güvenli Programlama Hafta-10"
author: "Yazar: Dr. Öğr. Üyesi Uğur CORUH"
date:
subtitle: "Beyaz Kutu Kriptografisi"
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
  - cen429-hafta-10
  - beyaz-kutu-kriptografi
  - şifreleme
  - güvenlik
ref_link: na
---

<!-- _backgroundColor: aquq -->

<!-- _color: orange -->

<!-- paginate: false -->

# CEN429 Güvenli Programlama

## Hafta-10

#### Beyaz Kutu Kriptografisi

---

İndir

- [PDF](pandoc_cen429-week-10.tr_doc.pdf)
- [DOC](pandoc_cen429-week-10.tr_word.docx)
- [SLIDE](cen429-week-10.tr_slide.pdf)
- [PPTX](cen429-week-10.tr_slide.pptx)

---


<iframe width=700, height=500 frameBorder=0 src="../cen429-week-10.tr_slide.html"></iframe>

---

### Outline

- Beyaz Kutu Kriptografisi Nedir?
- Beyaz Kutu Şifreleme Yöntemleri
- Uygulama Alanları ve Tehditler

---

### **Hafta-10: Beyaz Kutu Kriptografisi**

Bu hafta, şifreleme işlemlerinin açık sistemlerde güvenli bir şekilde nasıl uygulandığını inceleyen Beyaz Kutu Kriptografisi'ni ele alacağız. Beyaz kutu kriptografisi, özellikle dijital hak yönetimi (DRM) ve mobil uygulamalarda veri güvenliğini sağlamak için önemli bir tekniktir.

---

#### **1. Beyaz Kutu Kriptografisinin Temelleri**

**Teorik Açıklama:** Beyaz kutu kriptografisi, özellikle saldırganın sistemin tüm kaynaklarına erişimi olduğu durumlarda güvenliği sağlamak amacıyla geliştirilmiştir. Buradaki temel amaç, şifreleme anahtarlarını ve işlemlerini dışarıdan gelebilecek saldırılara karşı gizli tutmaktır. Saldırgan, sistem üzerinde kodu analiz edebilir, belleği okuyabilir ve şifreleme işlemlerini takip edebilir. Beyaz kutu kriptografi, bu durumlarda bile güvenliği sağlayacak teknikler sunar.

- **Kara Kutu Modeli (Blackbox):** Anahtar ve veri, şifreleme işlemi sırasında sistemde gizli kalır. Saldırganın şifreleme algoritmasına erişimi yoktur.
- **Beyaz Kutu Modeli (Whitebox):** Saldırgan sistemde tam erişime sahiptir. Şifreleme algoritması ve anahtarlar saldırgan tarafından görünür.

**Uygulama Örnekleri:**

1. Beyaz kutu ortamında bir şifreleme algoritmasının nasıl gizlenebileceğini analiz etmek.
2. Kara kutu ve beyaz kutu modelleri arasındaki farkları karşılaştırarak açıklamak.

---

#### **2. Beyaz Kutu Şifreleme Yöntemleri**

**Teorik Açıklama:** Beyaz kutu şifreleme, özellikle simetrik şifreleme algoritmaları için kullanılır. Beyaz kutu ortamında şifreleme yapılırken, şifreleme anahtarının bellekten çıkarılması veya tahmin edilmesi zorlaştırılır.

- **Whitebox AES:** AES şifreleme algoritmasının, beyaz kutu ortamlarında güvenli bir şekilde uygulanmasını sağlar.
- **Whitebox DES:** DES algoritmasının benzer şekilde beyaz kutu güvenliği sağlanmış hali.

**Uygulama Örnekleri:**

1. **Whitebox AES** ile bir metni şifreleme ve çözme işlemi.
2. **Whitebox DES** kullanarak verilerin şifrelenmesi ve şifre çözülmesi.

---

#### **3. Whitebox AES ve DES**

**Teorik Açıklama:** AES ve DES, simetrik şifreleme algoritmalarıdır. Beyaz kutu uygulamalarında, bu algoritmaların iç yapılarını gizlemek için çeşitli teknikler kullanılır.

- **Whitebox AES:** Normalde güvenli bir ortamda çalışan AES algoritması, saldırganın tüm belleğe ve koda erişebildiği durumlarda dahi anahtarları gizli tutacak şekilde dönüştürülür. Bu, dönüşüm tablosu kullanılarak yapılır.
- **Whitebox DES:** DES algoritmasında da benzer bir yaklaşım izlenir, ancak AES'e göre daha düşük güvenlik seviyelerine sahiptir.

**Uygulama Örnekleri:**

1. Whitebox AES algoritmasının nasıl çalıştığını adım adım analiz etme.
2. Whitebox DES'in zayıf yönlerini ve güvenlik açıklarını tartışma.

---

#### **4. Beyaz Kutu Kriptografisinde Kullanılan Teknikler**

**Teorik Açıklama:** Beyaz kutu kriptografisi, saldırganın anahtarları elde etmesini zorlaştıran çeşitli teknikler kullanır.

- **Tablo Dönüşümü (Table Lookups):** Anahtar işlemleri, tabloya dayalı dönüşümlerle gerçekleştirilir ve böylece anahtarlar kod içinde açıkça görünmez.
- **Obfuscation:** Kodun karmaşıklaştırılması, şifreleme işlemlerinin izlenmesini zorlaştırır.
- **Çoklu Maskeler (Multiple Masking):** Anahtarlar, birden fazla maskeleme katmanıyla korunur, böylece saldırganın tek bir anahtarı ele geçirmesi yeterli olmaz.

**Uygulama Örnekleri:**

1. **Tablo Dönüşüm** yöntemi ile şifreleme işlemini beyaz kutuda nasıl güvenli hale getirebiliriz?
2. **Obfuscation** teknikleri kullanarak şifreleme algoritmasını karmaşıklaştırma.

---

#### **5. Beyaz Kutu Kriptografisinde Güvenlik Tehditleri**

**Teorik Açıklama:** Beyaz kutu kriptografisi, tam güvenlik sunamayabilir ve çeşitli saldırı türlerine karşı savunmasız kalabilir.

- **Yan Kanal Saldırıları (Side-Channel Attacks):** Saldırgan, şifreleme işlemi sırasında enerji tüketimi, elektromanyetik yayılım veya zamanlama bilgilerini analiz ederek şifreleme anahtarlarını elde etmeye çalışabilir.
- **Kapsamlı Saldırılar (Brute Force):** Tüm olası anahtar kombinasyonlarını deneyerek doğru anahtarı bulmaya çalışan saldırılardır.
- **Differential Fault Analysis (DFA):** Saldırgan, şifreleme işlemi sırasında bellek veya işlemcide küçük hatalar oluşturarak, şifre çözme sürecini manipüle eder ve anahtar bilgilerini elde edebilir.

**Uygulama Örnekleri:**

1. Yan kanal saldırılarına karşı beyaz kutu ortamında nasıl koruma sağlanabilir?
2. Brute force saldırılarının etkilerini ve korunma yöntemlerini analiz etme.

---

#### **6. Güvenlik Kapsamında Beyaz Kutu Kriptografisinin Avantaj ve Dezavantajları**

**Teorik Açıklama:** Beyaz kutu kriptografisi, dijital hak yönetimi ve mobil uygulamalarda sıkça kullanılsa da, her durumda mükemmel bir çözüm sunmaz. Avantajlar ve dezavantajlar şunlardır:

- **Avantajlar:**
  - Saldırganın tüm sisteme erişimi olduğu durumlarda dahi güvenlik sağlar.
  - Dijital hak yönetimi (DRM) gibi uygulamalarda yaygın olarak kullanılır.
- **Dezavantajlar:**
  - Yan kanal saldırıları gibi çeşitli saldırı türlerine karşı hala savunmasız olabilir.
  - Performans açısından maliyetli olabilir, çünkü ek maskeler ve dönüşümlerle işlem yapılır.

**Uygulama Örnekleri:**

1. Beyaz kutu kriptografisinin avantajlarını ve dezavantajlarını tartışma.
2. Beyaz kutu ve kara kutu güvenlik modellerinin karşılaştırılması.

---

#### **7. Beyaz Kutu Kriptografisinin Uygulama Alanları**

**Teorik Açıklama:** Beyaz kutu kriptografisi, çeşitli uygulama alanlarında kullanılır:

- **Dijital Hak Yönetimi (DRM):** Müzik, film ve yazılım gibi dijital içeriklerin korsan kullanımını önlemek için kullanılır.
- **Mobil Uygulama Güvenliği:** Mobil cihazlarda çalışan uygulamalarda, özellikle finansal uygulamalarda hassas bilgilerin korunmasını sağlar.
- **IoT Güvenliği:** Nesnelerin interneti (IoT) cihazlarında veri güvenliğini sağlamak için kullanılır.

**Uygulama Örnekleri:**

1. **DRM** sistemlerinde beyaz kutu kriptografinin nasıl kullanıldığını inceleme.
2. Mobil uygulamalarda beyaz kutu kriptografinin uygulanması ve test edilmesi.

---

#### **8. Beyaz Kutu Kriptografi Araçları**

**Teorik Açıklama:** Beyaz kutu kriptografisini uygulamak için çeşitli araçlar ve kütüphaneler kullanılabilir. Bu araçlar, şifreleme işlemlerini karmaşıklaştırarak güvenliği artırır.

- **Tigress:** C/C++ programları için obfuscation (kod karmaşıklaştırma) ve beyaz kutu kriptografi teknikleri sağlayan bir araç.
- **Whitebox Toolkits:** Beyaz kutu AES ve diğer şifreleme algoritmalarını uygulayan çeşitli açık kaynak ve ticari kütüphaneler.

**Uygulama Örnekleri:**

1. **Tigress** kullanarak bir şifreleme algoritmasını karmaşıklaştırma.
2. Beyaz kutu kriptografi araçlarıyla basit bir uygulama geliştirme.

---

#### **9. Beyaz Kutu Kriptografisinde Gelecek Yönelimleri**

**Teorik Açıklama:** Beyaz kutu kriptografisi, dijital hak yönetimi ve güvenli mobil uygulamalar için kritik bir rol oynamaya devam ediyor. Gelecekte, beyaz kutu güvenlik tekniklerinin daha da geliştirilmesi ve yeni saldırı türlerine karşı daha dirençli hale getirilmesi bekleniyor.

- **Post-Kuantum Kriptografi:** Kuantum bilgisayarların ortaya çıkmasıyla birlikte, mevcut şifreleme algoritmalarının güvenliği sorgulanmaktadır. Beyaz kutu kriptografisi, bu yeni tehditlere karşı daha güvenli hale getirilmeye çalışılıyor.

**Uygulama Örnekleri:**

1. Beyaz kutu kriptografisinin gelecekteki güvenlik tehditlerine karşı nasıl geliştirilebileceğini analiz etme.

---

### **Sonuç**

Bu hafta, beyaz kutu kriptografisinin temellerini, uygulama alanlarını ve güvenlik tehditlerine karşı nasıl koruma sağlandığını öğrendik. Beyaz kutu kriptografisi, dijital içeriklerin ve hassas bilgilerin güvenliğini sağlamak için önemli bir araçtır.

---

$$
10.Hafta-Sonu
$$
