# Week 14 · Demo 1 — Source-to-source obfuscation (Tigress)

Obfuscates `grant_access(token)` **source-to-source** with **Tigress** (when installed): transform
pipeline + behavior verification + `objdump`/`dumpbin` cost measurement + two-seed diversification.
When Tigress is not installed, the same steps run against the **documented local fallback**
(`fallback_transform.py`) instead, so the pipeline is still real and still end to end.
Same `grant_access`/`token`/`VALID_TOKEN` interface as `week-09/01-manual-obfuscation`, where the
same idea is applied **by hand**, without a tool — read that demo side by side with this one.

## Running it

```sh
../../build.sh        # or on Windows: ..\..\build.ps1
sh demo.sh             # Linux/WSL
```

On Windows directly: `bin\windows\source.exe CEN429-OK`, or `.\demo.ps1` / double-click `demo.cmd`.

Install Tigress from the official site to see the real tool run: <https://tigress.wtf> (free for
non-profit/academic use; commercial use needs a University of Arizona license). Without it, the
scripts print that message and use `fallback_transform.py` automatically — no separate flag needed.

## What it shows

1. **Source-to-source, not compiler-embedded:** the tool reads `source.c` (plain C) and writes
   another `.c` file (`variant_<seed>.c`); that generated file is compiled with your ordinary C
   compiler, exactly like any other source file — Tigress/the fallback never touches the compiler
   itself (contrast with Obfuscator-LLVM, week 14 §1).
2. **Behavior preserved:** the original and both diversified variants answer the same tokens the
   same way — obfuscation and diversification must never change what the program does.
3. **Cost measured:** the instruction/branch count of `grant_access()` (or, on Windows, the whole
   file's disassembly size) goes up in every transformed variant — the visible price of hiding it.
4. **Diversified:** seeds `1001` and `2002` produce **byte-different** binaries from the exact same
   source and the exact same transform flags — a patch written against one does not apply to the
   other (see week 14 §6).

## Files

| File | Purpose |
| --- | --- |
| `source.c` | The plain, readable input fed to the pipeline (the only file a maintainer edits). |
| `fallback_transform.py` | Documented local approximation of `EncodeLiterals` + `AddOpaque`, used automatically when Tigress is not on `PATH`. Only understands this demo's own `source.c`, not general C — that is what makes it a fallback, not a Tigress replacement. |
| `pipeline_check.py` | The automated end-to-end check (used by `ctest`): runs the pipeline for two seeds, asserts semantic equivalence against the original and that the two seeds' binaries differ in bytes. |
| `demo.sh` / `demo.ps1` / `demo.cmd` | The narrated, step-by-step version of the same pipeline for a live demo. |
| `tests/test_source.c` | Unit tests for `grant_access()` on the plain source (17 checks). |

Never hand-edit a generated `variant_*.c` file — it is regenerated from `source.c` on every run and
any hand edit is silently lost (see the `!!! danger` box in week 14 §1).

## Safety

Entirely synthetic; no file/network/system operation beyond compiling and running files inside this
folder's own temporary/working area. The valid token is not a real secret; it is only ever passed on
the command line. `make clean` / deleting `bin/` is enough to clean up; `demo.sh`/`demo.ps1` already
delete every generated `variant_*` file at the end of the run.
