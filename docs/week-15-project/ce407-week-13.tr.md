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
footer: '![height:50px](http://erdogan.edu.tr/Images/Uploads/MyContents/L_379-20170718142719217230.jpg) RTEU CE407 Hafta-2'
title: "CE407 Güvenli Programlama Hafta-2"
author: "Yazar: Dr. Öğr. Üyesi Uğur CORUH"
date:
subtitle: "Geliştirme Ortamı Güvenliği ve Yazılım Geliştirme Süreçleri"
geometry: "left=2.54cm,right=2.54cm,top=1.91cm,bottom=1.91cm"
titlepage: true
titlepage-color: "FFFFFF"
titlepage-text-color: "000000"
titlepage-rule-color: "CCCCCC"
titlepage-rule-height: 4
logo:
logo-width:
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
lang: en-US
math: katex
tags:
  - ce407-hafta-2
  - yazılım-geliştirme
  - değişiklik-yönetimi
  - sürüm-kontrol
  - güvenlik
  - geliştirme-ortamı
ref_link: na
---

<!-- _backgroundColor: aquq -->

<!-- _color: orange -->

<!-- paginate: false -->

# CE407 Güvenli Programlama

## Hafta-2

#### Geliştirme Ortamı Güvenliği ve Yazılım Geliştirme Süreçleri

İndir [PDF](pandoc_ce407-week-2.tr_doc.pdf),[DOCX](pandoc_ce407-week-2.tr_word.docx), [SLIDE](ce407-week-2.tr_slide.pdf), [PPTX](ce407-week-2.tr_slide.pptx)

<iframe width=700, height=500 frameBorder=0 src="../ce407-week-2.tr_slide.html"></iframe>

---

### Outline

- Geliştirme Ortamı Güvenliği ve Yazılım Geliştirme Süreçleri

- Yazılım Geliştirme Süreci

  - Yazılım Geliştirme Akışı

  - Konfigürasyon Sabitleme

  - Değişiklik Başlatma ve Sınıflandırma

  - Değişikliği Onaylama ve Yayınlama

- Yazılım Geliştirme Ortamları

  - Geliştirme Ortamı Güvenliği

  - Sürüm Kontrol Sistemleri

  - Kaynak Kod Sunucu Güvenliği

  - Sunucu Odası ve Geliştirme Bilgisayarları Güvenliği


---

---

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

1. Tigress aracını kullanarak bir programın nasıl benzersiz bir yorumlayıcıya dönüştürüldüğünü görmek için aşağıdaki komutları kullanın:

```bash
tigress --Transform=Virtualize --Functions=fib --VirtualizeDispatch=switch --out=v1.c test1.c
gcc -o v1 v1.c

```

Bu işlem, fib fonksiyonunu switch tabanlı bir sanal makineye dönüştürür.

---

#### **2. Kodda Çeşitlilik Sağlama**

**Teorik Açıklama:** Çeşitlilik, kodun analizini zorlaştırmak amacıyla farklı yöntemlerle rastgeleleştirilmesini içerir. Bu yöntemler, bir saldırganın programı tersine mühendislikle çözmesini zorlaştırır. Tigress ile bir program her çalıştırıldığında benzersiz bir sanal makine oluşturulabilir.

- **Kodda Çeşitlilik Sağlayan Teknikler:**
  - **Flattening (Düzleştirme):** Programdaki tüm kontrol akışlarını bir döngü içine yerleştirerek karıştırma.
  - **Fonksiyon Birleştirme:** Birden fazla fonksiyonun birleştirilmesi.
  - **Rastgele Sayılarla Kodda Çeşitlilik Sağlama:** Rastgele sayılar kullanılarak fonksiyonların ve operandların karmaşıklaştırılması.
  - **Instruction Dispatch (Talimat Yönlendirme) Türleri:**
    - **Switch-based Dispatching:** Switch case kullanarak sanal makinelerin talimatlarını yönlendirme.
    - **Indirect Dispatching:** Endirekt olarak dallanma noktalarını yönlendirme.

**Uygulama Örneği:**

1. Aşağıdaki komutlarla farklı türde talimat yönlendirmeler ile programı sanal makinelerle çalıştırın:

```bash
tigress --Transform=Virtualize --Functions=fib --VirtualizeDispatch=indirect --out=v2.c test1.c
gcc -o v2 v2.c

```

