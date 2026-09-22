
<!-- _class: bolum -->

# Erişim denetimi ve modeller

---


# Özne, nesne, hak — ve matris

- **Özne** (kullanıcı/süreç) · **Nesne** (dosya/kayıt) · **Hak** (oku/yaz/çalıştır).

| | `odeme_anahtari` | `gunluk` |
| --- | --- | --- |
| **uygulama** | — | yaz |
| **kutuphane** | oku, yaz | yaz |
| **saldirgan** | — | — |

Matris iki biçimde saklanır: **ACL** (sütun: nesne kimin erişeceğini tutar) · **Yetenek** (satır: özne biletleri).

---


<!-- _class: yogun -->

# DAC · MAC · RBAC

| Model | Kararı kim verir? | Örnek |
| --- | --- | --- |
| **DAC** | Nesnenin **sahibi** | Unix `chmod`, Windows DACL |
| **MAC** | **Sistem/politika** (sahip değiştiremez) | Bell–LaPadula, SELinux |
| **RBAC** | İzinler **rollere**, kullanıcı role atanır | "Muhasebeci" rolü |

Gerçek sistemler üçünü **birlikte** kullanır; etkin karar çoğu zaman **kesişimdir.**

---


# Demo 03 — Salt DAC (matris)

`code/week-02/03-erisim-modeli`

```text
  kutuphane OKU odeme_anahtari   => IZIN
  uygulama  OKU odeme_anahtari   => RED  (matriste yok)
  saldirgan OKU odeme_anahtari   => RED
  saldirgan YAZ gunluk           => RED
```

Uygulamanın bile ödeme anahtarına **doğrudan erişimi yok** → **en az ayrıcalık.**

---


# Bell–LaPadula: gizlilik

Seviyeler: Genel < Gizli < Çok Gizli

- **Yukarı okuma yok:** kendinden gizli olanı okuyamaz.
- **Aşağı yazma yok (\*-özellik):** kendinden az gizli olana yazamaz.

> **"Read down, write up"** — gizli bilgi **aşağı sızamaz.**

<!--
Konuşma notu: Askeri kokenli (1973). "Asagi yazma yok" ilk bakista tuhaf gelir; amac cok gizli bilgiyi memurun gorebilecegi bir yere yazmayi engellemek.
-->

---


# Biba: bütünlük (BLP'nin tersi)

Seviyeler: Dış < Uygulama < Çekirdek (güvenilirlik)

- **Aşağı okuma yok:** kendinden az güvenilir veriyi okuyamaz.
- **Yukarı yazma yok:** kendinden güvenilir veriye yazamaz.

> **"Read up, write down"** — kirli bilgi **yukarı çıkamaz**, temizi bozamaz.

---


<!-- _class: sema -->

# BLP ve Biba: ters yönler

```text
        BELL-LaPADULA (gizlilik)      BIBA (butunluk)
        Cok Gizli  ^  oku             Cekirdek  ^  yaz
            |       |  yaz gonderme        |     |  oku gonderme
        Gizli      |                   Uygulama  |
            |      v                       |     v
        Genel                           Dis

  BLP: yukari OKUMA yok, asagi YAZMA yok
  Biba: asagi OKUMA yok, yukari YAZMA yok
```

Bir veri hem gizli hem güvenilir olmalıysa → yalnız **kendi seviyesinde** işlenir.

---


# Clark–Wilson: ticari bütünlük

Askeri seviye yerine **iyi biçimli işlem + görev ayrılığı** (1987, banka):

- **CDI:** bütünlüğü korunacak veri (bakiye).
- **TP:** CDI'ye yalnız **onaylı işlemler** dokunur (doğrudan yazma yok).
- **IVP:** tutarlılığı düzenli denetler ("borç = alacak").
- **Görev ayrılığı:** başlatan ≠ onaylayan.

> "Veriye doğrudan değil, **doğrulanmış işlemlerle** dokun."

---


# Demo 03 — BLP ve Biba çıktısı

```text
BLP:  memur   OKU operasyon  BLP:RED  => RED  (yukari okuma)
      general YAZ ilan       BLP:RED  => RED  (asagi yazma)

Biba: aglayici YAZ kayit     BIBA:RED => RED  (yukari yazma)
      islemci  OKU gelen     BIBA:RED => RED  (asagi okuma)
```

DAC her ikisinde **VAR**; reddi getiren **sistem (MAC)** kuralıdır.

---


# Unix erişim modeli

`-rwxr-x---` → sahip / grup / diğerleri, her biri **oku-yaz-çalıştır**.

