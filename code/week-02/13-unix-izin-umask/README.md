# Demo 13 — Unix izinleri, umask ve setuid laboratuvarı

**Konu:** Unix erişim modeli (UID/GID, gerçek/etkin/saklı kimlik, rwx, setuid/setgid, yapışkan bit, umask, POSIX
ACL, Linux yetenekleri) · **Hafta:** 2 · **Kitap:** Viega & Messier, Tarif 2.1, 2.7 (ayrıca 1.3)

## Ne gösteriyor?

| Adım | Ne yapılır | Ne öğretir? |
| --- | --- | --- |
| 1 `izin sim` | Çekirdeğin izin algoritması, umask tablosu, setuid kimlik geçişleri, yapışkan bit (benzetim) | İlk eşleşen sınıf karar verir; saklı UID tuzağı; grup önce bırakılır |
| 2 `izin gercek` | `cikti/` altında gerçek dosyalar (yalnız Linux/WSL) | umask gerçekte; "sahip okuyamaz"; dizinde r/x farkı; açık fd bir yetenektir; `CapEff` |
| 3 POSIX ACL | `setfacl`/`getfacl` demonun kendi dosyasında | Adlandırılmış kullanıcı, maske, `#effective` |
| 4 setuid listesi | `ls -l /usr/bin/passwd`, `find ... -perm -4000` (salt okuma) | Sistemdeki saldırı yüzeyi |
| Windows | `izin sim` + `icacls` ile kalıtım | umask'ın Windows karşılığı kalıtımdır |

## Çalıştırma

Önce derleyin (`code/` içinde `.\build.ps1` ya da `./build.sh`), sonra bu klasörde Windows'ta `.\demo.ps1`
(ya da `demo.cmd`), WSL/Linux'ta `sh demo.sh`. Gerçek Unix adımları için depoyu WSL içinde `~` altına kopyalayın
(`/mnt/c` Unix izinlerini saklamayabilir; betik bunu denetler). **Normal kullanıcıyla** çalıştırın: root için
çekirdek izin bitlerini atlar (program bunu uyarır).

## Neden güvenli?

Gerçek setuid ikili **oluşturulmaz**, `sudo` gerekmez; setuid yalnız benzetimle anlatılır. Bütün dosyalar
`cikti/` altındadır; program izinleri geri açar ve betik klasörü sonunda siler. Sistem dosyaları yalnız listelenir.

## Kendin dene

- `izin.c`'deki `paradoks.txt` modunu `0707` yapın: `mehmet` (grup) okuyabilir mi? Neden?
- C3 benzetiminde `setresuid` yerine `setreuid(1001, 1001)` kuralını ekleyin: saklı UID'ye ne olur?
- `umask 000` ile `echo x > a.txt` yapıp `ls -l` ile bakın; sonra `umask 077` ile tekrarlayın.
