# Demo 2 — Command injection: shell string vs argument list

**Topic:** Command injection, invoking external programs (CWE-78) · **Week:** 5 ·
**Book:** Viega & Messier, Recipe 3.1 (input validation), 1.7–1.8 (safely running
an external program)

## What it shows

A "greeting tool" passes a user name to an external program:

- **BAD:** the command is given to the shell as a single **string** (`sh -c` /
  `cmd /c`, or `Runtime.exec(String)` in Java). A `;` (Linux) or `&` (Windows) in
  the input starts a **second command** in the shell. In the demo the injected
  command only runs a harmless `echo` — in a real attack it could delete or
  steal files.
- **GOOD:** `ProcessBuilder` (Java) / `subprocess` with an **argument list**
  (Python) is used. There is no shell; the input passes through as a single
  **argument**, like data. An **allow-list** (`^[A-Za-z0-9_]+$`, default-deny)
  also validates the input before anything runs.

Same lesson in both languages: **never build a command string for a shell**; pass
an argument list.

## Running it

| Environment | Command |
| --- | --- |
| Windows (PowerShell) | `.\demo.ps1` — or double-click `demo.cmd` |
| WSL / Linux | `sh demo.sh` |

The Python part always runs; the Java part runs if a **JDK 17/21** is present. **No
download required.** The "tool" the Java demo runs is `java -cp bin Printer`, using
`java` from PATH (already installed on the student's machine).

## Why it's safe

- The injected command is only `echo`, which prints a message; **no file is
  deleted/changed**, no network is used, no administrator privilege is requested.
- The only program ever run is the demo's own `Printer` class (it prints its
  arguments) or the Python interpreter. No other tool on the system is invoked.

## Try it yourself

1. Instead of `echo LEAKED`, print some other harmless text. Why does the shell
   also run this second command? Try the `&` / `;` / `|` / `&&` separators.
2. Loosen the allow-list (allow spaces). Which inputs pass now? Why is that
   dangerous? Why is "default-deny" safer than "search for the bad stuff"?
3. In Java, change `runBad` to use an argument list (`ProcessBuilder`). What
   happens with the same bad input now? Why does `&` lose its special meaning
   once the shell is out of the picture?
