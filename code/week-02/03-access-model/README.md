# Demo 03 — Access control and formal security model simulator

**Topic:** Access control matrix, DAC/MAC, Bell–LaPadula (level + category), Biba (strict and low-water-mark),
Chinese Wall · **Week:** 2 · **Book:** Viega & Messier, Recipe 2.1–2.2 (operating-system counterparts)

## What it shows

Evaluates the same access requests against a text policy and shows the models' decisions side by side. The
effective decision is computed as `DAC AND (the active mandatory model)` (BLP's ds-property).

| Step | Policy | Model | What it teaches |
| --- | --- | --- | --- |
| 0 | `policy-matrix.txt` | Pure DAC | Least privilege: not in the matrix, denied |
| 1 | `policy-confidentiality.txt` | BLP | No read up, no write down (**confidentiality**) |
| 2 | `policy-integrity.txt` | Biba | No read down, no write up (**integrity**) |
| 3 | `policy-category.txt` | BLP + categories | Dominance: level alone isn't enough, you need the category too |
| 4 | `policy-lwm.txt` | Biba low-water-mark | Reading lowers the subject's level |
| 5 | `policy-chinese-wall.txt` | Chinese Wall | The decision depends on history: a wall against a conflicting company |

## Running it

First build all the demos once (inside the `code/` folder): Windows `.\build.ps1` · WSL / Linux `./build.sh`.
Then, inside this folder: Windows `.\demo.ps1` (or double-click `demo.cmd`) · WSL / Linux `sh demo.sh`.

Try your own policy: `.\bin\windows\access.exe policy-category.txt` or
`./bin/linux/access policy-category.txt`. The format is explained at the top of `access.c` (`MODEL`, `LEVEL`,
`SUBJECT`, `OBJECT`, `COMPANY`, `RIGHT`, `REQUEST`; `RIGHT * * rw` grants everyone every right).

## Why it's safe

This is a **simulator**: it never touches a real file, user, or operating-system setting.

## Try it yourself

- In `policy-confidentiality.txt`, write `MODEL BLP+BIBA`: at which level must a subject be to both read and
  write the same object?
- In `policy-category.txt`, add the `NUCLEAR` category to `attache`; which decisions change?
- In `policy-lwm.txt`, move the `read incoming` request to the very top. Why do the later decisions change? How
  does this conflict with the "tranquility" principle?
- In `policy-chinese-wall.txt`, change `consultant1`'s first request to `b_balance_sheet`. Which company does
  the wall close against this time?
