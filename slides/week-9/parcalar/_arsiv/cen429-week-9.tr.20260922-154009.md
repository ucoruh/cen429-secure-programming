---
marp: true
theme: cen429
paginate: true
lang: tr
title: "CEN429 Hafta 9 — Gelişmiş Kod Gizleme ve Çeşitlendirme"
author: "Dr. Öğr. Üyesi Uğur CORUH"
header: "CEN429 Güvenli Programlama · Hafta 9"
footer: "RTEÜ Bilgisayar Mühendisliği · 2026-2027 Güz"
---


<!-- _class: baslik -->
<!-- _paginate: false -->

# Gelişmiş Kod Gizleme ve Çeşitlendirme

**CEN429 Güvenli Programlama — Hafta 9**

Dr. Öğr. Üyesi Uğur CORUH · 13.11.2026

<!--
Konuşma notu: Bu hafta ileri kod gizleme kurallarını işliyoruz. Çerçeve: gizleme kırılamaz kılmaz, pahalı kılar. Her tekniği bir güvenlik kuralı olarak veriyoruz — neyi korur, maliyeti, sınırı, nasıl ölçülür. Anahtar koruması gizleme değildir (11. hafta).
-->

---

# Bugünün planı (3 saat)

| Saat | Konu |
| --- | --- |
| 1 | Gizleme neden kural? · beyaz kutu/MATE · taksonomi · "koruma kuralı" şablonu |
| 2 | Kontrol akışı kuralları: opak yüklem/döngü, aritmetik, sahte işlem/ölü dal, düzleştirme, rastgele çıkış |
| 3 | Veri kuralları · sanallaştırma/derleyici/dinamik · çeşitlendirme · ölçme · katmanlı yer |

Ana kaynaklar: **teknik kılavuz** (native karşı önlemler) + **Cookbook Bölüm 12**

---

<!-- _class: bolum -->

# 1. Gizleme neden bir kuraldır?

---

<!-- _class: yogun -->

# Beyaz kutu / MATE saldırgan

- Program **saldırganın makinesinde** çalışır: ikili dosya onda, bellek onda, sınırsız deneme
- Sunucu tarafı denetimler burada **yok**
- Dürüst gerçek: yeterli zaman + beceri → **her gizleme çözülür**

**Öyleyse amaç:** kırmayı *imkânsız* değil, **ekonomik olmaktan çıkarmak**

---

# Gizlemenin üç kuralı

1. **Maliyeti değerin üstüne çıkar** — saldırı, korunan varlıktan pahalı olsun
2. **Otomasyonu kır** — bir kırık her kopyayı açmasın → **çeşitlendirme**
3. **Diğer katmanlara zaman kazandır** — anahtar/sürüm yenilenene kadar dayan

Gizleme tek başına savunma değil; **derinlemesine savunmanın** bir katmanı

---

<!-- _class: yogun -->

# Taksonomi: beş aile

| Aile | Neyi gizler? | Örnek |
| --- | --- | --- |
| Düzen | Ad, biçim, meta veri | Sembol gizleme, ad anlamsızlaştırma, log kaldırma |
| Veri | Sabit, dize, değişken | Dize kodlama, sabit dönüşümü, opak boolean |
| Kontrol akışı | Algoritmanın yapısı | Düzleştirme, opak yüklem, sahte/ölü dal |
| Önleyici | Analiz aracının işi | Tersine derleyiciyi yanıltma, çalışma anı çözme |
| Sanallaştırma | Makine kodunun kendisi | Fonksiyonu özel VM bayt koduna çevirme |

---

<!-- _class: yogun -->

# Ne verir, ne vermez?

| Verir | Vermez |
| --- | --- |
| Statik analize gecikme | Bir sırrın gizliliği (→ kripto) |
| Otomatik saldırıya direnç (çeşitlendirme) | Bellekten okumaya koruma (→ RASP, whitebox) |
| Diğer katmanlara zaman | Kalıcı güvenlik ("kırılamaz" yoktur) |
| Ölçülebilir maliyet artışı | Bedava koruma |

⚠️ **En sık hata:** gizlemeyi *anahtar saklama* sanmak

---

# "Koruma kuralı" şablonu

```text
KURAL K-xx: <teknik>
  Neyi korur?  : hangi varlık / kod bölümü
  Hangi tehdit?: statik / dinamik / otomatik / kurcalama
  Nasıl?       : kavram düzeyinde bir cümle
  Maliyet      : boyut, hız, bakım, hata ayıklama
  Sınır        : neyi korumaz
  Ölçüm        : etkinlik nasıl doğrulanır
```

