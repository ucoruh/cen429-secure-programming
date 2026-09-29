# Demo 4 — Introduction to fuzzing (libFuzzer)

**Topic:** Fuzz testing, automatic bug-finding with a sanitizer (CWE-125/CWE-787) · **Week:** 4 ·
**Book:** Viega & Messier, Recipe 3.1 (input validation) — fuzzing became mainstream after 2003

## What it shows

A small length-prefixed parser (`[type][length][data...]`) performs no bounds checking. libFuzzer
measures code coverage and automatically mutates the input, finding a **crashing input within
seconds**; ASan reports it at the exact spot. We then fix it and fuzz for the same time again: no
crash can be produced any more.

| Step | What happens |
| --- | --- |
| 1 | Normal input (`seeds/normal.bin`) parses without trouble |
| 2 | The buggy parser is fuzzed with libFuzzer (≤10 s) → a crashing input is found |
| 3 | The input found is replayed with the ASan reproducer → the full error report |
| 4 | The fixed parser is fuzzed for the same time → no crash |
| 5 | The fixed version safely rejects `seeds/crash.bin` |

## Platforms

- **Linux / WSL:** `clang -fsanitize=fuzzer,address`. Ubuntu 24.04 ships clang 18; on Ubuntu 20.04,
  `sudo apt-get install -y clang`. **Without clang**, the libFuzzer targets are **automatically
  skipped** by CMake; `demo.sh` says so and shows the bug with the ASan reproducer instead
  (`seeds/crash.bin`).
- **Windows:** MSVC `/fsanitize=fuzzer` (the Visual Studio 2022 "C++ AddressSanitizer" component). If
  it is not installed, `demo.ps1` runs only the ASan reproducer.

## Why it's safe

- Fuzzing is always **time-limited** (`-max_total_time`), and all output is written under this
  folder's `fuzz-out/` and deleted at the end of the demo. Runs that could crash are bounded on
  Linux with `prlimit --core=1:1 timeout` + `setarch -R`, on Windows with `demo_prepare()`. Only
  small **seed** inputs are kept in the repository.

## Try it yourself

1. Lower `-max_total_time` to 2 seconds. Is the crash still found? Why does coverage make this fast?
2. In `parser.c`, add only `if (n < 2) return 0;` (the first bug). What second bug does the fuzzer
   now find?
3. Add a few different seeds to `fuzz-out/corpus`. Does the fuzzer make faster progress?
