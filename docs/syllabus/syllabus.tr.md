---
marp: true
theme: default
style: |
    img[alt~="center"] {
      display: block;
      margin: 0 auto;
      background-color: transparent!important;
    }
_class: lead
paginate: true
backgroundColor: #fff
backgroundImage: url('https://marp.app/assets/hero-background.svg')
header: 'CEN429 Güvenli Programlama Dersi İzlencesi'
footer: '![height:50px](http://erdogan.edu.tr/Images/Uploads/MyContents/L_379-20170718142719217230.jpg) RTEU CEN429 İzlence'
title: "CEN429 Güvenli Programlama"
author: "Ders Sorumlusu: Dr. Öğr. Üyesi Uğur CORUH"
date:
subtitle: "Detaylı Ders İzlencesi"
geometry: "left=2.54cm,right=2.54cm,top=1.91cm,bottom=1.91cm"
titlepage: true
titlepage-color: "FFFFFF"
titlepage-text-color: "000000"
titlepage-rule-color: "CCCCCC"
titlepage-rule-height: 4
logo: "assets/2021-10-19-15-01-36-image.png"
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
footer-center: "License: CC BY-NC-ND 4.0"
footer-right:
subparagraph: true
lang: tr-TR 
math: katex
tags:
  - cen429-syllabus
  - güvenli-programlama
  - fall-2024
  - cen429
---

<!-- _backgroundColor: aquq -->

<!-- _color: orange -->

<!-- paginate: false -->

<img src="http://erdogan.edu.tr/Images/Uploads/MyContents/L_379-20170718142719217230.jpg" title="" alt="height:100px" width="95">

## Recep Tayyip Erdoğan Üniversitesi

### Mühendislik ve Mimarlık Fakültesi, Bilgisayar Mühendisliği
 
### CEN429 - Güvenli Programlama Ders İzlencesi

#### Güz Dönemi, 2024-2025

---

İndir [PDF](pandoc_syllabus.tr_doc.pdf), [DOC](pandoc_syllabus.tr_word.docx)

<iframe width=700, height=500 frameBorder=0 src="../syllabus.tr_slide.html"></iframe>

---

<!-- paginate: true -->

| Dersin Sorumlusu:          | Dr. Öğr. Üyesi Uğur CORUH                |
| -------------------------- | ---------------------------------------- |
| **İletişim Bilgileri:**    | ugur.coruh@erdogan.edu.tr                |
| **Ofis No:**               | F-301                                    |
| **Google Classroom Code**  | ?????????                                |
| **Microsoft Teams Code**   | ?????????                                |
| **Lecture Hours and Days** | Perşembe, 13:00 - 15:00 İBBF 402, 4. Kat |

---


| **Derslik**       | İBBF 402 4. Kat veya Online Google Meet / Microsoft Teams                                                                                                                                                                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ofis Saatleri** | Toplantılar Google Meet veya Microsoft Teams üzerinden üniversite hesabınız ve e-posta adresiniz kullanılarak yapılacaktır. Talep doğrultusunda e-posta ile planlanacaktır. Daha hızlı yanıt almak için e-posta konu başlığının *[CEN429]* etiketiyle başlamasına özen gösterin ve resmi, net, kısa e-postalar yazın. |



---

| **Lecture and Communication Language**     | English                             |
| ------------------------------------------ | ----------------------------------- |
| **Theory Course Hour Per Week** 			 | 3 Hours                             |
| **Credit**                                 | ?????                               |
| **Prerequisite**                           | CE103- Algorithms and Programming I |
| **Corequisite**                            | TBD                                 |
| **Requirement**                            | TBD                                 |

*TBD: To Be Defined.

---

##### A. Ders Tanımı

Bu ders, güvenli yazılım geliştirme tekniklerini anlamaya yönelik kapsamlı bir yaklaşım sunmaktadır. Öğrenciler, tampon taşmaları, bellek sızıntıları ve enjeksiyon saldırıları gibi yaygın güvenlik açıklarını ele almak için yazılım koruma yöntemleri öğreneceklerdir. Ders, güvenli yazılım geliştirmede gerçek dünya uygulamalarına ve en iyi uygulamalara odaklanmaktadır.

---

##### B. Dersin Öğrenme Çıktıları

Bu dersi başarıyla tamamlayan bir öğrenci:

1. Yaygın yazılım güvenlik açıklarını tanımlar.
2. Şifreleme yöntemlerini uygulayarak hassas verileri güvence altına alır.
3. Kod sertleştirme tekniklerini (RASP ve kod karıştırma gibi) uygular.
4. Güvenli iletişim kanallarını şifreleme ve kimlik doğrulama mekanizmaları ile kurar.
5. Güvenli yazılım tasarımını, savunma stratejilerini kullanarak planlar.
6. Güvenlik incelemeleri ve zafiyet değerlendirmeleri gerçekleştirir.

