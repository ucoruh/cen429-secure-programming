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
header: 'Güvenli Programlama ve Güvenlik Gereksinimleri'
footer: '![height:50px](http://erdogan.edu.tr/Images/Uploads/MyContents/L_379-20170718142719217230.jpg) RTEU CEN429 Hafta-12'
title: "CEN429 Güvenli Programlama Hafta-12"
author: "Yazar: Dr. Uğur CORUH"
date:
subtitle: "Güvenlik Gereksinimleri ve Standartlar"
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
  - cen429-hafta-12
  - güvenlik-gereksinimleri
  - standartlar
  - güvenlik
ref_link: na
---

<!-- _backgroundColor: aquq -->

<!-- _color: orange -->

<!-- paginate: false -->

# CEN429 Güvenli Programlama

## Hafta-12

#### Güvenlik Gereksinimleri ve Standartlar

İndir [PDF](cen429-week-12.tr_doc.pdf), [DOCX](cen429-week-12.tr_word.docx), [SLIDE](cen429-week-12.tr_slide.pdf), [PPTX](cen429-week-12.tr_slide.pptx)

<iframe width=700, height=500 frameBorder=0 src="../cen429-week-12.tr_slide.html"></iframe>

---

### Outline

- Güvenlik Gereksinimlerinin Önemi
- Uluslararası Güvenlik Standartları
- Yaygın Güvenlik Sertifikaları

---

### **Hafta-12: Güvenlik Gereksinimleri ve Standartlar**

Bu hafta, güvenlik gereksinimlerinin nasıl tanımlandığını, uluslararası güvenlik standartlarının nasıl oluşturulduğunu ve yaygın kullanılan güvenlik sertifikaları ile uyumlu olmanın neden önemli olduğunu öğreneceğiz. Güvenlik gereksinimleri, bir sistemin saldırılara karşı ne kadar dayanıklı olduğunu belirlemek için tasarlanmıştır. Bu standartlar, birçok sektörde güvenliği sağlamak için kullanılır.

---

#### **1. Güvenlik Gereksinimlerinin Önemi**

**Teorik Açıklama:** Bir sistemin güvenli olabilmesi için, belirli güvenlik gereksinimlerini karşılaması gereklidir. Bu gereksinimler, sistemin hangi tehditlere karşı korunması gerektiğini ve hangi güvenlik önlemlerinin alınacağını belirler.

- **Güvenlik Gereksinimlerinin Başlıca Kategorileri:**
  - **Gizlilik (Confidentiality):** Yetkisiz kişilerin bilgilere erişiminin engellenmesi.
  - **Bütünlük (Integrity):** Verilerin yetkisiz kişiler tarafından değiştirilmesinin engellenmesi.
  - **Kimlik Doğrulama (Authentication):** Sisteme erişen kişilerin kimliğinin doğrulanması.
  - **Yetkilendirme (Authorization):** Sadece belirli kişilerin belirli kaynaklara erişebilmesi.
  - **Kayıt Tutma (Auditing):** Olayların kaydedilmesi ve izlenebilmesi.
  - **Süreklilik (Availability):** Sistemin kesintisiz çalışmasını sağlama.

**Uygulama Örnekleri:**

1. Bir uygulama için güvenlik gereksinimlerini belirleme.
2. Veritabanı güvenliğinin nasıl sağlanabileceğini analiz etme.

---

#### **2. ETSI (European Telecommunications Standards Institute)**

**Teorik Açıklama:** ETSI, Avrupa Telekomünikasyon Standartları Enstitüsü tarafından belirlenen standartlar, özellikle ağ güvenliği, mobil iletişim ve IoT cihazları gibi alanlarda kullanılır.

- **ETSI’nin Görevleri:**
  - Telekomünikasyon teknolojilerinde uluslararası standartlar geliştirmek.
  - Mobil ağlar için güvenlik çözümleri sağlamak.
  - 5G güvenlik standartlarını oluşturmak.

**Uygulama Örnekleri:**

1. ETSI standartlarına göre bir IoT cihazının güvenliğini inceleme.
2. ETSI tarafından belirlenen güvenlik gereksinimlerine göre bir ağ yapılandırması oluşturma.

---

#### **3. GSMA (GSM Association)**

**Teorik Açıklama:** GSMA, mobil cihazlar ve ağlar için güvenlik standartlarını belirler. GSMA, özellikle SIM kart güvenliği, ağ güvenliği ve mobil operatörler için protokoller sağlar.

