# Demo 3 — Undefined behavior

**Topic:** Signed integer overflow, invalid shift, misaligned access (CWE-190, CWE-758) · **Week:** 4 ·
**Book:** SEI CERT C (INT32-C, INT34-C, EXP36-C) — UBSan shipped in Clang/GCC from 2013 onward

## What it shows

Some C operations are "undefined behavior" (UB): the standard places no requirement on what happens,
and the compiler is free to assume they never occur — which lets it optimize in ways that make the
bug's effect unpredictable and version-dependent. On ordinary x86 hardware most of these produce no
visible fault, so the program looks fine while quietly computing the wrong answer.
UndefinedBehaviorSanitizer (UBSan) instruments the binary so each occurrence is reported at run time.

| Step | What happens | Lesson |
| --- | --- | --- |
| 1 | `ub overflow 1` / `ub shift 31` / `ub unaligned` | Each "looks like it runs"; the value is wrong or unpredictable |
| 2 | `ub_ubsan ...` (Linux/WSL only) | UBSan reports `runtime error: signed integer overflow`, etc. |
| 3 | `ub_secure ...` | Every case is checked before it happens; overflow/invalid shift is rejected, not silently miscomputed |

## Running it

First, inside the `code/` folder: Windows `.\build.ps1` · WSL / Linux `./build.sh`.
Then, inside this folder: Windows `.\demo.ps1` (or `demo.cmd`) · WSL / Linux `sh demo.sh`.
UBSan is Linux/WSL (GCC/Clang) only; MSVC has no UBSan equivalent (see the note in `demo.ps1`).

## Why it's safe

- Every mode only touches local, stack-allocated data; nothing else on the system is affected. Steps
  that could crash are bounded on Linux with `prlimit --core=1:1 timeout`, on Windows with
  `demo_prepare()`.

## Try it yourself

1. Run `ub shift 32` and `ub shift 40` (well past 31). Do the numbers make any obvious sense?
2. In `ub_secure.c`, change `n >= 31` to `n >= 32`. Which call now triggers UB again, and why is 31
   the correct boundary for a 32-bit `int` (hint: the sign bit)?
3. Compile `ub.c` with `-O0` and with `-O2` (Linux/WSL) and compare `overflow 1`'s output. Did the
   optimizer change the answer?
