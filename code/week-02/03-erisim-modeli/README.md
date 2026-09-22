# Demo 03 — Erişim denetimi ve biçimsel güvenlik modeli simülatörü

**Konu:** Erişim denetim matrisi, DAC/MAC, Bell–LaPadula (seviye + kategori), Biba (katı ve düşük su işareti),
Çin Seddi · **Hafta:** 2 · **Kitap:** Viega & Messier, Tarif 2.1–2.2 (işletim sistemi karşılıkları)

## Ne gösteriyor?

Aynı erişim isteklerini bir metin politikasına göre değerlendirir ve modellerin kararlarını yan yana gösterir.
Etkin karar `DAC VE (yürürlükteki zorunlu model)` olarak hesaplanır (BLP'nin ds-özelliği).

| Adım | Politika | Model | Ne öğretir? |
| --- | --- | --- | --- |
| 0 | `politika-matris.txt` | Salt DAC | En az ayrıcalık: matriste yoksa red |
| 1 | `politika-gizlilik.txt` | BLP | Yukarı okuma yok, aşağı yazma yok (**gizlilik**) |
| 2 | `politika-butunluk.txt` | Biba | Aşağı okuma yok, yukarı yazma yok (**bütünlük**) |
| 3 | `politika-kategori.txt` | BLP + kategoriler | Baskınlık: seviye yetmez, kategori de gerekir |
| 4 | `politika-lwm.txt` | Biba düşük su işareti | Okumak öznenin seviyesini düşürür |
| 5 | `politika-cin.txt` | Çin Seddi | Karar geçmişe bağlı: çatışan şirkete duvar |

## Çalıştırma

Önce bütün demoları bir kez derleyin (`code/` klasöründe): Windows `.\build.ps1` · WSL / Linux `./build.sh`.
Sonra bu klasörde: Windows `.\demo.ps1` (ya da `demo.cmd`'ye çift tıklayın) · WSL / Linux `sh demo.sh`.

Kendi politikanızı deneyin: `.\bin\windows\erisim.exe politika-kategori.txt` ya da
`./bin/linux/erisim politika-kategori.txt`. Biçim `erisim.c` başında açıklanmıştır (`MODEL`, `SEVIYE`, `OZNE`,
`NESNE`, `SIRKET`, `HAK`, `ISTEK`; `HAK * * rw` herkese her hakkı verir).

## Neden güvenli?

Bu bir **simülatördür**: hiçbir gerçek dosyaya, kullanıcıya ya da işletim sistemi ayarına dokunmaz.

## Kendin dene

- `politika-gizlilik.txt`'te `MODEL BLP+BIBA` yazın: bir özne bir nesneyi hem okuyup hem yazabilmek için hangi
  seviyede olmalı?
- `politika-kategori.txt`'te `attase`'ye `NUKLEER` kategorisini ekleyin; hangi kararlar değişir?
- `politika-lwm.txt`'te `oku gelen` isteğini en başa alın. Sonraki kararlar neden değişti? Bu, "güçlü durağanlık"
  ilkesiyle nasıl çelişir?
- `politika-cin.txt`'te `danisman1`'in ilk isteğini `b_bilanco` yapın. Duvar bu kez hangi şirkete kapanır?
