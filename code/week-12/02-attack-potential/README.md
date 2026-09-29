# Demo 2 — Attack potential calculator

**Topic:** Rating a finding's severity by attack potential · **Week:** 12

## What it shows

Five factors — elapsed time, expertise, knowledge of the TOE (target of evaluation), window of
opportunity, equipment — are each scored on a simplified scale and summed; the total maps to a resistance
rating (BASIC/MODERATE/HIGH/VERY HIGH/BEYOND). A **LOW** total means the attack is **easy**, which makes it a
**serious** finding — the opposite of what "low score" sounds like at first.

| Run | What it does |
| --- | --- |
| No arguments | Scores three built-in example findings (a license-check patch, a white-box key extraction, a secure-element key extraction) |
| `attack_potential t e k w q` | Scores one finding from five factor-level indices (order: time, expertise, knowledge, opportunity, equipment) |

The separate `tests/test_attack_potential.c` (run automatically by `code/run_tests.py`) checks the rating
thresholds and the worked examples from the lecture notes directly.

## Running it

First build all demos once (inside `code/`): Windows `.\build.ps1` · WSL / Linux `./build.sh`.
Then, in this folder:

| Environment | Command |
| --- | --- |
| Windows (PowerShell) | `.\demo.ps1` — or double-click `demo.cmd` |
| WSL / Linux | `sh demo.sh` |

## Why is it safe?

The program only performs in-memory arithmetic on the numbers it is given (from `argv` or its own built-in
table); it never reads or writes any file, and makes no network or system call.

## Try it yourself

1. Run `attack_potential 3 3 3 2 2` (the secure-element scenario) and `attack_potential 0 1 0 0 0` (the
   unprotected license check) side by side — which score is lower, and why does that mean it is the more
   urgent finding?
2. Pick your own five factor levels for a finding from your own project and compute its score and rating.
