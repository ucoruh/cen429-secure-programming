# Demo 07 — Mini rule engine: string, hex, and condition, inspired by YARA

**Topic:** Rule-based matching in malware detection; false positives and false negatives ·
**Week:** 2 · **Source:** concepts from the YARA rule language (string, hex pattern, wildcard, condition) —
the code is written from scratch and is not a substitute for YARA.

## What it shows

Analysts write **rules** to identify a malware family instead of a single byte sequence: they define a few
strings or hex patterns and combine them with a **condition**. This demo implements that idea in a small,
readable C program. The rules live in `rules.txt` and use only **harmless** patterns made up for this course.

| Step | What happens | Lesson |
| --- | --- | --- |
| 1 | Five rules are listed | A rule = named strings + a condition |
| 2 | Five sample files are scanned | Who matched which rule? |
| 3 | The harmless `guide.txt` matches the `Word_Pair` rule | **False positive:** looking at a word, not its context |
| 4 | The modified `variant.bin` evades `Capsule_Format` but the wildcard-carrying `Marker_Hex` catches it | A narrow rule misses things; a wildcard adds resilience |
| 5 | A broken rule file is rejected | The rule file is an **input** too |

Condition language: `$id` (did the string appear at least once), `#id >= n` (how many times), `and`, `or`,
`not`, parentheses, `n of them`, `all of them`, `any of them`, `true`, `false`.

## Running it

First build all the demos once (inside the `code/` folder): Windows `.\build.ps1` ·
WSL / Linux `./build.sh`. Then, inside this folder:

| Environment | Command |
| --- | --- |
| Windows (PowerShell) | `.\demo.ps1` — or double-click `demo.cmd` |
| WSL / Linux | `sh demo.sh` |

A detailed dump of a single file: `bin/linux/rule_engine -a rules.txt output/capsule.bin`
(Windows: `.\bin\windows\rule_engine.exe -a rules.txt output\capsule.bin`).

## Why it's safe

- Every sample file is **plain text**; none is executable and none contains a real malware signature. No
  string that would trigger an antivirus (including EICAR) is used.
- The program only **reads**; samples are generated under this folder's `output/`.
- The rule file is treated as untrusted input: 64 bytes per string, 8 strings per rule, at most 32 rules; a file
  that exceeds a limit or has broken syntax is **rejected outright**.

## Try it yourself

- Rewrite the `Word_Pair` rule so it will not catch `guide.txt` but will still catch `capsule.bin`. How many
  different ways did you find?
- Remove the wildcard from the `Marker_Hex` pattern (use `2d` instead of `??`). What happens to `variant.bin`?
- Write `#t >= 5` for `notes.txt`. Why does the match disappear? What is the cost of choosing a threshold?
- Write a rule for your own file (e.g. a lecture note) and use `-a` to see which string appeared how many times.
