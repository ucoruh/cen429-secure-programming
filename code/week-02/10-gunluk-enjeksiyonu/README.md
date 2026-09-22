# Demo 10 — Günlük (log) enjeksiyonu ve kaçışlama (CWE-117)

**Konu:** Denetim kaydına güvenilmeyen alan yazma; log forging · **Hafta:** 2 ·
**CWE:** CWE-117 (Improper Output Neutralization for Logs), ilgili CWE-134 (biçim dizgesi)

## Ne gösteriyor?

Bir "giriş denetimi" günlüğü, kullanıcı adını günlük satırına yazar. Kullanıcı adı bir **dosyadan ham bayt**
olarak okunur (böylece satır sonu ve kontrol karakterleri argümandan geçirmeye gerek kalmadan temsil edilir).

- **Güvensiz sürüm** alanı hiç denetlemeden yazar: içindeki `\n` (satır sonu) yeni bir **sahte günlük satırı**
  oluşturur; saldırgan hiç olmayan bir `admin sonuc=BASARILI` kaydı **enjekte eder**. Kontrol karakterleri
  (ANSI kaçış dizileri) terminalde önceki satırı silip analisti yanıltabilir.
- **Güvenli sürüm** her yazdırılamayan baytı `\xNN` olarak **kaçışlar**, alanı bir üst sınıra **kırpar** ve her
  girdinin **tek satır** kalmasını garanti eder. Ayrıca kullanıcı verisini asla biçim dizgesi olarak kullanmaz
  (`fprintf(f, "%s", ad)`), böylece CWE-134 biçim-dizgesi açığı da baştan kapalıdır.

| Adım | Ne yapılır | Beklenen |
| --- | --- | --- |
| 1 | Güvensiz günlüğe 3 girdi yaz | Enjeksiyon nedeniyle **4** satır oluşur |
| 2 | Sahte satırı say | `admin BASARILI` satırı **bulunur** |
| 3 | Güvenli günlüğe aynı + uzun girdiyi yaz | Her girdi **tek satır**; kontrol karakterleri `\xNN` |
| 4 | Sahte satırı say (güvenli) | Sahte satır **yok** |

## Çalıştırma

Önce bütün demoları bir kez derleyin (`code/` klasöründe): Windows `.\build.ps1` · WSL / Linux `./build.sh`.
Sonra bu klasörde:

| Ortam | Komut |
| --- | --- |
| Windows (PowerShell) | `.\demo.ps1` — ya da `demo.cmd`'ye çift tıklayın |
| WSL / Linux | `sh demo.sh` |

Elle: `.\bin\windows\gunluk.exe uret calisma` sonra `... yaz guvensiz calisma\02-enjeksiyon.bin calisma\x.log`.

## Neden güvenli?

Program **yalnız kendi klasöründeki `calisma/`** altına yazar; işletim sisteminin `syslog`/Olay Günlüğü'ne
dokunmaz, yönetici yetkisi gerekmez, ağ kullanmaz. Kullanıcı adları uydurmadır. Biçim-dizgesi açığı bilerek
**tetiklenmez**; güvenli kod yolu her zaman sabit biçim dizgesi kullanır.

## Kendiniz deneyin

1. `calisma/02-enjeksiyon.bin` dosyasını bir onaltılık düzenleyiciyle açın; `0a` (satır sonu) baytını görün.
2. Kendi "enjeksiyon" girdinizi yazın: bir metin dosyasına `hile` yazıp ardından bir satır sonu ve sahte bir
   kayıt ekleyin; güvensiz ve güvenli modda karşılaştırın.
3. `kacisla()` fonksiyonundaki `SINIR` değerini değiştirip uzun alanın nasıl kırpıldığını görün.
