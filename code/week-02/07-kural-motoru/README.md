# Demo 07 — Mini kural motoru: YARA'dan esinlenen dizge, hex ve koşul

**Konu:** Zararlı yazılım tespitinde kural tabanlı eşleme; yanlış pozitif ve yanlış negatif ·
**Hafta:** 2 · **Kaynak:** YARA kural dilinin kavramları (dizge, hex desen, joker, koşul) —
kod sıfırdan yazılmıştır, YARA'nın yerini tutmaz.

## Ne gösteriyor?

Analistler bir zararlı ailesini tanımlamak için tek bir bayt dizisi yerine **kurallar** yazar:
birkaç dizge ya da hex desen tanımlar, bunları bir **koşulla** birleştirir. Bu demo, bu fikri
küçük ve okunur bir C programıyla uygular. Kurallar `kurallar.txt` içindedir ve yalnız bu ders
için uydurulmuş **zararsız** desenler kullanır.

| Adım | Ne olur | Ders |
| --- | --- | --- |
| 1 | Beş kural listelenir | Kural = adlandırılmış dizgeler + koşul |
| 2 | Beş örnek dosya taranır | Kim hangi kurala uydu? |
| 3 | Zararsız `kilavuz.txt`, `Kelime_Cifti` kuralına uyar | **Yanlış pozitif:** kelimeye bakıp bağlama bakmamak |
| 4 | Değiştirilmiş `varyant.bin`, `Kapsul_Bicimi`'ni atlatır ama joker içeren `Isaret_Hex` yakalar | Dar kural kaçırır, joker dayanıklılık kazandırır |
| 5 | Bozuk kural dosyası reddedilir | Kural dosyası da bir **girdidir** |

Koşul dili: `$id` (dizge en az bir kez geçti mi), `#id >= n` (kaç kez geçti), `and`, `or`,
`not`, parantez, `n of them`, `all of them`, `any of them`, `true`, `false`.

## Çalıştırma

Önce bütün demoları bir kez derleyin (`code/` klasöründe): Windows `.\build.ps1` ·
WSL / Linux `./build.sh`. Sonra bu klasörde:

| Ortam | Komut |
| --- | --- |
| Windows (PowerShell) | `.\demo.ps1` — ya da `demo.cmd`'ye çift tıklayın |
| WSL / Linux | `sh demo.sh` |

Tek bir dosyanın ayrıntılı dökümü: `bin/linux/kural_motoru -a kurallar.txt cikti/kapsul.bin`
(Windows: `.\bin\windows\kural_motoru.exe -a kurallar.txt cikti\kapsul.bin`).

## Neden güvenli?

- Örnek dosyaların hepsi **düz metindir**; hiçbiri çalıştırılabilir değildir ve gerçek bir
  zararlının imzasını içermez. Antivirüsü tetikleyen hiçbir dize (EICAR dahil) yoktur.
- Program yalnız **okur**; örnekler bu klasördeki `cikti/` altında üretilir.
- Kural dosyası güvenilmeyen girdi gibi işlenir: dizge başına 64 bayt, kural başına 8 dizge,
  en çok 32 kural; sınırı aşan ya da sözdizimi bozuk dosya **tümden reddedilir**.

## Kendin dene

- `Kelime_Cifti` kuralını `kilavuz.txt`'yi yakalamayacak ama `kapsul.bin`'i yakalamaya devam
  edecek biçimde yeniden yazın. Kaç farklı yol buldunuz?
- `Isaret_Hex` desenindeki jokeri kaldırın (`??` yerine `2d`). `varyant.bin` ne oldu?
- `notlar.txt` için `#t >= 5` yazın. Neden eşleşme kayboldu? Eşik seçmenin bedeli nedir?
- Kendi dosyanıza (ör. bir ders notu) bir kural yazın ve `-a` ile hangi dizgenin kaç kez geçtiğine
  bakın.
