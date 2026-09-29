# Demo 10 — Log injection and escaping (CWE-117)

**Topic:** Writing an untrusted field into an audit record; log forging · **Week:** 2 ·
**CWE:** CWE-117 (Improper Output Neutralization for Logs), related CWE-134 (format string)

## What it shows

A "login audit" log writes the username into a log line. The username is read as **raw bytes from a file**
(so line endings and control characters are represented without having to pass them through an argument).

- The **unsafe version** writes the field with no check at all: a `\n` (line ending) inside it creates a new
  **forged log line**; the attacker **injects** an `admin result=SUCCESS` record that never happened. Control
  characters (ANSI escape sequences) can erase the previous line on a terminal and mislead the analyst.
- The **safe version** escapes every non-printable byte as `\xNN`, **truncates** the field to an upper bound,
  and guarantees every input stays a **single line**. It also never uses user data as a format string
  (`fprintf(f, "%s", name)`), so the CWE-134 format-string bug is closed off from the start too. The escaped
  text can still *contain* the same words (a plain text search cannot tell), but they now sit, visibly mangled,
  inside the real submitter's own single line — never as a separate, independently-parseable record.

| Step | What happens | Expected |
| --- | --- | --- |
| 1 | Write 3 entries to the unsafe log | Injection produces **4** lines; one is a brand-new, standalone, believable `admin SUCCESS` record |
| 2 | Count the forged line | The `admin SUCCESS` text **is found**, as its own log line |
| 3 | Write the same entries + a long one to the safe log | Every entry is still **one line** (4 in, 4 out); control characters become `\xNN` |
| 4 | Count the forged line (safe) | The counter (a plain text search, not a record parser) still finds the same **words**, but now trapped, visibly escaped, **inside bob's own line** — no fifth line, no standalone forged record |

## Running it

First build all the demos once (inside the `code/` folder): Windows `.\build.ps1` · WSL / Linux `./build.sh`.
Then, inside this folder:

| Environment | Command |
| --- | --- |
| Windows (PowerShell) | `.\demo.ps1` — or double-click `demo.cmd` |
| WSL / Linux | `sh demo.sh` |

By hand: `.\bin\windows\logtool.exe generate work` then `... write unsafe work\02-injection.bin work\x.log`.

## Why it's safe

The program only writes under its **own folder's `work/`**; it never touches the operating system's
`syslog`/Event Log, needs no administrator rights, and uses no network. The usernames are made up. The
format-string bug is deliberately **never triggered**; the safe code path always uses a fixed format string.

## Try it yourself

1. Open `work/02-injection.bin` in a hex editor; find the `0a` (line-ending) byte.
2. Write your own "injection" input: put `trick` in a text file, then a line ending and a forged record;
   compare it in unsafe and safe mode.
3. Change the `LIMIT` value inside `escape()` and see how a long field gets truncated differently.
