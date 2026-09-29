# Demo 4 — Negative length: there is a check, but it isn't enough

**Topic:** Signed / unsigned integer conversion (CWE-195, CWE-805) · **Week:** 1 ·
**Book:** Viega & Messier, Recipe 3.5 (integer conversions and overflow)

## What it shows

A "record length" coming from a file or the network is read as an `int`, and only its **upper** bound is
checked. `-1` passes this check. Because `memcpy`'s length parameter is `size_t` (unsigned), `-1` turns into a
huge number like 18,446,744,073,709,551,615, and memory overflows.

| Step | What happens | Lesson |
| --- | --- | --- |
| 0 | Does the compiler see the bug? | GCC only warns with `-Wsign-conversion`; MSVC's C compiler never warns, but the same code compiled as C++ produces C4365 |
| 1 | `copy 8`: normal | — |
| 2 | `copy 100`: rejected | The upper-bound check works |
| 3 | `copy -1`: **crashes** | Linux: `SIGSEGV` (exit 139) · Windows: `0xC0000409` (stack buffer overflow detected) |
| 4 | `copy_asan -1` | ASan reports `negative-size-param` |
| 5 | `copy_secure` | `-1` and `12abc` are rejected; `8` works |

## Running it

First build all the demos once (inside the `code/` folder): Windows `.\build.ps1` · WSL / Linux `./build.sh`.
Then, inside this folder: Windows `.\demo.ps1` (or `demo.cmd`) · WSL / Linux `sh demo.sh`.

On Windows, step 0 finds Visual Studio's `cl` compiler by itself; you do not need to open a "Developer
PowerShell".

## Why it's safe

- The crash only happens in this program's own memory. No error dialog opens on Windows, no crash dump is
  written on Linux, and the command has a time limit.

## Try it yourself

1. In `copy.c`, change the check to `if (length < 0 || length > RECORD_SIZE)`. Is that enough? Why does
   `copy_secure.c` also use `strtol` instead of `atoi`? Try `copy 99999999999`.
2. Make the length variable a `size_t` from the very start. Which class of bug disappears, and which one
   remains?
3. If we turned on `-Wsign-conversion` for the whole project, which other lines would warn?
