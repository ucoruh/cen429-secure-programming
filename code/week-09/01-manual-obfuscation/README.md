# Week 9 · Demo 1 — Manual obfuscation and cost measurement

The same `grant_access(token)` check in two versions: **clean** (unprotected) and **obfuscated**
(hand-applied R-01 opaque predicate, R-04 flattening, R-05 randomized exit, R-07 string encoding,
R-08 opaque boolean). Behavior is **byte-identical**; only readability drops and cost rises.

## Running it

```sh
../../build.sh        # or on Windows: ..\..\build.ps1
sh demo.sh             # Linux/WSL
```

On Windows directly: `bin\windows\access_obfuscated.exe CEN429-OK`, or `.\demo.ps1` / double-click `demo.cmd`.

## What it shows

1. **Behavior preserved:** both versions' output is byte-identical for the same tokens.
2. **Secret hidden:** the valid token `CEN429-OK` appears in the clean binary's `strings` output but
   **not** in the obfuscated one (R-07).
3. **Cost measured:** the instruction and branch count of `grant_access()` alone (`objdump`) —
   higher in the obfuscated version.
   Example measurement: clean 28 instructions/3 branches -> obfuscated 51 instructions/6 branches.

## Safety

Entirely synthetic; no file/network/system operation. The valid token is not embedded in the
binary; it is passed on the command line. `make clean` / deleting `bin/` is enough to clean up.

> Week 14 does this hand work automatically and with diversification, using **Tigress** (see `week-14`).
