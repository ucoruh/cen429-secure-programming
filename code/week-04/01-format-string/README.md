# Demo 1 — Format string vulnerability

**Topic:** User-controlled format string (CWE-134) · **Week:** 4 ·
**Book:** Viega & Messier, Recipe 3.2 (preventing attacks against formatting functions)

## What it shows

A call like `printf(user_text)` asks the user "what should be written to the screen?" If the user types a format
specifier (`%x`, `%p`, `%n`), the program treats it as a **command**:

- `%x` / `%p` → **reads** a value off the stack (information leak; the program's secret value leaks),
- `%n` → **writes** to memory (crash, eventually code execution).

The fix is one line: `printf("%s", user_text)` — data is always an **argument**, the format is always **constant**.

| Step | What happens | Lesson |
| --- | --- | --- |
| 0 | Compiler warning | GCC/Clang `-Wformat-security` warns; MSVC's C compiler is silent by default, `/analyze` catches it |
| 1 | `leak Hello` | Normal |
| 2 | `leak '%x.%x...'` | The stack is dumped as hex; the secret value (`0x5ece7`) leaks |
| 3 | `leak 'AAAA%n'` | Linux unprotected: `SIGSEGV` · Windows: the CRT blocks `%n` |
| 4 | `leak_checked 'AAAA%n'` | Linux `_FORTIFY_SOURCE`: `*** %n in writable segment detected ***` |
| 5 | `leak_secure '...%n...'` | `%n` is now just text: safe |

## Running it

First build all the demos once (inside the `code/` folder): Windows `.\build.ps1` · WSL / Linux `./build.sh`.
Then, inside this folder: Windows `.\demo.ps1` (or `demo.cmd`) · WSL / Linux `sh demo.sh`.

## Why it's safe

- Every specifier only reads/writes **this program's own memory**. Steps that could crash are bounded on Linux
  with `prlimit --core=1:1 timeout`, on Windows with `demo_prepare()`; no error dialog opens, no crash dump is
  written, no system setting changes.

## Try it yourself

1. Give `%s` instead of `%n`: `leak '%s %s %s'`. What happens, and why? (Hint: `%s` expects a pointer.)
2. In `leak_secure`, replace `printf("%s", argv[1])` with `printf(argv[1])` and rebuild. Is the bug back?
3. On Linux, inspect `leak_checked` with `objdump -d`: find the call to `__printf_chk` instead of `printf`.
