# Demo 4 — Bytecode and decompiling: what shows up inside `.class`?

**Topic:** Bytecode, reverse engineering, secrets embedded in code (CWE-798) ·
**Week:** 5 · **Book:** Viega & Messier, Recipe 12.11 (string hiding — concept)

## What it shows

A small "license/PIN check" class is compiled. Then the JDK's own **`javap -c -p`**
tool inspects the `.class` file. Even **without** the source code, you can plainly see:

- **Constant strings:** `// String 4729` (the PIN) and `// String PRO-2026-DEMO`
  (the license key) sit as plain text in the constant pool.
- **Field and method names:** `VALID_PIN`, `pinCorrect`, `licenseValid` — meaningful
  names give the logic away.
- **Branch logic:** the `ldc` (load constant) and `invokevirtual equals` bytecode
  shows "compare the input against this constant" plainly.

This is the **motivation** for obfuscation: Java bytecode is high-level and easy to
read with tools like `javap`, `jadx` or CFR. Demo 5 reduces this leak with string
hiding and reflection.

## Running it

| Environment | Command |
| --- | --- |
| Windows (PowerShell) | `.\demo.ps1` — or double-click `demo.cmd` |
| WSL / Linux | `sh demo.sh` |

Only **JDK 17/21** is needed (`javac`, `javap`). **No download required.**

## Why it's safe

- The program only prints to the screen; it touches no file/system, uses no network.
- Every value (`4729`, `PRO-2026-DEMO`) is **synthetic**; not a real product, license
  or PIN.

## Try it yourself

1. In the `javap -c -p LicenseCheck` output, find the `ldc` lines. Which line gives
   the PIN away? How could an attacker use this information to bypass the program?
2. Run `main` with the correct PIN (`4729`) as an argument. How does the bytecode's
   logic match the behavior you see on screen?
3. Run `javap -v` (full detail). List the strings in the constant pool. Why do the
   `String` entries show up separately from the code that uses them?
