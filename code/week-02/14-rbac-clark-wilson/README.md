# Demo 14 — RBAC, görev ayrılığı ve Clark–Wilson simülatörü

**Konu:** RBAC0–RBAC2 (atama, oturum, hiyerarşi, SSD/DSD), Clark–Wilson (CDI, UDI, TP, IVP; C1–C5, E1–E4) ·
**Hafta:** 2

## Ne gösteriyor?

Küçük bir hesap defteri (iki hesap, sentetik tutarlar). Her komutun hangi kurala takıldığı çıktıda yazar.

| Bölüm | Ne olur? | Kural |
| --- | --- | --- |
| 1 | Onaycıya gişe rolü atanamaz; denetçi ile gişe aynı oturumda açılamaz; tanınmayan kullanıcı | SSD, DSD, E3 |
| 2 | Geçerli yatırma; `-500`, `12abc` reddi; CDI'ya doğrudan yazma; yetkisiz havale; eksiye düşme | C5, E1, E2, C2 |
| 3 | Eşik üstü havale ikinci kişi onayı ister; SSD kaldırılsa bile TP kendi talebini onaylatmaz | C3 |
| 4 | Sertifikacı TP çalıştıramaz; hatalı bir TP sertifikalanır ve %1'i kaybeder; IVP tutarsızlığı yakalar | E4, C2, C4, C1 |

## Çalıştırma

Önce derleyin (`code/` içinde `.\build.ps1` ya da `./build.sh`), sonra bu klasörde Windows'ta `.\demo.ps1`
(ya da `demo.cmd`), WSL/Linux'ta `sh demo.sh`. Doğrudan: `.\bin\windows\banka.exe senaryo.txt`.

## Neden güvenli?

Saf benzetimdir: dosya, ağ ya da sistem ayarı kullanmaz; yalnız `senaryo.txt`'yi okur. Gerçek para/hesap yoktur.

## Kendin dene

- `SSD GISE ONAYCI` satırını silin: bölüm 1'de ne değişir, bölüm 3'te TP içindeki C3 denetimi hâlâ korur mu?
- `ONAY_ESIGI`'ni 500 yapın: kaç işlem ikinci onaya düşer?
- `HATALI_HAVALE`'yi sertifikalamadan çalıştırın (SERTIFIKALA satırını silin): hangi kural durdurur?
