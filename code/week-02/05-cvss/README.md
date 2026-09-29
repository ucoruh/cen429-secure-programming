# Demo 5 — CVSS v3.1 Base Score calculator

**Topic:** CVE and CVSS scoring, vulnerability severity · **Week:** 2

## What it shows

Takes a CVSS v3.1 vector (e.g. `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`) and computes the **Base Score**
(0.0-10.0) from scratch using FIRST's official formulas. Ideal for seeing, by hand, how the eight metrics affect
the score. `--examples` solves five typical vulnerabilities; `test_cvss.py` verifies the results against the
known values in the FIRST specification.

## Running it

This demo needs **no build** (Python). The `build.ps1`/`build.sh` in the `code/` folder build the other demos;
you can run this one directly:

| Environment | Command |
| --- | --- |
| Windows (PowerShell) | `.\demo.ps1` — or double-click `demo.cmd` |
| WSL / Linux | `sh demo.sh` |

By hand:

```bash
python3 cvss.py "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
python3 cvss.py --examples
python3 test_cvss.py          # compares against known scores
```

On Windows, use `py -3` instead of `python3`: `py -3 cvss.py --examples`.

## Why it's safe

It only does arithmetic. It makes no network request, writes no file, and touches no system.

## Try it yourself

- Change `AV:N` to `AV:L` (remote → local). Why does the score drop? In the "device is in the attacker's hands"
  scenario, does that drop reflect reality?
- Change `S:U` to `S:C` (the scope changed). Why does the score go up? What exactly does "scope" describe?
- Build a vector for a vulnerability in your own project and score it. The Base Score does not include context
  (the asset's value) — how would you add that in your own S4 table?