---

## C.Ders Konuları

---

- **Güvenli Programlamaya Giriş ve Uygulama Koruma Planı**
  
  - Uygulama koruma genel bakış
  - Tampon taşması ve önleme teknikleri
  - Bellek yönetimi ve güvenlik
  - Korumalı kod bölme ve şifreleme ile işlem güvenliği

---

- **Bilgisayar Virüsleri ve Güvenlik Modelleri**
  
  - Virüs türleri (program, makro, boot sektörü)
  - Saldırı ağaçları ve güvenlik modelleri
  - Virüs karşı önlemleri

---

- **Veri Güvenliği: Aktarımda, Depolamada ve Kullanımda**
  
  - SSL/TLS kullanımı
  - Whitebox kriptografi uygulamaları
  - Dinamik anahtar yönetimi
  - Veri maskeleme teknikleri

---

- **Kod Sertleştirme Teknikleri (C/C++)**
  
  - Kontrol akışı düzleştirme
  - Fonksiyon adı gizleme
  - Bellek tahsisinin gizlenmesi
  - Dinamik şifreleme teknikleri

---

- **Kod Sertleştirme Teknikleri (Java/Yorumlanan Diller)**
  
  - ProGuard ile kod karıştırma
  - Dinamik metot karıştırma
  - Statik dize karıştırma ve korunması
  - Gelişmiş ProGuard kuralları

---
- **Çalışma Zamanı Uygulama Kendini Koruma (RASP) Teknikleri (C/C++)**
  
  - Root tespiti ve APK imzalama kontrolü
  - Dinamik bellek koruması
  - Debugger ve bellek izleme tespit etme
  - Dinamik analiz araçlarına karşı koruma

---
- **Gelişmiş Kod Karıştırma ve Çeşitlendirme Teknikleri**
  
  - Dinamik kontrol akışı karıştırma
  - Sahte kontrol akışları ekleme
  - Program karıştırma teknikleri
  - Dinamik fonksiyon çağrıları ve çalışma zamanı optimizasyonları

---
- **Quiz 1 + Ara Proje Rapor Teslimi**
  
  - İlk 7 hafta konularını kapsayan quiz
  - Ara proje rapor teslimi

---
- **Sertifikalar ve Şifreleme Yöntemleri (AES, RSA, PKI)**
  
  - AES ve RSA şifreleme
  - HMAC ile veri bütünlüğü sağlama
  - Dijital imza ve sertifika oluşturma

---
- **Whitebox Kriptografi**
  
  - Whitebox AES ve DES uygulamaları
  - Whitebox kriptografi ile anahtar koruma
  - Yazılım tabanlı güvenlik çözümleri

---
- **Güvenlik Sertifikasyonları ve Penetrasyon Testi Planlama**
  
  - ETSI ve EMV güvenlik standartları
  - Penetrasyon testi planlama
  - PCI DSS ve ISO 27001 güvenlik testleri

---
- **Ara Proje Rapor Teslimi**
  
  - Proje ilerlemesi ve rapor sunumu

---
- **Gerçek Dünya Vaka Çalışmaları**
  
  - Mobil ve masaüstü uygulama güvenliği
  - Çok katmanlı savunma uygulamaları
  - Uygulamalı penetrasyon testleri

---
- **Quiz 2**
  
  - İkinci quiz, önceki haftalardaki konuları kapsar

---
- **Final Proje Teslimi ve Sunumu**
  
  - Final proje raporu ve sunumu

---

## D. Ders Kitapları ve Gerekli Ekipmanlar

Bu ders için zorunlu bir ders kitabı bulunmamaktadır. Ancak, aşağıdaki kaynaklar önerilmektedir:

- **C How to Program, 7/E. Deitel & Deitel. 2013, Prentice-Hall.**
- **Introduction to Algorithms, Third Edition By Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, and Clifford Stein.**
- **Problem Solving and Program Design in C, J.R. Hanly, and E.B. Koffman.**

Sınıf içi uygulamalar ve sınavlar için kişisel bir dizüstü bilgisayara sahip olmanız gerekmektedir.

---

## E.Değerlendirme

Dönem boyunca 1 adet Proje ve 2 adet yazılı Quiz olacaksınız. Vize zamanı Proje Ara Raporu Teslim Etmeniz ve Projenizin İlermesini İspatlayıcı Şekilde Çıktılar Oluşturmanız ve Projenizin Proje Planına Sadık Kalmanız Gerekiyor. 15. Hafta Projenizin Sonuç Raporunu ve Sunumunu Yapacaksınız. 8. Hafta 1 Adet Yazılı Quiz Olacaksınız ve 14. Hafta da 1 adet Yazılı Quiz Olacaksınız. 

