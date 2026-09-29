# Demo 1 — Unit test runner (S16 results)

**Topic:** Unit testing as evidence for S16 · **Week:** 12

## What it shows

Two small security functions (`validate_input`, `safe_add`) are checked with **test cards**: each card prints
its id, purpose, observed evidence and decision (PASS/FAIL). The program's exit code equals the number of
FAILED cards — 0 means every card passed, which is exactly what a CI pipeline (and S16, this week's project
deliverable) checks for.

| Card | What it checks |
| --- | --- |
| T-01 | A valid input (letters, digits, underscore) is accepted |
| T-02 | An input containing whitespace/metacharacters is rejected |
| T-03 | An empty input is rejected |
| T-04 | An input longer than 32 characters is rejected |
| T-05 | Normal integer addition is correct |
| T-06 | An integer overflow is caught **before** it happens (INT32-C) |

The separate `tests/test_system_under_test.c` (run automatically by `code/run_tests.py`) checks both functions
much more thoroughly (boundary lengths, non-ASCII input, both overflow directions).

## Running it

First build all demos once (inside `code/`): Windows `.\build.ps1` · WSL / Linux `./build.sh`.
Then, in this folder:

| Environment | Command |
| --- | --- |
| Windows (PowerShell) | `.\demo.ps1` — or double-click `demo.cmd` |
| WSL / Linux | `sh demo.sh` |

## Why is it safe?

The program only performs in-memory computation on the strings/integers it is given; it never reads or writes
any file, and makes no network or system call.

## Try it yourself

1. Change T-01's input to something that should be rejected (e.g. add a space) and rerun — watch the card turn
   FAIL and the exit code become 1.
2. Add a seventh test card for a case not yet covered (e.g. `validate_input` with a string of exactly 32
   characters). Does your prediction match the observed result?
