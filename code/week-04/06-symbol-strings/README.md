# Demo 6 — Symbol and string leakage

**Topic:** Information disclosure from a binary, symbol/string hiding (CWE-200, CWE-215) · **Week:** 4 ·
**Book:** Viega & Messier, Recipe 12.11 (hiding strings)

## What it shows

**Plain-text strings** left in a release binary (logging text, hidden constants) and **function
names** hand a reverse engineer a direct hint. We see them with `strings` and `nm`; then we close
the leak by obfuscating the string at compile time (XOR), compiling logging out of the release
build, and `strip`ping the symbols.

| Step | What happens |
| --- | --- |
| 1 | `secret_exposed` and `secret_hidden` behave identically (license check) |
| 2 | `strings` → the exposed version shows `CEN429-LICENSE-2026` and `[LOG]`; the hidden version shows neither |
| 3 | `nm` → the exposed version shows `license_verify`; the hidden version is stripped ("no symbols") |
| 4 | Windows: names live in `.pdb`, not the EXE; the hidden version produces no PDB, and its string is hidden |

## The instructor's own methods (this course's techniques)

- **Turning off symbol visibility** (`-fvisibility=hidden`, `static`, `strip -s`): minimizes the
  symbols a shared library exports.
- **Compiling logging out of the release build:** compile the LOG macros out entirely with a
  build-time flag.
- **Static string obfuscation:** encrypt/scramble sensitive constants at compile time, decode them
  only when used.

## Running it

First, inside the `code/` folder: Windows `.\build.ps1` · WSL / Linux `./build.sh`.
Then, inside this folder: Windows `.\demo.ps1` (or `demo.cmd`) · WSL / Linux `sh demo.sh`.
Linux needs `strings`/`nm` (binutils); on Windows the script scans with plain PowerShell.

## Why it's safe

- The program only decodes its own string and prints it; it never touches any system resource. All
  values are **synthetic**. This is an obfuscation technique: it does not make the string
  unbreakable, it **raises the cost** of extracting it.

## Try it yourself

1. While `secret_hidden` runs, the decoded string sits in memory for a while. Why is that alone not
   enough (Week 3: secure wiping)?
2. Make the XOR key different on every build instead of the fixed `0x5A` (diversification). Why is
   this better?
3. Compare `nm --dynamic secret_exposed` with `nm secret_exposed`. What's the difference, and which
   one does `-fvisibility=hidden` affect?
