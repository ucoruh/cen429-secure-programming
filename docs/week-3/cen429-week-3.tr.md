---
title: "Hafta 3 — Veri Güvenliği: Aktarımda, Beklemede, Kullanımda"
tags:
  - cen429
  - hafta-3
  - sifreleme
  - aead
  - tls
  - anahtar-turetme
---

# Hafta 3 — Veri Güvenliği: Aktarımda, Beklemede, Kullanımda

| | |
| --- | --- |
| **Tarih** | 02.10.2026 |
| **Öğrenme çıktıları** | ÖÇ.2 (şifreleme yöntemleri ve güvenli iletişim ilkeleri) · ÖÇ.4 (güvenli iletişim kanalı kurma) |
| **Süre** | 3 saat (3 × 50 dakika) |
| **Ön bilgi** | C'de işaretçi, dizi, dosya; Hafta 1'den bellek düzeni ve güvenli silme; Linux/WSL terminalinde `cd`, derleme |
| **Uygulamalar** | [`code/week-03`](https://github.com/ucoruh/cen429-secure-programming/tree/main/code/week-03) — 9 demo; Windows'ta `.\demo.ps1`, WSL/Linux'ta `sh demo.sh` |

<!-- materyal:basla -->

<div class="materyal" markdown>

[:material-file-pdf-box: Ders notu (PDF)](cen429-week-3-ders-notu.pdf){ .md-button download="cen429-week-3-ders-notu.pdf" }
[:material-file-word-box: Ders notu (DOCX)](cen429-week-3-ders-notu.docx){ .md-button download="cen429-week-3-ders-notu.docx" }
[:material-presentation: Sunum (PDF)](cen429-week-3-sunum.pdf){ .md-button download="cen429-week-3-sunum.pdf" }
[:material-microsoft-powerpoint: Sunum (PPTX)](cen429-week-3-sunum.pptx){ .md-button download="cen429-week-3-sunum.pptx" }
[:material-language-html5: Sunum (HTML, çevrimdışı)](cen429-week-3-sunum.html){ .md-button download="cen429-week-3-sunum.html" }
[:material-folder-zip: Tümünü indir (ZIP)](cen429-week-3-materyal.zip){ .md-button download="cen429-week-3-materyal.zip" }
[:material-fullscreen: Sunumu tam ekran aç](cen429-week-3-sunum.html){ .md-button .md-button--primary target=_blank }

</div>

<div class="sunum-cercevesi">
<iframe src="../cen429-week-3-sunum.html" title="Hafta 3 — Veri Güvenliği: Aktarımda, Beklemede, Kullanımda" loading="lazy" allowfullscreen></iframe>
</div>

<p class="sunum-ipucu">Sunumun içine tıklayıp ok tuşlarıyla ilerleyin; tam ekran için sunumun sağ altındaki düğmeyi ya da yukarıdaki "Sunumu tam ekran aç" bağlantısını kullanın.</p>

<!-- materyal:bitis -->

!!! abstract "Bu haftanın sonunda şunları yapabileceksiniz"
    1. Bir verinin üç durumunu — **aktarımda, beklemede, kullanımda** — ayırt etmek ve her biri için doğru koruma
       aracını seçmek.
    2. **Simetrik/asimetrik şifreleme, özet (hash), MAC ve kimlik doğrulamalı şifrelemeyi (AEAD)** birbirinden ayırmak;
       AES-GCM ile bir dosyayı şifreleyip **tek bir bit değişince** çözmenin reddettiğini göstermek.
    3. **IV/nonce ve tuzun** ne işe yaradığını ve **nonce yeniden kullanımının** neden felaket olduğunu; **ECB kipinin**
       neden desen sızdırdığını çalışan örnekte göstermek.
    4. Paroladan anahtar türetmeyi (**PBKDF2, scrypt, Argon2id**) ve ana sırdan **oturum anahtarı türetmeyi (HKDF)**
       ile **ileri gizliliği** açıklamak.
    5. **TLS 1.3 el sıkışmasını** çizmek; **sertifika ve ana makine adı doğrulamanın**, **sertifika sabitlemenin
       (pinning)** ve **TOFU'nun** neden gerektiğini; doğrulamasız bir istemciye karşı **localhost MITM** kurup
       sabitleme ile durdurmak.
    6. **Beklemede** (dosya/veritabanı şifreleme, veri maskeleme) ve **kullanımda** (bellekte kısa ömür, güvenli silme,
       cihaz bağlama) veriyi korumak.
    7. **Güvenlik kabuğu** kavramını — bir sırrın taşıma, depolama ve kullanım boyunca **iç içe katmanlarla** sarılması —
       kurmak ve "yalnız TLS'e güvenmeme" ilkesini savunmak.
    8. **Whitebox kriptografinin** neden var olduğunu (motivasyon) bir cümleyle söylemek.
    9. Güvenlikle ilgili rastgele değerleri **CSPRNG**'den üretmek; OpenSSL EVP ve Windows CNG ile AES-GCM'yi **adım adım**
       doğru çağırmak, etiketi doğrulamadan açık metne dokunmamak ve sabit zamanlı karşılaştırma yapmak.
    10. Bir anahtarın **yaşam döngüsünü**, **hiyerarşisini**, **zarflamayı** ve anahtar sürümüyle yenilemeyi açıklamak;
        bir TLS istemcisini satır satır kurup **fail-open** hatalarını tanımak; **maskeleme, tokenizasyon ve takma
        adlandırmayı** doğru yerde kullanmak.

??? info "Ders akışı (öğretim üyesi için zaman planı)"
    | Zaman | Bölüm | Ne yapılıyor |
    | --- | --- | --- |
    | 0:00–0:10 | Giriş | Üç veri durumu, güvenlik kabuğu çerçevesi, laboratuvar kontrolü |
    | 0:10–0:30 | [2](#2-sifreleme-temelleri-hangi-arac-neyi-korur) | Simetrik/asimetrik/özet/MAC/AEAD; **Demo 1** (AES-GCM) |
    | 0:30–0:50 | [3–5](#3-rastgele-sayilar-kriptografinin-gorunmez-temeli) | Rastgele sayılar, kripto API'lerini adım adım kullanmak; IV/nonce/tuz, **Demo 2–3** |
    | 0:50–1:00 | Ara | |
    | 1:00–1:25 | [6–8](#6-paroladan-anahtar-turetme) | PBKDF2/Argon2id **Demo 4**; HKDF ve ileri gizlilik **Demo 5**; anahtar yaşam döngüsü ve hiyerarşisi |
    | 1:25–1:50 | [9–10](#9-aktarimda-veri-tls-13-sertifika-dogrulama-ve-sabitleme) | TLS 1.3, doğrulama, sabitleme, **Demo 6**; TLS'i kodda kurmak, fail-open — **sınıf etkinliği** |
    | 1:50–2:00 | Ara | |
    | 2:00–2:25 | [11–13](#11-beklemede-veri-dosya-ve-veritabani-sifreleme) | Beklemede veri **Demo 7**; veri maskeleme; kullanımda veri **Demo 8** |
    | 2:25–2:45 | [14–15](#14-guvenlik-kabuklari-derinlemesine-savunmanin-somut-hali) | **Demo 9** (kabuk) ve sahadaki kabuk matrisi; whitebox motivasyonu |
    | 2:45–3:00 | [17–21](#17-donem-projesi-bu-hafta) | Proje (S5/S7), kendini sınama, kapanış |

!!! tip "Laboratuvarı önceden hazırlayın (bu hafta kripto var)"
    Demolar hem **Windows** (Visual Studio 2022 derleyicisi, ek kurulum yok) hem **WSL/Linux** (GCC + OpenSSL) üzerinde
    **aynı kaynaktan** derlenir. Kripto işlevleri ortak bir başlık üzerinden gelir: Linux'ta **OpenSSL**, Windows'ta
    işletim sisteminin kendi **BCrypt (CNG)** kütüphanesi. Bu yüzden Windows'ta öğrencinin OpenSSL kurmasına gerek yoktur.

    === "Windows"
        ```powershell
        cd code
        .\build.ps1
        cd week-03\01-aes-gcm-dosya
        .\demo.ps1        # ya da demo.cmd dosyasına çift tıklayın
        ```

    === "WSL / Linux"
        ```bash
        cd code
        ./build.sh
        cd week-03/01-aes-gcm-dosya
        sh demo.sh
        ```

    === "Visual Studio 2022"
        `Dosya > Aç > Klasör > code/` deyin; üstteki yapılandırmadan **"Windows (MSVC)"** ya da **"WSL (GCC)"** seçin;
        **Derle > Tümünü Derle**. İkili dosyalar her demonun `bin\windows` ya da `bin/linux` klasörüne düşer.

    Kurulum ayrıntıları ve güvenlik kuralları: [`code/README.md`](https://github.com/ucoruh/cen429-secure-programming/blob/main/code/README.md).

!!! warning "Etik kural — bu derste her hafta geçerli"
    Bu derste saldırıları **görerek** öğreniyoruz. Bütün demolar yalnız kendi klasörlerinde dosya üretir, yönetici
    yetkisi istemez, sistem sertifika deposuna dokunmaz ve **ağı yalnız `localhost` (127.0.0.1)** üzerinde kullanır.
    TLS demosundaki "araya girme" (MITM) benzetimi tamamen kendi bilgisayarınızda, **kendi ürettiğimiz sertifikalarla**
    çalışır. Öğrendiğiniz teknikleri **yalnız kendi bilgisayarınızda ve verilen demolar üzerinde** deneyin. Başkasının
    trafiğini izinsiz dinlemek ya da araya girmek suçtur.

---

## 1. Verinin üç hâli ve güvenlik kabuğu

Geçen iki hafta "hata → saldırı → düzeltme" ile programın **kendisini** koruduk. Bu hafta odağı **veriye** çeviriyoruz.
Bir sır — parola, ödeme anahtarı, kişisel bilgi — yaşam döngüsü boyunca **üç ayrı hâlde** bulunur ve her hâlin tehdidi
de savunması da farklıdır:

| Hâl | Nerede? | Tehdit | Tipik savunma |
| --- | --- | --- | --- |
| **Aktarımda** (in transit) | Ağ üzerinde, iki uç arasında | Dinleme, araya girme (MITM), yeniden oynatma | TLS 1.3, sertifika doğrulama + sabitleme, mesaj düzeyi AEAD |
| **Beklemede** (at rest) | Disk, veritabanı, yedek | Dosyanın/DB'nin çalınması | Dosya/alan şifreleme (AEAD), cihaza bağlı anahtar, maskeleme |
| **Kullanımda** (in use) | RAM, önbellek, yazmaç | Bellek dökümü, hata ayıklayıcı, takas alanı | Kısa ömür, güvenli silme, bellek kilitleme, whitebox |

```mermaid
flowchart LR
    subgraph Sunucu["Sunucu (güvenilir)"]
        S[("Veri")]
    end
    subgraph Ag["Ağ"]
        T["Aktarımda<br/>TLS + mesaj AEAD"]
    end
    subgraph Cihaz["Kullanıcının cihazı (güvenilmez)"]
        R[("Beklemede<br/>şifreli dosya/DB")]
        U["Kullanımda<br/>kısa ömür + silme"]
    end
    S --> T --> R --> U
```

!!! note "Bu haftanın ana fikri: güvenlik kabuğu"
    Tek bir önlem yetmez. Hassas bir varlığı, yaşam döngüsünün **her aşamasında** iç içe geçmiş **koruma katmanlarıyla**
    (kabuklarla) sararız: en dışta kanal güvenliği (TLS), onun içinde mesaj düzeyi şifreleme, onun içinde depolama
    şifrelemesi, en içte cihaza bağlı bir anahtar. Saldırganın sırra ulaşması için **hepsini sırayla** kırması gerekir.
    Bu, Hafta 1'de tanıttığımız **derinlemesine savunmanın** somut hâlidir; Bölüm 14'da bir anahtarı
    dört kabukla sarıp açacağız.

Dönem boyunca kullandığımız **örnek mimariyi** (bir mobil ödeme uygulaması + onun kritik işlerini yapan bir güvenlik
kütüphanesi) hatırlayın. Bu hafta o mimarideki üç arayüzü dolduruyoruz: telefon ↔ sunucu (aktarımda), telefondaki
şifreli veritabanı (beklemede) ve ödeme anında bellekte açılan anahtar (kullanımda).

Bu mimaride telefon **güvenilmez ortamdır** (kullanıcı — yani potansiyel saldırgan — cihazın sahibidir; root alınmış,
hata ayıklayıcı bağlanmış olabilir). Sunucu tarafı güvenilirdir. Aradaki her arayüz için şu soruları sorarız: hangi
veri geçiyor, hangi hâlde (aktarım/depolama/kullanım), kimlik nasıl doğrulanıyor, gizlilik mi bütünlük mü yoksa ikisi
birden mi gerekiyor? Bu haftanın demoları tam olarak bu soruların cevaplarını kurar:

- **Telefon ↔ sunucu (aktarımda):** TLS 1.3 + sertifika doğrulama + sabitleme, üstüne mesaj düzeyi AEAD (Demo 6, 1, 5).
- **Yerel veritabanı (beklemede):** hassas alanlar cihaza bağlı bir anahtarla AES-GCM (Demo 7, 4).
- **Ödeme anında bellek (kullanımda):** anahtar en kısa süre açık, kullanınca güvenli silme, cihaz bağlama (Demo 8, 9).

Bütün örnek değerler **sentetiktir** (uydurma); gerçek anahtar, kart numarası, cihaz kimliği ya da IP kullanılmaz.

---

## 2. Şifreleme temelleri: hangi araç neyi korur?

Kriptografi tek bir şey değildir; **farklı hedefler için farklı araçlar** vardır. En sık karıştırılan dört aileyi
netleştirelim.

| Araç | Ne sağlar? | Anahtar | Örnek | Bu derste |
| --- | --- | --- | --- | --- |
| **Simetrik şifreleme** | Gizlilik | Tek gizli anahtar (her iki taraf) | AES, ChaCha20 | Dosya/DB/oturum şifreleme |
| **Asimetrik şifreleme** | Gizlilik + anahtar dağıtımı | Açık/özel çift | RSA-OAEP, ECIES | Anahtar kurulumu, TLS |
| **Özet (hash)** | Bütünlük parmak izi (anahtarsız) | Yok | SHA-256, SHA-3 | Parmak izi, HKDF/HMAC yapıtaşı |
| **MAC** | Bütünlük **+ kimlik** (paylaşılan anahtar) | Tek gizli anahtar | HMAC-SHA-256, CMAC | Mesajın değişmediğini kanıtlama |
| **Dijital imza** | Bütünlük + kimlik + **inkâr edilemezlik** | Açık/özel çift | Ed25519, RSA-PSS | Sertifikalar, sürüm imzalama (H10) |
| **AEAD** | Gizlilik **ve** bütünlük **birlikte** | Tek gizli anahtar | AES-GCM, ChaCha20-Poly1305 | Bu haftanın ana aracı |

!!! danger "En sık yapılan iki hata"
    1. **Yalnız şifrelemek, bütünlüğü unutmak.** Sadece şifreli metin (ör. AES-CTR) saldırganın **fark edilmeden**
       bitleri değiştirmesini engellemez. Şifreleme gizliliği sağlar, **bütünlüğü değil**.
    2. **Kendi şifrenizi/kipinizi yazmak.** Kerckhoffs ilkesi: güvenlik algoritmanın gizliliğine değil **anahtarın**
       gizliliğine dayanmalı. Standart, denenmiş yapıları kullanın.

### 2.1 Kimlik doğrulamalı şifreleme (AEAD): tek çağrıda gizlilik + bütünlük

Doğru cevap neredeyse her zaman **AEAD**'dir (Authenticated Encryption with Associated Data). AEAD tek bir işlemle iki
şey yapar: veriyi şifreler (**gizlilik**) ve şifreli metnin (isteğe bağlı olarak ek "ilişkili veri"nin) değişmediğini
kanıtlayan bir **etiket (tag)** üretir (**bütünlük + kimlik**). Çözerken etiket **doğrulanır**: tek bir bit bile
oynadıysa çözme **reddedilir**.

İki modern AEAD:

- **AES-GCM** — donanım AES hızlandırması olan işlemcilerde (çoğu masaüstü/sunucu) çok hızlı. NIST SP 800-38D.
- **ChaCha20-Poly1305** — AES donanımı olmayan cihazlarda (bazı mobil/gömülü) daha hızlı ve yan kanala dirençli.
  RFC 8439.

```mermaid
flowchart LR
    A["Anahtar (32 bayt)"] --> E["AES-256-GCM"]
    N["Nonce (12 bayt)<br/>her mesajda BENZERSİZ"] --> E
    P["Düz metin"] --> E
    AAD["İlişkili veri (AAD)<br/>şifrelenmez, doğrulanır"] --> E
    E --> C["Şifreli metin"]
    E --> T["Etiket (16 bayt)"]
```

!!! info "Kitap tarifi ve güncelleme"
    Ders kitabı (Viega & Messier) simetrik şifrelemeyi **tarif 5.x**'te işler ama 2003 tarihlidir: DES/3DES/RC4 ve ayrı
    MAC önerir. Biz bunları **AES-GCM / ChaCha20-Poly1305** (AEAD) ile güncelliyoruz. "Şifreleme ile bütünlüğü birlikte
    çalıştırma" fikri tarif **6.18**'de geçer; AEAD bunun tek çağrıya inmiş hâlidir.

### 2.2 Simetrik mi, asimetrik mi? Cevap: ikisi birden (hibrit)

Simetrik şifreleme (AES) hızlıdır ama iki tarafın **aynı gizli anahtarı** bilmesini gerektirir; bu anahtarı güvensiz bir
ağdan nasıl paylaşırsınız? Asimetrik şifreleme (RSA, eliptik eğri) bu sorunu çözer: herkesin bir **açık** anahtarı
(dağıtılır) ve bir **özel** anahtarı (gizli kalır) vardır. Ama asimetrik işlemler yavaştır ve büyük veriye uygun
değildir.

Gerçek sistemler bu yüzden **hibrit** çalışır: asimetrik kripto yalnız **küçük bir simetrik anahtarı** güvenle taşımak
(ya da anlaşmak) için kullanılır; asıl veri o simetrik anahtarla AEAD ile şifrelenir. TLS tam olarak budur: el
sıkışmada eliptik eğri Diffie-Hellman ile bir oturum anahtarı üzerinde anlaşılır, sonra bütün trafik AES-GCM ya da
ChaCha20-Poly1305 ile şifrelenir.

| Özellik | Simetrik (AES) | Asimetrik (RSA/EC) |
| --- | --- | --- |
| Hız | Çok hızlı | Yavaş (100–1000×) |
| Anahtar | Tek, paylaşılan gizli | Açık/özel çift |
| Kullanım | Büyük veri şifreleme | Anahtar taşıma, imza |
| Bu haftada | Dosya/DB/oturum | TLS anahtar kurulumu (H10) |

### 2.3 Blok mü, akış mı? Kip (mode) neden önemli?

AES bir **blok şifresidir**: tek seferde 16 baytlık bir bloğu şifreler. Bloktan uzun veriyi şifrelemek için bir **kip**
(mode of operation) gerekir ve **kip seçimi güvenliği belirler**:

- **ECB** — her bloğu bağımsız şifreler; **desen sızdırır** (Demo 3). Kullanmayın.
- **CBC** — her blok bir öncekine zincirlenir; rastgele IV ister, tek başına bütünlük **vermez**, padding oracle'a açık.
- **CTR** — bloğu bir akış şifresine çevirir (anahtar akışı ⊕ veri); nonce tekrarına **çok** hassas (Demo 2).
- **GCM** — CTR + Galois MAC; **AEAD**. Modern varsayılan.

ChaCha20 zaten bir **akış şifresidir** (blok kavramı yoktur); Poly1305 MAC'iyle birleşince AEAD olur. Sonuç aynı:
**gizlilik + bütünlük tek pakette.**

### 2.4 Özet, MAC ve imza: hangisi ne zaman?

Bu üçü **bütünlük** ailesindendir ama farklı şeyler kanıtlarlar; karıştırmak yaygın bir hatadır:

- **Özet (hash)** anahtarsızdır. Yalnız verinin **değişip değişmediğini** (parmak izi) gösterir. Ama saldırgan veriyi
  değiştirip **özeti de yeniden hesaplayabilir**; bu yüzden özet tek başına bütünlük **kanıtı değildir**. Özet, HMAC ve
  HKDF gibi yapıların yapıtaşıdır ve parmak izi/karşılaştırma için kullanılır. Eski MD5/SHA-1 çakışmaya açıktır;
  SHA-256/SHA-3 kullanın.
- **MAC** (ör. HMAC-SHA-256) **paylaşılan gizli anahtar** ister. "Bu mesajı, anahtarı bilen biri gönderdi ve
  değişmedi" der. İki taraf da anahtarı bildiği için MAC **inkâr edilemezlik sağlamaz** (hangi taraf ürettiği
  ayırt edilemez). Sırları MAC ile karşılaştırırken **sabit zamanlı** karşılaştırma kullanın (`CRYPTO_memcmp`), düz
  `memcmp` zamanlama sızdırır.
- **Dijital imza** (ör. Ed25519, RSA-PSS) **açık/özel anahtar** çiftiyle çalışır. Yalnız özel anahtar sahibi imza
  üretebilir, herkes açık anahtarla doğrular; bu yüzden **inkâr edilemezlik** sağlar. Sertifikalar ve sürüm imzalama
  (Hafta 10) bununla çalışır.

| Soru | Doğru araç |
| --- | --- |
| "Bu dosya bozuldu mu?" (anahtarsız parmak izi) | Özet (SHA-256) |
| "Bu mesajı anahtarı bilen biri mi yolladı ve değişmedi mi?" | MAC (HMAC) |
| "Bunu **kesinlikle** şu kişi/sunucu imzaladı, inkâr edemez" | İmza (Ed25519) |
| "Bunu hem gizle hem bütünlüğünü kanıtla" | AEAD (AES-GCM) |

!!! tip "AEAD çoğu zaman doğru cevaptır"
    Uygulama içinde veri saklıyor ya da bir kanaldan geçiriyorsanız, ayrı ayrı "şifrele + MAC ekle" kurmak yerine
    **AEAD** kullanın; iki işi tek çağrıda, doğru sırada (encrypt-then-MAC) ve daha az hatayla yapar. Ayrı MAC yalnız
    şifrelenmeyecek ama bütünlüğü gereken veriler için (ya da AEAD'nin AAD alanıyla) gerekir.

### Demo 1 — AES-256-GCM ile dosya şifreleme ve kurcalama tespiti

!!! info "Demo 1 · `code/week-03/01-aes-gcm-dosya` · AEAD, NIST SP 800-38D"
    Program bir dosyayı AES-256-GCM ile şifreliyor; çıktı `[12 bayt nonce][şifreli metin][16 bayt etiket]` biçiminde.
    Çözerken etiket doğrulanıyor. Sonra şifreli metnin bir baytını, ardından yalnız etiketin bir baytını değiştirip
    çözmenin **reddedildiğini** görüyoruz.

Şifreleme ve çözmenin özü (kripto çağrıları ortak `cen429_kripto.h` başlığından gelir; Linux'ta OpenSSL EVP, Windows'ta
BCrypt):

```c title="aesgcm.c (özet)"
/* Şifrele: cik = [nonce][şifreli metin][etiket] */
kripto_rastgele(nonce, 12);                 /* her mesaja yeni nonce */
memcpy(cik, nonce, 12);
kripto_gcm_sifrele(anahtar, nonce, 12, NULL, 0,
                   duz, duz_boy, cik + 12, etiket);
memcpy(cik + 12 + duz_boy, etiket, 16);

/* Çöz: etiket doğrulanır; tutmazsa ok == 0 */
int ok = kripto_gcm_coz(anahtar, nonce, 12, NULL, 0,
                        sc, sc_boy, etiket, duz);
if (!ok) { /* REDDET: veri kurcalanmış ya da yanlış anahtar */ }
```

Çalıştırın (Windows'ta `.\demo.ps1`):

```bash
cd code/week-03/01-aes-gcm-dosya
sh demo.sh
```

WSL'de alınan **gerçek çıktı** (kısaltılmış):

```text title="sh demo.sh — çıktı"
ADIM 2 - Sifrele
Sifrelendi: cikti/gizli.txt -> cikti/gizli.enc
   (53 bayt sifreli metin + 12 nonce + 16 etiket)
Sifreli dosyanin ilk baytlari (nonce + sifreli metin):
   000000 74 15 41 da 38 0b 86 1e 92 2f 42 eb 1c ac 49 54
   000010 07 2b 38 e2 3a e4 cd bb fb 7f fb 1c e5 ec a5 36

ADIM 3 - Dogru sekilde coz (etiket tutar)
Cozuldu ve DOGRULANDI: ... -> cikti/cozulen.txt (53 bayt)
   IBAN: TR00 0000 0000 0000 0000 0000 00
   Bakiye: 12345

ADIM 4 - Saldiri: sifreli metnin 20. baytini degistir
DOGRULAMA BASARISIZ: etiket tutmadi, veri kurcalanmis ya da
yanlis anahtar. Cozme REDDEDILDI.   (cikis kodu 2)

ADIM 5 - Saldiri: yalniz ETIKETin son baytini degistir
DOGRULAMA BASARISIZ: ... Cozme REDDEDILDI.   (cikis kodu 2)
```

Satır satır ne oldu:

- **ADIM 2:** Rastgele bir 12 baytlık nonce üretildi ve dosyanın başına yazıldı. Nonce **gizli değildir** (dosyada açık
  durur); yalnız **benzersiz** olması gerekir.
- **ADIM 3:** Aynı anahtar ve nonce ile çözüldü, etiket tuttu, düz metin geri geldi.
- **ADIM 4:** Şifreli metnin 20. baytını bir XOR ile değiştirdik. GCM etiketi bütün şifreli metnin üzerinde
  hesaplandığı için **tek bayt bile** etiketi bozar; çözme reddedildi (çıkış kodu 2).
- **ADIM 5:** Bu kez veriye değil **yalnız etikete** dokunduk; yine reddedildi. Etiket, veriyle birlikte anahtarın da
  fonksiyonudur; saldırgan doğru etiketi anahtar olmadan üretemez.

!!! success "Kural"
    Bir şeyi şifreliyorsanız **AEAD kullanın** (AES-GCM ya da ChaCha20-Poly1305). Her mesaja **benzersiz nonce** verin.
    Etiketi **her zaman doğrulayın** ve doğrulama başarısızsa **hiçbir çıktı üretmeyin** (fail-closed). Bütünlüğü ayrı
    bir adıma bırakmayın.

!!! note "Sahada nasıl uygulanır?"
    Mobil ödeme kütüphanesinde yerel veritabanındaki her hassas alan ve sunucuya giden her mesaj AEAD ile korunur.
    "İlişkili veri" (AAD) alanına şifrelenmesi gerekmeyen ama **bağlanması** gereken bilgiler (sürüm no, kayıt kimliği,
    kart şeması etiketi) konur; böylece bir kaydın şifreli gövdesi başka bir bağlama **taşınamaz**.

!!! question "Değerlendirici nasıl test eder?"
    Bağımsız bir değerlendirici şifreli dosyada/DB'de bir baytı değiştirir ve uygulamanın **sessizce yanlış veri
    döndürmediğini, açıkça reddettiğini** doğrular. Ayrıca aynı düz metnin iki kez şifrelendiğinde **farklı** şifreli
    metin verdiğini (nonce'un tekrar etmediğini) kontrol eder.

!!! warning "Sık hatalar ve kontrol listesi"
    - [ ] Nonce her mesajda benzersiz mi? (Sabit nonce = felaket, bkz. Demo 2)
    - [ ] Etiket saklanıyor ve çözerken doğrulanıyor mu?
    - [ ] Doğrulama başarısızsa çıktı üretmeden mi çıkılıyor?
    - [ ] Anahtar koda gömülü değil, güvenli bir kaynaktan mı geliyor?
    - [ ] AES-CBC/CTR'yi tek başına (MAC'siz) kullanmıyorsunuz, değil mi?

---

## 3. Rastgele sayılar: kriptografinin görünmez temeli

Şimdiye kadar konuştuğumuz her şey (anahtar, IV, nonce, tuz, oturum kimliği) tek bir varsayıma dayanır: bu değerler
**tahmin edilemez**. Dünyanın en iyi şifreleme algoritması, anahtarı tahmin edilebilir bir üreteçle oluşturulmuşsa
hiçbir şey korumaz. Kitabın 11. bölümü baştan sona bu konuya ayrılmıştır; burada bugün geçerli olan kısmını adım
adım işleyeceğiz.

### Üç tür "rastgele"

| Tür | Nasıl üretilir? | Tahmin edilebilir mi? | Nerede kullanılır? |
| --- | --- | --- | --- |
| **İstatistiksel sözde rastgele** | `rand()`, `std::mt19937`, Java `Random` | **Evet**: birkaç çıktıdan iç durum hesaplanabilir | Oyun, simülasyon, test verisi |
| **Kriptografik sözde rastgele (CSPRNG)** | İşletim sisteminin üreteci: `getrandom`, `BCryptGenRandom`, OpenSSL `RAND_bytes` | Hayır (tohum gizli kaldıkça) | Anahtar, IV, nonce, tuz, belirteç |
| **Gerçek rastgele (entropi kaynağı)** | Donanım gürültüsü, zamanlama belirsizliği | Hayır | CSPRNG'yi **tohumlamak** için |

Kural basittir: **güvenlikle ilgili her rastgele değer CSPRNG'den gelir.** `rand()` ve `mt19937` istatistiksel
olarak "rastgele görünür", ama güvenlik açısından tamamen tahmin edilebilirdir. Mersenne Twister'ın 624 ardışık
çıktısını gören biri, sonraki bütün çıktıları hesaplayabilir.

### Hata 1: zamanla tohumlamak

```c title="Hatalı: saniye cinsinden zaman = tahmin edilebilir tohum"
srand(time(NULL));
unsigned char anahtar[16];
for (int i = 0; i < 16; i++)
    anahtar[i] = rand() & 0xFF;
```

Saldırgan anahtarın hangi gün üretildiğini biliyorsa, olası tohum sayısı bir günde yalnız 86.400'dür. Bir dizüstü
bilgisayar bunların hepsini saniyeler içinde dener. `rand()`'ın kendi iç durumu da küçüktür; tohum bilinirse bütün
dizi bilinir.

### Hata 2: entropiyi yanlışlıkla silmek

!!! example "Debian OpenSSL felaketi (2008)"
    Bir dağıtım paketleyicisi, bellek denetim aracının verdiği bir uyarıyı susturmak için OpenSSL'in rastgele sayı
    havuzuna entropi ekleyen iki satırı kaldırdı. Sonuç: iki yıl boyunca o dağıtımda üretilen SSH ve SSL anahtarlarının
    tek entropi kaynağı **süreç kimliği** (en fazla 32.768 değer) oldu. Her anahtar türü ve boyu için olası anahtar
    sayısı birkaç on bine düştü; saldırganlar hepsini önceden üretip listeledi (CVE-2008-0166). Ders: kriptografik
    koda **anlamadan dokunmayın** ve rastgele üretecin çıktısını istatistiksel olarak test etmek, tahmin
    edilemezliğini kanıtlamaz.

### Doğru yol: işletim sisteminin üreteci

=== "Linux"

    ```c
    #include <sys/random.h>
    #include <errno.h>

    int rastgele_bayt(void *tampon, size_t n)
    {
        unsigned char *p = tampon;
        while (n > 0) {
            ssize_t r = getrandom(p, n, 0);    /* havuz hazır olana kadar bekler */
            if (r < 0) {
                if (errno == EINTR) continue;
                return -1;
            }
            p += r; n -= (size_t)r;
        }
        return 0;
    }
    ```

    `getrandom` (Linux 3.17+, glibc 2.25+), çekirdeğin CSPRNG'sinden okur ve açılışta havuz yeterince
    tohumlanmadıysa **bekler**. Eski yöntem olan `/dev/urandom` dosyasını açmak da güvenlidir, ama dosya
    tanıtıcıları tükenmiş ya da `chroot` içinde dosya yoksa başarısız olabilir. `/dev/random`'ı kullanmak için
    bugün bir neden yoktur.

=== "Windows"

    ```c
    #include <windows.h>
    #include <bcrypt.h>
    #pragma comment(lib, "bcrypt.lib")

    int rastgele_bayt(void *tampon, size_t n)
    {
        NTSTATUS s = BCryptGenRandom(NULL, (PUCHAR)tampon, (ULONG)n,
                                     BCRYPT_USE_SYSTEM_PREFERRED_RNG);
        return BCRYPT_SUCCESS(s) ? 0 : -1;
    }
    ```

    `BCryptGenRandom`, kitabın Tarif 11.4'te anlattığı eski `CryptGenRandom`'ın yerini almıştır. Algoritma
    tanıtıcısı yerine `NULL` ve `BCRYPT_USE_SYSTEM_PREFERRED_RNG` vermek en sade kullanımdır.

=== "OpenSSL (her iki platform)"

    ```c
    #include <openssl/rand.h>
    if (RAND_bytes(tampon, (int)n) != 1) { /* hata: ASLA devam etme */ }
    ```

!!! warning "Dönüş değerini denetleyin"
    Rastgele üreteç **başarısız olabilir**. Dönüş değeri denetlenmezse, tampon ilklendirilmemiş (ya da sıfır) kalır
    ve program "rastgele" sandığı sabit bir anahtarla çalışmaya devam eder. Hata durumunda tek doğru davranış,
    işlemi durdurmaktır.

### Hata 3: aralığa indirgerken sapma (modulo bias)

Bir zar atmak için `r % 6` yazmak masum görünür. Ama `r` 0–255 arasında tekdüze ise, 256 sayısı 6'ya tam
bölünmediği için 0–3 değerleri 43'er kez, 4–5 değerleri 42'şer kez çıkar. Zar için önemsiz; ama rastgele bir
parola ya da tek kullanımlık kod üretirken bazı karakterlerin daha sık çıkması tahmin edilebilirliği artırır.
Doğru yöntem **reddetmedir** (Tarif 11.11):

```c title="[0, ust) aralığında sapmasız rastgele tamsayı"
#include <stdint.h>

uint32_t aralikta_rastgele(uint32_t ust)
{
    uint32_t sinir = (uint32_t)(-ust) % ust;   /* 2^32 mod ust: bu kadar değer "fazla" */
    uint32_t r;
    do {
        rastgele_bayt(&r, sizeof r);
    } while (r < sinir);                        /* fazlalığı at, yeniden çek */
    return r % ust;
}
```

Fikir: 2³² değerin, `ust`'e tam bölünen en büyük kısmını kullanıp kalanı atmak. Böylece her sonuç tam olarak aynı
sayıda girdiden gelir.

### Rastgele değerleri nerede kullanıyoruz? Bir kontrol listesi

| Değer | Boyut | Gizli mi? | Benzersiz mi? | Not |
| --- | --- | --- | --- | --- |
| Simetrik anahtar | 16–32 bayt | **Evet** | Evet | CSPRNG'den ya da KDF'den |
| GCM nonce | 12 bayt | Hayır | **Evet** (aynı anahtarla asla tekrar etmemeli) | Rastgele üretiliyorsa bir anahtarla en fazla ~2³² mesaj |
| CBC IV | 16 bayt | Hayır | Evet | **Tahmin edilemez** olmalı |
| Parola tuzu | ≥ 16 bayt | Hayır | Evet | Kullanıcı başına |
| Oturum belirteci | ≥ 16 bayt | **Evet** | Evet | Tahmin edilirse oturum çalınır |
| Tek kullanımlık kod (OTP) | 6–8 hane | Evet | — | Sapmasız aralık üretimi + deneme sınırı |

!!! info "Rastgele nonce mu, sayaç mı?"
    GCM'de 12 baytlık nonce'u rastgele üretmek pratiktir, ama doğum günü olasılığı nedeniyle aynı anahtarla
    çok sayıda mesaj şifrelenecekse (NIST SP 800-38D'nin önerisi: rastgele nonce ile en fazla 2³² mesaj) ya anahtar
    sık yenilenir ya da nonce bir **sayaç** olarak üretilir. Sayaç kullanılıyorsa, sayacın cihaz yeniden
    başladığında sıfırlanmaması (kalıcı saklanması) gerekir. Bir sonraki bölümde göreceğimiz nonce tekrarı
    felaketi tam olarak bu noktada yaşanır.

!!! question "Değerlendirici nasıl test eder?"
    Kaynak kodda `rand`, `srand`, `random`, `mt19937`, `java.util.Random` ve `Math.random` çağrılarını arar;
    güvenlikle ilgili bir değerin bunlardan gelip gelmediğine bakar. Rastgele üretecin dönüş değerinin denetlenip
    denetlenmediğini ve aralığa indirgemenin sapmasız yapılıp yapılmadığını inceler. Mobil platformlarda
    rastgele üretecin **kancalanabilir** olup olmadığını (ör. sabit değer döndürecek şekilde değiştirilebilir mi)
    sorar.

!!! note "Sahada nasıl uygulanır?"
    Hassas bir kütüphanenin kılavuzunda rastgele sayıların **nerede kullanıldığı ve nerede kullanılmadığı** ayrıca
    yazılır: ödeme verisi için istemcide rastgele sayı üretilmez (değerler sunucudan gelir), Java tarafında
    platformun güvenli üreteci kullanılır, native tarafta rastgelelik yalnız bellek doldurmada kullanılır. Böylece
    değerlendirici, rastgele üretecin zayıflamasının hangi varlığı etkileyeceğini tek bakışta görür.

---

## 4. Kripto API'lerini doğru kullanmak: adım adım AES-GCM

Demo 1'de AES-256-GCM ile bir dosyayı şifreledik ve kurcalamayı yakaladık. Demo, işi `code/common/cen429_kripto.h`
içindeki yardımcı fonksiyonlara bıraktı. Bu bölümde o fonksiyonların **içini** açıyoruz: OpenSSL'in EVP arayüzü ve
Windows'un CNG (BCrypt) arayüzüyle AES-GCM'yi adım adım yazacağız. Amaç, bir kripto kütüphanesini kullanırken
nerede hata yapılabileceğini görmektir. Kural hâlâ geçerlidir: **kendi algoritmanızı yazmazsınız**, ama hazır
algoritmayı **doğru çağırmak** da bir beceridir.

### AEAD'in dört girdisi ve iki çıktısı

```text
 anahtar (32 B, gizli) ─┐
 nonce   (12 B, benzersiz) ─┤
 AAD     (açık ama korunan başlık) ─┼──▶ [ AES-256-GCM ] ──▶ şifreli metin (n B)
 açık metin (n B) ──────┘                                 └─▶ etiket (16 B)
```

**AAD** (ek doğrulanmış veri), şifrelenmeyen ama değiştirilirse fark edilmesi gereken bilgidir: dosya başlığı,
sürüm numarası, kayıt kimliği. 1. haftadaki parola kasası örneğinde türetme parametrelerini AAD yapmıştık; biri
yineleme sayısını değiştirirse etiket tutmaz.

### OpenSSL EVP ile şifreleme

```c title="aes_gcm.c — şifreleme (OpenSSL 1.1.1 / 3.x)"
#include <openssl/evp.h>

/* Başarıda şifreli metin uzunluğunu, hatada -1 döndürür. */
int aes_gcm_sifrele(const unsigned char anahtar[32], const unsigned char nonce[12],
                    const unsigned char *aad, int aad_n,
                    const unsigned char *acik, int n,
                    unsigned char *sifreli, unsigned char etiket[16])
{
    EVP_CIPHER_CTX *ctx = EVP_CIPHER_CTX_new();
    int yazilan, toplam = -1;
    if (ctx == NULL) return -1;

    if (EVP_EncryptInit_ex(ctx, EVP_aes_256_gcm(), NULL, NULL, NULL) != 1) goto son;   /* 1 */
    if (EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_SET_IVLEN, 12, NULL) != 1) goto son;     /* 2 */
    if (EVP_EncryptInit_ex(ctx, NULL, NULL, anahtar, nonce) != 1) goto son;            /* 3 */
    if (aad_n > 0 && EVP_EncryptUpdate(ctx, NULL, &yazilan, aad, aad_n) != 1) goto son; /* 4 */
    if (EVP_EncryptUpdate(ctx, sifreli, &yazilan, acik, n) != 1) goto son;             /* 5 */
    toplam = yazilan;
    if (EVP_EncryptFinal_ex(ctx, sifreli + toplam, &yazilan) != 1) { toplam = -1; goto son; } /* 6 */
    toplam += yazilan;
    if (EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_GET_TAG, 16, etiket) != 1) toplam = -1; /* 7 */
son:
    EVP_CIPHER_CTX_free(ctx);     /* bağlamdaki anahtar malzemesini de temizler */
    return toplam;
}
```

Adımlar sırasıyla:

1. Algoritmayı seç; anahtarı ve nonce'u **henüz verme**.
2. Nonce uzunluğunu ayarla (GCM için önerilen 12 bayt; varsayılan da budur ama açık yazmak iyidir).
3. Anahtarı ve nonce'u ver.
4. AAD'yi ver: çıktı tamponu `NULL`'dır, çünkü AAD şifrelenmez, yalnız etikete katılır.
5. Açık metni şifrele. Büyük veride bu adım parça parça tekrarlanabilir.
6. Bitir. GCM akış kipinde çalıştığı için dolgu yoktur; bu çağrı genellikle 0 bayt yazar, ama **çağrılması
   zorunludur**: etiket burada hesaplanır.
7. Etiketi al ve şifreli metinle birlikte sakla.

Her çağrının dönüş değeri denetleniyor ve tek bir çıkış noktasında (`son:`) bağlam serbest bırakılıyor. C'de
kaynak sızıntısını önlemenin en okunaklı yolu bu `goto` kalıbıdır.

### Çözme: etiket doğrulanmadan açık metne dokunma

```c title="aes_gcm.c — çözme"
/* Başarıda açık metin uzunluğunu; etiket tutmazsa ya da hata olursa -1 döndürür. */
int aes_gcm_coz(const unsigned char anahtar[32], const unsigned char nonce[12],
                const unsigned char *aad, int aad_n,
                const unsigned char *sifreli, int n,
                const unsigned char etiket[16], unsigned char *acik)
{
    EVP_CIPHER_CTX *ctx = EVP_CIPHER_CTX_new();
    int yazilan, toplam = -1;
    if (ctx == NULL) return -1;

    if (EVP_DecryptInit_ex(ctx, EVP_aes_256_gcm(), NULL, NULL, NULL) != 1) goto son;
    if (EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_SET_IVLEN, 12, NULL) != 1) goto son;
    if (EVP_DecryptInit_ex(ctx, NULL, NULL, anahtar, nonce) != 1) goto son;
    if (aad_n > 0 && EVP_DecryptUpdate(ctx, NULL, &yazilan, aad, aad_n) != 1) goto son;
    if (EVP_DecryptUpdate(ctx, acik, &yazilan, sifreli, n) != 1) goto son;
    toplam = yazilan;
    /* Beklenen etiketi Final'dan ÖNCE ver */
    if (EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_SET_TAG, 16, (void *)etiket) != 1) { toplam = -1; goto son; }
    if (EVP_DecryptFinal_ex(ctx, acik + toplam, &yazilan) != 1) {
        OPENSSL_cleanse(acik, (size_t)n);     /* etiket tutmadı: yarı çözülmüş veriyi sil */
        toplam = -1;
        goto son;
    }
    toplam += yazilan;
son:
    EVP_CIPHER_CTX_free(ctx);
    return toplam;
}
```

!!! danger "En sık yapılan AEAD hatası"
    `EVP_DecryptUpdate` çağrısı açık metni **etiket doğrulanmadan önce** tampona yazar. Etiket `EVP_DecryptFinal_ex`
    içinde doğrulanır. Bir program Final'ın dönüş değerine bakmadan tampondaki veriyi kullanırsa, kurcalanmış veriyi
    doğrulanmış sanar. Kural: **Final başarılı olmadan açık metin yok sayılır ve silinir.**

### Windows CNG ile aynı iş

=== "Şifreleme"

    ```c
    #include <windows.h>
    #include <bcrypt.h>

    int aes_gcm_sifrele_cng(const UCHAR anahtar[32], const UCHAR nonce[12],
                            UCHAR *aad, ULONG aad_n, const UCHAR *acik, ULONG n,
                            UCHAR *sifreli, UCHAR etiket[16])
    {
        BCRYPT_ALG_HANDLE alg = NULL;
        BCRYPT_KEY_HANDLE key = NULL;
        BCRYPT_AUTHENTICATED_CIPHER_MODE_INFO bilgi;
        ULONG yazilan = 0;
        int sonuc = -1;

        if (!BCRYPT_SUCCESS(BCryptOpenAlgorithmProvider(&alg, BCRYPT_AES_ALGORITHM, NULL, 0))) goto son;
        if (!BCRYPT_SUCCESS(BCryptSetProperty(alg, BCRYPT_CHAINING_MODE,
                (PUCHAR)BCRYPT_CHAIN_MODE_GCM, sizeof(BCRYPT_CHAIN_MODE_GCM), 0))) goto son;
        if (!BCRYPT_SUCCESS(BCryptGenerateSymmetricKey(alg, &key, NULL, 0,
                (PUCHAR)anahtar, 32, 0))) goto son;

        BCRYPT_INIT_AUTH_MODE_INFO(bilgi);
        bilgi.pbNonce = (PUCHAR)nonce; bilgi.cbNonce = 12;
        bilgi.pbAuthData = aad;        bilgi.cbAuthData = aad_n;
        bilgi.pbTag = etiket;          bilgi.cbTag = 16;

        if (BCRYPT_SUCCESS(BCryptEncrypt(key, (PUCHAR)acik, n, &bilgi, NULL, 0,
                                         sifreli, n, &yazilan, 0)))
            sonuc = (int)yazilan;
    son:
        if (key) BCryptDestroyKey(key);
        if (alg) BCryptCloseAlgorithmProvider(alg, 0);
        return sonuc;
    }
    ```

=== "Çözme"

    ```c
    /* Aynı hazırlık; bilgi.pbTag beklenen etiketi gösterir. */
    NTSTATUS s = BCryptDecrypt(key, (PUCHAR)sifreli, n, &bilgi, NULL, 0,
                               acik, n, &yazilan, 0);
    if (s == STATUS_AUTH_TAG_MISMATCH) {      /* 0xC000A002: kurcalama */
        SecureZeroMemory(acik, n);
        return -1;
    }
    ```

İki arayüz farklı görünse de adımlar aynıdır: algoritma ve kip seçimi, anahtar nesnesi, nonce + AAD + etiket, tek
çağrıda işlem, kaynakların serbest bırakılması. CNG'nin bir avantajı, etiketin uyuşmamasını ayrı bir durum koduyla
bildirmesidir.

### Sabit zamanlı karşılaştırma

Etiketi ya da bir MAC'i elle karşılaştırmanız gerekirse (ör. HMAC ile imzalanmış bir mesajda), `memcmp` kullanmayın.
`memcmp` ilk farklı baytta durur; karşılaştırmanın süresi, kaç baytın doğru olduğunu **sızdırır**. Saldırgan etiketi
bayt bayt tahmin edip süreyi ölçerek doğru değere ulaşabilir (zamanlama saldırısı).

```c title="Sabit zamanlı karşılaştırma"
int sabit_zamanli_esit(const unsigned char *a, const unsigned char *b, size_t n)
{
    unsigned char fark = 0;
    for (size_t i = 0; i < n; i++)
        fark |= a[i] ^ b[i];         /* her baytı mutlaka dolaş */
    return fark == 0;
}
```

Hazır karşılıkları: OpenSSL `CRYPTO_memcmp`, Linux çekirdeğinde `crypto_memneq`, libsodium `sodium_memcmp`.

### Kripto kütüphanesi kullanırken kontrol listesi

- [ ] Her çağrının dönüş değeri denetleniyor; hata durumunda işlem **durduruluyor**.
- [ ] Nonce her şifrelemede **yeni** (rastgele ya da kalıcı sayaç).
- [ ] Etiket, açık metin kullanılmadan **önce** doğrulanıyor; başarısızlıkta açık metin siliniyor.
- [ ] Etiket ve MAC karşılaştırmaları **sabit zamanlı**.
- [ ] Anahtar tamponları iş bitince siliniyor; bağlam nesneleri serbest bırakılıyor.
- [ ] Hata iletileri saldırgana ayrıntı vermiyor: "etiket hatası" ile "dolgu hatası" ayrı iletiler olursa, bu fark
      bir **kâhin** olarak kullanılabilir (CBC dolgu kâhini saldırıları buradan doğmuştur).
- [ ] Eskimiş algoritmalar yok: DES/3DES, RC4, MD5, SHA-1 (imzada), ECB.

!!! note "Sahada nasıl uygulanır?"
    Gerçek ürünlerin kılavuzlarında bir **algoritma envanteri** bulunur: kullanılan her algoritma (AES-CBC/CTR,
    HMAC, SHA-256, TLS, ödeme şemalarının MAC'i), hangi amaçla, hangi anahtar boyuyla ve hangi standarda dayanarak
    kullanıldığı tablo halinde yazılır. Bu envanter aynı zamanda **eleştirel bir okuma** için iyi bir malzemedir:
    birkaç yıl önce yazılmış envanterlerde SHA-1 ya da ayrı MAC'li CBC gibi bugün önerilmeyen seçimler görülür.
    Bugün yazılan bir envanterde bunların yerini SHA-256 ve AEAD almalıdır.

!!! question "Değerlendirici nasıl test eder?"
    Algoritma envanterini kaynak kodla karşılaştırır: envanterde olmayan bir algoritma kullanılıyor mu? Nonce
    üretimini ve tekrarını inceler; şifreli veriyi bir bit değiştirerek geri verip uygulamanın bunu **reddettiğini**
    ve reddederken ayrıntılı hata vermediğini doğrular. MAC karşılaştırmasında `memcmp` arar.

---

## 5. IV/nonce ve tuz: aynı anahtarı tekrar kullanmak

Üç kavram sürekli karıştırılır. Üçü de **gizli değildir**, ama güvenlik doğru kullanımlarına bağlıdır (kitap **tarif
4.9**):

| Kavram | Nerede? | Kural | Bozulursa |
| --- | --- | --- | --- |
| **Tuz (salt)** | Paroladan anahtar türetmede | Her parola/kayıt için **rastgele** | Önhesaplı tablolar (rainbow) işe yarar |
| **IV** (başlangıç vektörü) | CBC gibi kiplerde | **Rastgele**, öngörülemez | İlk blok sızar (BEAST türü) |
| **Nonce** (bir kez kullanılan sayı) | CTR/GCM gibi kiplerde | Aynı anahtarla **asla tekrar etmesin** | Anahtar akışı sızar (aşağıda) |

### 5.1 Nonce yeniden kullanımı neden felakettir?

GCM ve CTR, anahtardan ve nonce'dan bir **anahtar akışı** üretip düz metinle XOR'lar: `C = P ⊕ AA(anahtar, nonce)`.
Aynı anahtar **ve** aynı nonce ile iki mesaj şifrelenirse iki mesajda da **aynı** anahtar akışı kullanılır:

```text
C1 = P1 ⊕ AA        C2 = P2 ⊕ AA
C1 ⊕ C2 = (P1 ⊕ AA) ⊕ (P2 ⊕ AA) = P1 ⊕ P2
```

Anahtar akışı yok olur; saldırgan iki **düz metnin XOR'unu** ele geçirir. Bir mesajı biliyorsa (ya da tahmin ederse)
diğerini tamamen çözer.

### Demo 2 — Nonce tekrarının iki düz metnin XOR'unu sızdırması

!!! info "Demo 2 · `code/week-03/02-nonce-tekrari` · nonce yeniden kullanımı"
    Program iki farklı mesajı önce **aynı** nonce ile, sonra **farklı** nonce ile AES-256-GCM ile şifreliyor ve
    `C1 ⊕ C2` ile `P1 ⊕ P2`'yi karşılaştırıyor.

```text title="sh demo.sh — gerçek çıktı (hex kısaltıldı)"
Duz metin 1: "Saldiri safagi 06:00'da baslasin!!"
Duz metin 2: "Toplam bakiye 45000 TL, sifre 1234"
==============================================================
KOTU DURUM - iki mesajda da AYNI nonce:
  C1 xor C2 = 070e1c08081f4942120a0f18024914050 ... 5c1215
  P1 xor P2 = 070e1c08081f4942120a0f18024914050 ... 5c1215
  ==> C1 xor C2 == P1 xor P2 : anahtar akisi SIZDI!
  Saldirgan P1'i biliyorsa P2 = (C1 xor C2) xor P1 =
     "Toplam bakiye 45000 TL, sifre 1234"
==============================================================
IYI DURUM - her mesaja FARKLI nonce:
  C1 xor C2 = 21158fbd64978ae63835b80d1f98c02d2 ... 8385c5af
  P1 xor P2 = 070e1c08081f4942120a0f18024914050 ... 5c1215
  ==> C1 xor C2 != P1 xor P2 : sizinti YOK.
```

Kötü durumda `C1 ⊕ C2` ile `P1 ⊕ P2` **birebir aynı** çıktı: anahtar akışı iptal oldu. Program bir mesajı bilen
saldırganın diğerini `(C1 ⊕ C2) ⊕ P1` ile tamamen çözdüğünü de gösterdi. Farklı nonce'ta ilişki kayboldu.

!!! quote "Gerçek olaylar"
    Nonce/IV tekrarı efsanevi hatalardır: WEP'in kısa IV'i (kablosuz ağ şifrelemesinin çöküşü), Sony PlayStation 3'ün
    ECDSA imzasında **aynı rastgele değeri** iki kez kullanması (özel anahtarın çıkarılması) ve çeşitli TLS
    kütüphanelerinde GCM nonce tekrarı uyarıları. Kural nettir: **nonce asla tekrar etmesin.**

!!! success "Kural"
    Nonce'u ya **rastgele** (12 bayt, çakışma olasılığı ihmal edilebilir) ya da **sayaç** olarak üretin ve **kalıcı
    olarak** takip edin. Aynı anahtarla aynı nonce'u iki kez asla kullanmayın. Çok fazla mesaj şifreliyorsanız
    (2³² üstü) anahtarı yenileyin ya da XChaCha20 gibi geniş nonce'lu bir yapı seçin.

!!! note "Sahada nasıl uygulanır? / Değerlendirici nasıl test eder?"
    Uzun ömürlü bir anahtarla milyonlarca mesaj şifreleyen sistemlerde (ör. sunucu-istemci oturumu) nonce yönetimi bir
    tasarım kararıdır: her mesaja artan sayaç + oturum başına yeni anahtar. Değerlendirici, kodda nonce'un nasıl
    üretildiğine bakar (sabit mi, sayaç kalıcı mı, rastgele mi) ve iki şifreli çıktının nonce alanlarının **asla aynı
    olmadığını** doğrular. Sabit nonce ya da yeniden başlatınca sıfırlanan sayaç doğrudan bulgudur (CWE-323).

!!! warning "Sık hatalar ve kontrol listesi"
    - [ ] Nonce kalıcı mı takip ediliyor (program yeniden başlayınca sıfırlanmıyor)?
    - [ ] Rastgele nonce kullanıyorsanız 96 bit yeterli mesaj sayısı için mi?
    - [ ] Aynı `(anahtar, nonce)` çifti iki mesajda kullanılamaz, doğru mu?

### 5.2 ECB deseni sızdırır

Nonce/IV kullanmayan bir kip olan **ECB** (Electronic Codebook), her 16 baytlık bloğu **bağımsız** şifreler. Aynı düz
metin bloğu **her zaman** aynı şifreli bloğu verir; bu yüzden verideki tekrar eden desenler şifreli metinde de görünür.

### Demo 3 — ECB "pengueni": desen sızıntısı

!!! info "Demo 3 · `code/week-03/03-ecb-desen` · ECB desen sızıntısı"
    İki renkli bir "resim" kuruyoruz (her piksel tam bir 16 baytlık blok). AES-128-**ECB** ile şifrelenince şekil hâlâ
    okunur kalır; AES-256-**GCM** (CTR tabanlı) ile şifrelenince desen kaybolur.

```text title="sh demo.sh — gerçek çıktı"
Orijinal resim (duz metin):
  ################################
  #  ##    ####    ####    ##    #
  ...  (429 rakamlari)  ...
  ################################
==============================================================
AES-128-ECB ile sifreli (her blok ilk baytina gore):
  ================================
  =##==####====####====####==####=
  ...  ayni sekil hala GORUNUYOR ...
  ================================
  ==> Sekil hala GORUNUYOR: ECB deseni sizdirir.
==============================================================
AES-256-GCM (CTR tabanli) ile sifreli, ayni resim:
  : -..--+%%*-:**% . #*#+*.:+* :..
  *.#*##:*%+###:#-*%==*#-+=%:.=***
  ...  desen kayboldu, gurultu ...
  ==> Desen kayboldu: GCM/CTR her blogu farkli sifreler.
```

ECB çıktısında yalnız **iki** karakter var (arka plan bloğu → bir şifreli blok, şekil bloğu → başka bir şifreli blok);
şekil aynen okunuyor. Bu, ünlü "ECB pengueni" örneğinin ASCII hâlidir. GCM'de her blok konuma bağlı farklı bir anahtar
akışıyla şifrelendiği için çıktı gürültüdür.

!!! success "Kural"
    **ECB kullanmayın.** Şifreleme için AEAD (GCM, ChaCha20-Poly1305); disk için XTS-AES; asla desen sızdıran ECB
    değil. "Her blok bağımsız şifrelensin" cazip görünür ama gizliliği bozar.

!!! note "Sahada nasıl uygulanır? / Değerlendirici testi"
    Kod incelemesinde `ECB` geçen her yer bir bulgudur (kitap **tarif 5.x** eski `EVP_*_ecb` çağrılarını içerir;
    güncellenmelidir). Değerlendirici, aynı düz metnin şifreli metninde tekrar eden 16 baytlık bloklar arayarak ECB'yi
    otomatik yakalayabilir.

!!! warning "Sık hatalar ve kontrol listesi"
    - [ ] Kodda `ecb` geçen hiçbir şifreleme kipi yok, değil mi?
    - [ ] Görüntü/yapılandırılmış veri şifrelerken desen sızıntısını düşündünüz mü?
    - [ ] Şifreli çıktı, aynı girdi için her seferinde farklı mı (nonce/IV sayesinde)?

---

## 6. Paroladan anahtar türetme

Parola doğrudan anahtar olamaz: kısa, düşük entropili ve tahmin edilebilir. Paroladan anahtar türetme fonksiyonu (KDF)
iki iş yapar:

1. **Tuz (salt):** Her kullanıcıya/kayda rastgele tuz eklenir. Aynı parola farklı tuzlarla farklı anahtar verir;
   böylece **önhesaplı tablolar (rainbow table)** işe yaramaz ve iki kullanıcının aynı parolası fark edilmez.
2. **Yavaşlık (maliyet):** KDF bilerek yüzbinlerce tur çalışır; bir parolayı denemek pahalı olur, kaba kuvvet yavaşlar.

| KDF | Maliyet ekseni | Ne zaman? | Standart |
| --- | --- | --- | --- |
| **PBKDF2** | Yalnız CPU (tur sayısı) | Uyumluluk/FIPS gerektiğinde | NIST SP 800-132 |
| **scrypt** | CPU **+ bellek** | Bellek-zor isteniyorsa | RFC 7914 |
| **Argon2id** | CPU + bellek + paralellik | **Yeni sistemlerde birinci tercih** | RFC 9106, OWASP |

!!! info "Kitap tarifi ve güncelleme"
    Kitap paroladan anahtar türetmeyi **tarif 4.10**'da PBKDF2 ile, 10.000 tur önererek anlatır. Bugün bu **çok
    düşüktür**: OWASP (2023) PBKDF2-HMAC-SHA256 için **≥ 600.000 tur** ister; mümkünse **Argon2id** tercih edilir.

### Demo 4 — Tur sayısı, süre ve tuzun önemi

!!! info "Demo 4 · `code/week-03/04-parola-anahtar` · PBKDF2, tuz, maliyet"
    Program aynı paroladan PBKDF2 ile anahtar türetir: aynı tuz → aynı anahtar (tabloya açıklık), farklı tuz → farklı
    anahtar; ve tur sayısı arttıkça geçen süreyi ölçer. WSL'de `argon2` aracı varsa Argon2id karşılaştırması da yapılır.

```text title="sh demo.sh — gerçek çıktı (WSL)"
1) TUZUN ONEMI (tur = 100000)
   tuz A -> anahtar = e1d9214abdcfa793...cad33a816
   tuz A -> anahtar = e1d9214abdcfa793...cad33a816   (ayni)
   tuz B -> anahtar = 89cc5979affa2a62...972e020e   (farkli)
==============================================================
2) TUR SAYISI vs SURE (ayni parola, ayni tuz)
   tur =     1000  ->      0.37 ms
   tur =    10000  ->      3.82 ms
   tur =   100000  ->     39.05 ms
   tur =   600000  ->    209.55 ms
   tur =  2000000  ->    628.42 ms
==============================================================
3) Argon2id ile karsilastirma (argon2 araci varsa)
   $argon2id$v=19$m=65536,t=3,p=1$...   0.112 seconds
```

- **Tuz:** Aynı parola + aynı tuz her seferinde **aynı** anahtarı verdi (bu yüzden tuz sabitse saldırgan bir kez tablo
  kurup herkesi arar). Aynı parola + **farklı** tuz tamamen farklı anahtar verdi.
- **Maliyet:** Tur sayısı 1.000'den 2.000.000'a çıkınca süre ~0,4 ms'den ~628 ms'ye çıktı. Bu doğrudan çarpandır:
  saldırganın her parola denemesi de o kadar pahalılaşır. "Kullanıcı girişinde 200 ms" kabul edilebilir; saldırgan için
  saniyede milyarlarca deneme yerine binlerce deneme demektir.
- **Argon2id:** Ek olarak **bellek** (burada 64 MiB) ister; GPU/ASIC ile paralel kaba kuvveti PBKDF2'den daha çok
  zorlaştırır.

!!! warning "Windows notu"
    Windows demosu (`.\demo.ps1`) aynı PBKDF2 ölçümünü yapar (BCrypt üzerinden); süreler makineye göre değişir. `argon2`
    komut satırı aracı Windows'ta gelmez, bu yüzden Argon2id yalnız açıklanır. Anahtar değerleri iki platformda da
    **aynıdır** (aynı standart, aynı test vektörleri).

!!! success "Kural"
    Parola saklarken **düz metin ya da düz SHA-256 kullanmayın**. Rastgele tuz + yeterli maliyetli bir KDF (Argon2id;
    değilse yüksek turlu PBKDF2 ya da scrypt) kullanın. Tuzu şifreyle birlikte saklayın (gizli olması gerekmez);
    maliyeti donanımınıza göre ayarlayıp yıllar içinde artırın.

!!! question "Değerlendirici nasıl test eder?"
    Değerlendirici tuzun **rastgele ve kayıt başına benzersiz** olduğunu, tur/bellek parametrelerinin güncel öneriye
    uyduğunu ve parolanın türetmeden sonra bellekten silindiğini kontrol eder (bkz. Demo 8).

!!! tip "İleri: biber (pepper)"
    Tuza ek olarak, veritabanında **saklanmayan**, uygulama yapılandırmasında ya da bir donanım güvenlik modülünde
    (HSM) tutulan gizli bir **biber (pepper)** de eklenebilir. Böylece yalnız veritabanı çalınırsa (biber sızmadıkça)
    parola özetleri kaba kuvvete karşı bir kat daha korunur. Tuz gizli değildir; biber gizlidir.

---

## 7. Ana sırdan anahtar türetme, oturum anahtarları ve ileri gizlilik

Uzun ömürlü bir "ana sır" **doğrudan** kullanılmaz. Ondan, her amaç ve her oturum için **ayrı** anahtarlar türetilir.
Araç: **HKDF** (RFC 5869), iki aşamalı bir KDF:

- **Extract:** ana sır + tuz → tekdüze bir ara anahtar (PRK).
- **Expand:** PRK + "info" etiketi → istenen boyda anahtar. Farklı `info` → farklı anahtar.

```mermaid
flowchart TB
    M["Ana sır"] --> EX["HKDF-Extract<br/>(+ tuz)"] --> PRK["PRK"]
    PRK --> E1["Expand info='şifreleme'"] --> K1["Şifreleme anahtarı"]
    PRK --> E2["Expand info='MAC'"] --> K2["MAC anahtarı"]
    PRK --> E3["Expand info='oturum-42'"] --> K3["Oturum-42 anahtarı"]
```

!!! info "Kitap tarifi"
    Kitap **tarif 4.11**'de "tek bir ana sırdan algoritmayla anahtar üretme" ve **4.13**'te anahtar malzemesini güvenli
    yönetme konusunu işler. HKDF bu fikrin standartlaşmış hâlidir. Her türetmenin **benzersiz bir ayırt edici**
    (info/label) içermesi şarttır.

### 7.1 İleri gizlilik (forward secrecy)

Anahtarları bir **tek yönlü zincir** olarak türetirsek — `K0 = ana sır`, `Kᵢ = HKDF(Kᵢ₋₁)` — ve her oturumdan sonra
`Kᵢ₋₁`'i **silersek**, saldırgan bugünkü `Kₙ`'i ele geçirse bile geriye gidip eski `K1..Kₙ₋₁`'i (ve o oturumların
verisini) **hesaplayamaz**. TLS 1.3 bu güvenceyi her oturumda geçici Diffie-Hellman ile sağlar (kitap **tarif
8.20–8.21**).

### Demo 5 — HKDF ile oturum anahtarları ve ileri gizlilik zinciri

!!! info "Demo 5 · `code/week-03/05-hkdf-oturum` · HKDF, oturum anahtarı, ileri gizlilik"

```text title="sh demo.sh — gerçek çıktı"
Tek ana sirdan amaca gore ayri anahtarlar:
  info='...sifreleme...' -> 2b8b46840fa2d1b1...0e577a55
  info='...MAC...'       -> 30a302d19ec9ab8e...c55dfa84
  ^ Ayni sir, farkli info -> farkli anahtar.
==============================================================
ILERI GIZLILIK zinciri: Ki = HKDF(Ki-1), Ki-1 silinir
  K1 (oturum 1) = 0630f63f015d003e
  K2 (oturum 2) = def84847df4d9461
  K3 (oturum 3) = 54b13f0ff3a486ca
  K4 (oturum 4) = 55524a8f5c09652f
  ^ Elimizde yalniz K4 var; zincir tek yonlu oldugu icin
    K4'ten K3, K2, K1 geri hesaplanamaz.
```

Aynı ana sırdan farklı `info` etiketleriyle farklı anahtarlar çıktı; bir amaç için üretilen anahtar başka amaca
kullanılamaz. İleri gizlilik zincirinde her adımda eski anahtar `kripto_temizle` (OPENSSL_cleanse/SecureZeroMemory) ile
silindi; elde yalnız son anahtar kaldı ve tek yönlülük geçmişi korudu.

!!! success "Kural"
    Ana sırdan **amaca ve oturuma göre** ayrı anahtarlar türetin (anahtar ayrımı). Her türetmeye benzersiz bir
    `info`/label koyun. Uzun ömürlü sırdan kısa ömürlü oturum anahtarları üretip **kullanınca silin**; mümkünse geçici
    (ephemeral) DH ile gerçek ileri gizliliği hedefleyin.

!!! note "Sahada nasıl uygulanır?"
    Örnek mimaride sunucuyla anlaşılan bir ana sırdan; şifreleme anahtarı, MAC anahtarı ve her oturum için ayrı bir
    oturum anahtarı HKDF ile türetilir. Anahtar hiyerarşisini (hangi anahtar hangi anahtardan türer, ne kadar yaşar)
    Hafta 10'da ayrıntılı işleyeceğiz; bu hafta ilke şudur: **tek bir anahtarı her işe koşmayın.**

!!! question "Değerlendirici nasıl test eder?"
    Değerlendirici anahtar hiyerarşisi belgesini ister ve her anahtarın **tek bir amacı** olduğunu, oturum anahtarlarının
    kısa ömürlü ve türetilmiş olduğunu, aynı türetilmiş anahtarın iki farklı yerde kullanılmadığını denetler. Ayrıca
    ileri gizliliğin sağlanıp sağlanmadığını (eski anahtarların silinip silinmediğini) sorar.

!!! warning "Sık hatalar ve kontrol listesi"
    - [ ] Her türetmenin benzersiz bir `info`/label'ı var mı?
    - [ ] Şifreleme ve MAC için **ayrı** anahtarlar mı türetiliyor?
    - [ ] Oturum anahtarları kullanımdan sonra siliniyor mu?
    - [ ] Ana sır bellekte gereğinden uzun durmuyor, değil mi?

---

## 8. Dinamik anahtar yönetimi: yaşam döngüsü, hiyerarşi ve yenileme

"Algoritma kırıldı" diye haber yapılan olayların çok küçük bir kısmı gerçekten algoritmanın kırılmasıdır. Büyük
çoğunluk **anahtar yönetimi** hatasıdır: kaynak koda gömülmüş anahtar, hiç değişmeyen anahtar, her işe koşulan tek
anahtar, silinmeyen eski anahtar. Kitap anahtar malzemesinin güvenli yönetimini Tarif 4.13'te kısaca işler; bu
bölümde konuyu sahada kullanılan biçimiyle genişletiyoruz.

### Bir anahtarın hayatı

NIST SP 800-57, bir anahtarın yaşam döngüsünü durumlarla tanımlar. Sade haliyle:

```mermaid
stateDiagram-v2
    [*] --> Uretildi: CSPRNG / KDF
    Uretildi --> Dagitildi: güvenli kanal, sarılı (wrapped)
    Dagitildi --> Etkin: kullanıma alındı
    Etkin --> Askida: şüphe / geçici durdurma
    Askida --> Etkin
    Etkin --> PasifYalnizCozme: kripto-periyot doldu
    PasifYalnizCozme --> Imha: eski veri yeniden şifrelendi
    Etkin --> Ele_gecirildi: sızıntı
    Ele_gecirildi --> Imha: iptal + yeni anahtar
    Imha --> [*]
```

| Aşama | Sorulacak soru | Tipik hata |
| --- | --- | --- |
| **Üretim** | Yeterli entropi var mı? Kim üretiyor (istemci mi, sunucu mu, HSM mi)? | `rand()`, sabit anahtar, istemcide üretilmemesi gereken anahtarı üretmek |
| **Dağıtım** | Anahtar yolda nasıl korunuyor? | Anahtarı düz metin olarak göndermek, yalnız TLS'e güvenmek |
| **Saklama** | Anahtar beklerken nerede, hangi korumayla duruyor? | Kaynak koda ya da yapılandırma dosyasına düz yazmak |
| **Kullanım** | Anahtar yalnız tek bir amaçla mı kullanılıyor? | Aynı anahtarla hem şifreleme hem MAC; aynı anahtarla sınırsız mesaj |
| **Yenileme** | Anahtar ne zaman ve nasıl değişiyor? | Hiç değişmemesi; değiştirince eski verinin okunamaz hale gelmesi |
| **İptal** | Ele geçirildiğinde ne yapılıyor? | İptal mekanizmasının hiç olmaması |
| **İmha** | Bütün kopyaları siliniyor mu? | Yedeklerde, günlüklerde, bellekte kalan kopyalar |

**Kripto-periyot**, bir anahtarın kullanılmasına izin verilen süredir. Süre dolduğunda anahtar yeni veriyi
**şifrelemek** için kullanılmaz, ama eski veriyi **çözmek** için bir süre daha tutulabilir. Kripto-periyodu belirleyen
etkenler: anahtarla korunan verinin miktarı, verinin ne kadar süre gizli kalması gerektiği, anahtarın ne kadar
açıkta durduğu. İstemci cihazında duran bir anahtar, HSM'de duran bir anahtardan çok daha kısa ömürlü olmalıdır.

### Anahtar hiyerarşisi: her işe ayrı anahtar

Tek bir anahtarla her şeyi yapmak yerine, anahtarlar bir **ağaç** halinde düzenlenir. Üstteki anahtarlar az
kullanılır ve en iyi korunan yerde durur; alttakiler sık kullanılır, kısa ömürlüdür ve kaybedildiklerinde zarar
küçüktür.

```mermaid
flowchart TB
    R["Kök / ana anahtar<br/>(HSM'de, neredeyse hiç kullanılmaz)"]
    R --> K1["Anahtar şifreleme anahtarı (KEK)<br/>müşteri ya da cihaz başına"]
    R --> K2["İmza anahtarı<br/>(güncelleme paketleri)"]
    K1 --> D1["Veri anahtarı (DEK)<br/>dosya / kayıt başına"]
    K1 --> S1["Oturum anahtarı<br/>oturum başına, dakikalar"]
    S1 --> T1["Tek kullanımlık anahtar<br/>işlem başına"]
```

İki temel fikir:

1. **Anahtar ayrımı:** Farklı amaçlar için farklı anahtarlar. Şifreleme anahtarı imzalamada, MAC anahtarı
   şifrelemede kullanılmaz. HKDF'nin `info` etiketi bu ayrımı kolaylaştırır (önceki bölüm).
2. **Zararın sınırlanması:** Alt düzeydeki bir anahtarın ele geçirilmesi yalnız o dalı etkiler. Tek kullanımlık bir
   ödeme anahtarı çalınırsa kaybedilen **tek bir işlemdir**.

!!! example "Ödeme sistemlerinden bir hiyerarşi"
    EMV tarzı kart sistemlerinde tipik zincir şöyledir: kart çıkaran kurumun **ana anahtarı** (HSM'de) → kart
    numarası ve sıra numarasından türetilen **kart ana anahtarı** → işlem sayacından türetilen **oturum anahtarı**
    → her ödemede kullanılan **tek kullanımlık anahtar**. Telefonun güvenli elemanını kullanmayan mobil ödeme
    çözümlerinde telefona yalnız zincirin en altındaki, **sınırlı sayıda kullanılabilen** anahtarlar indirilir;
    anahtarlar tükenince sunucudan yenileri istenir (anahtar yenileme / replenishment). Telefon ele geçirilse bile
    saldırganın elinde birkaç işlemlik anahtar vardır ve bunlar sunucuda kolayca iptal edilir.

### Zarflama (envelope encryption)

Büyük miktarda veriyi doğrudan ana anahtarla şifrelemek iki sorun yaratır: ana anahtar sık kullanılır (açıkta kalma
süresi artar) ve anahtar değiştiğinde **bütün veri** yeniden şifrelenmelidir. Zarflama bu iki sorunu çözer:

```text
  veri ──AES-GCM(DEK)──▶ şifreli veri
  DEK  ──AES-KW / AES-GCM(KEK)──▶ sarılmış DEK     (şifreli verinin yanında saklanır)

  KEK değişince: yalnız sarılmış DEK'ler yeniden sarılır; veri olduğu yerde kalır.
```

1. Her dosya ya da kayıt için rastgele bir **veri anahtarı (DEK)** üretilir; veri bununla şifrelenir.
2. DEK, bir **anahtar şifreleme anahtarıyla (KEK)** sarılır (şifrelenir) ve şifreli verinin başlığına yazılır.
3. KEK güvenli bir yerde durur: işletim sisteminin anahtar deposu, TPM, HSM ya da bulut anahtar yönetim hizmeti.
4. KEK yenilendiğinde yalnız küçük DEK'ler yeniden sarılır.

Bulut sağlayıcılarının anahtar yönetim hizmetleri (KMS) ve disk şifreleme sistemleri bu yöntemi kullanır.

### Anahtar sürümü: yenilemeyi mümkün kılan küçük alan

Bir anahtarı yenileyebilmek için, şifreli verinin **hangi anahtarla** şifrelendiğini bilmek gerekir. Bu yüzden
şifreli verinin başlığına bir **anahtar kimliği / sürüm** alanı konur:

```text
 +---------+--------------+-------------+------------------+-----------+
 | biçim   | anahtar_sürüm| nonce (12B) | şifreli metin    | etiket    |
 | 1 bayt  | 4 bayt       |             |                  | (16 B)    |
 +---------+--------------+-------------+------------------+-----------+
   └──────────── AAD (şifrelenmez ama değiştirilemez) ──────┘
```

Okuyucu önce sürüme bakar, o sürümün anahtarını bulur ve çözer. Yeni yazmalar hep en yeni anahtarla yapılır; eski
kayıtlar okundukça (ya da arka planda) yeni anahtarla yeniden şifrelenir. Başlık AAD olduğu için saldırgan sürüm
alanını değiştirip uygulamayı eski, zayıf bir anahtara yönlendiremez.

### Anahtarı nerede saklamalı?

| Seçenek | Platform | Koruma | Not |
| --- | --- | --- | --- |
| Kaynak koda gömülü | Hepsi | **Yok**: `strings` ile bulunur | Asla (zorunlu değilse; zorunluysa gizleme + parçalama, 4. hafta) |
| Yapılandırma dosyası | Hepsi | Dosya izinleri | Yedeklere, depoya sızar |
| Ortam değişkeni | Hepsi | Zayıf | Alt süreçlere, çökme raporlarına sızar |
| DPAPI (`CryptProtectData`) | Windows | Kullanıcı ya da makine hesabına bağlı | Aynı kullanıcıyla çalışan zararlıya karşı korumaz |
| Anahtarlık / Keystore | macOS, iOS, Android | İşletim sistemi, bazen donanım destekli | Mobilde önerilen |
| TPM | Windows, Linux | Donanım; anahtar çıkarılamaz | Anahtar cihaza bağlanır |
| HSM / bulut KMS | Sunucu | Donanım; anahtar HSM'den hiç çıkmaz | Sunucu tarafının standardı |

```c title="Windows DPAPI — bir anahtarı kullanıcı hesabına bağlı olarak sarmak"
#include <windows.h>
#include <dpapi.h>
#pragma comment(lib, "crypt32.lib")

int anahtari_sar(const BYTE *anahtar, DWORD n, DATA_BLOB *cikti)
{
    DATA_BLOB giris = { n, (BYTE *)anahtar };
    /* cikti->pbData, iş bitince LocalFree ile serbest bırakılır */
    return CryptProtectData(&giris, L"kasa-anahtari", NULL, NULL, NULL,
                            CRYPTPROTECT_UI_FORBIDDEN, cikti) ? 0 : -1;
}
```

### Sahadan: kart şeması gereksinimleri ve bir anahtar envanteri

Mobil ödeme uygulamalarının uyması gereken kart şeması güvenlik gereksinimleri, bu bölümde anlattıklarımızı madde
madde ister. İki şemanın (burada **Şema-A** ve **Şema-B**) kripto ve anahtar gereksinimlerinin özeti:

| Gereksinim (özet) | Bu haftadaki karşılığı |
| --- | --- |
| Endüstri standardı algoritmalar ve protokoller kullanılmalı, **güvenli yapılandırılmalı** | Kripto API'lerini doğru kullanmak; TLS'i kodda kurmak |
| Anahtarların gizliliği ve bütünlüğü korunmalı ya da anahtarlar gizlenmeli | Güvenlik kabukları, whitebox (11. hafta) |
| Anahtarlar güvenle **kurulmalı, güncellenmeli** ve iş bitince bellekten ve geçici depolardan **silinmeli** | Yaşam döngüsü; kullanımda veri |
| Her anahtarın **hiyerarşisi, kullanımı ve kripto-periyodu** tanımlı olmalı; anahtar **yalnız tek amacı** için kullanılmalı | Anahtar hiyerarşisi, anahtar ayrımı |
| Yeterli entropili, tahmin edilemez rastgele sayılar kullanılmalı (ör. arka uçtan) | Rastgele sayılar bölümü |
| Rastgele sayı kaynağına yapılan çağrı **kancalanamamalı** | 6. hafta (kanca algılama) |
| Veri şifreleme ve sınırlı kullanım anahtarları, uygulamaya ve cihaza **bağlı, birbirinden farklı** anahtarlarla korunmalı | Cihaz ve sürüm bağlama |

Bu gereksinimleri karşılayan bir kütüphanenin kılavuzu, anahtarları dört gruba ayırır:

| Grup | Nerede üretilir? | Nasıl korunur? |
| --- | --- | --- |
| **Dinamik cihaz anahtarları** (whitebox anahtarları) | Sunucuda | Cihaza bağlı olarak indirilir ve saklanır; kullanımdan hemen önce bağdan çözülür |
| **Dinamik ödeme anahtarları** (sınırlı kullanım anahtarları) | Sunucuda | Cüzdan anahtarının (whitebox) altında indirilir ve aynı anahtarla veritabanında saklanır |
| **Statik cihaz anahtarı** (tek bir tane: dize gizleme anahtarı) | Derleme anında | Kaynak kodda parçalanmış ve gizlenmiş olarak durur |
| **Sunucu sertifikası** | Sertifika otoritesi | Açık anahtarı uygulamada sabitlenir |

Aynı kılavuz iki önemli **olumsuz** beyanda da bulunur: kütüphane hesap parametreleri için **anahtar üretmez** ve ödeme
için istemcide **rastgele sayı üretmez**. Bir değerlendirici için "yapmıyoruz" demek de "yapıyoruz" demek kadar
değerlidir; saldırı yüzeyini daraltır.

### Oturum anahtarları: sahadan bir örnek ve eleştirel okuma

İstemci ile sunucu arasında TLS'in **üstüne** ikinci bir koruma katmanı kurulduğunda, bu katmanın anahtarları oturum
başına türetilir. Sahadan bir tasarımın ana hatları (adlar genelleştirilmiştir):

1. Sunucu 32 baytlık bir **oturum kimliği** üretir, bunu istemciye özgü **yapılandırma anahtarıyla** şifreler ve
   anlık bildirim kanalıyla (ya da istemcinin yeni oturum isteğine yanıt olarak) gönderir.
2. İstemci oturum kimliğini korunan anahtarla (whitebox AES, 11. hafta) çözer.
3. **Kimlik doğrulama kodu:** çözülmüş oturum kimliğinin bir kısmı, cüzdan kimliği ve cihaz parmak izi birlikte
   SHA-256'dan geçirilir. Sunucu aynı değeri kendisi hesaplar; iki taraf da karşısındakinin gerçek olduğunu
   doğrulamış olur.
4. **Oturum anahtarı:** yapılandırma anahtarının özeti bir **ana anahtar** olarak kullanılır; çözülmüş oturum
   kimliği ile bu özetten HMAC yoluyla 16 baytlık bir AES oturum anahtarı türetilir.
5. Mesajlar bu anahtarla **AES-CTR** kipinde şifrelenir ve her mesaja ayrıca 256 bitlik bir MAC eklenir; alıcı
   MAC'i doğrulamadan mesajı kullanmaz.

Bu tasarım derinlemesine savunmanın iyi bir örneğidir: TLS kırılsa bile mesajlar ayrıca şifreli ve bütünlük
korumalıdır; oturum anahtarı her oturumda değişir; kimlik doğrulama kodu cihaza bağlıdır. Bugün aynı tasarım yeniden
yapılsaydı şu iyileştirmeler önerilirdi:

| Tasarımda | Bugün önerilen | Neden? |
| --- | --- | --- |
| AES-CTR + ayrı MAC (elle birleştirme) | Kütüphanenin AEAD kipi: AES-GCM, AES-CCM ya da ChaCha20-Poly1305 | Tek çağrıda gizlilik ve bütünlük; "önce şifrele, sonra MAC" sırasını ve iki ayrı anahtarı elle doğru yönetme yükü kalkar |
| Özete dayalı özel HMAC türetmesi, çıktının kırpılması | HKDF; şifreleme ve MAC için ayrı `info` | Standart, analiz edilmiş; anahtar ayrımı açıkça görünür |
| Bazı adımlarda SHA-1 | SHA-256 | SHA-1'e çakışma saldırıları pratik hale geldi |
| Oturum anahtarı simetrik bir kökten | İleri gizlilik için geçici (EC)DH | Kök anahtar çalınırsa geçmiş oturumların da çözülmesini önler |

!!! tip "Eleştirel okuma bir beceridir"
    Birkaç yıl önce yazılmış, sertifikasyondan geçmiş bir tasarımı bugünün ölçütleriyle okumak, onu "yanlış" ilan
    etmek değildir. Tasarım kendi dönemindeki gereksinimleri karşılamıştır. Mühendislik becerisi, hangi seçimin
    **bugün** neden değişmesi gerektiğini gerekçesiyle söyleyebilmektir. 12. haftada bir güvenlik kılavuzunu bu
    gözle inceleyeceğiz.

!!! success "Kural"
    Anahtarları bir hiyerarşi içinde düzenleyin; her anahtarın tek bir amacı, bir kripto-periyodu ve bir imha
    anı olsun. Veriyi zarflayın; şifreli verinin başlığına anahtar sürümünü yazıp AAD ile koruyun. Anahtarı
    mümkün olan en güçlü depoda tutun ve istemci cihazına yalnız zararı sınırlı, kısa ömürlü anahtarlar indirin.

!!! question "Değerlendirici nasıl test eder?"
    Anahtar yönetimi belgesini (her anahtar için: üretildiği yer, boyut, algoritma, amaç, saklandığı yer, kripto-
    periyot, imha anı) ister ve kaynak kodla karşılaştırır. Aynı anahtarın iki amaçla kullanılıp kullanılmadığını,
    iki farklı cihazda aynı anahtarın bulunup bulunmadığını (ortak statik anahtar), anahtar yenilemenin gerçekten
    çalışıp çalışmadığını ve eski anahtarların silinip silinmediğini denetler.

---

## 9. Aktarımda veri: TLS 1.3, sertifika doğrulama ve sabitleme

Aktarımdaki veriyi koruyan standart **TLS**'tir (eski adıyla SSL). Bugün **TLS 1.3** kullanılır; SSLv2/SSLv3 ve
TLS 1.0/1.1 kırık kabul edilir ve bırakılmıştır (POODLE, BEAST gibi saldırılar).

### 9.1 TLS 1.3 el sıkışması

```mermaid
sequenceDiagram
    participant I as İstemci
    participant S as Sunucu
    I->>S: ClientHello (+ anahtar payları, desteklenen şifre takımları)
    S->>I: ServerHello (+ anahtar payı)
    Note over I,S: Ortak sır (ECDHE) — her oturuma yeni: ileri gizlilik
    S->>I: {Sertifika} (şifreli)
    S->>I: {CertificateVerify} (özel anahtarla imza)
    S->>I: {Finished}
    Note over I: Sertifikayı DOĞRULA:<br/>zincir + süre + ad (+ pin)
    I->>S: {Finished}
    Note over I,S: Uygulama verisi (AEAD ile şifreli)
```

TLS 1.3'ün iki kilit özelliği: (1) el sıkışma **tek gidiş-dönüşte** biter (hızlı); (2) anahtar değişimi her zaman
**geçici (ephemeral) ECDHE** ile yapılır, yani **ileri gizlilik** varsayılan olarak açıktır (RFC 8446).

### 9.2 Doğrulamanın üç katmanı — ve en tehlikeli tuzak

Bir TLS bağlantısı, karşı tarafın sunduğu sertifikayı **doğrulamazsa** hiçbir şey ifade etmez. Doğrulama üç sorudan
oluşur:

| Katman | Soru | Araç |
| --- | --- | --- |
| **Zincir doğrulama** | Sertifikayı güvenilir bir kök (CA) mı imzaladı, süresi geçmiş/iptal mi? | CA deposu, CRL/OCSP (H10) |
| **Ana makine adı** | Sertifika **gerçekten bu sunucu için mi**? | SAN/CN karşılaştırma (`SSL_set1_host`) |
| **Sabitleme (pinning)** | Beklediğim **belirli** anahtar/sertifika mı? | SPKI SHA-256 karşılaştırma |

!!! danger "OpenSSL'in ölümcül varsayılanı"
    OpenSSL bir istemci soketinde sertifikayı **varsayılan olarak doğrulamaz** (kitap **tarif 10.7** bunu "olabilecek en
    kötü varsayılan" diye tanımlar). `SSL_CTX_set_verify` çağrılmazsa ve ana makine adı `SSL_set1_host` ile
    ayarlanmazsa, saldırgan araya girip **kendi sertifikasını** sunar ve istemci hiçbir şey anlamaz.

Zincir doğrulama şöyle işler: sunucu bir **uç (leaf) sertifika** sunar; bu sertifikayı bir **ara CA**, onu da güvenilir
bir **kök CA** imzalamıştır. İstemci, elindeki güvenilir kök listesine (trust store) ulaşana kadar imzaları **yukarı
doğru** doğrular; ayrıca her sertifikanın **süresini** ve **iptal durumunu** (CRL/OCSP) kontrol eder. Demo 6'da bu güven
kökünü kendi ürettiğimiz küçük bir CA ile kuruyoruz: "gerçek" sunucu sertifikası bu CA tarafından imzalıdır, "saldırgan"
sertifikası ise kendi imzalıdır (kök listesinde yoktur), bu yüzden zincir doğrulaması onu reddeder. PKI, sertifika
zincirleri, CRL ve OCSP'yi **Hafta 10**'da ayrıntılı işleyeceğiz.

### 9.3 Sabitleme (pinning) ve TOFU

- **Sertifika sabitleme:** İstemci, sunucunun **beklenen açık anahtarının** (SPKI) SHA-256 özetini gömer. Zincir
  geçerli olsa bile (ör. saldırgan sahte ama "geçerli" bir sertifika elde etmiş) anahtar tutmuyorsa bağlantı reddedilir.
  Mobil uygulamalarda yaygındır (OWASP MASVS-NETWORK). Kitap **tarif 10.9** buna "beyaz liste ile doğrulama" der.
- **TOFU** (Trust On First Use): PKI yoksa, ilk bağlantıdaki anahtar hatırlanır; sonraki bağlantılarda **değişirse**
  uyarılır. SSH'ın yaptığı budur (kitap **tarif 8.19**). PKI kadar güçlü değildir ama ilk bağlantıdan sonra araya
  girmeyi zorlaştırır.

### 9.4 TLS 1.2'den 1.3'e ne değişti?

TLS 1.3 yalnız bir sürüm artışı değil, **temiz bir sadeleşmedir**. Eski sürümlerde onlarca "şifre takımı" (cipher
suite) vardı ve birçoğu zayıftı; yanlış yapılandırma yaygın bir açıktı. TLS 1.3 bunu köklü biçimde temizledi:

| Konu | TLS 1.2 | TLS 1.3 |
| --- | --- | --- |
| El sıkışma | 2 gidiş-dönüş | **1 gidiş-dönüş** (daha hızlı) |
| Anahtar değişimi | RSA ya da DH (ileri gizlilik seçime bağlı) | **Yalnız geçici (EC)DHE** → ileri gizlilik varsayılan |
| Şifre takımları | Çok sayıda, bazıları zayıf (RC4, CBC, export) | Yalnız birkaç güçlü AEAD takımı |
| Kırık özellikler | Sıkıştırma, yeniden anlaşma, statik RSA | **Kaldırıldı** |

!!! warning "Düşürme (downgrade) ve 0-RTT tuzakları"
    Saldırgan bazen istemciyi **daha eski, zayıf bir sürüme** düşürmeye çalışır (downgrade attack). Bu yüzden istemcide
    **minimum sürümü** (en az TLS 1.2, tercihen 1.3) zorlamak önemlidir. TLS 1.3'ün "0-RTT" hızlandırması, ilk mesajın
    **yeniden oynatmaya** (replay) açık olabileceği bir ödünleşmedir; ödeme gibi tekrar edilmemesi gereken işlemlerde
    0-RTT kullanılmaz.

### Demo 6 — Doğrulamasız istemci → localhost MITM → hostname + SPKI pinning

!!! info "Demo 6 · `code/week-03/06-tls-pinning` · yalnız Linux/WSL · CWE-295 (yanlış sertifika doğrulama)"
    Demo kendi kök CA'mızı, CN=localhost için **CA tarafından imzalı "gerçek"** bir sertifika ve **kendi imzalı
    "saldırgan"** bir sertifika üretir; iki yerel TLS sunucusu (127.0.0.1) başlatır. İstemci üç modda dener: doğrulamasız,
    zincir+hostname doğrulayan ve SPKI pinleyen. **Windows'ta bu demo WSL'de çalıştırılır** (`.\demo.ps1` bunu anlatır).

İstemcinin özü:

```c title="tls_istemci.c (özet)"
SSL_CTX_set_min_proto_version(ctx, TLS1_2_VERSION);   /* en az TLS 1.2 */
if (dogrula) {
    SSL_CTX_load_verify_locations(ctx, ca_pem, NULL);  /* güvenilen CA */
    SSL_CTX_set_verify(ctx, SSL_VERIFY_PEER, NULL);
    SSL_set1_host(ssl, host);                           /* ana makine adı! */
}
/* pin modunda: sunucu ACIK ANAHTARININ (SPKI) SHA-256'si eslesmeli */
i2d_X509_PUBKEY(X509_get_X509_PUBKEY(cert), &der);
EVP_Digest(der, len, ozet, NULL, EVP_sha256(), NULL);
if (memcmp(ozet, beklenen_pin, 32) != 0) { /* REDDET */ }
```

```text title="sh demo.sh — gerçek çıktı (WSL)"
Gercek sunucu SPKI pini (SHA-256): 1dabd67747366675...ac36b3f7c
==============================================================
SENARYO 1 - Guvensiz istemci SALDIRGAN sunucuya:
[guvensiz] Dogrulama YOK - ne gelirse KABUL (TEHLIKELI).
   ^ Sahte sertifika kabul edildi. MITM basarili olurdu.
SENARYO 2 - Dogrulayan istemci GERCEK sunucuya:
[dogrula] Zincir + hostname DOGRULANDI - KABUL.
SENARYO 3 - Dogrulayan istemci SALDIRGAN sunucuya:
[dogrula] EL SIKISMA BASARISIZ - baglanti REDDEDILDI.
   Sebep: (18: self signed certificate)
SENARYO 4 - Pinleyen istemci GERCEK sunucuya, DOGRU pin:
[pin] SPKI pin TUTTU - baglanti KABUL.
SENARYO 5 - Pinleyen istemci SALDIRGAN sunucuya, GERCEK pin ile:
[pin] SPKI pin TUTMADI - baglanti REDDEDILDI.
   ^ Anahtar tutmadi: pinning MITM'i durdurdu.
```

Beş senaryo tek bir hikâye anlatır: **doğrulamasız istemci** saldırganın sahte sertifikasını sorgusuz kabul eder (MITM
başarılı olurdu). **Zincir + hostname doğrulaması** saldırganın kendi imzalı sertifikasını reddeder. **SPKI sabitleme**
ise saldırgan zincir açısından "geçerli" bir sertifika bulsa bile, **beklenen anahtar** tutmadığı için bağlantıyı
keser.

!!! success "Kural"
    İstemcide doğrulamayı **elle açın**: güvenilir CA deposunu yükleyin, `SSL_VERIFY_PEER` verin, **ana makine adını**
    (`SSL_set1_host`) ayarlayın ve minimum sürümü TLS 1.2 (tercihen 1.3) yapın. Yüksek riskli uygulamalarda **SPKI
    sabitleme** ekleyin. Hata durumunda **kapalı kalın** (fail-closed): istisnayı yutup güven deposuna düşmeyin.

!!! note "Aktarımda 'yalnız TLS'e güvenmeme'"
    TLS kanalı korur ama **uç noktalar** güvenilmez olabilir (kök alınmış telefon, araya konmuş vekil, hatalı yapılmış
    pinning). Yüksek güvenlikli tasarımlarda **TLS'in içine** bir kat daha konur: mesaj düzeyinde AEAD şifreleme + MAC +
    sunucu kimlik doğrulama kodu. Böylece TLS aşılsa bile mesajın gövdesi hâlâ şifrelidir. Bu, Bölüm 14'daki
    güvenlik kabuğunun en dış iki katmanıdır.

!!! question "Değerlendirici nasıl test eder?"
    Değerlendirici localhost'ta bir vekil ile araya girer, **kendi CA'sını** sunar ve uygulamanın bağlantıyı reddedip
    reddetmediğine bakar. Pinlenmiş uygulamada, geçerli ama farklı anahtarlı bir sertifika sunup reddi doğrular; ayrıca
    kod incelemesinde "istisna yutuluyor mu, güven deposuna düşülüyor mu?" diye bakar.

!!! warning "Sık hatalar ve kontrol listesi"
    - [ ] `SSL_CTX_set_verify(..., SSL_VERIFY_PEER, ...)` çağrıldı mı?
    - [ ] Ana makine adı (`SSL_set1_host`) ayarlandı mı? (Zincir doğru ama ad yanlış olabilir.)
    - [ ] Minimum protokol sürümü ≥ TLS 1.2 mi?
    - [ ] Sertifika hatası **yutulmuyor**, bağlantı gerçekten kesiliyor mu?
    - [ ] Pinlenen değer **SPKI** mı (sertifikanın kendisi değil; sertifika yenilenince anahtar aynı kalır)?

---

## 10. TLS'i kodda doğru kurmak: adım adım istemci, sabitleme ve sık hatalar

Önceki bölüm TLS 1.3'ün **ne yaptığını** ve Demo 6 doğrulamasız bir istemcinin nasıl kandırıldığını gösterdi. Bu
bölümde bir TLS istemcisini **satır satır** doğru kurmayı, sabitlemeyi sahada sürdürülebilir biçimde uygulamayı ve
gerçek uygulamalarda en sık görülen hataları işliyoruz. Kitap bu konuyu Tarif 9.1 (SSL istemcisi), 10.7 (karşı
tarafın sertifikasını doğrulama), 10.8 (ana makine adı denetimi) ve 10.9 (beyaz listeyle doğrulama) ile anlatır;
aşağıdaki kod bu tariflerin OpenSSL 1.1.1/3.x'e güncellenmiş halidir.

### OpenSSL ile doğru bir istemci: yedi adım

```c title="tls_istemci.c — OpenSSL 1.1.1 / 3.x"
#include <openssl/ssl.h>
#include <openssl/err.h>

/* Başarıda okunup yazılabilen bir BIO döndürür; iş bitince BIO_free_all + SSL_CTX_free. */
BIO *tls_baglan(SSL_CTX **ctx_cikti, const char *ana_makine, const char *port)
{
    BIO *bio = NULL;
    SSL *ssl = NULL;
    SSL_CTX *ctx = SSL_CTX_new(TLS_client_method());                 /* 1 */
    if (!ctx) return NULL;
    SSL_CTX_set_min_proto_version(ctx, TLS1_2_VERSION);             /* 2 */
    SSL_CTX_set_verify(ctx, SSL_VERIFY_PEER, NULL);                  /* 3 */
    if (SSL_CTX_set_default_verify_paths(ctx) != 1) goto hata;       /* 4 */

    if ((bio = BIO_new_ssl_connect(ctx)) == NULL) goto hata;
    BIO_get_ssl(bio, &ssl);
    SSL_set_tlsext_host_name(ssl, ana_makine);                       /* 5: SNI */
    if (SSL_set1_host(ssl, ana_makine) != 1) goto hata;              /* 6: ad denetimi */
    BIO_set_conn_hostname(bio, ana_makine);
    BIO_set_conn_port(bio, port);

    if (BIO_do_connect(bio) <= 0 || BIO_do_handshake(bio) <= 0) goto hata;
    if (SSL_get_verify_result(ssl) != X509_V_OK) goto hata;          /* 7 */

    *ctx_cikti = ctx;
    return bio;
hata:
    ERR_print_errors_fp(stderr);
    BIO_free_all(bio);
    SSL_CTX_free(ctx);
    return NULL;
}
```

| Adım | Ne yapar? | Atlanırsa |
| --- | --- | --- |
| 1 | Sürümden bağımsız istemci bağlamı | — |
| 2 | En düşük sürümü TLS 1.2 yapar | Sürüm düşürme saldırısına açık kalır |
| 3 | Karşı tarafın sertifikasını **doğrula** | OpenSSL varsayılan olarak doğrulamaz: herhangi bir sertifika kabul edilir |
| 4 | İşletim sisteminin güvenilir kök deposunu yükler | Hiçbir sertifika doğrulanamaz; geliştirici "çalışmıyor" diye 3. adımı kapatır |
| 5 | Sunucuya hangi adı istediğini söyler (SNI) | Aynı IP'de birden fazla site varsa yanlış sertifika gelir |
| 6 | Sertifikadaki adın **bu** sunucu olduğunu denetler | Başka bir site için alınmış geçerli bir sertifika kabul edilir |
| 7 | Doğrulama sonucunu açıkça sorar | Bir yapılandırma hatası sessizce geçebilir (kemer + askı) |

!!! warning "Adım 6 neden bu kadar önemli?"
    Zincir doğrulaması yalnız "bu sertifikayı güvenilir bir CA imzalamış mı?" sorusunu cevaplar. Saldırgan kendi
    alan adı için **tamamen geçerli** bir sertifika alabilir. Ad denetimi yapılmazsa, istemci `banka.ornek` yerine
    `saldirgan.ornek` sertifikasını da kabul eder. 2012'de yayımlanan "dünyanın en tehlikeli kodu" başlıklı
    çalışma, çok sayıda gerçek uygulamanın ve kütüphanenin tam olarak bu adımı atladığını göstermişti.

### Sabitlemeyi eklemek: SPKI özeti

Doğrulama başarılı olduktan sonra sunucunun **açık anahtarının** özeti, uygulamaya gömülü listeyle karşılaştırılır.
Sertifikanın kendisi yerine açık anahtar bilgisinin (SPKI) sabitlenmesi, sertifika aynı anahtarla yenilendiğinde
uygulamanın çalışmaya devam etmesini sağlar.

```c title="SPKI SHA-256 sabitleme"
#include <openssl/x509.h>
#include <openssl/sha.h>

static const unsigned char PINLER[][32] = {
    { /* birincil anahtarın SPKI SHA-256 özeti (32 bayt) */ },
    { /* YEDEK anahtarın özeti: çevrimdışı üretilmiş, henüz kullanılmayan */ },
};

int pin_denetle(SSL *ssl)
{
    X509 *sert = SSL_get_peer_certificate(ssl);    /* 3.x: SSL_get1_peer_certificate */
    if (!sert) return 0;
    X509_PUBKEY *pk = X509_get_X509_PUBKEY(sert);
    int n = i2d_X509_PUBKEY(pk, NULL);
    unsigned char *der = OPENSSL_malloc((size_t)n), *p = der;
    i2d_X509_PUBKEY(pk, &p);                        /* p ilerler; der başta kalır */
    unsigned char ozet[32];
    SHA256(der, (size_t)n, ozet);
    OPENSSL_free(der);
    X509_free(sert);

    for (size_t i = 0; i < sizeof PINLER / sizeof PINLER[0]; i++)
        if (CRYPTO_memcmp(ozet, PINLER[i], 32) == 0)
            return 1;
    return 0;                                       /* tutmadı: bağlantıyı KES */
}
```

Bir sunucunun SPKI özetini komut satırından hesaplamak:

```bash
openssl s_client -connect sunucu.ornek:443 -servername sunucu.ornek </dev/null 2>/dev/null \
  | openssl x509 -pubkey -noout \
  | openssl pkey -pubin -outform der \
  | openssl dgst -sha256 -binary | base64
```

### Sabitlemeyi sahada sürdürmek

Sabitleme güçlü ama **kırılgan** bir önlemdir: sunucunun anahtarı değiştiğinde, eski sürümdeki bütün uygulamalar
bağlanamaz hale gelir. Tarayıcılar bu yüzden HTTP üzerinden dinamik sabitlemeyi (HPKP) 2018'de bıraktı; mobil ve
masaüstü uygulamalarda ise sabitleme hâlâ yaygındır (OWASP MASVS-NETWORK). Sürdürülebilir bir sabitleme için:

| Kural | Neden? |
| --- | --- |
| Sertifikayı değil **SPKI**'yi sabitle | Aynı anahtarla yenilenen sertifika çalışmaya devam eder |
| Her zaman en az bir **yedek pin** göm | Birincil anahtar ele geçerse ya da kaybolursa yedeğe geçilir; uygulama "tuğlalaşmaz" |
| Yedek anahtarı **çevrimdışı** üret ve sakla | Birincil anahtarla aynı anda ele geçmesin |
| Pin listesini güncelleme sürecine bağla | Yeni pin, eski pin kaldırılmadan **önce** bir sürümle dağıtılır |
| Pin hatasını **raporla** | Pin hatası ya bir saldırı ya da bir yapılandırma hatasıdır; ikisini de bilmek istersiniz |
| Pinlemeyi bir yapılandırma bayrağıyla kapatılabilir bırakma | Saldırgan önce bayrağı değiştirir |

!!! tip "Uç sertifika mı, ara CA mı?"
    Uç (leaf) sertifikanın anahtarını sabitlemek en sıkı seçenektir ama en çok bakım gerektirir. Ara CA'nın
    anahtarını sabitlemek, o CA'nın imzaladığı her sertifikayı kabul eder; bakım kolaylaşır ama güvence azalır.
    Seçim, koruma planına bir **ödünleşim kaydı** olarak yazılır (1. hafta).

### Windows'ta TLS: WinHTTP ve Schannel

Windows'un yerleşik TLS yığını **Schannel**'dır; uygulamalar çoğunlukla onu **WinHTTP** ya da WinINet üzerinden
kullanır (kitabın Tarif 9.4'te anlattığı WinInet'in güncel karşılığı). OpenSSL'in tersine WinHTTP, sertifikayı
ve ana makine adını **varsayılan olarak doğrular**. Tehlike, bu doğrulamayı kapatan bayraklardadır:

```c title="Asla sürüm derlemesine girmemesi gereken satır"
DWORD bayraklar = SECURITY_FLAG_IGNORE_UNKNOWN_CA |
                  SECURITY_FLAG_IGNORE_CERT_CN_INVALID |
                  SECURITY_FLAG_IGNORE_CERT_DATE_INVALID;
WinHttpSetOption(istek, WINHTTP_OPTION_SECURITY_FLAGS, &bayraklar, sizeof bayraklar);
```

Bu satır genellikle geliştirme sırasında kendi imzalı bir test sunucusuna bağlanmak için eklenir ve **unutulur**.
Doğrusu, test sunucusunun CA'sını geliştirme makinesinin güven deposuna eklemektir; kod aynı kalır. WinHTTP'de
sabitleme için, istek gönderildikten sonra `WinHttpQueryOption(..., WINHTTP_OPTION_SERVER_CERT_CONTEXT, ...)` ile
sunucu sertifikası alınır ve açık anahtar bilgisinin özeti yukarıdaki gibi karşılaştırılır.

### Eleştirel okuma: sessizce açılan kapı (fail-open)

Sahada kullanılmış bir sabitleme gerçekleştiriminin sadeleştirilmiş ve yeniden yazılmış hali aşağıdadır. Kod ilk
bakışta doğru görünür: önce zinciri doğruluyor, sonra sunucunun açık anahtarını uygulamada saklanan anahtarla
karşılaştırıyor. Hatayı bulabilir misiniz?

```java title="Sabitleme — sadeleştirilmiş örnek (Java)"
public void checkServerTrusted(X509Certificate[] zincir, String tur) throws CertificateException {
    varsayilanDogrulayici.checkServerTrusted(zincir, tur);          // 1. zincir doğrulaması
    try {
        PublicKey beklenen = depo.getCertificate("ca").getPublicKey();
        if (!Arrays.equals(beklenen.getEncoded(), zincir[0].getPublicKey().getEncoded()))
            throw new CertificateException("pin tutmadi");           // 2. sabitleme
    } catch (KeyStoreException e) {
        e.printStackTrace();                                         // 3. ???
    }
}
```

3 numaralı satır, anahtar deposundan okuma **başarısız olursa** hatayı yazdırıp metodu **normal biçimde** bitirir.
Metot istisna fırlatmadan döndüğü için bağlantı **kabul edilir**: sabitleme hiç yapılmamış olur. Bir güvenlik
denetiminin hata durumunda "geçti" sonucuna düşmesine **fail-open** (açık kalarak başarısız olma) denir. Aynı kod
tabanında dikkat çeken başka noktalar da vardı:

- Zincir doğrulaması başarısız olduğunda, uygulamaya gömülü depo ile ikinci bir doğrulama yapılıyor ve bu ikinci
  doğrulamada **iptal denetimi kapatılıyordu**.
- Sertifika dosyası ya da onun bütünlük belirteci bulunamazsa, yalnız bir günlük satırı yazılıp bağlantı kurulmaya
  **devam ediliyordu**.
- Tek bir pin vardı; **yedek pin** yoktu.

Doğrusu **fail-closed** (kapalı kalarak başarısız olma) tasarımdır: bir güvenlik denetiminin sonucunu
belirleyemiyorsanız, sonuç "reddet"tir.

```java title="Düzeltilmiş: her belirsizlik reddedilir"
    } catch (KeyStoreException | RuntimeException e) {
        throw new CertificateException("pin denetimi yapilamadi", e);   // belirsizlik = ret
    }
```

!!! success "Kural: güvenlik denetimleri kapalı kalarak başarısız olur"
    Bir denetimin her çıkış yolunu (istisna, boş değer, eksik dosya, zaman aşımı) tek tek düşünün ve her birinin
    **reddetmeye** vardığını doğrulayın. Kod incelemesinde `catch` bloklarını ve "bulunamadı, devam ediliyor"
    günlük satırlarını ayrıca arayın: fail-open hatalarının neredeyse hepsi oradadır.

### Gerçek uygulamalarda en sık TLS hataları

| Hata | Nerede görülür? | Sonuç |
| --- | --- | --- |
| Doğrulama geri çağrısının her zaman "geçerli" döndürmesi | OpenSSL `verify_callback`, Java'da "her şeye güvenen" `TrustManager` | Her sertifika kabul edilir |
| Ana makine adı denetiminin kapatılması | `SSL_set1_host` yok; Java `HostnameVerifier` her zaman `true` | Başka sitenin geçerli sertifikası kabul edilir |
| Sertifika hatasında "devam et" | Mobil web görünümünde hata olayında işlemi sürdürmek | Araya giren saldırgan fark edilmez |
| Hata ayıklama bayrağının sürüme sızması | `#ifdef DEBUG` yerine çalışma anı bayrağı | Saldırgan bayrağı açar |
| Yalnız yedeksiz uç sertifika pini | Mobil uygulamalar | Sertifika yenilenince uygulama çalışmaz; ekip pinlemeyi tamamen kaldırır |
| Dönüş değerlerinin denetlenmemesi | Her yerde | El sıkışma başarısız olsa bile veri gönderilir |
| TLS'in tek koruma sanılması | Mimari | Sunucuda ya da istemcide açık duran veri korunmaz |

!!! danger "'Nasılsa TLS var' yanılgısı"
    TLS yalnız **yoldaki** veriyi korur. Veri sunucuya ulaştığında, günlüğe yazıldığında ya da istemcide bir
    dosyaya kaydedildiğinde TLS'in koruması biter. Bu yüzden hassas veri için TLS'in üstüne **mesaj düzeyinde**
    şifreleme (güvenlik kabuğu) eklenir ve veri beklemede de şifrelenir.

### Kendi bağlantınızı test etmek

=== "Komut satırı"

    ```bash
    # Sürüm, şifre takımı ve sertifika zincirini göster; doğrulama hatasında dur
    openssl s_client -connect sunucu.ornek:443 -servername sunucu.ornek \
                     -verify_return_error -brief </dev/null

    # TLS 1.1'i dene: sunucu reddetmeli
    openssl s_client -connect sunucu.ornek:443 -tls1_1 </dev/null
    ```

=== "Uygulama davranışı"

    1. Kendi imzalı bir sertifika sunan yerel bir sunucuya bağlanın: uygulama **reddetmeli** (Demo 6).
    2. Geçerli ama başka bir ad için alınmış sertifika sunun: uygulama **reddetmeli**.
    3. Test cihazının güven deposuna kendi CA'nızı ekleyip araya bir proxy koyun: sabitleme yapan uygulama yine
       **reddetmeli**.
    4. Pin hatasının raporlandığını ve kullanıcıya anlaşılır bir ileti gösterildiğini doğrulayın.

!!! question "Değerlendirici nasıl test eder?"
    Test cihazına kendi kök sertifikasını kurar ve trafiği bir araya-girme proxy'sinden geçirir. Uygulama bu durumda
    bağlanabiliyorsa sabitleme yok ya da etkisizdir. Sonra RASP ve gizleme katmanlarını aşarak sabitleme denetimini
    çalışma anında devre dışı bırakmayı dener (6. hafta); bu denemenin ne kadar sürdüğü, korumanın gücünü gösterir.
    Ayrıca sunucu tarafında TLS sürümlerini, şifre takımlarını ve sertifika zincirini tarar.

!!! note "Sahada nasıl uygulanır?"
    Mobil ödeme kütüphanelerinde aktarımdaki veri tipik olarak iki dış kabukla korunur: TLS + açık anahtar
    karşılaştırmalı sertifika sabitleme + sunucu sertifika zincirinin doğrulanması (en dış kabuk), onun içinde de
    oturum anahtarıyla mesaj düzeyinde şifreleme ve MAC. Sunucunun adresi, sertifika ana makine adı ve sabitlenen
    değerler kütüphaneye üst uygulama tarafından parametre olarak verildiğinde, bu parametrelerin korunması
    **üst uygulamanın sorumluluğu** olarak kılavuzda açıkça yazılır; sorumluluğun kimde olduğu belirsiz bırakılmaz.

---

## 11. Beklemede veri: dosya ve veritabanı şifreleme

Diskteki dosya ya da veritabanı **çalınabilir** (kayıp telefon, çalınan yedek, ele geçirilen sunucu). Beklemede veriyi
korumanın iki düzeyi vardır:

- **Tüm disk/dosya şifreleme:** İşletim sistemi düzeyinde (LUKS, BitLocker, XTS-AES) ya da uygulama düzeyinde tüm dosyayı
  AEAD ile şifreleme (bkz. Demo 1). Kitap **tarif 5.15** disk şifrelemeyi işler; sabit IV tuzağına dikkat çeker.
- **Alan/sütun şifreleme:** Yalnız **hassas alanları** (kart no, TC kimlik, sağlık verisi) uygulama katmanında şifreleyip
  veritabanına şifreli yazma. Veritabanı çalınsa bile o alanlar okunamaz.

**Veri maskeleme** ayrı bir tekniktir: veriyi geri döndürülemez ya da kısmi biçimde gösterme. Şifreleme **değildir**
(anahtarla geri açılmaz); amacı, verinin **gereksiz yere maruz kalmasını** azaltmaktır. Başlıca biçimleri:

- **Kısmi maskeleme:** yalnız bir kısmını gösterme, ör. kart no `**** **** **** 4242`, e-posta `a***@ornek.com`.
  Kullanıcı arayüzünde ve müşteri hizmetleri ekranlarında kullanılır.
- **Loglama maskesi:** loglara hassas alan **hiç** yazılmaz ya da maskeli yazılır. (Hafta 1'de gördüğümüz "sırrı
  loglama" hatasının veri tarafı.)
- **Tokenizasyon:** gerçek değeri anlamsız bir "token" ile değiştirip gerçek değeri ayrı, güvenli bir kasada tutma.
  Ödeme sistemlerinde kart numarası yerine token dolaşır; asıl numara yalnız gerekince kasadan çözülür.
- **Test verisi maskeleme:** üretim verisini test/geliştirme ortamına kopyalarken gerçek kişisel veriyi sahte ama
  gerçekçi değerlerle değiştirme.

Maskeleme şifrelemenin **yerine geçmez**; onu **tamamlar**. Veri diskte AEAD ile şifreli durur (gizlilik), ekrana/loga
giderken maskelenir (maruz kalmayı azaltma). İkisi farklı tehditlere karşıdır: biri dosyanın çalınmasına, diğeri "yanlış
kişinin ekranda/logda görmesine".

### Demo 7 — SQLite'ta hassas alanı AES-GCM ile şifreleme

!!! info "Demo 7 · `code/week-03/07-sqlite-alan` · beklemede veri, alan şifreleme"
    Program bir SQLite veritabanına iki müşteri kaydı ekler: `ad` alanı **açık**, `kart_sifreli` alanı AES-256-GCM ile
    şifreli BLOB. Anahtar koda gömülü değil; `SIM_ANAHTAR` ortam değişkeninden gelir. Saldırgan DB'yi çalıp açtığında
    kart alanı yalnız şifreli bayt yığınıdır. SQLite Linux'ta `sqlite3`, Windows'ta Windows SDK'nın yerleşik
    **winsqlite3** kütüphanesidir; kripto ortak başlıktan.

```text title="sh demo.sh — gerçek çıktı (WSL)"
ADIM 1 - Veritabanini kur (hassas alan sifreli)
Veritabani kuruldu: cikti/musteri.db (2 kayit)
ADIM 2 - Saldirgan DB dosyasini caldi ve sqlite3 ile aciyor:
  1|Ayse Yilmaz|D1ED7A3624E0F7C6...A64B373F...  (sifreli)
  2|Mehmet Kaya|C362F7A33BDEE736...F924DF9F...  (sifreli)
   ^ Kart alani yalniz sifreli bayt yigini; anahtar yok.
ADIM 3 - Dogru anahtarla uygulama okuyor (coz ve dogrula):
   1 | Ayse Yilmaz   | 4242-4242-4242-4242
   2 | Mehmet Kaya   | 5555-4444-3333-2222
ADIM 4 - YANLIS anahtarla okuma (GCM etiketi tutmaz):
   1 | Ayse Yilmaz   | (COZULEMEDI - anahtar yanlis?)
```

Saldırgan `sqlite3` ile DB'yi açsa bile `ad` alanını görür ama `kart_sifreli` alanı yalnız şifreli bayttır. Doğru
anahtarla uygulama açıp doğrular; **yanlış** anahtarla GCM etiketi tutmadığı için çözme reddedilir (sessizce çöp
döndürmez). Windows demosu (`.\demo.ps1`) `sqlite3` aracı yerine ham DB dosyasında arama yaparak aynı noktayı
gösterir: `Ayse` (açık ad) bulunur, `4242-4242` (kart) **bulunmaz** çünkü şifrelidir.

!!! success "Kural"
    Hassas alanları veritabanına yazmadan **önce** uygulama katmanında AEAD ile şifreleyin. Anahtarı koda gömmeyin;
    cihaza/kullanıcıya bağlı bir KDF'den türetin (Bölüm 13). Loglara ve ekrana giden değerleri
    **maskeleyin**. Beklemede şifreleme, kullanımda korumanın (Demo 8) yerine geçmez; ikisi birlikte gerekir.

!!! note "Sahada nasıl uygulanır? / Değerlendirici testi"
    Örnek mimaride yerel veritabanı SQLite'tır; kart profili, işlem sayacı ve anahtar listesi şifreli sütunlarda tutulur,
    anahtar cihaza bağlıdır. Değerlendirici DB dosyasını çıkarır, açık hassas veri arar ve bulursa bulgu yazar; ayrıca
    anahtarın nereden geldiğini (koda gömülü mü, cihaza bağlı mı) inceler.

!!! warning "Sık hatalar ve kontrol listesi"
    - [ ] Hassas alan DB'ye yazılmadan **önce** mi şifreleniyor?
    - [ ] Anahtar koda gömülü değil, cihaza/kullanıcıya bağlı bir kaynaktan mı geliyor?
    - [ ] Yanlış anahtarla çözme sessizce çöp döndürmüyor, reddediyor mu (AEAD)?
    - [ ] Loglara/ekrana giden hassas alanlar maskeleniyor mu?
    - [ ] Şifreli alan başka bir kayda taşınamıyor mu (AAD ile bağlama)?

---

## 12. Veri maskeleme teknikleri: veriyi göstermeden kullanmak

Şifreleme, veriyi **anahtarı olmayan** herkesten saklar. Ama birçok durumda veriyi **anahtarı olan** sistemlerin ve
kişilerin bile tam olarak görmesi gerekmez: çağrı merkezi çalışanı müşterinin kart numarasının tamamını değil son dört
hanesini görmelidir; test ortamındaki veritabanı gerçek kişilerin kimlik numaralarını içermemelidir; günlük dosyası
parolayı hiç görmemelidir. **Veri maskeleme**, verinin kullanım amacına yetecek kadarını gösterip gerisini gizleme
teknikleri ailesidir. Kişisel verilerin korunması mevzuatı (KVKK, GDPR) ve ödeme kartı standardı (PCI DSS), bu
teknikleri açıkça ister.

### Dört temel teknik

| Teknik | Ne yapar? | Geri döndürülebilir mi? | Tipik kullanım |
| --- | --- | --- | --- |
| **Maskeleme (gösterimde)** | Değerin bir kısmını `*` ile değiştirir | Hayır (gösterilen kopya için) | Ekran, fiş, günlük |
| **Tokenizasyon** | Değeri anlamsız bir **belirteçle** değiştirir; gerçek değer ayrı ve korunan bir kasada durur | Evet, yalnız kasaya erişimi olan için | Ödeme sistemleri, kart saklama |
| **Takma adlandırma (pseudonymization)** | Değeri anahtarlı bir fonksiyonla sabit bir takma ada çevirir | Anahtarı olan için eşleştirilebilir | Analiz, raporlama, test verisi |
| **Anonimleştirme** | Kişiyle bağı kalıcı olarak koparır (genelleme, gürültü, silme) | Hayır | Açık veri, istatistik |

Aralarındaki fark hukuken de önemlidir: takma adlandırılmış veri hâlâ **kişisel veridir** (anahtarı olan kişiyi
bulabilir); gerçekten anonimleştirilmiş veri ise kişisel veri sayılmaz. Birçok "anonim" veri kümesinin, başka
verilerle birleştirilerek kişilere geri bağlanabildiği gösterilmiştir. Bu yüzden "anonimleştirdik" demek, "takma ad
verdik" demekten çok daha güçlü bir iddiadır.

### 1. Gösterimde maskeleme

Kart numarası (PAN) için PCI DSS kuralı nettir: numara görüntülendiğinde en fazla ilk altı (ya da standardın yeni
sürümlerinde kart türüne göre sekiz) ve son dört hane gösterilebilir; işi gereği tam numarayı görmesi gereken
roller ayrıca tanımlanır.

```c title="Kart numarasını görüntüleme için maskele (son 4 hane)"
#include <string.h>

/* "1234567812345678" -> "************5678"; çıktı tamponu en az n+1 bayt */
void pan_maskele(const char *pan, char *cikti, size_t cikti_boyut)
{
    size_t n = strnlen(pan, 19);
    if (cikti_boyut < n + 1) { if (cikti_boyut) cikti[0] = '\0'; return; }
    for (size_t i = 0; i < n; i++)
        cikti[i] = (i + 4 < n) ? '*' : pan[i];
    cikti[n] = '\0';
}
```

Maskeleme **kaynağa yakın** yapılmalıdır: tam değer sunucudan istemciye gönderilip ekranda maskelenirse, ağ trafiğini
ya da istemci belleğini inceleyen biri tam değeri görür. Doğrusu, istemciye zaten maskelenmiş değeri göndermektir.

### 2. Tokenizasyon

```mermaid
sequenceDiagram
    participant U as Uygulama
    participant T as Belirteç kasası (korunan)
    participant D as Uygulama veritabanı
    U->>T: kart numarası
    T-->>U: belirteç (ör. tok_7f3a...)
    U->>D: yalnız belirteci sakla
    Note over D: Veritabanı çalınsa bile kart numarası yok
    U->>T: ödeme anında belirteç
    T-->>U: yetkili işlem için gerçek değer (ya da işlemi kasa yapar)
```

Tokenizasyonun gücü, gerçek verinin **tek bir küçük ve çok iyi korunan** sistemde toplanmasıdır. Uygulamanın geri
kalanı, veritabanları, raporlar ve günlükler yalnız belirteci görür; bunlar ele geçirilse bile kart verisi sızmaz.
Bu, 1. haftadaki "tehdidi aktarma" yanıtının teknik karşılığıdır: kart verisini hiç saklamayıp ödeme sağlayıcısının
belirteç hizmetini kullanmak, uygulamanın PCI DSS kapsamını büyük ölçüde küçültür. Mobil ödemede telefona indirilen
kart bilgisi de gerçek kart numarası değil, cihaza özgü bir **belirteç numarasıdır**.

Belirtecin **biçimi korunabilir**: 16 haneli bir kart numarası yerine yine 16 haneli ama anlamsız bir sayı. Bu, eski
sistemlerin (alan uzunluğu, doğrulama kuralları) değiştirilmeden kullanılmasını sağlar. Biçimi koruyan şifreleme
(format-preserving encryption, NIST SP 800-38G'deki FF1 algoritması) aynı işi bir anahtar ve kasa olmadan yapar.

### 3. Takma adlandırma: anahtarlı özet

Analiz ya da test için "aynı kişinin kayıtlarını bir araya getirebilmek ama kim olduğunu bilmemek" gerekir. Kimlik
numarasını düz bir özetten (SHA-256) geçirmek **yetmez**: 11 haneli bir kimlik numarasının olası değer sayısı küçüktür
ve saldırgan hepsinin özetini hesaplayıp karşılaştırabilir. Doğrusu, **gizli bir anahtarla HMAC** kullanmaktır:

```c title="Anahtarlı takma ad: HMAC-SHA256(anahtar, kimlik_no)"
/* code/common/cen429_kripto.h */
unsigned char takma_ad[32];
kripto_hmac_sha256(takma_anahtari, 32, kimlik_no, strlen(kimlik_no), takma_ad);
/* Veri kümesinde kimlik_no yerine hex(takma_ad)'ın ilk 16 baytı saklanır */
```

Anahtar veri kümesinden **ayrı** tutulur. Anahtarı olmayan için takma addan kimlik numarasına dönmek, olası bütün
kimlik numaralarını denemek anlamına gelir ve anahtar bilinmeden bu mümkün değildir. Anahtar kaybolursa ya da
imha edilirse, veri fiilen anonimleşir.

### 4. Test ve geliştirme verisi

Gerçek üretim verisinin test ortamına kopyalanması, en sık görülen veri sızıntısı nedenlerinden biridir: test
ortamları daha az korunur, daha çok kişi erişir. Test verisi için sırasıyla tercih edilecekler:

1. **Tamamen sentetik veri:** Gerçek kayıtlardan hiç türetilmemiş, üretilmiş veri. En güvenlisi. Bu dersteki bütün
   örnekler bu yolu izler: kart numaraları, anahtarlar ve kimlikler sentetiktir.
2. **Statik maskeleme:** Üretim verisinin bir kopyası alınır, kopyadaki hassas alanlar kalıcı olarak değiştirilir
   (takma ad, karıştırma, genelleme) ve ancak ondan sonra test ortamına taşınır.
3. **Dinamik maskeleme:** Veri değiştirilmez; veritabanı sorgu sonucunu kullanıcının rolüne göre maskeleyerek döndürür.
   Kullanışlıdır ama veri tabanında tam haliyle durmaya devam eder.

### 5. Günlüklerde ve hata iletilerinde maskeleme

İkinci haftada denetim kaydının "asla kaydetme" listesini görmüştük: parola, PIN, belirteç, anahtar, tam kart numarası.
Kural bir şeydir, onu **garanti etmek** başka. İki yaklaşım birlikte kullanılır:

- **Kaynakta önleme:** Hassas veriler özel bir türde tutulur ve bu türün yazdırma fonksiyonu her zaman maskeli çıktı
  verir. Programcı yanlışlıkla günlüğe yazsa bile tam değer çıkmaz.
- **Çıkışta süzme:** Günlük kütüphanesinin son adımında, kart numarasına benzeyen (13–19 haneli, Luhn denetimini
  geçen) diziler ve `parola=`, `token=` gibi anahtarlardan sonra gelen değerler otomatik olarak maskelenir.

```c title="Günlük satırında 'parola=' ve 'pin=' değerlerini maskele (basit süzgeç)"
#include <string.h>
#include <ctype.h>

void gunluk_suz(char *satir)
{
    static const char *anahtarlar[] = { "parola=", "pin=", "token=" };
    for (size_t k = 0; k < sizeof anahtarlar / sizeof anahtarlar[0]; k++) {
        char *p = satir;
        while ((p = strstr(p, anahtarlar[k])) != NULL) {
            p += strlen(anahtarlar[k]);
            while (*p && !isspace((unsigned char)*p))
                *p++ = '*';                    /* değeri yerinde maskele */
        }
    }
}
```

!!! warning "Süzgeç ikinci savunma hattıdır"
    Çıkışta süzme, programcının hatasını yakalamak için bir **emniyet ağıdır**; asıl önlem hassas veriyi günlüğe hiç
    göndermemektir. Süzgeç her biçimi tanıyamaz (ör. JSON içinde `"parola": "..."`) ve süzülmeden önce veri zaten
    bellekte ve belki bir tamponda durmuştur. Sahada sürüm derlemelerinde günlük kodunun tamamen kaldırılması bu
    yüzden tercih edilir (1. hafta ödünleşim kaydı).

### Hangi tekniği ne zaman?

| Durum | Önerilen teknik |
| --- | --- |
| Çağrı merkezi ekranında kart numarası | Gösterimde maskeleme (son 4), tam değer istemciye hiç gelmez |
| Kart numarasını tekrarlı ödemeler için saklamak | Tokenizasyon (tercihen ödeme sağlayıcısında) |
| Aynı müşterinin davranışını analiz etmek | Anahtarlı takma ad (HMAC) |
| Test veritabanı | Sentetik veri; olmazsa statik maskeleme |
| Günlük dosyası | Kaynakta önleme + çıkışta süzme |
| Açık veri olarak paylaşmak | Anonimleştirme (genelleme, toplulaştırma) ve yeniden tanımlama riskinin değerlendirilmesi |

!!! question "Değerlendirici nasıl test eder?"
    Uygulamanın ekranlarında, istemciye giden ağ yanıtlarında, günlük dosyalarında, çökme raporlarında ve yedeklerde
    tam kart numarası, kimlik numarası ya da parola arar. Maskelemenin istemcide mi (zayıf) yoksa sunucuda mı yapıldığına
    bakar. Takma adlandırmada anahtarsız bir özet kullanılıp kullanılmadığını denetler ve test ortamında gerçek veri
    bulunup bulunmadığını sorar.

!!! note "Sahada nasıl uygulanır?"
    Ödeme kütüphanelerinde kullanıcı arayüzüne kartın yalnız son dört hanesi ve kart türü gibi maskeli bilgiler verilir;
    gerçek kart numarası yerine cihaza özgü belirteç numarası kullanılır. Kütüphanenin kılavuzunda "hata kodları
    saldırgana ipucu vermemeli" ve "hassas veri açık olarak günlüğe yazılmamalı" gereksinimlerinin nasıl karşılandığı
    (ör. bütün günlüklerin derleme anında kaldırılması) ayrıca belgelenir.

---

## 13. Kullanımda veri: bellekte güvenli silme ve cihaz bağlama

Bir sır **kullanılmak için** eninde sonunda bellekte açılır. O anda risk altındadır: bellek dökümü, hata ayıklayıcı,
takas alanı (swap), aynı belleği sonra kullanan başka kod. Hafta 1'de `explicit_bzero` ile "ölü yazma giderme"yi görmüştük;
bu hafta **kullanımda veri** için ek katmanları kuruyoruz.

| Katman | Amaç | Linux | Windows |
| --- | --- | --- | --- |
| Döküm engelleme | Sır core/crash dosyasına düşmesin | `setrlimit(RLIMIT_CORE, 0)` | `SetErrorMode` |
| Bellek kilitleme | Sayfa takas alanına yazılmasın | `mlock` | `VirtualLock` |
| Güvenli silme | İş bitince üzerine yaz (kaldırılamaz) | `OPENSSL_cleanse` | `SecureZeroMemory` |
| Kısa ömür | Sırrı en kısa süre tut, kopyalama | — | — |

### Demo 8 — mlock + güvenli silme

!!! info "Demo 8 · `code/week-03/08-bellek-silme` · kullanımda veri (kitap tarif 13.2–13.3)"
    Program üç katmanı kurar: dökümü kapatır, belleği kilitler, işi bitince `kripto_temizle` ile siler; silme sonrası
    tamponun gerçekten sıfırlandığını doğrular. (Hafta 1'deki gcore gösterimini tekrarlamaz; yeni katmanlar ekler.)

```text title="sh demo.sh — gerçek çıktı (WSL)"
Katman 1 - cokme dokumu kapatildi (RLIMIT_CORE=0): TAMAM
Katman 2 - mlock ile takasa (swap) yazma engellendi: TAMAM
Sir kullaniliyor: uzunluk = 20, dolu bayt = 20
Katman 3 - guvenli silme sonrasi dolu bayt = 0
   ==> sir bellekten temizlendi.
--------------------------------------------------------------
OPENSSL_cleanse cagrisi sayisi -> 2
```

Windows'ta (`.\demo.ps1`) aynı üç katman `SetErrorMode` + `VirtualLock` + `SecureZeroMemory` ile kurulur; çıktı da
"TAMAM"dır. `memset`'in aksine `OPENSSL_cleanse`/`SecureZeroMemory` çağrısı derleyici tarafından **"ölü yazma" olarak
kaldırılamaz** — makine kodunda gerçek bir çağrı olarak kalır (demo bunu `objdump` ile sayar).

### 13.1 Cihaz bağlama

**Kullanımda** korumanın bir parçası da anahtarın **belirli bir cihaza/sürüme bağlanmasıdır**. Anahtarı, cihazın parmak
izinden (üretici, model, cihaz kimliği, sürüm dizesi) türetilen bir değerle sararsak, dosyalar başka bir cihaza
kopyalansa bile orada **açılamaz**. Doğru yol: XOR ya da tuzsuz özet değil, **HKDF ile tuzlanmış türetme** ve AEAD ile
sarma. Bölüm 14'daki güvenlik kabuğunun en iç katmanı tam olarak budur; bunu Hafta 6'da RASP ile
birleştireceğiz.

!!! success "Kural"
    Sırrı **en son anda** aç, **en kısa süre** tut, **kopyalama**, işin bitince derleyicinin kaldıramayacağı bir işlevle
    **sil**. Mümkünse belleği kilitle ve dökümü kapat. Depolama anahtarını **cihaza ve sürüme bağla** (HKDF + AEAD).

!!! note "Sahada nasıl uygulanır?"
    Mobil ödeme kütüphanesinde tek kullanımlık ödeme anahtarı yalnız ödeme anında, yalnız yerel (native) katmanda açılır
    ve kullanımdan hemen sonra rastgele veriyle üzerine yazılarak silinir. Depolama anahtarı cihaz parmak izine bağlıdır;
    telefon klonlansa bile başka cihazda çözülemez (Demo 9, Saldırı 2). Java tarafında hassas veri, silinemeyen `String`
    yerine silinebilen `byte[]` dizilerinde tutulur.

!!! question "Değerlendirici nasıl test eder?"
    Değerlendirici ödeme sırasında ve sonrasında bellek dökümü alıp anahtarı arar; ayrıca dosyaları başka bir cihaza
    kopyalayıp orada açılıp açılmadığını dener. Güvenli silmenin gerçekten yapıldığını (ve derleyicinin kaldırmadığını)
    ikili dosyanın makine kodundan doğrular.

!!! warning "Sık hatalar ve kontrol listesi"
    - [ ] Sır `memset` ile değil, kaldırılamaz bir işlevle mi siliniyor?
    - [ ] Sırrın gereksiz kopyaları (loglar, geçici tamponlar, `String`) var mı?
    - [ ] Depolama anahtarı cihaza/sürüme bağlı mı?
    - [ ] Çökme dökümü kapalı ve hassas bellek kilitli mi?

---

## 14. Güvenlik kabukları: derinlemesine savunmanın somut hâli

Şimdi bu haftanın bütün parçalarını tek bir fikirde birleştiriyoruz. Hassas bir varlığı **tek** bir korumaya
bırakmayız; onu, yaşam döngüsünün her aşamasına karşılık gelen **iç içe kabuklarla** sararız:

```mermaid
flowchart TB
    subgraph K4["Kabuk 4 — Kanal (TLS 1.3 + pinning)"]
        subgraph K3["Kabuk 3 — Oturum (mesaj AEAD + MAC)"]
            subgraph K2["Kabuk 2 — Depolama (AES-GCM, beklemede)"]
                subgraph K1["Kabuk 1 — Cihaz bağlama (HKDF + AEAD)"]
                    S["SIR"]
                end
            end
        end
    end
```

Saldırganın sırra ulaşması için **dört kabuğu da** sırayla açması gerekir: TLS'i kır, mesaj şifrelemesini kır, depolama
şifrelemesini kır **ve** doğru cihazda ol. Bu, "aktarımda yalnız TLS'e güvenmeme", "beklemede alan şifreleme" ve
"kullanımda cihaz bağlama" ilkelerinin tek tabloda birleşmiş hâlidir.

### Demo 9 — Bir anahtarı dört kabukla sarıp açmak

!!! info "Demo 9 · `code/week-03/09-guvenlik-kabugu` · derinlemesine savunma"
    Program 16 baytlık bir sırrı sırayla dört AES-GCM kabuğuyla sarar (en iç: cihaza bağlı HKDF anahtarı), sonra ters
    sırada açar. İki saldırı: (1) paketin bir biti kurcalanırsa en dış kabuk açılmaz; (2) paket başka bir cihaza
    (farklı parmak izi) kopyalanırsa dış kabuklar açılsa bile **en iç cihaz kabuğu** açılmaz.

```text title="sh demo.sh — gerçek çıktı"
SARMA (dis dunyaya dogru): sir -> K1 -> K2 -> K3 -> K4
  Kabuk 1 (cihaz baglama)     :  44 bayt
  Kabuk 4 (kanal/TLS benzeri) : 128 bayt  <- aktarilan paket
ACMA (ice dogru): K4 -> K3 -> K2 -> K1 -> sir
  Kabuk 4/3/2/1 acildi: TAMAM
  Cozulen SIR : deadbeef...ba98  -> sir DOGRU
==============================================================
SALDIRI 1 - Paketin bir biti kurcalanirsa (Kabuk 4):
  Kabuk 4 acildi: RED  (GCM etiketi tutmadi)
SALDIRI 2 - Paket BASKA cihaza kopyalanirsa (yanlis parmak izi):
  Dis 3 kabuk acildi: TAMAM
  Kabuk 1 (cihaz baglama) BASKA cihazda acildi: RED
  ^ Anahtarlar kopyalansa bile sir baska cihazda ACILAMAZ.
```

Normal akışta dört kabuk sırayla açıldı ve sır doğru geri geldi. Tek bir bit kurcalanınca en dış GCM etiketi tuttu ve
o katmanda reddedildi. Paket başka bir cihaza taşındığında dış üç kabuk (anahtarları taşınabilir) açıldı ama **cihaza
bağlı en iç kabuk** açılamadı — sır ele geçmedi. Gerçek ürünlerde bu en iç kabuk çoğu zaman **whitebox kripto** olur
(Hafta 11).

Bu kabuk yaklaşımı dönemin geri kalanına köprüdür: native kod sağlamlaştırma ve RASP (Hafta 4, 6, 9) kabukları
**çalışma zamanında** korur; kripto ve anahtar hiyerarşisi (Hafta 10) kabukların anahtarlarını doğru üretir ve yönetir;
whitebox (Hafta 11) en iç kabuğu güçlendirir; sertifikasyon (Hafta 12–13) bütün bu katmanların **kanıtını** ister. Yani
bu haftanın veri güvenliği bölümü, güvenlik kılavuzunuzun (S5, S7) omurgasıdır ve ilerideki her hafta bir kabuğu daha
somutlaştırır.

### Sahadaki kabuk matrisi: bir varlık, beş aşama

Demo 9, fikri sade tutmak için dört kabuğun hepsini AES-GCM ile kurdu. Bağımsız bir laboratuvarın sertifikasyonundan
geçmiş bir mobil ödeme kütüphanesinde ise kabuklar şöyle tanımlanmıştı (adlar genelleştirilmiştir):

| Kabuk | İçerik |
| --- | --- |
| **1** | Ödeme anahtarının **whitebox DES biçiminde** tutulması: anahtar hiçbir aşamada açık halde bulunmaz |
| **2** | Cüzdan anahtarıyla whitebox AES-CBC + **cihaz bağlama** + **uygulama bağlama** |
| **3** | Beklemede: cüzdan anahtarıyla whitebox AES-CBC + SHA-256 MAC + cihaz ve **sürüm bağlama**. Aktarımda: yapılandırma anahtarından türetilen **oturum anahtarıyla** AES + SHA-256 MAC + cihaz ve sürüm bağlama |
| **4** | TLS + açık anahtar sabitleme + sunucu sertifikası denetimi |
| **Dış** | Kimlik doğrulama kodu: oturum anahtarı + cihaz ve sürüm bağlama (iki taraf birbirini doğrular) |

Asıl öğretici olan, aynı varlığın yaşam döngüsündeki **her aşamada** hangi kabukların bulunduğunu gösteren
matristir:

| Aşama | Kabuk 1 | Kabuk 2 | Kabuk 3 | Kabuk 4 |
| --- | :-: | :-: | :-: | :-: |
| Sunucudan kütüphaneye **aktarım** | ✔ | ✔ | ✔ (oturum anahtarı) | ✔ |
| Yerel veritabanında **saklama** | ✔ | ✔ | ✔ (MAC) | — |
| Java tarafında çözme ve native API çağrısı | ✔ | ✔ | — | — |
| Ödeme sırasında Java tarafı | ✔ | ✔ | — | — |
| Ödeme sırasında **native** taraf | ✔ | — | — | — |

Matrisin okunuşu:

- Varlık dışarıdan içeriye, yani kullanım anına yaklaştıkça kabuklar birer birer açılır. Ama en içteki aşamada
  bile (native tarafta ödeme hesabı) **bir kabuk kalır**: anahtar, whitebox biçimiyle kullanılır ve hiçbir zaman
  açık hale gelmez.
- Kabuklar yalnız **hassas** varlıklar için dört katlıdır. Daha az hassas ("normal") varlıklar beklemede tek bir
  kabukla, aktarımda yalnız dış iki kabukla korunur. Her varlığa en güçlü korumayı uygulamak performans ve bakım
  maliyetini gereksiz yere artırır; varlık tablosundaki C/I sınıflandırması bu kararın dayanağıdır.
- Kullanımda kalan açıklığı (bellekteki işlem anı) kabuklar değil, **RASP ve kod sağlamlaştırma** korur (4, 6 ve
  9. haftalar).
- Kütüphane yerel veritabanında (SQLite) kart profillerini, sınırlı kullanım anahtarlarını, kalan anahtar sayısını,
  kart durumunu, işlem kayıtlarını ve cihaz parmak izini tutar. Kayıt silindiğinde **ya da bir saldırı algılandığında**
  bu tabloların tamamı silinir.

!!! tip "Bugünün gözüyle"
    Kabuk 1'deki DES tabanlı biçim, ödeme şemalarının o dönemki kriptogram algoritmalarına uyum için seçilmişti;
    CBC + ayrı MAC birleşimi de dönemin yaygın tercihiydi. Bugün yeni bir tasarımda AES tabanlı bir whitebox ve AEAD
    kipleri tercih edilirdi. Matris fikrinin kendisi ise zamansızdır: projenizin güvenlik kılavuzunda (S7) her hassas
    varlık için bu tabloyu dolduracaksınız.

!!! success "Kural"
    Kritik bir varlığı korurken "hangi tek önlem?" diye değil, "hangi **katmanlar**?" diye sorun. Her aşamaya (taşıma,
    depolama, kullanım) bir kabuk koyun; kabukları **birbirinden bağımsız anahtarlarla** kurun ki birinin kırılması
    diğerini vermesin. En içe cihaz/sürüm bağlaması koyun.

!!! question "Değerlendirici nasıl test eder?"
    Değerlendirici güvenlik kabuğu matrisini ister ve her hassas varlık için **her aşamada** en az bir kabuğun varlığını
    doğrular; kabukların **doğru sırada** uygulandığını ve anahtarların **paylaşılmadığını** denetler. Sızma testinde tek
    bir kabuğu kırmak yetmez; korumaların **birlikte** (zincirleme) kırılması gerektiğini raporlar — bu, derinlemesine
    savunmanın çalıştığının kanıtıdır.

!!! warning "Sık hatalar ve kontrol listesi"
    - [ ] Her hassas varlık için üç aşamada da (aktarım/depolama/kullanım) kabuk var mı?
    - [ ] Kabuklar bağımsız anahtarlarla mı kuruldu (biri diğerini vermiyor)?
    - [ ] En iç kabuk cihaza/sürüme bağlı mı?
    - [ ] "Yalnız TLS'e güvenmeme" için mesaj düzeyi bir kabuk var mı?

---

## 15. Whitebox kriptografiye giriş (motivasyon)

Bütün bu haftanın gizli varsayımı şudur: **anahtar kullanıldığı an bellekte açık durur.** "Cihazın sahibi saldırgan"
(Hafta 1, beyaz kutu) senaryosunda saldırgan belleği okuyabilir, hata ayıklayıcı bağlayabilir; o anı yakalayıp anahtarı
çalabilir. Güvenli silme ve bellek kilitleme bu pencereyi **daraltır** ama kapatmaz.

**Whitebox kriptografi** bu soruna radikal bir cevaptır: algoritmayı (ör. AES) öyle bir tabloya gömer ki, çalışırken
bile **ham anahtar hiçbir zaman bellekte açık görünmez**; anahtar tabloların içine "pişirilmiştir". Böylece saldırgan
belleği tamamen görse bile anahtarı doğrudan okuyamaz. Bu, Bölüm 14'daki güvenlik kabuğunun **en iç**
katmanının gerçek dünyadaki hâlidir.

!!! note "Bu yalnız bir giriş"
    Whitebox'ın nasıl kurulduğunu, saldırılarını (BGE, DFA, DCA) ve neden "yayımlanmış tüm tasarımların kırıldığını"
    **Hafta 11**'de ayrıntılı işleyeceğiz. Bu hafta yalnız **neden var olduğunu** bilmeniz yeterli: bellekte açık anahtar
    problemi.

!!! warning "Whitebox sihirli değnek değildir"
    Whitebox kripto tek başına yeterli değildir: saldırgan anahtarı okuyamasa bile whitebox işlevinin **kendisini** bir
    "kâhin" (oracle) gibi çağırıp kullanabilir ya da kod parçasını kopyalayıp (code lifting) başka yerde çalıştırabilir.
    Bu yüzden whitebox her zaman **diğer kabuklarla** birlikte gelir: cihaz bağlama, RASP (Hafta 6), sunucu tarafı risk
    denetimi ve anahtar yenileme. Yine bir **güvenlik kabuğu**.

---

## 16. Yaygın yanlış anlamalar

!!! failure "\"Şifreledim, o hâlde güvende.\""
    Şifreleme yalnız **gizlilik** verir. Bütünlük için AEAD (ya da encrypt-then-MAC) gerekir; yoksa saldırgan veriyi
    fark edilmeden değiştirebilir. Ayrıca şifreleme, anahtar kötü yönetiliyorsa (koda gömülü, tuzsuz türetilmiş)
    işe yaramaz.

!!! failure "\"HTTPS/TLS var, o hâlde MITM imkânsız.\""
    TLS yalnız **doğru yapılandırıldığında** korur. İstemci sertifikayı doğrulamıyorsa, ana makine adını kontrol
    etmiyorsa ya da hataları yutuyorsa MITM hâlâ mümkündür (Demo 6). Ayrıca uç nokta ele geçmişse TLS'in içi de
    korunmalıdır ("yalnız TLS'e güvenmeme").

!!! failure "\"SHA-256 ile parolayı özetledim, güvenli.\""
    Düz (tuzsuz, tek turlu) SHA-256 bir parola koruması **değildir**: hızlıdır, tuz yoktur, aynı parola herkeste aynı
    özeti verir. Argon2id/scrypt/yüksek turlu PBKDF2 + rastgele tuz gerekir.

!!! failure "\"Nonce/IV gizli olmalı.\""
    Hayır. Nonce ve IV **gizli değildir** (şifreli metinle birlikte açık taşınır); yalnız **benzersiz/rastgele**
    olmaları gerekir. Gizli olan tek şey **anahtardır**.

!!! failure "\"Kendi şifreleme algoritmamı yazarsam kimse kıramaz.\""
    Güvenlik gizli algoritmaya değil (Kerckhoffs), **anahtarın gizliliğine** dayanmalıdır. Ev yapımı kripto neredeyse her
    zaman kırılır. Standart, açık, denenmiş yapıları kullanın.

---

## 17. Dönem projesi: bu hafta

Bu hafta güvenlik kılavuzunuzun **veri güvenliği** bölümlerini yazacaksınız. Vize teslimi için:

- [ ] **S5 — Varlık listesi (taslak):** Projenizdeki her hassas varlığı tabloya dökün. Her varlık için: nerede durur
      (dosya/DB/bellek), ne zaman oluşur/silinir, **gizlilik (C)** mi **bütünlük (I)** mi (ya da **I+**) gerekir, hangi
      mekanizmayla korunur.
- [ ] **S7 — Veri güvenliği + güvenlik kabuğu matrisi:** Her varlık için üç durumu (aktarımda/beklemede/kullanımda) ve
      her durumda hangi kabuğun sarıldığını gösterin. Güvenli silme politikanızı yazın.

```markdown title="S5 varlik tablosu sablonu (surekli kolonlar icin genisletin)"
| Varlik              | Konum        | C/I | Koruma mekanizmasi           |
| ------------------- | ------------ | --- | ---------------------------- |
| Oturum anahtari     | bellek       | C,I | HKDF + AES-GCM, kullaninca sil |
| Yerel veri anahtari | bellek       | C,I | KDF(parola,tuz) + cihaz baglama |
| Kart no (ornek)     | DB (sifreli) | C,I | AES-256-GCM alan sifreleme   |
```

```markdown title="S7 guvenlik kabugu matrisi sablonu"
| Varlik          | Asama    | Ic kabuk  -> ...  -> Dis kabuk   |
| --------------- | -------- | -------------------------------- |
| Oturum anahtari | aktarim  | cihaz -> depo -> mesaj -> TLS+pin |
| Oturum anahtari | depolama | cihaz -> AES-GCM                 |
| Oturum anahtari | kullanim | kisa omur + guvenli silme        |
```

!!! tip "Kurs gereksinim aileleri"
    Bu bölümler şu gereksinim ailelerini karşılar: `CEN429-DT` (aktarımda veri), `CEN429-DR` (beklemede veri),
    `CEN429-DU` (kullanımda veri), `CEN429-AS` (varlık koruma), `CEN429-CR` (kripto ve anahtarlar). Her gereksinim için
    S17 uyum matrisine bir satır ekleyin: gereksinim → durum → belge bölümü → kanıt (test/kod).

---

## 18. Sınıf etkinlikleri

!!! example "Etkinlik 1 — MITM'i kendi elinizle durdurun (15 dk, ikili)"
    Demo 6'yı WSL'de çalıştırın. Sonra `tls_istemci.c`'de `dogrula` modundaki `SSL_set1_host` satırını yoruma alıp
    yeniden derleyin. Saldırgan sunucuya (14444) bağlanınca ne değişir? Ana makine adı denetimi olmadan **hangi**
    saldırgan hâlâ yakalanır, hangisi kaçar? (İpucu: kendi imzalı vs. farklı ad ama geçerli zincir.)

!!! example "Etkinlik 2 — Nonce'u tekrarlatın (10 dk, bireysel)"
    Demo 1'in kodunda `kripto_rastgele(nonce, 12)` yerine `memset(nonce, 0, 12)` yazıp iki farklı dosyayı şifreleyin.
    İki şifreli metnin başındaki nonce alanları aynı mı? Şifreli metinlerin XOR'unu alıp düz metinlerin XOR'uyla
    karşılaştırın (Demo 2'deki gibi). Ne görüyorsunuz? Neden bu bir güvenlik açığı?

!!! example "Etkinlik 3 — Üç veri durumu haritası (15 dk, 3-4 kişilik grup)"
    Bir **"sağlık takip uygulaması"** düşünün: kullanıcı ölçümlerini telefona kaydeder, buluta yükler, doktoru görür.
    Bir tablo çizin: her hassas veri (ölçüm, kimlik, doktor notu) için üç durumdaki (aktarımda/beklemede/kullanımda)
    tehdidi ve önlemi yazın. En az **iki** varlık için güvenlik kabuğu matrisini doldurun.

!!! example "Etkinlik 4 — KDF maliyeti ayarı (10 dk, bireysel)"
    Demo 4'te tur sayılarına bir de 5.000.000 ekleyin. Kullanıcı girişinde kabul edilebilir en yüksek gecikme sizce ne
    (100 ms? 500 ms?)? O gecikmeyi veren tur sayısını bulun. Saldırganın makinesi sizinkinden 1000 kat hızlıysa bu tur
    sayısı onu ne kadar yavaşlatır?

---

## 19. Kod okuma alıştırmaları

!!! question "Okuma 1 — Bu TLS istemcisi güvenli mi?"
    ```c
    SSL_CTX *ctx = SSL_CTX_new(TLS_client_method());
    SSL *ssl = SSL_new(ctx);
    SSL_set_fd(ssl, sock);
    if (SSL_connect(ssl) == 1)
        printf("Baglanti guvenli!\n");
    ```
    ??? success "Cevap"
        **Hayır.** `SSL_CTX_set_verify` ve `SSL_set1_host` yok; hiçbir doğrulama yapılmıyor. Bu kod her sertifikayı
        (saldırganınki dahil) kabul eder. "Baglanti guvenli" mesajı yanıltıcıdır — yalnız pasif dinleyiciye karşı
        koruma vardır, aktif MITM'e karşı yoktur (Demo 6, Senaryo 1).

!!! question "Okuma 2 — Bu çözme neden tehlikeli?"
    ```c
    EVP_DecryptUpdate(c, duz, &len, sc, sc_boy);
    EVP_DecryptFinal_ex(c, duz + len, &len);   /* dönüş değeri okunmuyor */
    kullan(duz);
    ```
    ??? success "Cevap"
        `EVP_DecryptFinal_ex`'in dönüş değeri (GCM'de etiket doğrulaması) **kontrol edilmiyor**. Etiket tutmasa bile
        `kullan(duz)` çağrılıyor — kurcalanmış veri kabul edilir. Doğrulama başarısızsa çıktı **kullanılmamalı** (Demo 1).

!!! question "Okuma 3 — Bu anahtar türetme nerede zayıf?"
    ```c
    unsigned char anahtar[32];
    SHA256((unsigned char*)parola, strlen(parola), anahtar);
    ```
    ??? success "Cevap"
        Tek turlu, **tuzsuz** SHA-256 bir parola KDF'si değildir: hızlıdır (kaba kuvvet ucuz), tuz yoktur (rainbow
        tablo çalışır), aynı parola herkeste aynı anahtarı verir. PBKDF2/scrypt/Argon2id + rastgele tuz gerekir (Demo 4).

---

## 20. Kendi başına çalış

Bu alıştırmalar not verilmez; pekiştirme içindir. Hepsi kendi bilgisayarınızda, `code/week-03` demoları üzerinde yapılır.

??? question "Alıştırma 1 — Kolay: AAD'nin gücü"
    Demo 1'e ilişkili veri (AAD) ekleyin: şifrelerken `kripto_gcm_sifrele`'ye AAD olarak `"surum=1"` verin, çözerken
    `"surum=2"` verin. Ne olur? AAD ne işe yarar?

    ??? success "Beklenen sonuç"
        Etiket tutmaz, çözme reddedilir. AAD şifrelenmez ama **doğrulanır**; şifreli gövde başka bir bağlama
        (farklı sürüm, farklı kayıt) taşınamaz.

??? question "Alıştırma 2 — Kolay: Tuzu sabitleyin"
    Demo 4'te iki tuzu da aynı yapın. İki "farklı kullanıcı" artık aynı anahtarı mı alıyor? Bu neden kötü?

??? question "Alıştırma 3 — Orta: CBC + rastgele IV"
    Demo 1'i AES-256-CBC ile yeniden yazın (kip değişecek; bütünlük için ayrıca HMAC ekleyin — "encrypt-then-MAC").
    Neden CBC tek başına yetmez? GCM ile karşılaştırın: hangisi daha az hata yapmaya açık?

    ??? tip "İpucu"
        CBC yalnız gizlilik verir; MAC'siz CBC'de saldırgan bitleri değiştirebilir (padding oracle). GCM tek çağrıda
        ikisini birden yapar.

??? question "Alıştırma 4 — Orta: Pinning'i kırın (kendi sertifikanızla)"
    Demo 6'da saldırgan sertifikasını **gerçek** sunucunun anahtarıyla üretin (aynı `gercek.key`'i kullanın). Pinleyen
    istemci artık kabul eder mi? Bu neden pinning'in "anahtarı" pinlediğini, sertifikayı değil, gösterir?

??? question "Alıştırma 5 — Orta: Maskeleme"
    Demo 7'ye bir "maskeli görünüm" ekleyin: kart numarasını çözüp yalnız son 4 hanesini gösterin
    (`**** **** **** 4242`). Maskeleme ile şifrelemenin farkı ne? Hangisi loglar için uygun?

??? question "Alıştırma 6 — Orta: Kabuğa beşinci katman"
    Demo 9'a bir HMAC katmanı ekleyin (her kabuğun dışına ayrı bir MAC). Toplam boyut nasıl değişir? Bir kabuğun MAC'i
    tutmazsa hangi katmanda durursunuz?

??? question "Alıştırma 7 — Zor: HKDF'yi elle doğrulayın"
    `cen429_kripto.h`'daki HKDF'yi RFC 5869 Test Case 1 ile karşılaştırın (IKM, tuz, info değerleri RFC'de). Çıktınız
    RFC'nin OKM'siyle birebir aynı mı? (İpucu: `code`'daki test bunu zaten yapıyor.)

??? question "Alıştırma 8 — Zor: Nonce sayacı taşması"
    Bir sistem 96 bitlik nonce'u sayaç olarak kullanıyor ve her mesajda 1 artırıyor. Kaç mesajdan sonra nonce tekrar
    eder? Rastgele nonce'ta çakışma olasılığı ne zaman kaygı verir (doğum günü sınırı)?

??? question "Alıştırma 9 — Zor: Whitebox motivasyonu"
    Demo 8'i çalıştırırken (WSL) programı `gdb` ile durdurup belleği inceleyin (Hafta 1 Demo 2'deki gcore yöntemi).
    Sır silinmeden **önce** bellekte görünüyor mu? Bu, whitebox kriptografinin hangi problemi çözmeye çalıştığını nasıl
    açıklar?

??? question "Alıştırma 10 — Orta: AES-GCM mi ChaCha20-Poly1305 mi?"
    Bir mobil uygulama, AES donanım hızlandırması **olmayan** eski bir telefonda çalışacak. Hangi AEAD'yi seçersiniz ve
    neden? Aynı uygulama modern bir sunucuda çalışsaydı seçiminiz değişir miydi?

    ??? success "Beklenen sonuç"
        Donanım AES'i olmayan cihazda **ChaCha20-Poly1305** genelde daha hızlı ve yan kanala dirençlidir. Modern
        sunucuda AES-NI olduğu için **AES-GCM** çok hızlıdır. İkisi de AEAD'dir; güvenlik açısından ikisi de kabul
        edilir, seçim performans/platform kaynaklıdır.

??? question "Alıştırma 11 — Zor: Sabit zamanlı karşılaştırma"
    Bir MAC doğrulaması `if (memcmp(beklenen, gelen, 32) == 0)` ile yapılıyor. Bu neden bir **zamanlama** sızıntısı
    olabilir? Nasıl düzeltirsiniz?

    ??? tip "İpucu"
        `memcmp` ilk farklı baytta durur; saldırgan cevap süresini ölçerek doğru MAC'i bayt bayt tahmin edebilir.
        Çözüm: `CRYPTO_memcmp` gibi **sabit zamanlı** karşılaştırma (tüm baytları her zaman karşılaştırır).

??? question "Ek alıştırma A — Kolay: rand() ne kadar tahmin edilebilir?"
    `srand(time(NULL))` ile 16 baytlık bir "anahtar" üreten küçük bir program yazın ve anahtarı onaltılık yazdırın.
    Sonra ikinci bir program yazın: son 10 dakikanın her saniyesini tohum olarak deneyip aynı anahtarı bulsun. Kaç
    denemede buldu? Ardından ilk programı `kripto_rastgele()` (`code/common/cen429_kripto.h`) ile yeniden yazın.

??? question "Ek alıştırma B — Kolay: modulo sapmasını ölçün"
    0–255 arasında tekdüze baytlar üretip `bayt % 10` ile bir milyon rakam çıkarın; her rakamın kaç kez çıktığını
    sayın. Sonra "Rastgele sayılar" bölümündeki `aralikta_rastgele(10)` ile tekrarlayın. Farkı tablo olarak yazın.

    ??? tip "Beklenen sonuç"
        256 = 25·10 + 6 olduğu için 0–5 rakamları 6–9'dan yaklaşık %4 daha sık çıkar (26/256'ya karşı 25/256). Reddetme
        yöntemiyle bütün rakamlar istatistiksel olarak eşit çıkar.

??? question "Ek alıştırma C — Orta: AEAD'de Final'ı unutmak"
    "Kripto API'lerini doğru kullanmak" bölümündeki `aes_gcm_coz` fonksiyonundan `EVP_DecryptFinal_ex` denetimini
    kaldırın (yalnız `EVP_DecryptUpdate`'in yazdığı tamponu kullanın). Şifreli metnin bir baytını değiştirip çözün.
    Program ne döndürüyor? Sonra denetimi geri koyup aynı testi yapın. Bu farkı bir cümleyle bir değerlendirme
    raporuna yazılacak bulgu olarak ifade edin.

??? question "Ek alıştırma D — Orta: zarflama ile anahtar yenileme"
    Beş küçük dosyayı her biri kendi rastgele DEK'iyle AES-GCM ile şifreleyin; DEK'leri bir KEK ile sarıp dosya
    başlığına anahtar sürümüyle birlikte yazın. Sonra KEK'i yenileyin: yalnız sarılmış DEK'leri yeniden sarın. Dosya
    içeriklerinin (şifreli metinlerin) hiç değişmediğini özetleriyle gösterin.

??? question "Ek alıştırma E — Orta: fail-open avı"
    "Eleştirel okuma: sessizce açılan kapı" bölümündeki deseni kendi yazdığınız ya da daha önce yazdığınız bir
    projede arayın: bir güvenlik denetiminin `catch` bloğunda ya da "bulunamadı" dalında işleme devam eden bir yer
    var mı? Her bulgu için "hangi girdiyle tetiklenir, sonuç ne olur, nasıl kapalı kalarak başarısız olur" sorularını
    cevaplayın.

??? question "Ek alıştırma F — Orta: günlükte kart numarası"
    Bir günlük dosyasında 13–19 haneli, Luhn denetimini geçen sayı dizilerini bulup son dört hanesi dışında maskeleyen
    bir süzgeç yazın. Test için yalnız **sentetik** numaralar kullanın (ör. Luhn'u geçen ama gerçek bir karta ait
    olmayan, kendi ürettiğiniz diziler).

??? question "Ek alıştırma G — Zor: kendi projeniz için kabuk matrisi"
    Projenizin en hassas iki varlığı için "Sahadaki kabuk matrisi" biçiminde bir tablo doldurun: aşamalar (aktarım,
    saklama, bellekte işlem) × kabuklar. Her hücrede hangi algoritmanın, hangi anahtarın ve hangi bağlamanın
    kullanıldığını yazın; boş kalan hücreler için gerekçe verin.

---

## 21. Kendini sınama

??? question "1. Verinin üç hâli nedir? Her biri için bir tehdit ve bir önlem söyleyin."
    Aktarımda (dinleme/MITM → TLS+pinning), beklemede (dosya çalınması → AEAD alan şifreleme), kullanımda (bellek
    dökümü → güvenli silme + kısa ömür).

??? question "2. AEAD nedir? AES-CTR'den farkı?"
    AEAD gizlilik **ve** bütünlük+kimliği birlikte sağlar (şifreli metin + doğrulanan etiket). AES-CTR yalnız
    gizlilik verir; MAC eklenmezse kurcalama fark edilmez.

??? question "3. Nonce yeniden kullanımı GCM/CTR'de neden felakettir?"
    Aynı anahtar akışı iki mesajda kullanılır; `C1 ⊕ C2 = P1 ⊕ P2` olur, anahtar akışı sızar. Bir düz metin bilinirse
    diğeri çözülür (GCM'de kimlik doğrulama da çöker).

??? question "4. ECB neden kullanılmaz?"
    Her bloğu bağımsız şifreler; aynı düz metin bloğu aynı şifreli bloğu verir, desenler sızar (ECB pengueni).

??? question "5. Tuz ile nonce arasındaki fark nedir? İkisi de gizli mi?"
    Tuz paroladan anahtar türetmede rainbow tabloyu engeller; nonce şifreleme kipinde anahtar akışını benzersizleştirir.
    İkisi de **gizli değildir**; tuz rastgele+benzersiz, nonce anahtar başına tekrarsız olmalıdır.

??? question "6. PBKDF2'de tur sayısı neden yüksek olmalı? Bugünkü öneri?"
    Her parola denemesini pahalılaştırır. OWASP 2023: PBKDF2-HMAC-SHA256 için ≥ 600.000 tur; mümkünse Argon2id.

??? question "7. HKDF'nin iki aşaması nedir? 'info' ne işe yarar?"
    Extract (ana sır+tuz → PRK) ve Expand (PRK+info → anahtar). `info` amaç/oturum ayrımı sağlar; farklı info farklı
    anahtar verir.

??? question "8. İleri gizlilik (forward secrecy) nedir?"
    Bugünkü anahtar sızsa bile eski oturumların çözülememesi. Tek yönlü zincir/geçici DH ile sağlanır; TLS 1.3'te
    varsayılan.

??? question "9. TLS 1.3 el sıkışmasında sunucunun kimliği nasıl doğrulanır?"
    Sunucu sertifikasını sunar ve özel anahtarıyla el sıkışmayı imzalar (CertificateVerify). İstemci zinciri, süreyi ve
    **ana makine adını** doğrular (gerekirse pin).

??? question "10. OpenSSL istemcisinde en tehlikeli varsayılan nedir?"
    Sertifikayı **doğrulamamak**. `SSL_VERIFY_PEER` ve `SSL_set1_host` açıkça ayarlanmazsa MITM mümkündür.

??? question "11. Sertifika sabitleme (pinning) neyi, hostname doğrulama neyi yakalar?"
    Hostname, yanlış ad taşıyan sertifikayı yakalar; pinning, geçerli zincirli ama **beklenmeyen anahtarlı** (mis-issued)
    sertifikayı yakalar.

??? question "12. TOFU nedir ve sınırı nedir?"
    İlk bağlantıdaki anahtarı hatırlayıp sonra değişirse uyarmak (SSH modeli). İlk bağlantı korumasızdır; PKI kadar
    güçlü değildir.

??? question "13. Alan şifreleme ile veri maskeleme farkı?"
    Alan şifreleme geri döndürülebilir (anahtarla açılır), gizlilik için. Maskeleme genelde geri döndürülemez/kısmidir,
    gereksiz maruz kalmayı azaltmak için (log, ekran).

??? question "14. Kullanımda veriyi korumanın üç katmanı?"
    Döküm engelleme (RLIMIT_CORE/SetErrorMode), bellek kilitleme (mlock/VirtualLock), güvenli silme
    (OPENSSL_cleanse/SecureZeroMemory) + kısa ömür.

??? question "15. Güvenlik kabuğu nedir? Bir örnek verin."
    Bir sırrı iç içe bağımsız katmanlarla sarmak. Örnek: cihaz bağlama → depolama AES-GCM → mesaj AEAD → TLS+pinning
    (Demo 9). Saldırgan hepsini kırmalı.

??? question "16. Cihaz bağlama nasıl doğru yapılır?"
    Cihaz parmak izinden **HKDF ile tuzlanmış** türetme ve **AEAD ile sarma**; tuzsuz özet ya da XOR değil.

??? question "17. Whitebox kriptografi hangi problemi çözmeye çalışır?"
    Kullanım anında anahtarın bellekte açık durması problemini: anahtarı tablolara gömerek ham hâlini hiç
    göstermemek (beyaz kutu saldırgana karşı).

??? question "18. 'Yalnız TLS'e güvenmeme' ne demektir?"
    Uç noktalar güvenilmez olabildiği için TLS'in içine bir kat daha (mesaj düzeyi AEAD+MAC) koymak; TLS aşılsa bile
    gövde şifreli kalır.

??? question "19. GCM etiketi kaç bayttır ve neyin fonksiyonudur?"
    16 bayt; şifreli metnin, AAD'nin ve anahtarın fonksiyonudur. Bu yüzden saldırgan anahtarsız doğru etiket üretemez.

??? question "20. Aynı düz metni AES-GCM ile iki kez şifrelerseniz şifreli metinler aynı mı olur?"
    Hayır — nonce her seferinde farklı olduğu için şifreli metin ve etiket de farklı olur. Aynı çıkması nonce tekrarına
    işarettir (tehlike).

??? question "Ek soru 1. `rand()` neden güvenlikle ilgili değerler için kullanılamaz? Yerine ne kullanılır?"
    İstatistiksel bir üreteçtir; tohum ya da birkaç çıktı bilinirse bütün dizi hesaplanır. Yerine işletim sisteminin
    CSPRNG'si: Linux `getrandom`, Windows `BCryptGenRandom`, OpenSSL `RAND_bytes`.

??? question "Ek soru 2. `EVP_DecryptUpdate` açık metni yazdı ama `EVP_DecryptFinal_ex` başarısız döndü. Ne yapmalısınız?"
    Açık metni kullanmadan silmeli ve işlemi reddetmelisiniz; etiket tutmamıştır, veri kurcalanmış olabilir.

??? question "Ek soru 3. MAC karşılaştırmasında `memcmp` neden sakıncalıdır?"
    İlk farklı baytta durur; süre, kaç baytın doğru olduğunu sızdırır (zamanlama saldırısı). Sabit zamanlı
    karşılaştırma (`CRYPTO_memcmp`) kullanılır.

??? question "Ek soru 4. Kripto-periyot nedir? Süresi dolan bir anahtar hemen silinir mi?"
    Anahtarın kullanılmasına izin verilen süredir. Süre dolunca yeni veriyi şifrelemekte kullanılmaz ama eski veri
    yeniden şifrelenene kadar çözme için tutulabilir; sonra imha edilir.

??? question "Ek soru 5. Zarflamada KEK yenilendiğinde neden bütün veri yeniden şifrelenmez?"
    Veri DEK'lerle şifrelidir; KEK yalnız DEK'leri sarar. KEK değişince yalnız küçük sarılmış DEK'ler yeniden sarılır.

??? question "Ek soru 6. OpenSSL istemcisinde `SSL_set1_host` çağrılmazsa ne olur?"
    Zincir doğrulaması yapılsa bile sertifikadaki ad denetlenmez; saldırganın kendi alan adı için aldığı geçerli
    bir sertifika kabul edilir.

??? question "Ek soru 7. Sabitlemede neden sertifika yerine SPKI özeti ve neden bir yedek pin kullanılır?"
    SPKI özeti, sertifika aynı anahtarla yenilendiğinde değişmez. Yedek pin, birincil anahtar kaybolduğunda ya da ele
    geçtiğinde uygulamanın bağlanamaz hale gelmesini (tuğlalaşmasını) önler.

??? question "Ek soru 8. 'Fail-open' ne demektir? Bir örnek verin."
    Bir güvenlik denetiminin hata durumunda "geçti" sonucuna düşmesidir. Örnek: sabitleme kodunda anahtar deposu
    hatasının yakalanıp yalnız yazdırılması ve bağlantının kabul edilmesi.

??? question "Ek soru 9. Takma adlandırmada kimlik numarasının düz SHA-256 özeti neden yetmez?"
    Olası değer sayısı küçüktür; saldırgan bütün kimlik numaralarının özetini hesaplayıp eşleştirebilir. Gizli
    anahtarlı HMAC kullanılır ve anahtar veri kümesinden ayrı tutulur.

??? question "Ek soru 10. Tokenizasyon bir uygulamanın PCI DSS kapsamını neden küçültür?"
    Uygulama, veritabanları ve günlükler gerçek kart numarası yerine anlamsız belirteç tutar; gerçek veri yalnız
    küçük ve iyi korunan belirteç kasasında durur.

??? question "Ek soru 11. Sahadaki kabuk matrisinde, ödeme sırasında native tarafta neden yalnız bir kabuk kalır ve bu yeterli midir?"
    Anahtarın hesaplamada kullanılabilmesi için dış kabuklar açılmıştır; kalan kabuk whitebox biçimidir, yani anahtar
    yine açık değildir. Tek başına yeterli değildir: o andaki koruma RASP ve kod sağlamlaştırmayla tamamlanır.

---

## 22. Quiz-1 tarzı örnek sorular

!!! note "Quiz-1 (8. hafta) bu tarz kısa soru + kod okuma içerir"
    1. (Çoktan seçmeli) Aşağıdakilerden hangisi **hem** gizlilik **hem** bütünlük sağlar?
       a) AES-CTR · b) SHA-256 · c) **AES-GCM** · d) AES-ECB
    2. (Doğru/Yanlış) "Nonce gizli tutulmalıdır." → **Yanlış** (benzersiz olmalı, gizli değil).
    3. (Kısa cevap) Bir istemci TLS'te sertifikayı doğruluyor ama `SSL_set1_host` çağırmıyor. Hangi saldırgan hâlâ
       başarılı olur? → Geçerli zincirli ama **başka bir ad** için verilmiş sertifikaya sahip saldırgan.
    4. (Kod okuma) `EVP_DecryptFinal_ex`'in dönüşü kontrol edilmeyen bir GCM çözme kodunda hangi güvenlik özelliği
       kaybolur? → **Bütünlük/kimlik doğrulama** (kurcalanmış veri kabul edilir).
    5. (Eşleştirme) PBKDF2 ↔ CPU maliyeti · Argon2id ↔ CPU+bellek · HKDF ↔ oturum anahtarı türetme · pinning ↔ SPKI.

---

## 23. Kaynaklar ve ileri okuma

**Ders kitabı** — J. Viega, M. Messier, *Secure Programming Cookbook for C and C++*, O'Reilly, 2003:

- Tarif 4.9 (tuz/nonce/IV), 4.10 (paroladan anahtar — PBKDF2), 4.11 (ana sırdan anahtar), 4.13 (anahtar malzemesi
  yönetimi)
- Tarif 5.15 (dosya/disk şifreleme), 6.18 (şifreleme + bütünlük birlikte)
- Tarif 8.19 (PKI'siz doğrulama / TOFU), 8.20–8.21 (ileri gizlilik)
- Tarif 9.1–9.3 (SSL istemci/sunucu), 10.7–10.9 (sertifika doğrulama, ana makine adı, beyaz liste = pinning)
- Tarif 13.2–13.3 (bellekten güvenli silme, belleğin diske yazılmasını önleme)
- Tarif 11.1–11.4 (rastgele sayı türleri, Unix ve Windows altyapısı), 11.11 (aralıkta sapmasız rastgele tamsayı)
- Tarif 9.4 (Windows'ta WinInet ile güvenli iletişim — bugün WinHTTP/Schannel)

**Açık standartlar ve kaynaklar**

- NIST SP 800-57 Part 1 (anahtar yönetimi, kripto-periyot), SP 800-90A (rastgele bit üreteçleri), SP 800-38G (FF1,
  biçimi koruyan şifreleme), SP 800-38C (CCM).
- PCI DSS v4.0 (kart numarasının gösterimde maskelenmesi, tokenizasyon); KVKK ve GDPR'da takma adlandırma ve
  anonimleştirme.
- M. Georgiev ve diğ., "The Most Dangerous Code in the World: Validating SSL Certificates in Non-Browser Software",
  ACM CCS 2012.
- MITRE CWE: CWE-330 (yetersiz rastgelelik), CWE-338 (zayıf PRNG), CWE-208 (zamanlama farkıyla bilgi sızması),
  CWE-297 (ana makine adı denetimi eksik), CWE-636 (fail-open: güvenli olmayan başarısızlık), CWE-359 (kişisel veri
  ifşası), CWE-532 (günlüğe hassas veri yazma).

- NIST SP 800-38D (AES-GCM), SP 800-132 (PBKDF2), SP 800-108 / RFC 5869 (HKDF), RFC 8439 (ChaCha20-Poly1305),
  RFC 9106 (Argon2), RFC 7914 (scrypt), RFC 8446 (TLS 1.3).
- OWASP: Password Storage Cheat Sheet, Transport Layer Security Cheat Sheet, Certificate and Public Key Pinning,
  MASVS-CRYPTO / MASVS-NETWORK.
- MITRE CWE: CWE-295 (yanlış sertifika doğrulama), CWE-323 (nonce/IV yeniden kullanımı), CWE-327 (zayıf kripto),
  CWE-916 (yetersiz maliyetli parola özeti), CWE-311 (şifrelemenin eksikliği).

??? abstract "Sözlük"
    | Terim | Türkçe | Kısa tanım |
    | --- | --- | --- |
    | AEAD | Kimlik doğrulamalı şifreleme | Gizlilik + bütünlük + kimliği birlikte veren şifreleme (AES-GCM) |
    | Nonce | Bir kez kullanılan sayı | Anahtar başına tekrar etmemesi gereken, gizli olmayan değer |
    | IV | Başlangıç vektörü | Kipe rastgelelik veren, gizli olmayan başlangıç değeri |
    | Salt / Tuz | Tuz | Paroladan anahtar türetmede rainbow tabloyu engelleyen rastgele değer |
    | KDF | Anahtar türetme fonksiyonu | Paroladan/sırdan anahtar üreten fonksiyon (PBKDF2, HKDF, Argon2id) |
    | MAC | Mesaj kimlik doğrulama kodu | Paylaşılan anahtarla bütünlük+kimlik kanıtı (HMAC) |
    | Forward secrecy | İleri gizlilik | Bugünkü anahtar sızsa bile eski oturumların güvende kalması |
    | Pinning | Sabitleme | Beklenen belirli anahtarı/sertifikayı zorunlu kılma (SPKI) |
    | TOFU | İlk kullanımda güven | İlk görülen anahtarı hatırlayıp değişince uyarma (SSH modeli) |
    | Data at rest / in transit / in use | Beklemede / aktarımda / kullanımda veri | Verinin üç hâli |
    | Security shell | Güvenlik kabuğu | Bir sırrı iç içe bağımsız koruma katmanlarıyla sarma |
    | Whitebox crypto | Beyaz kutu kriptografi | Anahtarı tablolara gömüp bellekte açık göstermeyen gerçekleştirim |
    | Device binding | Cihaz bağlama | Anahtarı belirli cihaza/sürüme bağlayıp başka yerde açılamaz kılma |
    | Hybrid encryption | Hibrit şifreleme | Asimetrik ile simetrik anahtar taşıyıp veriyi simetrik şifreleme (TLS) |
    | Encrypt-then-MAC | Önce şifrele sonra MAC | Şifreli metnin üzerine MAC koyma; AEAD'nin içerideki doğru sırası |
    | Tokenization | Tokenizasyon | Gerçek değeri anlamsız bir token ile değiştirip kasada saklama |
    | Constant-time compare | Sabit zamanlı karşılaştırma | Sırları/MAC'leri zamanlama sızdırmadan karşılaştırma (`CRYPTO_memcmp`) |
    | AAD | İlişkili veri | AEAD'de şifrelenmeyen ama doğrulanan (bağlanan) ek veri |
