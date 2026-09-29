# Demo 5 — Code obfuscation: string hiding, reflection, ProGuard

**Topic:** Obfuscation, string hiding, reflection, shrinking (CWE-798) · **Week:** 5 ·
**Book:** Viega & Messier, Recipe 12.11 (string hiding), 12.7–12.10 (obfuscation)

## What it shows

Demo 4 showed that a compiled `.class` file is an open book. This demo shows three
independent, combinable mitigations:

- **Part A — static string hiding:** `PlainConstant` embeds a secret as a literal
  string (visible in `javap -c -p`). `HiddenConstant` XOR-encrypts the same string
  before compiling and decrypts it at run time; the plain text never appears in the
  bytecode.
- **Part B — hiding a method call via reflection:** `DirectCall` calls
  `hiddenOperation()` directly (`invokestatic hiddenOperation` is visible in the
  bytecode). `ReflectionCall` builds the method's name at run time (also
  XOR-hidden) and calls it through `Class.getDeclaredMethod` + `Method.invoke`;
  no direct call site names it. The method is **still defined in the class**
  (`javap -p` lists it) — reflection hides the *call link*, not the method itself.
- **Part C (optional) — ProGuard:** shrinks and renames. A `-keep` rule protects
  `DirectCall.main` as the entry point; the unused private `hiddenOperation` is
  removed by shrinking. `javap -p` before/after shows the member disappearing.

## Running it

| Environment | Command |
| --- | --- |
| Windows (PowerShell) | `.\demo.ps1` — or double-click `demo.cmd` |
| WSL / Linux | `sh demo.sh` |

Parts A and B need only a **JDK 17/21** and **no download**. Part C is optional; to
enable it:

| Environment | Command |
| --- | --- |
| Windows | `.\prepare.ps1` |
| WSL / Linux | `sh prepare.sh` |

`prepare` downloads ProGuard `7.4.2` from its official GitHub release at a **pinned
version, verified by SHA-256**, and extracts only `lib/proguard.jar`. The jar never
enters the repository.

## Why it's safe

- All programs only print to the screen or read/write files under `output/` and
  `bin/` inside the demo folder. No system file is touched, no network/administrator
  privilege is used.
- All secret-looking values (`server-key-9F3A`, `hidden-result-42`) are synthetic.

## Try it yourself

1. Change the XOR key in `HiddenConstant`/`ReflectionCall` and recompile. Does
   `javap -c -p` still show anything readable? Why does XOR alone not count as real
   encryption (hint: think about what happens if an attacker recovers the key)?
2. In `proguard.pro`, widen the `-keep` rule (e.g. `-keep class * { *; }`). Run
   Part C again: does shrinking still remove `hiddenOperation`? Why does a
   too-broad `-keep` defeat the whole point?
3. Read `ReflectionCall.main`'s bytecode with `javap -c -p` yourself. Which line
   proves the method name was **not** a compile-time constant?
