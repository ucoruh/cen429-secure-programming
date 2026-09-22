# Demo 12 — Windows ACE değerlendirme simülatörü

**Konu:** Windows erişim denetimi: erişim belirteci, DACL, ACE sırası, NULL/boş DACL, kalıtım, UAC süzgeci, bütünlük
seviyeleri (MIC), sahip hakları · **Hafta:** 2 · **Kitap:** Viega & Messier, Tarif 2.2 (ve Tarif 1.2)

## Ne gösteriyor?

Metin dosyasında tanımlanan bir erişim belirteci ve bir nesne (sahip, etiket, ACE listesi) için Windows'un erişim
kararını **adım adım** hesaplar. Kitabın 2003 metnindeki iki yanlışı da düzeltir: Windows "en iyi eşleşen" ACE'yi
seçmez, ACE'leri **sırayla** gezer; hiç ACE içermeyen DACL (boş DACL) ile hiç DACL olmaması (NULL DACL) aynı şey
değildir.

| Adım | Senaryo | Sonuç |
| --- | --- | --- |
| 1 | `senaryo-1-sira.txt` | İlk eşleşen RET isteği keser; sıra bozulursa ret hiç görülmez; sahip her zaman DACL'ı değiştirebilir |
| 2 | `senaryo-2-null-bos.txt` | NULL DACL herkese her hakkı verir; boş DACL kimseye vermez |
| 3 | `senaryo-3-kalitim.txt` | Açık ACE, miras ACE'den önce gelir; kalıtımı kesmek |
| 4 | `senaryo-4-uac-mic.txt` | UAC süzgecinde yönetici grubu "yalnız ret"; düşük bütünlük orta etikete yazamaz |
| 5 | `senaryo-5-sahip-ayricalik.txt` | SAHIP_HAKLARI ACE'si; SAHIPLIK_AL ayrıcalığı DACL'ı atlar |
| 6 | (gerçek sistem) | Windows: `icacls`, `whoami /groups`, `whoami /priv` · Linux: `id`, `stat`, `getfacl` — salt okuma |

## Çalıştırma

Önce derleyin (`code/` içinde `.\build.ps1` ya da `./build.sh`), sonra bu klasörde Windows'ta `.\demo.ps1`
(ya da `demo.cmd`), WSL/Linux'ta `sh demo.sh`. Tek senaryo: `.\bin\windows\ace.exe senaryo-1-sira.txt`.

## Neden güvenli?

Simülatör saf hesaplamadır. Gerçek sistem adımı yalnız `cikti/` altında bir dosya oluşturur ve izinlerini
**okur**; hiçbir ACL değiştirilmez, yönetici yetkisi gerekmez.

## Kendin dene

- `senaryo-1-sira.txt`'e `ACE RET Pazarlama YAZ` satırını `IZIN Pazarlama` satırından sonra ekleyin ve
  `KANONIK` ile ve onsuz deneyin.
- Senaryo 4a'da `ACE RET Yoneticiler YAZ` ekleyin: yalnız ret grubu RET ACE'siyle eşleşir mi?
- Kendi dosyanızın `icacls` çıktısını simülatör biçimine çevirip aynı kararı elle ve simülatörle hesaplayın.