---

| Değerlendirme            | Kısaltma | Oran | Kapsam |
| ------------------------ | -------- | ---- | ------ |
| Proje Ara Raporu Teslimi | RAP1     | %60  | Vize   |
| Quiz-1                   | QUIZ1    | %40  | Vize   |
| Proje Final Raporu       | RAP2     | %70  | Final  |
| Quiz-2                   | QUIZ2    | %30  | Final  |


$$
Not_{Vize} = 0.6RAP1 + 0.4QUIZ1
$$

$$
Not_{Final}=0.7RAP2 + 0.3QUIZ2
$$

$$
\text{Geçme Notu}=(40*Not{Vize}+60*Not_{Final})/100
$$

---

##### F. Dersin Yürütülmesi

Dersler yüz yüze yapılacak olup, destekleyici materyaller ve duyurular Google Classroom veya Microsoft Teams üzerinden paylaşılacaktır. Salgına bağlı bir uzaktan eğitim gereksinimi oluşması durumunda, ders senkron ve asenkron uzaktan eğitim yöntemleri ile yürütülecektir.


---

## G. Geç Teslim

Ödev ve projelerin belirlenen tarihlerde teslim edilmesi gerekmektedir. Geç teslimler kabul edilmeyecektir. Beklenmedik durumlar en kısa sürede dersin sorumlusuna bildirilmelidir.


---

##### H. İletişim ve Ders Platformu

Google Classroom ve Teams bu dersin yönetim platformu olarak kullanılacaktır. Tüm kaynaklar ve duyurular burada paylaşılacaktır. Sağlıklı bir iletişim için bu platformu düzenli olarak kontrol ediniz.

---

### I. Akademik Dürüstlük, İntihal ve Kopya

Akademik dürüstlük, RTEÜ Üniversitesi'nin en önemli ilkelerinden biridir. Akademik dürüstlük ilkelerine aykırı davrananlar ciddi şekilde cezalandırılacaktır.

---

Sınıf arkadaşlarınızla veya başkalarıyla "birlikte çalışmak" normaldir. Bir öğrenci, zor bir konuyu veya tüm dersi daha iyi anlamak için ücretli ya da ücretsiz birinden yardım istemiş olabilir. Ancak, "birlikte çalışmak" ile "özel ders almak" ve "akademik dürüstlük ihlali" arasındaki sınır nedir? Ne zaman intihal, ne zaman kopya çekme sayılır?

---

Bir başka öğrencinin kağıdına ya da sınavda izin verilmeyen başka bir kaynağa bakmanın kopya çekme olduğu ve cezalandırılacağı açıktır. Ancak, birçok öğrenci, üniversiteye geldiklerinde ödevlerde neyin kabul edilebilir olduğuna ve "kopyalama"nın ne olduğuna dair çok az deneyime sahip olabiliyor. Özellikle ödevlerde akademik dürüstlüğün sınırlarını anlamak her zaman kolay olmayabilir.

Aşağıda, Mühendislik ve Mimarlık Fakültesi öğrencilerine, notlandırılacakları ödevlerde akademik dürüstlük felsefesini vurgulamak için rehber niteliğinde bazı açıklamalar yer almaktadır. Aşağıda tanımlanmayan bir durumla karşılaşıldığında, öğrencinin, yapmayı düşündüğü şeyin akademik dürüstlük çerçevesinde olup olmadığını anlamak için dersin hocasına veya asistanına danışması önerilir.

---

### a. Bir ödev hazırlanırken kabul edilebilir olan nedir?

- Ödevi daha iyi anlamak için sınıf arkadaşlarınızla iletişim kurmak

---

- İnternette veya başka yerlerde bulduğunuz fikirler, alıntılar, paragraflar, küçük kod parçacıkları (snippet) gibi içerikleri ödevinize dahil etmek, şu şartla:
  
  - Bu içerikler, ödevin tamamının çözümü olmamalıdır.
  
  - İçeriklerin kaynağını mutlaka belirtmelisiniz.

---

- Ödevinizin İngilizce içeriği konusunda size rehberlik etmesi için bir kaynaktan yardım istemek.

- Ödevin küçük parçalarını sınıfta tartışma ortamı oluşturmak için paylaşmak.

- Teknik sorunları çözmek için web ya da başka kaynaklardan talimat, referans veya çözüm aramak, ancak doğrudan ödeve cevap aramamak.

- Ödevlerin çözümlerini başkalarıyla diyagramlar ya da özet açıklamalar kullanarak tartışmak, ancak doğrudan metin ya da kod paylaşmamak.

- Dersle ilgili bir eğitmenden yardım almak (ücretli ya da ücretsiz), ancak eğitmen ödevinizi sizin yerinize yapmamalıdır.

