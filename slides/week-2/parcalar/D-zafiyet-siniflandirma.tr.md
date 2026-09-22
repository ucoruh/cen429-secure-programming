
<!-- _class: bolum -->

# Zafiyet sınıflandırma

---


# CWE: zayıflık türleri kataloğu

- **CWE** = zayıflığın **türü** (SQL enjeksiyonu → CWE-89).
- **CWE Top 25:** o yıl en çok görülen/tehlikeli 25 zayıflık.

| CWE | Zayıflık |
| --- | --- |
| CWE-787 | Sınır dışına yazma |
| CWE-79 | XSS |
| CWE-89 | SQL enjeksiyonu |
| CWE-367 | TOCTOU (Demo 06) |
| CWE-798 | Gömülü kimlik/anahtar |

Hiyerarşik: pillar → class → base → variant. **En somut** CWE'yi seç.

---


# OWASP Top 10 ve MASVS

| Belge | Kapsam | Türü |
| --- | --- | --- |
| CWE / Top 25 | Tüm yazılım | Katalog / öncelik |
| OWASP Top 10 | Web | Farkındalık / öncelik |
| OWASP ASVS | Web | Doğrulama standardı |
| OWASP **MASVS** + MASTG | **Mobil** | Doğrulama + test |

**MASVS-RESILIENCE** = tersine mühendisliğe direnç → bu dersin kod gizleme (H9, H14), RASP (H6), whitebox (H11) konuları.

---


# CVE ve CVSS

- **CVE:** belirli üründeki belirli açığın **kimliği** (CVE-2014-0160 = Heartbleed). Bir **isim**, ciddiyet değil.
- **CVSS:** açığın **ciddiyeti** 0.0–10.0. Üç grup: **Temel** (değişmez), Zamansal, Çevresel.

Bir CVE bir ya da birden çok **CWE türüne** aittir.

---


<!-- _class: yogun -->

# CVSS v3.1 Temel puan metrikleri

| Metrik | Sorusu | Değerler |
| --- | --- | --- |
| **AV** | Nereden? | Ağ / Bitişik / Yerel / Fiziksel |
| **AC** | Ne kadar zor? | Düşük / Yüksek |
| **PR** | Yetki gerekir mi? | Yok / Düşük / Yüksek |
| **UI** | Kurban gerekir mi? | Yok / Gerekli |
| **S** | Kapsam aşılıyor mu? | Değişmedi / Değişti |
| **C/I/A** | Etki? | Yüksek / Düşük / Yok |

**v4.0:** kapsam yerine ayrı VC/VI/VA + SC/SI/SA; temel puan = CVSS-B.

---


# Demo 05 — CVSS hesaplayıcı

`code/week-02/05-cvss` (Python)

```text
AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H  = 9.8  Kritik
              ... S:U -> S:C          = 10.0 Kritik
AV:L (yerel) /PR:L/... C:H/I:H/A:H    = 7.8  Yuksek
```

- **Uzaktan + kimliksiz** en yüksek; kapsam değişince 10.0.
- ⚠️ Temel puan **bağlamı bilmez**: 4.0'lık açık tam sizin varlığınızı vuruyorsa sizin için 9.8'den önemli olabilir.

---


# Zafiyet yaşam döngüsü

```text
Kesif -> Ozel ifsa -> Yama -> Yama yayini -> Kamuya acilma -> Guncelleme
   \.................. zero-day (yama yokken saldiri) ................/
```

- **Zero-day:** satıcının bilmediği/yamasının olmadığı açık.
- **Sorumlu ifşa:** önce satıcıya bildir, ~90 gün bekle, sonra açıkla.
- **Yama boşluğu:** yama çıkınca açık kamuya açılır; güncellemeyen savunmasız (WannaCry).