---

#### **3. Saldırılar ve Karşı Saldırılar**

**Teorik Açıklama:** Bir saldırgan, programın sanal talimat setini çözerek kodun nasıl çalıştığını anlamaya çalışabilir. Bunun için çeşitli saldırı yöntemleri geliştirilmiştir, ancak Tigress bu saldırılara karşı bazı karşı saldırı teknikleri sunar.

- **Saldırı Türleri:**
  
  - **Saldırı 1:** Talimatları tersine mühendislik yaparak yorumlama.
  - **Saldırı 2:** Dinamik saldırılarla, programı çalıştırıp sanal program sayacını (PC) izleyerek talimatları çözme.

- **Karşı Saldırılar:**
  
  - **Kompleks Semantiği Olan Talimatlar Kullanma:** Talimatların içeriğini daha karmaşık hale getirerek tersine mühendisliği zorlaştırmak.
  - **Birden Fazla Program Sayacı Kullanma:** Programda birden fazla PC oluşturarak, saldırganın hangi PC’yi izleyeceğini bulmasını zorlaştırmak.

**Uygulama Örneği:**

1. **Saldırı Senaryosu:** Bir sanal makinenin talimat setini tersine mühendislikle çözme.
2. **Karşı Saldırı:** Programda birden fazla sanal makine sayacı kullanarak, tersine mühendislik yapılmasını zorlaştırma.

---

#### **4. Algoritmik Yöntemler ve Çeşitlilik Sağlama**

**Teorik Açıklama:** Çeşitlilik sağlama algoritmaları, programın çalışmasını karmaşıklaştırmak için çeşitli seviyelerde uygulanabilir. Bu yöntemler, bir saldırganın programı çözme olasılığını azaltmak için kullanılır.

- **Algoritmik Yöntemler:**
  
  - **Build-and-Execute:** Kodun bir kısmının çalışma zamanında oluşturulması ve çalıştırılması.
  - **Self-Modifying Code (Kendi Kendini Değiştiren Kod):** Kodu çalışma zamanında değiştiren algoritmalar.
  - **Şifreleme (Encryption):** Kodun bir kısmının şifrelenip çalışma zamanında çözülmesi.
  - **Kodun Taşınması (Moving Code Around):** Kodun her çalıştırıldığında farklı yerlerde çalıştırılması.

- **Granülerlik Düzeyleri:**
  
  - **Dosya Seviyesi (File-Level):** Tüm dosyanın şifrelenmesi veya taşınması.
  - **Fonksiyon Seviyesi (Function-Level):** Belirli fonksiyonların dinamik olarak değiştirilmesi.
  - **Temel Blok Seviyesi (Basic Block-Level):** Programın temel yapı taşlarının karıştırılması.

**Uygulama Örneği:**

1. Programı kendi kendini değiştiren bir kodla koruma:

```bash
void makeCodeWritable(caddr_t first, caddr_t last) {
  // Kodu çalışmadan önce değiştir.
}

```

---

#### **5. Kendini Değiştiren Kod (Self-Modifying Code)**

**Teorik Açıklama:** Kendi kendini değiştiren kodlar, programın çalışma zamanında kendini değiştirmesine izin verir. Bu yöntem, bir saldırganın kodu çözmesini zorlaştırmak için kullanılır.

- **Kanzaki Algoritması:** Gerçek talimatları sahte talimatlarla değiştirir ve sahte talimatları çalıştırmadan önce gerçek talimatlarla değiştirir.
- **Madou Algoritması:** Dinamik olarak fonksiyonları birleştirir ve kodun sürekli değişmesini sağlar.

**Uygulama Örneği:**

1. Madou’nun dinamik kod birleştirme algoritmasını kullanarak programı koruma:

```bash
gcc -o v5 v5.c

```

---

#### **Sonuç**

Bu hafta, çeşitlilik sağlama ve kendini değiştiren kod gibi ileri düzey kod obfuscation tekniklerini öğrendik. Bu teknikler, programların saldırılara karşı daha dirençli hale getirilmesini sağlar ve saldırganların kodu çözmesini zorlaştırır. Tigress gibi araçlar, kodu rastgeleleştirerek her seferinde farklı bir yapı oluşturur, bu da kodun analizi ve tersine mühendislik yapılmasını daha zor hale getirir.

---

$$
End-Of-Week-1
$$