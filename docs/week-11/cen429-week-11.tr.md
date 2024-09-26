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
header: 'Güvenli Programlama ve Güvenlik Sertifikaları'
footer: '![height:50px](http://erdogan.edu.tr/Images/Uploads/MyContents/L_379-20170718142719217230.jpg) RTEU CEN429 Hafta-11'
title: "CEN429 Güvenli Programlama Hafta-11"
author: "Yazar: Dr. Uğur CORUH"
date:
subtitle: "Güvenlik Sertifikaları ve Penetrasyon Testi Planları"
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
  - cen429-hafta-11
  - güvenlik-sertifikaları
  - penetrasyon-testi
  - güvenlik
ref_link: na
---

<!-- _backgroundColor: aquq -->

<!-- _color: orange -->

<!-- paginate: false -->

# CEN429 Güvenli Programlama

## Hafta-11

#### Güvenlik Sertifikaları ve Penetrasyon Testi Planları

---

İndir

- [PDF](pandoc_cen429-week-11.pdf)
- [DOC](pandoc_cen429-week-11.docx)
- [SLIDE](cen429-week-11.pdf)
- [PPTX](cen429-week-11.pptx)

---


<iframe width=700, height=500 frameBorder=0 src="../cen429-week-11.html"></iframe>

---

### Outline

- Güvenlik Sertifikalarının Önemi
- Penetrasyon Testi Planları ve Araçları
- Sertifikasyon Süreçleri ve İlişkiler

---

### **Hafta-11: Güvenlik Sertifikaları ve Penetrasyon Testi Planları**

Bu haftanın amacı, güvenlik sertifikasyonlarının önemini, kullanılan standartları ve sızma testi (Penetrasyon Testi) süreçlerinin nasıl planlandığını öğrenmektir. Güvenlik sertifikaları, yazılım ve donanımın güvenliğinin uluslararası standartlara uygunluğunu gösterirken, penetrasyon testleri sistemin güvenlik açıklarını belirleyip olası tehditleri analiz etmemizi sağlar.

---

#### **1. Güvenlik Sertifikalarının Önemi**

**Teorik Açıklama:** Güvenlik sertifikaları, bir sistemin veya ürünün belirli güvenlik standartlarına uyduğunu gösterir. Sertifikalar, genellikle bir ürünün kullanıcılara güven verdiğini ve güvenlik açısından belirli testlerden geçtiğini belirtir.

- **Neden Önemli?**
  - Güvenilirlik sağlar.
  - Uluslararası standartlara uygunluğu gösterir.
  - Regülasyon ve yasal uyum gereksinimlerini karşılar.
  - Ürünlerin güvenlik seviyesini artırır.
  - Kullanıcılar ve müşterilere güven verir.

**Uygulama Örnekleri:**

1. Bir sistemin neden güvenlik sertifikasına ihtiyaç duyduğuna dair bir analiz yapma.
2. Güvenlik sertifikalarının ticari ürünler üzerindeki etkilerini inceleme.

---

#### **2. Yaygın Güvenlik Sertifikaları ve Standartlar**

**Teorik Açıklama:** Birçok güvenlik standardı ve sertifikasyon, donanım ve yazılım ürünlerinin güvenliğini sağlamak için kullanılır. Bu standartlar, ürünlerin nasıl test edilmesi ve sertifikalandırılması gerektiğine dair rehberlik eder.

- **ETSI (European Telecommunications Standards Institute):** Telekomünikasyon ve ağ güvenliği standartlarını belirler.
- **EMV (Europay, MasterCard, Visa):** Kart tabanlı ödeme sistemlerinin güvenliğini sağlamak için kullanılan standart.
- **GSMA:** Mobil cihazlar ve ağlar için güvenlik standartları.
- **ISO/IEC 27001:** Bilgi güvenliği yönetim sistemleri standardı.
- **PCI DSS (Payment Card Industry Data Security Standard):** Ödeme kartı bilgilerinin güvenliğini sağlamak için kullanılan standart.

**Uygulama Örnekleri:**

1. ETSI standartlarına göre bir ağ güvenliği planı oluşturma.
2. PCI DSS uyumluluğunun bir ödeme sistemi için nasıl sağlanacağını inceleme.

---

#### **3. EAL (Evaluation Assurance Level) Sertifikasyonu**

**Teorik Açıklama:** EAL (Değerlendirme Güvencesi Seviyesi), bir ürünün belirli güvenlik gereksinimlerini karşılama düzeyini gösterir. Farklı seviyelerde (EAL1'den EAL7'ye kadar) güvenlik güvencesi sağlar.

- **EAL Seviyeleri:**
  - **EAL1:** Fonksiyonel olarak test edilmiş.
  - **EAL2:** Yapısal olarak test edilmiş.
  - **EAL3:** Metodolojik olarak test edilmiş ve denetlenmiş.
  - **EAL4:** Tasarım bazında gözden geçirilmiş, metodolojik olarak test edilmiş.
  - **EAL5:** Yüksek güvence sağlayan, semantik olarak analiz edilmiş.
  - **EAL6 ve EAL7:** Son derece yüksek güvenlik seviyesi, matematiksel olarak kanıtlanmış.

**Uygulama Örnekleri:**

1. EAL sertifikasyon sürecinin nasıl işlediğini araştırma.
2. EAL seviyelerine göre bir sistemin güvenliğini değerlendirme.

---

