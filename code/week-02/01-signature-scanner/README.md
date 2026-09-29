# Demo 01 — Toy antivirus: signatures, polymorphism, heuristics, emulation

**Topic:** Malware detection and how malware hides from it · **Week:** 2 ·
**Book:** Viega & Messier, Recipe 12.1 (the problem with software protection — the attacker and the defender use
the same techniques)

## What it shows

Working code shows how four scanning methods work **and where each one falls short**. There is no real malware
here. Instead, this demo uses a made-up, non-executable **"CAPSULE"** data format: a header + a "decoder"
command line + a (plain or scrambled) body. This structure imitates the skeleton of a real encrypted/polymorphic
piece of malware, but it contains nothing but harmless text.

| Step | Method | Lesson |
| --- | --- | --- |
| 1 | Digest + entropy | The lab first examines the sample it captured |
| 2 | **Hash** (SHA-256) | Catches the exact same file; **change one byte** and it's evaded |
| 3 | **Pattern** (byte sequence) | Survives small changes; evaded once the decoder itself changes (polymorphism) |
| 4 | — | Same body + different key → completely different bytes (the strength of the encryption layer) |
| 5 | **Heuristic** | Scores traits without a signature; produces a false positive (harmless `archive.bin`) and a false negative |
| 6 | **Emulation** | Runs the decoder in a safe "virtual machine", rescans the decoded body → catches everything |

SHA-256 works on both platforms: OpenSSL on Linux, the operating system's own BCrypt library on Windows
(`common/cen429_kripto.h`).

## Running it

First build all the demos once (inside the `code/` folder): Windows `.\build.ps1` · WSL / Linux `./build.sh` ·
Visual Studio: **File > Open > Folder** → `code` → choose a configuration (**Windows (MSVC)** or **WSL (GCC)**)
→ **Build > Build All**. Then, inside this folder:

| Environment | Command |
| --- | --- |
| Windows (PowerShell) | `.\demo.ps1` — or double-click `demo.cmd` |
| WSL / Linux | `sh demo.sh` |

Binaries are written under `bin\windows\` or `bin/linux/`, sample files under `output/` (both are excluded via
`.gitignore`).

## Why it's safe

- The generated files are **not executable**; no operating system can run them, only our own scanner reads them.
- The scanner only **reads**: it never modifies, deletes, or runs any file.
- The "decoder emulation" never runs real machine code; it only interprets a toy 6-instruction language and
  blocks infinite loops by capping the instruction count (a timeout). An unknown command, or a `LEN` longer than
  the body, is rejected — meaning **the file is never trusted**.
- No string that would trigger a real antivirus (such as the EICAR test string) is used.

## Try it yourself

- Add a new `PATTERN` line in `signatures.txt` for `poly_3.bin`'s decoder. Does the pattern method catch it now?
  What if a fourth polymorphic copy (a new algorithm) were produced?
- In `generate_samples.c`, split the `BLUE-CAT-42` marker into two pieces in the body (`BLUE-` + `CAT-42`). Does
  emulation still catch it? What about the pattern method?
- Why does the heuristic score go up when `NOP` commands are added to the decoder? Why do real pieces of malware
  add "junk code" too?
