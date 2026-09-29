# Demo 14 — RBAC, separation of duty, and a Clark–Wilson simulator

**Topic:** RBAC0–RBAC2 (assignment, session, hierarchy, SSD/DSD), Clark–Wilson (CDI, UDI, TP, IVP; C1–C5, E1–E4) ·
**Week:** 2

## What it shows

A small account ledger (two accounts, synthetic amounts). The output states which rule stops or allows every
command.

| Section | What happens | Rule |
| --- | --- | --- |
| 1 | An approver cannot also be assigned a teller role; an auditor and a teller cannot be active in the same session; an unrecognized user | SSD, DSD, E3 |
| 2 | A valid deposit; `-500`, `12abc` are rejected; a direct write to a CDI; an unauthorized transfer; going negative | C5, E1, E2, C2 |
| 3 | A transfer above the threshold needs a second person's approval; even with the SSD removed, a TP never lets someone approve their own request | C3 |
| 4 | A certifier cannot run a TP; a broken TP gets certified and loses 1%; the IVP catches the inconsistency | E4, C2, C4, C1 |

## Running it

Build first (inside `code/`, `.\build.ps1` or `./build.sh`), then inside this folder, on Windows `.\demo.ps1`
(or `demo.cmd`), on WSL/Linux `sh demo.sh`. Directly: `.\bin\windows\bank.exe scenario.txt`.

## Why it's safe

A pure simulation: it uses no file, network, or system setting; it only reads `scenario.txt`. There is no real
money and no real account.

## Try it yourself

- Remove the `SSD TELLER APPROVER` line: what changes in section 1, and does the C3 check inside the TP still
  protect section 3?
- Set `APPROVAL_THRESHOLD` to 500: how many transactions now fall to a second approval?
- Run `BAD_TRANSFER` without certifying it first (remove the `CERTIFY` line): which rule stops it?
