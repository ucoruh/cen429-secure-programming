# Demo 3 — Becoming admin with a one-byte overflow

**Topic:** Buffer overflow, memory layout, run-time checks (CWE-120, CWE-787) · **Week:** 1 ·
**Book:** Viega & Messier, Recipe 3.3 (preventing buffer overflows)

## What it shows

Session information is kept in a struct: a 16-byte username, immediately followed by an `admin` field. The name
is copied with `strcpy`, with no length check. A name longer than 16 bytes overwrites the field that sits right
behind it in memory.

```text
offset:  0 ........................ 15 | 16 17 18 19
         [ name[0] ............ name[15] ][ admin     ]
"AAAAAAAAAAAAAAAAB" -> 16 x 'A' into name, 'B' (0x42 = 66) into admin
```

| Step | Program | What happens | Lesson |
| --- | --- | --- | --- |
| 1 | `login alice` | Normal user | — |
| 2 | `login AAAAAAAAAAAAAAAAB` | **The admin panel opens** | One byte of overflow grants a privilege |
| 3 | `login_asan`, same input | ASan stays **silent** | The overflow stayed inside the struct; tools have limits too |
| 4 | `login_asan`, 40 characters | ASan reports `stack-buffer-overflow` | A write past the struct is caught |
| 5 | `login_checked`, same short input | The program is stopped | `_FORTIFY_SOURCE` (Linux) / `strcpy_s` (Windows) knows the destination size |
| 6 | `login_secure` | The input is rejected | The real fix: validate the length and the characters |

## Running it

First build all the demos once (inside the `code/` folder): Windows `.\build.ps1` · WSL / Linux `./build.sh`.
Then, inside this folder: Windows `.\demo.ps1` (or `demo.cmd`) · WSL / Linux `sh demo.sh`.

To step through it in Visual Studio: make `login` the startup item, pass `AAAAAAAAAAAAAAAAB` as the argument
(see `code/README.md`), set a breakpoint on the `strcpy` line, and watch the address `&s` in the **Memory**
window.

## Why it's safe

- The overflow only happens on the program's own stack; the program either prints a message and exits, or is
  stopped by a check.
- No error dialog opens on Windows (`demo_hazirla()`), no crash dump is written on Linux, and every command has
  a time limit.

## Try it yourself

1. Find the name that sets the `admin` field to 1. (Hint: the ASCII code of the 17th character.)
2. Swap the order of the struct's fields (`admin` first). Does the attack still work? Is this a real fix?
3. Remove the check in `login_secure.c` and use `strncpy` instead. What happened to the terminating `\0`?
