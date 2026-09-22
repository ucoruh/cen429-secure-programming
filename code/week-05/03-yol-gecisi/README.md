# Demo 3 — Yol geçişi (path traversal): kanonikleştirme + kök denetimi

**Konu:** Yol geçişi / directory traversal (CWE-22) · **Hafta:** 5 ·
**Kitap:** Viega & Messier, Tarif 3.7 (dosya adı ve yol doğrulama)

## Ne gösteriyor?

Bir "dosya sunucusu" yalnızca `cikti/veri/` kökü altındaki dosyaları vermelidir:

- **KÖTÜ:** İstek doğrudan köke eklenir (`kok.resolve(istek)`). `../gizli.txt` isteği
  kökün **dışına** çıkar ve kök dışındaki sentetik gizli dosyayı sızdırır.
- **İYİ:** Yol **kanoniklleştirilir** (`normalize()` + `toRealPath()` / Python
  `resolve()`) ve sonucun kökün **içinde** kaldığı doğrulanır (`startsWith` /
  `is_relative_to`). Mutlak yol ve sürücü harfi de reddedilir.

Windows'ta `..\` ve `../` ayıraçlarının ikisi de, sürücü harfli mutlak yol da işlenir;
kanoniklleştirme bunların hepsini tek bir gerçek yola indirger ve denetim uygular.

## Çalıştırma

| Ortam | Komut |
| --- | --- |
| Windows (PowerShell) | `.\demo.ps1` — ya da `demo.cmd`'ye çift tıklayın |
| WSL / Linux | `sh demo.sh` |

Python bölümü her zaman çalışır; Java bölümü **JDK 17/21** varsa çalışır. **İndirme
gerektirmez.**

## Neden güvenli?

- Bütün dosyalar demo klasöründeki `cikti/` altında üretilir: `cikti/veri/rapor.txt`
  (kök içi) ve `cikti/gizli.txt` (kökün bir üstü, ama **hâlâ demo klasörünün içinde**).
  `../gizli.txt` saldırısı demo klasörünün dışına **çıkmaz**.
- İçerik sentetiktir; sistem dosyalarına dokunulmaz, ağ/yönetici yetkisi kullanılmaz.

## Kendiniz deneyin

1. İstek olarak `veri/../gizli.txt` veya `./../gizli.txt` deneyin. Kanoniklleştirme
   bunları da yakalıyor mu? Neden ham dize karşılaştırması ("`..` var mı?") yetersiz?
2. Kök içinde bir alt klasör (`cikti/veri/alt/`) oluşturup oradan bir dosya isteyin.
   Meşru alt yollar hâlâ çalışıyor mu? (Kök denetimi meşru erişimi engellememeli.)
3. Windows'ta `..\\..\\gizli.txt` gibi çift ters eğik çizgi deneyin. `toRealPath()`
   sonucu neden aynı gerçek dosyaya iniyor?
