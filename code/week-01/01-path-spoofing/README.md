# Demo 1 — PATH spoofing: the program runs the wrong command

**Topic:** Safe process startup, untrusted search path (CWE-426, CWE-427) · **Week:** 1 ·
**Book:** Viega & Messier, Recipe 1.1 (cleaning up the environment), 1.7 and 1.8 (safely running external
programs: Unix / Windows)

## What it shows

The `report` program prints a header and then calls a system command: `hostname` on Windows, `date` on Linux.
Because it calls the command by its **bare name** through `system()`, the shell decides which file actually runs
by searching the `PATH` environment variable. Whoever can change `PATH` also decides what your program runs.

| Step | What happens | Lesson |
| --- | --- | --- |
| 1 | Normal run: the real command is found | The code looks correct, tests pass |
| 2 | The `fake` folder is added to the front of `PATH`: the fake command runs | Input is not only the keyboard; the environment is input too |
| 3 | The fixed `report_secure` behaves correctly under the same attack | Absolute path + shell-less launch + a small, clean environment |

The fixed version launches `System32\hostname.exe` on Windows by its full path with `CreateProcessW`, using an
environment that contains only `SystemRoot`; on Linux it launches `/bin/date` with `posix_spawn` and a clean
environment.

## Running it

First build all the demos once (inside the `code/` folder): Windows `.\build.ps1` · WSL / Linux `./build.sh` ·
Visual Studio: **File > Open > Folder** → `code` → **Build > Build All**. Then, inside this folder:

| Environment | Command |
| --- | --- |
| Windows (PowerShell) | `.\demo.ps1` — or double-click `demo.cmd` |
| WSL / Linux | `sh demo.sh` |

## Why it's safe

- The "fake" command (`fake\hostname.bat`, `fake/date`) only prints a warning to the screen; it does nothing else.
- The `PATH` change is only in effect **inside the demo script's own process**; it is never written to your
  system's settings, and it disappears once the script ends.

## Try it yourself

1. Change the message the fake command prints and repeat the attack by hand (PowerShell:
   `$env:PATH = "$PWD\fake;" + $env:PATH; .\bin\windows\report.exe` — only in effect in that one window).
2. On Windows, copy `fake\hostname.bat` into the demo folder itself and run `report.exe` without touching `PATH`.
   What happened? (Hint: `cmd.exe` searches the working folder first.)
3. Which three lines in `report_secure.c` block the attack? Remove one and watch the attack work again.