---

### b. Kabul edilemez olan nedir?

- Ödevi teslim etmeden önce bir sınıf arkadaşınızdan çözümünü görmek istemek.

- Ödevde dış kaynaklardan alıntı yaptığınız her türlü metin ya da kodun kaynağını belirtmemek.

- Çözmekte zorlanan bir sınıf arkadaşınıza kendi ödev çözümünüzü vermek veya göstermek.

---

### J. Beklentiler

Derslere zamanında katılmanız ve dönem boyunca haftalık ders gereksinimlerini (okuma ve ödevler) tamamlamanız beklenmektedir. Eğitmen ile öğrenciler arasındaki ana iletişim kanalı e-posta olacaktır. Dersle ilgili sorularınızı, üniversite tarafından size sağlanan e-posta adresi üzerinden eğitmenin e-posta adresine göndermelisiniz. ***Mesajınızın konu alanına dersin adını, metin alanına ise adınızı eklemeyi unutmayın.*** Ayrıca, eğitmen gerekli olduğunda sizinle e-posta yoluyla iletişime geçecektir. Bu nedenle, sağlıklı bir iletişim için e-posta adresinizi her gün kontrol etmeniz çok önemlidir.

---

## K. Ders İçeriği ve Program Güncellemeleri

Gerektiğinde ders içeriği ve programda değişiklik yapılabilir. Herhangi bir değişiklik durumunda dersin sorumlusu, öğrencileri bilgilendirecektir.


---

### C. Haftalık Ders Planı

| **Hafta**     | **Tarih**      | **Konu**                                                         | **Diğer Görevler**       |
| ------------- | -------------- | ---------------------------------------------------------------- | ------------------------ |
| **1. Hafta**  | 26 Eylül 2024  | Güvenli Programlamaya Giriş ve Uygulama Koruma Planı             |                          |
| **2. Hafta**  | 3 Ekim 2024    | Bilgisayar Virüsleri ve Güvenlik Modelleri                       |                          |
| **3. Hafta**  | 10 Ekim 2024   | Veri Güvenliği: Aktarımda, Depolamada ve Kullanımda              |                          |


---

### C. Haftalık Ders Planı

| **Hafta**     | **Tarih**      | **Konu**                                                         | **Diğer Görevler**       |
| ------------- | -------------- | ---------------------------------------------------------------- | ------------------------ |
| **4. Hafta**  | 17 Ekim 2024   | Kod Sertleştirme Teknikleri (C/C++)                              |                          |
| **5. Hafta**  | 24 Ekim 2024   | Kod Sertleştirme Teknikleri (Java/Yorumlanan Diller)             |                          |
| **6. Hafta**  | 31 Ekim 2024   | Çalışma Zamanı Uygulama Kendini Koruma (RASP) Teknikleri (C/C++) |                          |
| **7. Hafta**  | 7 Kasım 2024   | Gelişmiş Kod Karıştırma ve Çeşitlendirme Teknikleri              |                          |

---

### C. Haftalık Ders Planı

| **Hafta**     | **Tarih**      | **Konu**                                                         | **Diğer Görevler**       |
| ------------- | -------------- | ---------------------------------------------------------------- | ------------------------ |
| **8. Hafta**  | 14 Kasım 2024  | **Quiz 1 + Ara Proje Rapor Teslimi**                             | Quiz ve Ara Proje Raporu |
| **9. Hafta**  | 21 Kasım 2024  | Sertifikalar ve Şifreleme Yöntemleri (AES, RSA, PKI)             |                          |
| **10. Hafta** | 28 Kasım 2024  | Whitebox Kriptografi                                             |                          |
| **11. Hafta** | 5 Aralık 2024  | Güvenlik Sertifikasyonları ve Penetrasyon Testi Planlama         |                          |

---

### C. Haftalık Ders Planı

| **Hafta**     | **Tarih**      | **Konu**                                                         | **Diğer Görevler**       |
| ------------- | -------------- | ---------------------------------------------------------------- | ------------------------ |
| **12. Hafta** | 12 Aralık 2024 | Ara Proje Rapor Teslimi                                          | Ara Proje Raporu         |
| **13. Hafta** | 19 Aralık 2024 | Gerçek Dünya Vaka Çalışmaları                                    |                          |
| **14. Hafta** | 26 Aralık 2024 | **Quiz 2**                                                       | Quiz 2                   |
| **15. Hafta** | 2 Ocak 2025    | **Final Proje Teslimi ve Sunumu**                                | Final Proje ve Sunum     |


---

### Bologna Information

<iframe width=700, height=1000 frameBorder=0 src="../ce100-algorithms-and-prgramming-II-bologna-en.pdf"></iframe>

---

$End-Of-Syllabus$