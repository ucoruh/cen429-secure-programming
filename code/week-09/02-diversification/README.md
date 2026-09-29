# Week 9 · Demo 2 — Diversification (two seeds)

The same source (`diversified.c`), compiled twice with a different `SEED` macro. Both binaries
behave identically but their **machine code differs**: a patch/crack written against one copy does
not work against the other. A hand-written, compiler-macro imitation of Tigress's `--Seed`
(week 14 does this with the real tool).

## Running it

```sh
../../build.sh        # or on Windows: ..\..\build.ps1
sh demo.sh             # Linux/WSL
```

On Windows directly: `bin\windows\access_seed1001.exe CEN429-OK`, or `.\demo.ps1` / double-click `demo.cmd`.

## What it shows

1. **Behavior is the same:** `access_seed1001` and `access_seed2002` give the same GRANTED/DENIED
   answer for every token.
2. **Machine code is different:** the two binaries differ at hundreds of bytes (`cmp -l` on Linux,
   SHA-256 on Windows) — `grant_access()`'s encoded string mask and flattening case values both
   depend on `SEED`.
3. **Consequence:** an automated attack (a byte patch, a signature-based crack) that works on one
   seed's binary does not transfer to the other seed's binary.

## Safety

Entirely synthetic; no file/network/system operation. `make clean` / deleting `bin/` is enough to
clean up.

> Week 14 automates this with **Tigress**'s `RandomFuns`, `--Seed` and transform-composition
> options (see `week-14`).