#### **4. Penetrasyon Testi (PenTest) Planları**

**Teorik Açıklama:** Penetrasyon testi, bir sistemin zayıf noktalarını ve güvenlik açıklarını belirlemek için gerçekleştirilen saldırı simülasyonlarıdır. Penetrasyon testi planları, test edilecek alanları, metodolojiyi, hedefleri ve süreci içerir.

- **Neden Penetrasyon Testi Yapılır?**
  - Güvenlik açıklarını tespit etmek.
  - Gerçek dünya saldırılarına karşı sistemi test etmek.
  - Zayıf noktaları belirleyerek savunma mekanizmalarını güçlendirmek.
  - Sistem güvenliğini proaktif bir şekilde artırmak.

**PenTest Süreç Adımları:**

1. **Keşif (Reconnaissance):** Sistem hakkında bilgi toplama.
2. **Tarama (Scanning):** Açık portlar, hizmetler ve zayıflıklar tespit edilir.
3. **Sistem İstismarı (Exploitation):** Tespit edilen zayıflıklardan yararlanarak sisteme sızma.
4. **Avantaj Sağlama (Privilege Escalation):** Sistemde yönetici haklarına erişim sağlama.
5. **Erişimi Koruma (Maintaining Access):** Sızmanın kalıcı hale getirilmesi.
6. **Kanıt Toplama (Evidence Collection):** Bulunan güvenlik açıklarının belgelenmesi.

**Uygulama Örnekleri:**

1. Bir web uygulaması için penetrasyon testi planı oluşturma.
2. Gerçek dünya saldırılarını simüle ederek bir sistemin güvenlik açıklarını analiz etme.

---

#### **5. Penetrasyon Testi Yöntemleri**

**Teorik Açıklama:** Penetrasyon testi yöntemleri, test edilecek sistemin türüne ve saldırı hedeflerine göre değişiklik gösterir. Bazı yaygın test yöntemleri şunlardır:

- **Beyaz Kutu (Whitebox) Testi:** Test eden kişi, sistemin iç yapısını ve kaynak kodunu bilir.
- **Kara Kutu (Blackbox) Testi:** Test eden kişi, sistem hakkında hiçbir bilgiye sahip değildir. Saldırılar dışarıdan gerçekleştirilir.
- **Gri Kutu (Graybox) Testi:** Test eden kişi, sistemin bazı bölümleri hakkında bilgi sahibidir. Örneğin, uygulama yapısına veya kullanıcı rollerine dair bilgiye sahiptir.

**Uygulama Örnekleri:**

1. Beyaz kutu ve kara kutu testi arasındaki farkları analiz etme.
2. Bir sistem üzerinde gri kutu testi gerçekleştirerek sonuçları raporlama.

---

#### **6. Penetrasyon Testi Araçları**

**Teorik Açıklama:** Penetrasyon testleri sırasında çeşitli araçlar kullanılarak sistemin zayıf noktaları analiz edilir. Bu araçlar, testin kapsamına ve hedeflerine göre seçilir.

- **Nessus:** Zayıf nokta taraması için kullanılan popüler bir araçtır.
- **Metasploit:** Güvenlik açıklarının istismar edilmesi ve zayıflıkların test edilmesi için kullanılan bir çerçeve.
- **Wireshark:** Ağ trafiğini izlemek ve analiz etmek için kullanılır.
- **Burp Suite:** Web uygulamalarında güvenlik testi yapmak için kullanılan bir araçtır.
- **OWASP ZAP:** Web uygulamalarında güvenlik açıklarını tespit etmek için kullanılan açık kaynak bir araç.

**Uygulama Örnekleri:**

1. **Nessus** kullanarak bir sistemin güvenlik açıklarını tarama.
2. **Metasploit** kullanarak bir güvenlik açığından yararlanma ve sonuçlarını analiz etme.

---

#### **7. Penetrasyon Testi ve Sertifikasyon İlişkisi**

**Teorik Açıklama:** Penetrasyon testi sonuçları, bir sistemin güvenlik sertifikasyonu sürecinde önemli bir rol oynar. Sertifikasyon sağlayıcıları, bir sistemin güvenliğini doğrulamak için genellikle penetrasyon testi sonuçlarını göz önünde bulundurur.

- **Nasıl İlişkilidir?**
  - PenTest sonuçları, sertifikasyon sürecine eklenir ve güvenlik seviyesi kanıtlanır.
  - Güvenlik sertifikası almak için belirli testlerin başarıyla geçilmesi gerekir.
  - Penetrasyon testleri, sertifika uyumluluğunu sağlamak için düzenli olarak yapılır.

**Uygulama Örnekleri:**

1. Penetrasyon testi sonuçlarını sertifikasyon sürecine nasıl entegre edebileceğimizi analiz etme.
2. Sertifikasyon gereksinimlerine uygun bir güvenlik testi planı hazırlama.

---

### **Sonuç**

Bu hafta, güvenlik sertifikasyonlarının ve penetrasyon testlerinin sistem güvenliği üzerindeki etkilerini inceledik. Güvenlik sertifikaları, uluslararası standartlara uyumluluğu gösterirken, penetrasyon testleri bir sistemin zayıf noktalarını ortaya çıkararak güvenliğini artırır. Bu iki süreç, yazılım ve donanım ürünlerinin güvenlik seviyesini artırmak için birlikte çalışır.

---

$$
11.Hafta-Sonu
$$
