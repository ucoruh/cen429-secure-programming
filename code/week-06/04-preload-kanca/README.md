# Demo 4 — LD_PRELOAD / fonksiyon kancası (hook) algılama · yalnız Linux / WSL

**Konu:** RASP algılama — dinamik enstrümantasyon / hook tespiti (LD_PRELOAD, PLT/GOT, Frida/Xposed ailesi) ·
**Hafta:** 6 · **Katalog:** K7 (RTLD_NEXT adres karşılaştırma), K8 (LD_PRELOAD ortam)

## Ne gösteriyor?

Saldırgan bir kütüphaneyi `LD_PRELOAD` ile **önyükler** ve uygulamanın çağırdığı standart fonksiyonları (`time`,
`getenv`, ...) kendi sürümüyle değiştirir (**interposition**). Böylece Demo 2'deki anti-debug kontrollerini
yalancıya çıkarabilir. Bu demo iki teknikle bunu yakalar:

1. `LD_PRELOAD` ortam değişkeni boş mu? — zayıf sinyal (`getenv` de sahtelenebilir).
2. Kritik bir fonksiyon **hangi paylaşımlı nesneden** çözülüyor? `dlsym(RTLD_DEFAULT, ...)` ile fonksiyonun adresini
   alır, `dladdr` ile o adresi sağlayan `.so` dosyasını bulur. libc yerine başka bir `.so` çıkıyorsa: **kanca var.**

| Adım | Ne olur |
| --- | --- |
| 1 | `LD_PRELOAD` yokken çalışır: `time`/`getenv` libc'den çözülür → **temiz** |
| 2 | `libsahtekanca.so` `LD_PRELOAD` ile yalnız bu sürece yüklenir → `time` `.so`'dan çözülür, sabit sahte değer döner → **KANCA ALGILANDI** |

## Çalıştırma

Bu demo **yalnız Linux / WSL** üzerinde çalışır. Windows'ta `demo.ps1` bunu açıklar (Windows karşılığı IAT/satır-içi
kanca tespitidir, farklı API gerektirir).

WSL/Linux'ta: `code/` klasöründe `./build.sh`, sonra bu klasörde `sh demo.sh`.

## Neden güvenli?

- `LD_PRELOAD` **yalnızca tek bir komutu** (demo sürecini) etkiler; kabuğa ya da sisteme kalıcı hiçbir şey yazılmaz.
- Sahte kanca kütüphanesi (`sahtekanca.c`) yalnız `time()`'ı ele geçirip sabit değer döndürür; ekrana bir şey basmaz,
  dosyaya dokunmaz. Tamamen zararsız bir gösterimdir.

## Kendiniz deneyin

1. `sahtekanca.c`'ye `getenv`'i de ekleyin (LD_PRELOAD'ı gizlemek için boş döndürsün). 1. sinyal artık yakalıyor mu?
   2. sinyal (dladdr) hâlâ yakalıyor mu? Bu neden daha sağlam?
2. Demo 2'yi (`antidebug`) bu kanca ile `LD_PRELOAD` altında çalıştırın. `ptrace`/`TracerPid` sahtelenebilir mi?
3. Gerçek dünyada Frida nasıl çalışır ve neden `/proc/self/maps` taraması (K18) ek bir sinyaldir?