Projede **S9** bu şablonla yazılır — ölçümsüz koruma "iddia"dır

---

<!-- _class: bolum -->

# 2. Kontrol akışı kuralları

---

# K-01 · Opak yüklem ve döngü

```c
/* x*(x+1) daima çift → daima true, ama statik kanıtı zor */
static int opak_dogru(unsigned x){ return ((x*(x+1))&1u)==0; }
if (opak_dogru(sayac)) gercek(); else sahte();  /* sahte: ölü yol */
```

- Döngüler düzleştirmenin **içine** gizlenir; "kaç kez döner" CFG'den okunmaz
- **Sınır:** bilinen kalıplar tanınır → çeşitlendir

---

# K-02 · Aritmetik kodlama

```c
/* 0x2A doğrudan yazılmaz; iki parçadan üretilir */
static uint8_t esik(void){ uint8_t a=0x37,b=0x1D; return a^b; } /* 0x2A */
```

- `a+b` ≡ `(a^b)+2*(a&b)` — sonuç aynı, görünüm karmaşık
- **Sınır:** MBA sadeleştiriciler açar → tek başına zayıf, kontrol akışıyla birleştir

---

<!-- _class: yogun -->

# K-03 · Sahte işlem ≠ ölü dal

| | Sahte işlem | Ölü dal |
| --- | --- | --- |
| Çalışır mı? | **Evet** (sonuç değişmez) | **Hayır** (opak yüklemle) |
| Amaç | Gerçek işlemi kalabalıkta gizle | Sahte yürütme yolu göster |
| Örnek | `crc ^= (s ^ s);` | `if(opak_yanlis()){...}` |

**Sınır:** ölü kod eleme, opak yüklem çözülürse dalı atar

---

# K-04 · Kontrol akışı düzleştirme

```c
int durum = BASLA;
for(;;) switch(durum){
  case BASLA: durum=ADIM1; break;
  case ADIM1: durum = kosul?ADIM2:HATA; break;
  case ADIM2: durum=BITIR; break;
  case HATA:  return RED;
  default:    return RED;   /* rastgele çıkış buraya */
}
```

Dikey akış → yatay; sıra yalnız **durum değişkeninden** okunur

---

# K-04 · Düzleştirmeyi güçlendirenler

Tek başına düzleştirme zayıftır. Güç, birlikte gelenlerden:

- **K-02** durum değerlerini gizle (ardışıklık görünmesin)
- **K-03** sahte + ölü bloklar
- **K-05** rastgele çıkış
- **K-01** geçişleri opak yüklemlere bağla

**Ölçüm:** CFG düğüm/kenar sayısı, denetimi izleme süresi

---

# K-05 · Rastgele çıkış · K-06 · çağrı gizleme

```c
if (!imza_gecerli(p)) { durum = kararsiz_deger(); break; } /* →default */
```

- **K-05:** hata **nerede** yakalandı, akıştan okunmaz; tek-bayt yaması yetmez
- **K-06:** kritik yolda `memcmp` yerine kendi sabit-zamanlı `esit_mi`; sahte parametreler
- ⚠️ Kendi sürümün **sabit zamanlı** olsun — yan kanal açma

---

<!-- _class: bolum -->

# 3. Veri ve program bütünü kuralları

---

# K-07 · Dize kodlama

```c
static const uint8_t GIZLI[]={0x3B,0x2A,0x2E,0x2E,0x2D}; /* sentetik */
for(size_t i=0;i<sizeof GIZLI;i++) tmp[i]=GIZLI[i]^0x5A; /* çöz */
isle(tmp,sizeof GIZLI); memset_s_benzeri(tmp,sizeof tmp); /* hemen sil */
```

- `strings` hassas metni **bulamamalı**
- **Sınır:** çalışırken bellekte açık; çözme anahtarı da içeride → parçala/dağıt

---

<!-- _class: yogun -->

# K-08 · Opak boolean · K-09 · değişken bölme

```c
typedef struct { uint32_t a,b; } Karar;
static Karar izin_ver(void){ return (Karar){0xA3C1,0x5C3E}; } /* a^b==0xFFFF */
static int karar_izin_mi(Karar k){ return (k.a^k.b)==0xFFFF; }
```

- Sonuç düz `0/1` değil → **tek bayt** çeviremez (birden çok noktaya bağlı)
- K-09: değişkeni böl/birleştir, tampon sırası/boyutu değiştir, kullanınca doldur
- **Ölçüm:** sonucu çevirmek için gereken bağımsız nokta > 1

---

<!-- _class: yogun -->

# Program bütünü: K-10..K-12