- **GSMA’nın Rolü:**
  - Mobil ağlarda kullanılan protokoller için güvenlik standartları oluşturmak.
  - SIM kart ve eSIM güvenlik standartlarını yönetmek.
  - Mobil operatörler arasında güvenli veri alışverişini sağlamak.

**Uygulama Örnekleri:**

1. GSMA standartlarına göre bir mobil cihazın güvenlik gereksinimlerini belirleme.
2. GSMA tarafından önerilen güvenlik protokollerini mobil uygulama geliştirme süreçlerine entegre etme.

---

#### **4. EMV (Europay, MasterCard, Visa)**

**Teorik Açıklama:** EMV, ödeme kartı güvenliğini sağlamak amacıyla oluşturulmuş bir standarttır. Özellikle kredi kartları ve POS cihazlarının güvenliğini artırmak için kullanılır.

- **EMV Standartları:**
  - **MasterCard:** Kart güvenliği ve ödeme sistemlerinin korunması.
  - **Visa:** Kart sahiplerinin ve POS cihazlarının güvenliğini sağlayan protokoller.

**Uygulama Örnekleri:**

1. EMV standartlarına uygun bir ödeme sisteminin güvenlik gereksinimlerini oluşturma.
2. MasterCard ve Visa tarafından sağlanan güvenlik protokollerini bir POS cihazına entegre etme.

---

#### **5. EAL (Evaluation Assurance Level)**

**Teorik Açıklama:** EAL (Değerlendirme Güvencesi Seviyesi), bir ürünün güvenlik gereksinimlerini karşılama düzeyini gösterir. EAL seviyeleri, sistemin güvenliğini ne ölçüde test ettiğimizi belirler.

- **EAL Seviyeleri:**
  - **EAL1:** Fonksiyonel olarak test edilmiş.
  - **EAL2:** Yapısal olarak test edilmiş.
  - **EAL3:** Metodolojik olarak test edilmiş ve denetlenmiş.
  - **EAL4:** Tasarım bazında gözden geçirilmiş, metodolojik olarak test edilmiş.
  - **EAL5 ve üzeri:** Yüksek güvenlik gereksinimleri sağlayan sistemler.

**Uygulama Örnekleri:**

1. EAL seviyelerine göre bir sistemin güvenlik derecesini belirleme.
2. EAL4 seviyesinde bir sistem için test senaryoları geliştirme.

---

#### **6. Common Criteria (Ortak Kriterler)**

**Teorik Açıklama:** Common Criteria (Ortak Kriterler), uluslararası bir güvenlik sertifikasyon standardıdır. Bu standart, ürünlerin güvenlik seviyesini değerlendirmek için kullanılır ve dünya çapında kabul görmüştür.

- **Common Criteria’nin Avantajları:**
  - Ürün güvenliğinin küresel çapta onaylanmasını sağlar.
  - Güvenlik özelliklerinin doğrulanması için ortak bir dil sunar.
  - EAL sertifikasyon süreçlerine uyumludur.

**Uygulama Örnekleri:**

1. Common Criteria kapsamında bir güvenlik sertifikasyonu süreci başlatma.
2. Common Criteria uyumlu bir yazılım geliştirme planı hazırlama.

---

#### **7. FIPS (Federal Information Processing Standards)**

**Teorik Açıklama:** FIPS, Amerika Birleşik Devletleri hükümeti tarafından kullanılan bilgi işlem standartlarını tanımlar. FIPS, özellikle kriptografik modüllerin güvenliği için kullanılan bir standarttır.

- **FIPS’in Önemi:**
  - ABD hükümetine ait sistemlerde kullanılan güvenlik protokollerini tanımlar.
  - Kriptografik algoritmalar ve modüllerin sertifikalandırılmasını sağlar.
  - Hassas bilgilerin güvenliğini sağlamak için geliştirilmiş güvenlik standartları sunar.

**Uygulama Örnekleri:**

1. FIPS standardına uygun bir kriptografik modül geliştirme.
2. FIPS sertifikalı güvenlik algoritmalarını bir uygulamaya entegre etme.

---

#### **Sonuç**

Bu hafta, ETSI, GSMA, EMV, EAL, Common Criteria ve FIPS gibi güvenlik gereksinimleri ve standartlarını inceledik. Bu standartlar, uluslararası düzeyde kabul görmüş güvenlik protokollerini tanımlayarak sistemlerin ve ürünlerin güvenliğini sağlamaya yardımcı olur. Güvenlik sertifikaları, ürünlerin ve sistemlerin güvenlik açısından değerlendirildiğini ve onaylandığını gösterir.

---

$$
12.Hafta-Sonu
$$
