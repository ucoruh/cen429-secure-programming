# Demo 2 — Password left in memory: why `memset` isn't enough

**Topic:** Secrets in memory, compiler optimization, and secure wiping (CWE-14, CWE-316) · **Week:** 1 ·
**Book:** Viega & Messier, Recipe 13.2 (erasing data in memory)

## What it shows

The `password` program reads the password from the `password.txt` file, uses it to compute a key, and then tries
to wipe the password once it is done. A dump of the program's memory is then taken and searched for the
password. This is a safe simulation of an attacker stealing a secret from a crash dump, a swap file, or a
debugger.

The same source is compiled three times:

| Program | Wipe method | Expected result |
| --- | --- | --- |
| `password_no_wipe` | Never wipes it | The password **is found** in the dump |
| `password_memset` | `memset(password, 0, ...)`, `-O2` / `/O2` | The password **is found** in the dump: the compiler treats this never-read-again write as "dead" and removes it |
| `password_explicit` | `explicit_bzero` (Linux) / `SecureZeroMemory` (Windows) | The password **is not found** in the dump |

The Linux script also counts machine instructions: in the `memset` version, the wipe instruction count is zero —
meaning no wipe code was ever generated.

## Running it

First build all the demos once (inside the `code/` folder): Windows `.\build.ps1` · WSL / Linux `./build.sh`.
Then, inside this folder:

| Environment | Command | How it takes the dump |
| --- | --- | --- |
| Windows (PowerShell) | `.\demo.ps1` | The program writes its own memory with `MiniDumpWriteDump` into the `dump\` folder |
| WSL / Linux | `sh demo.sh` (needs gdb) | The program is started under gdb and dumped with `gcore` into the `dump/` folder |

## Why it's safe

- The password is made up (`Secret-Password-2026`) and lives only in the `password.txt` file in this folder.
- Only the **demo program's own memory** is dumped; no other process is touched, and no administrator rights are
  needed.
- Dump files (a few tens of MB on Windows) are only written into the `dump/` folder; `build clean` removes them
  too.

## Try it yourself

1. Change the password inside `password.txt` and rerun the demo.
2. In `CMakeLists.txt`, change the mode for `password_memset` from `optimize` to `korumasiz` (`-O0` / `/Od`) and
   rebuild. Does `memset` survive now? Why?
3. Read the comment on `deep_call_chain()` in `password.c`: why can an un-wiped secret live on in memory for
   hours?
