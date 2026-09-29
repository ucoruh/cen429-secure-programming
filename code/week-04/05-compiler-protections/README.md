# Demo 5 — Compiler and operating-system protections

**Topic:** Stack canary, FORTIFY, PIE/ASLR, DEP/NX, RELRO, CFG (CWE-121) · **Week:** 4 ·
**Book:** Viega & Messier, Recipe 3.3 (StackGuard/ProPolice/`/GS`) — built into compilers today; ASLR/DEP/RELRO/CFI were added after 2003

## What it shows

The same overflow bug is built twice: protections **off** (`overflow_weak`) and **on**
(`overflow_hardened`). When a long input overflows the 64-byte buffer, the hardened version's
**stack canary** is corrupted and the program stops safely; the weak version's overflow either
silently corrupts something or crashes later. Then we inspect the binary's own protections with a
script.

| GCC/Clang (Linux) | MSVC (Windows) | What it does |
| --- | --- | --- |
| `-fstack-protector-strong` | `/GS` | Stack canary (a hidden value placed before the return address) |
| `-D_FORTIFY_SOURCE=2` | `_s` functions / `strcpy_s` | Size checks on library calls |
| `-fPIE -pie` (ASLR) | `/DYNAMICBASE /HIGHENTROPYVA` | Randomize addresses on every run |
| NX (default) | `/NXCOMPAT` | Never execute a data page as code |
| `-Wl,-z,relro,-z,now` | (no equivalent) | Make the GOT/PLT read-only |
| `-fsanitize=cfi` / `-fcf-protection` | `/guard:cf` | Control-flow integrity (checks indirect calls) |

## Running it

First, inside the `code/` folder: Windows `.\build.ps1` · WSL / Linux `./build.sh`.
Then, inside this folder: Windows `.\demo.ps1` (or `demo.cmd`) · WSL / Linux `sh demo.sh`.
The inspection step uses `readelf` on Linux, `dumpbin` on Windows (no Developer PowerShell needed).

## Why it's safe

- The overflow only happens on this program's own stack; it is bounded on Linux with
  `prlimit --core=1:1 timeout`, on Windows with `demo_prepare()`. These protections **do not fix
  the bug** — they only make it harder to exploit, or stop it.

## Try it yourself

1. Inspect `overflow_hardened` with `readelf -h`: is `Type: DYN` (PIE)? Why is `overflow_weak` `EXEC`?
2. On Windows, run `dumpbin /headers overflow_hardened.exe` and find the "Dynamic base" and "High
   Entropy" lines.
3. In the hardened version, shrink the buffer from 64 to 8 bytes. Does the canary still trigger?
   Why doesn't `/GS` protect every buffer?
