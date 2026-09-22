# Demo 2 — Hata ayıklayıcı (debugger) algılama

**Konu:** RASP algılama — anti-debug · **Hafta:** 6 ·
**Kitap:** Viega & Messier, Tarif 12.13 (Unix/ptrace), 12.14 (Windows/IsDebuggerPresent)

## Ne gösteriyor?

Uygulamaya bir hata ayıklayıcı (gdb, lldb, Visual Studio, x64dbg, WinDbg) bağlı olup olmadığını **yalnızca okuyarak**
anlar. Tek bir göstergeye değil, birden çok bağımsız sinyale bakar:

| Ortam | Sinyaller |
| --- | --- |
| **Linux / WSL** | `/proc/self/status` → `TracerPid` (>0 ise izleniyor); ana sürecin (parent) adı gdb/strace/ltrace/valgrind mı? |
| **Windows** | `IsDebuggerPresent` (PEB BeingDebugged); `CheckRemoteDebuggerPresent`; PEB `NtGlobalFlag` (0x70 bitleri) |

## Çalıştırma

Önce `code/` klasöründe derleyin (Windows `.\build.ps1` · WSL/Linux `./build.sh`). Sonra bu klasörde:

| Ortam | Komut | Debugger altında görmek için |
| --- | --- | --- |
| Windows | `.\demo.ps1` | Visual Studio'da `antidebug` hedefini başlangıç yapıp **F5** |
| WSL / Linux | `sh demo.sh` | `demo.sh` zaten programı `gdb` altında da çalıştırır |

## Neden güvenli?

- Program yalnız `/proc` ve PEB alanlarını **okur**; hiçbir dosyayı ya da sistem ayarını değiştirmez, yönetici
  yetkisi istemez. Kendini `ptrace(PTRACE_TRACEME)` ile izlemeye **almaz** (yan etkiden kaçınmak için sadece okuma).
- `demo.sh` programı `gdb -batch` ile normal (izleyerek) çalıştırır; bu yalnız demo sürecini etkiler.

## Kendiniz deneyin

1. Linux'ta `strace -f ./bin/linux/antidebug` çalıştırın. TracerPid değişiyor mu? Ana sürecin adı ne oluyor?
2. Windows'ta demoyu **F5** (Visual Studio hata ayıklayıcısı) ve **Ctrl+F5** (hata ayıklayıcısız) ile çalıştırın.
   Hangi sinyaller değişiyor?
3. Tek bir `if (IsDebuggerPresent()) exit(1);` neden zayıftır? (İpucu: saldırgan o tek çağrının dönüşünü yamalar;
   bkz. Demo 4 hook ve Demo 5 dağıtık sayaç.)