- Üç kimlik: **effective / real / saved** UID.
- **setuid:** program **sahibinin** (çoğu zaman root) yetkisiyle çalışır — güçlü ama tehlikeli.
- **sticky bit:** `/tmp`'te başkasının dosyasını silememe.

Kitap: Tarif 2.1

---


<!-- _class: yogun -->

# Windows erişim modeli

| Kavram | Unix | Windows |
| --- | --- | --- |
| Kimlik | UID/GID | SID |
| İzin | Mod bitleri | **DACL** içindeki ACE'ler |
| Denetim | syslog (harici) | **SACL** (yerleşik) |
| "Herkese açık" | `chmod 777` | **NULL DACL** |

- **DACL:** kim ne yapabilir (ACE = SID + hak + izin/reddet).
- Modern Windows: **MIC** ve **AppContainer** (Biba benzeri). Kitap: Tarif 2.2

---


# Demo 06 — TOCTOU yarışı (CWE-367)

`code/week-02/06-toctou` (yalnız WSL/Linux) · Kitap: Tarif 2.3

```text
GUVENSIZ (once lstat, sonra fopen):
  >>> SALDIRI BASARILI: yazi gizli_hedef.txt'e yonlendirildi!
GUVENLI (O_NOFOLLOW ile tek adim):
  reddedildi: hedef sembolik bag
```

**Denetim ile kullanım arasındaki boşluk** bir yarıştır. Çözüm: tek atomik adım (`O_NOFOLLOW`, `O_EXCL`), fd üzerinden çalış.

---

<!-- _class: yogun -->

# Demo 12 — ACE değerlendirme algoritması

`code/week-02/12-ace-degerlendirme` · Tarif 2.2

```text
1a kanonik:  RET Herkes TAM | IZIN Pazarlama YAZ  => RED
1b bozuk:    IZIN Pazarlama YAZ | ... RET Herkes  => IZIN
2a NULL DACL (yabanci hesap) => IZIN (SAHIP_AL, IZIN_YAZ dahil!)
2b BOS DACL  (ayni hesap)    => RED
3b kalitim kesildi           => RED (liste bitti)
```

- Sıra önemli: **açık RET → açık İZİN → miras RET → miras İZİN**
- ❌ NULL DACL = herkese **her** hak · ✅ gerekli hakları açıkça ver
- Sahip, DACL ne derse desin izinleri değiştirebilir

<!-- Konuşma notu: 1a ve 1b'de ACE'ler aynı, yalnız sıra farklı. Son adımda icacls ile demonun kendi dosyasının gerçek ACL'ini gösterin. -->

---

<!-- _class: yogun -->

# Demo 13 — Unix izinleri, umask, setuid

`code/week-02/13-unix-izin-umask` · Tarif 2.1, 2.7, 1.3

```text
ayse   oku paradoks.txt ---rwxrwx  sahip -> RED
zeynep oku paradoks.txt ---rwxrwx  diger -> IZIN
0666 & ~umask:  000 -> rw-rw-rw-   022 -> rw-r--r--   077 -> rw-------
seteuid(1001)  r/e/s = 1001/1001/0   <- sakli UID hala 0!
```

- **İlk eşleşen sınıf** karar verir (sahip → grup → diğerleri)
- `fopen()` 0666 ister → hassas dosya: `open(..., 0600)`
- Kalıcı bırakma: `setresuid()` + doğrula

<!-- Konuşma notu: Benzetimdir; gerçek setuid dosyası oluşturulmaz, sudo gerekmez. Sistemdeki setuid programlar yalnız listelenir. -->

---

<!-- _class: yogun -->

# Demo 14 — RBAC, görev ayrılığı, Clark–Wilson

`code/week-02/14-rbac-clark-wilson` · banka benzetimi

```text
ATA cem GISE                 SSD(GISE,ONAYCI)  -> RED
OTURUM deniz GISE,DENETCI    DSD(GISE,DENETCI) -> RED
OTURUM deniz DENETCI         -> TAMAM
deniz IVP: beklenen 20250, bulunan 20250
```

- **SSD:** çelişen iki role atanamaz · **DSD:** aynı oturumda ikisi etkin olamaz
- CDI'ya yalnız **sertifikalı TP** dokunur; büyük havale → **ikinci kişi onayı**
- ⚠️ Hatalı TP sertifikalanırsa kurallar görmez, **IVP yakalar**

<!-- Konuşma notu: Sahada karşılığı: dört göz ilkesi, bölünmüş bilgi ve çift denetim, günlük mutabakat. -->
