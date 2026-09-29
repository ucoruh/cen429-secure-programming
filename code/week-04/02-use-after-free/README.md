# Demo 2 — Use-after-free and double-free

**Topic:** use-after-free (CWE-416), double-free (CWE-415) · **Week:** 4 ·
**Book:** Viega & Messier, Recipe 3.3 (memory-management bugs) — sanitizers were added after 2003

## What it shows

A "session" object kept on the heap is still usable after `free()` **if the pointer is not set to
NULL** (a dangling pointer). An attacker allocates a new block of the same size and puts their own
data in that spot; the dangling pointer now points at the attacker's data. That turns a `user` role
into `admin`, and the object's function pointer ends up calling a different function. A double-free
corrupts the allocator's own internal bookkeeping.

| Step | What happens | Lesson |
| --- | --- | --- |
| 1 | `uaf uaf` (unprotected) | The freed block is filled by the `admin` object -> privilege escalation |
| 2 | `uaf_asan uaf` | ASan reports `heap-use-after-free` (where allocated/freed/used) |
| 3 | `uaf double` (unprotected) | Double-free -> the allocator detects corruption / undefined behavior |
| 4 | `uaf_asan double` | ASan reports `attempting double-free` |
| 5 | `uaf_secure` | `free`+NULL, ownership, a single free point: both bugs are closed |

## Running it

First, inside the `code/` folder: Windows `.\build.ps1` · WSL / Linux `./build.sh`.
Then, inside this folder: Windows `.\demo.ps1` (or `demo.cmd`) · WSL / Linux `sh demo.sh`.

## Why it's safe

- The dangling function pointer only ever calls this program's **own** `admin_panel` function; no
  code is injected from the outside. Steps that could crash are bounded on Linux with
  `prlimit --core=1:1 timeout`, on Windows with `demo_prepare()`.

## Try it yourself

1. In the unprotected `uaf uaf`, remove the `fake` allocation. What does `s->role` show now? Is a
   UAF always exploitable, or does it depend on the memory layout?
2. In `uaf_secure.c`, replace `safe_free` with a plain `free(s)` (without setting it to NULL). Which
   step becomes dangerous again?
3. Read the three stack traces in the ASan report: where was the object **allocated**, where was it
   **freed**, where was it **used**?
