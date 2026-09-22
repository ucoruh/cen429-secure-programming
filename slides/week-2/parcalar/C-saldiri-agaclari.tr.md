
<!-- _class: bolum -->

# Saldırı ağaçları

---


# Saldırı ağacı = niceliksel tehdit

- Kök: saldırganın **hedefi** · Dallar: ona ulaşma yolları.
- **VEYA:** en ucuz çocuk yeter · **VE:** çocukların toplamı gerekir.
- Yapraklara **maliyet** yazarsak en ucuz saldırıyı buluruz.

```text
HEDEF (VEYA)
 ├─ Veritabanini coz        (VE:  3 + 6 = 9)
 ├─ Bellekten oku           (VEYA: min 2)   <- en ucuz
 └─ Trafigi dinle           (VE:  7 + 8 = 15)
```

---


# Demo 04 — Savunma maliyeti artırır

`code/week-02/04-saldiri-agaci`

```text
ONCE:   EN UCUZ SALDIRI = 2  (bellekten oku)
SONRA:  EN UCUZ SALDIRI = 8  (RASP eklendi)
```

- "Bellekten oku" dalına **RASP** (anti-debug, anti-hook) eklendi.
- En ucuz saldırı **2 → 8** birime çıktı; en zayıf nokta **değişti.**
- Güvenlik yatırımını **sayıyla** gerekçelendirmenin yolu budur.

<!--
Konuşma notu: VE dugumleri saldirgani birden cok katmani birlikte kirmaya zorlar; derinlemesine savunmanin niceliksel hali.
-->

---

# Denetim kaydı: ne yazılır, ne yazılmaz?

| ✅ Kaydet | ❌ Asla kaydetme |
| --- | --- |
| Giriş denemeleri (kim, ne zaman, nereden) | Parola, PIN, belirteç, özel anahtar |
| Yetki ve ayar değişiklikleri | Kart numarasının tamamı, kişisel veri |
| Hassas işlemler (onay, dışa aktarma, silme) | Çözülmüş gizli veri |
| Güvenlik denetimi sonuçları | Sürümde hata ayıklama çıktısı |

Tarif 13.11 · günlüğü **saldırganın da okuyacağını** varsayarak tasarla

---

<!-- _class: yogun -->

# Demo 10 — Günlük enjeksiyonu (CWE-117)

`code/week-02/10-gunluk-enjeksiyonu`

```text
GUVENSIZ:
  DENETIM giris kullanici=kayra
  DENETIM giris kullanici=admin sonuc=BASARILI ...  <- SAHTE satir
  DENETIM giris kullanici=deniz^[[2K^Mgizli ...     <- ekran silme
GUVENLI:
  DENETIM giris kullanici=kayra\x0A2026-... (tek satir)
  sahte 'admin BASARILI' satiri: 0
```

✅ Kaçışla (`\xNN`) · ✅ uzunluğu sınırla · ✅ `syslog(LOG_INFO, "%s", girdi)` — girdi asla biçim dizgesi değil

<!-- Konuşma notu: Kullanıcı adına gömülü tek bir satır sonu, hiç yaşanmamış bir yönetici girişini günlüğe yazdırdı. Biçim dizgesi tuzağını 4. haftaya köprü olarak anın. -->

---

<!-- _class: yogun -->

# Demo 11 — Kurcalamaya dayanıklı günlük

`code/week-02/11-kurcalamaya-dayanikli-gunluk` · HMAC zinciri + **anahtar evrimi**

| Saldırı | Anahtar evrimli | Statik anahtar |
| --- | --- | --- |
| Kayıt değiştirme | ✅ MAC:BOZUK | ✅ yakalanır |
| Kayıt silme / sıra değiştirme | ✅ SIRA:BOZUK | ✅ yakalanır |
| Ele geçirilen anahtarla geçmişi yeniden yazma | ✅ **KURCALANMIŞ** | ❌ **BÜTÜNLÜKLÜ** görünür |

Anahtar her kayıtta tek yönlü evrilir, eski anahtar silinir → ele geçirmeden **önceki** kayıtlar korunur

<!-- Konuşma notu: Schneier–Kelsey 1999. Doğrulayıcı başlangıç anahtarını çevrimdışı tutar. En güçlü kanıt, saldırganın ulaşamadığı uzak kopyadır. -->
