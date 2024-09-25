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
header: 'Güvenli Programlama ve Yazılım Geliştirme'
footer: '![height:50px](http://erdogan.edu.tr/Images/Uploads/MyContents/L_379-20170718142719217230.jpg) RTEU CE407 Hafta-13'
title: "CE407 Güvenli Programlama Hafta-13"
author: "Yazar: Dr. Öğr. Üyesi Uğur CORUH"
date:
subtitle: "Tigress ve Çeşitlilik Teknikleri"
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
  - ce407-hafta-13
  - tigress
  - çeşitlilik-teknikleri
  - güvenlik
ref_link: na
---

<!-- _backgroundColor: aquq -->

<!-- _color: orange -->

<!-- paginate: false -->

# CE407 Güvenli Programlama

## Hafta-13

#### Tigress ve Çeşitlilik Teknikleri

İndir [PDF](ce407-week-13.tr_doc.pdf),[DOCX](ce407-week-13.tr_word.docx), [SLIDE](ce407-week-13.tr_slide.pdf), [PPTX](ce407-week-13.tr_slide.pptx)

<iframe width=700, height=500 frameBorder=0 src="../ce407-week-13.tr_slide.html"></iframe>

---

### Outline

- Tigress ve Çeşitlilik Teknikleri
- Obfuscation Yöntemleri
- Saldırılara Karşı Savunma

---

### **Hafta-13: Tigress ve Çeşitlilik Teknikleri**

Bu hafta, kodun analiz edilmesini zorlaştıran ve programı saldırılara karşı daha dirençli hale getiren çeşitlilik (diversification) tekniklerini ve Tigress gibi obfuscation araçlarını inceleyeceğiz. Bu teknikler, programın çalıştığı her seferinde farklılaşmasını sağlar, böylece saldırganların aynı yöntemlerle programı analiz etmelerini zorlaştırır.

---

#### **1. Tigress Çeşitlilik (Diversity)**

**Teorik Açıklama:** Tigress, bir programı farklı şekillerde dönüştürerek, saldırılara karşı dirençli hale getiren güçlü bir obfuscation aracıdır. Bir programın her çıktısı benzersiz bir yorumlayıcı (interpreter) oluşturur. Bu, programın davranışını rastgeleleştirir ve analiz edilmesini zorlaştırır.

- **Tigress’te Kullanılan Yöntemler:**
  - **Instruction Dispatch Türleri:**
    - Switch, direkt, endirekt, çağrı (call), if-else, lineer, binary, interpolasyon.
  - **Operand Türleri:**
    - Yığın (stack), registerlar.
  - **Rastgeleleştirilen Operatörler:**
    - Farklı operandlar ve operator kombinasyonları kullanarak kodun karmaşıklaştırılması.
  - **Çeşitli Dönüşümler:**
    - **Code Flattening:** Programın akış kontrolünün düzleştirilmesi.
    - **Merge/Split Fonksiyonlar:** Birleştirilen ya da bölünen fonksiyonlar.
    - **Opaque Predicates:** Kodda gizli ve değiştirilemeyen koşul ifadeleri ekleme.

**Uygulama Örneği:** 

```bash
tigress --Transform=Virtualize --Functions=fib --VirtualizeDispatch=switch --out=v1.c test1.c
gcc -o v1 v1.c
```

---

2. Kodda Çeşitlilik Sağlama
Teorik Açıklama: Çeşitlilik, kodun analizini zorlaştırmak amacıyla farklı yöntemlerle rastgeleleştirilmesini içerir. Bu yöntemler, bir saldırganın programı tersine mühendislikle çözmesini zorlaştırır. Tigress ile bir program her çalıştırıldığında benzersiz bir sanal makine oluşturulabilir.

---

3. Saldırılar ve Karşı Saldırılar
Teorik Açıklama: Bir saldırgan, programın sanal talimat setini çözerek kodun nasıl çalıştığını anlamaya çalışabilir. Bunun için çeşitli saldırı yöntemleri geliştirilmiştir, ancak Tigress bu saldırılara karşı bazı karşı saldırı teknikleri sunar.

---

4. Algoritmik Yöntemler ve Çeşitlilik Sağlama
Teorik Açıklama: Çeşitlilik sağlama algoritmaları, programın çalışmasını karmaşıklaştırmak için çeşitli seviyelerde uygulanabilir. Bu yöntemler, bir saldırganın programı çözme olasılığını azaltmak için kullanılır.

---

Sonuç
Bu hafta, çeşitlilik sağlama ve kendini değiştiren kod gibi ileri düzey kod obfuscation tekniklerini öğrendik. Bu teknikler, programların saldırılara karşı daha dirençli hale getirilmesini sağlar ve saldırganların kodu çözmesini zorlaştırır. Tigress gibi araçlar, kodu rastgeleleştirerek her seferinde farklı bir yapı oluşturur, bu da kodun analizi ve tersine mühendislik yapılmasını daha zor hale getirir.


---

$$
13.Hafta-Sonu
$$