| Kural | Ne | Maliyet / sınır |
| --- | --- | --- |
| K-10 Sanallaştırma | Fonksiyon → özel VM bayt kodu | **Yüksek** hız/bakım; VM çözülürse hepsi açılır |
| K-11 Derleyici (O-LLVM) | Düzleştirme/sahte akış otomatik, tohumla | Kalıplar tanınır; araçla güncel kal |
| K-12 Dinamik şifreleme | Kod şifreli durur, anında çözülür | DEP/NX, W^X ile **çatışır**; risklidir |

⚠️ Bir koruma eklerken başka bir korumayı kapatma — net kazancı ölç

---

# Java/yönetilen taraf (5. haftadan)

- Native tarafın karşılığı: **ProGuard/R8** ad gizleme + ölü kod eleme + küçültme
- `-keep` ve reflection ile çağrılan API'ler
- İki taraf **çapraz denetler**: Java native'in sağlamasını, native Java'nın bütünlüğünü (RASP, 6. hafta)

---

<!-- _class: bolum -->

# 4. Çeşitlendirme, ölçme, dayanıklılık

---

# Çeşitlendirme: otomasyonu kır

- **Uzayda:** her yapı farklı tohum → opak yüklem/blok/durum değişir
- **Zamanda:** her sürüm yeni düzen → eski saldırı bozulur
- Gücü değil, **ölçeklenmeyi** engeller

**Ölçüt:** iki tohumla derle, korunan fonksiyonların bayt farkı ne kadar yüksekse o kadar iyi (14. hafta: Tigress `--Seed`)

---

<!-- _class: yogun -->

# Gizlemeyi ölçmenin dört boyutu

| Ölçüt | Soru | Nasıl |
| --- | --- | --- |
| **Güç** | İnsana ne kadar anlaşılmaz? | CFG/çevrimsel karmaşıklık, önce/sonra |
| **Dayanıklılık** | Araca ne kadar dayanır? | Deobfuscation aracının geri açma süresi |
| **Gizlilik** | Kendini ele veriyor mu? | Normal koddan ayırt edilebilirlik |
| **Maliyet** | Bize kaça mal? | Boyut, hız, bellek, bakım |

Dördü **ödünleşir**; varlık değerine göre dengelenir

---

# Deobfuscation → dayanıklılık kuralı

- **Sembolik yürütme (KLEE):** opak yüklem/düzleştirmeyi açar → çözücüyü pahalı yapılarla zorla, durum uzayını büyüt
- **MBA sadeleştirici:** aritmetik kodlamayı açar → tek başına sayma
- **Kalıp tanıma:** bilinen kalıpları bulur → **çeşitlendir**

**Kural:** dayanıklılık iddia değil, *ölçülen* niceliktir — "şu araca karşı şu kadar dayandı"

---

<!-- _class: yogun -->

# Katmanlı savunmada yeri

| Katman | Hafta | İlişki |
| --- | --- | --- |
| Bellek güvenliği/derleme | 4 | Yerine geçmez; birlikte |
| RASP | 6 | Gizleme RASP'ı gizler; RASP gizlemeyi korur |
| Whitebox kripto | 11 | Anahtarın asıl koruması; gizleme kabuğu |
| Anahtar/sürüm yenileme | 10 | "Yenilenene kadar" zaman kazandırır |
| Sertifikasyon | 12–13 | Her katmanın geciktirmesi puanlanır |

---

# Proje · S9 (ileri sağlamlaştırma)

1. **Koruma tablosu:** 2–3 kritik bölüm için kural şablonu (neyi/tehdit/nasıl/maliyet/sınır/ölçüm)
2. **Ölçüm:** en az bir teknik için önce/sonra sayı (`strings`, CFG düğümü, boyut, süre)
3. **Çeşitlendirme kararı:** evet/hayır + **gerekçe**
4. **Sınır ve kalan risk:** her koruma neyi **korumaz**?

Aranan: "çok teknik" değil, **her tekniğin gerekçesi ve ölçüsü**

---

# Kendini sınama (seçme)

- MATE modeli neden kriptografiyi tek başına yetersiz bırakır?
- Sahte işlem ≠ ölü dal: fark?
- Düzleştirme tek başına neden zayıf? Üç güçlendirici?
- Dize gizleme anahtarı korur mu? Neden?
- Dört ölçüt hangileri ödünleşir?

*(Tam liste ders notunda)*

---

<!-- _class: bolum -->

# Sonraki hafta

**10. hafta — Sertifikalar ve kriptografik yöntemler**
Anahtar seçimi, yaşam döngüsü, PKI · "gizleme anahtarı korumaz" → asıl koruma burada
