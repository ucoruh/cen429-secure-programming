# Demo 1 — Runtime integrity check (self-hashing, HMAC)

**Topic:** RASP detection — code/data integrity verification, patch detection · **Week:** 6 ·
**Book:** Viega & Messier, Recipe 12.2 (Detecting Modification — CRC32; here upgraded to HMAC-SHA-256)

## What it shows

At runtime, the application computes the **HMAC-SHA-256** digest of its own binary (or a protected module) and
compares it with a previously saved "golden" value. If even a single byte has changed (patched), the mismatch is
caught.

| Step | What happens | Lesson |
| --- | --- | --- |
| 1 | `save self` — the golden HMAC of the program's own file is saved | Reference value |
| 2 | `verify self` — no patch, integrity is **OK** | Normal run |
| 3 | A **copy** of the binary is made and 1 byte is changed | Patch simulation (inside the program's own `output/` folder) |
| 4 | The patched copy's HMAC is compared with the golden value → **PATCH DETECTED** | The integrity check catches the patch |

Why HMAC instead of CRC32: CRC is not cryptographic — an attacker can easily patch the file so the CRC stays the
same. HMAC needs a secret key the attacker does not have.

## Running it

First build all demos once (inside `code/`): Windows `.\build.ps1` · WSL / Linux `./build.sh`.
Then, in this folder:

| Environment | Command |
| --- | --- |
| Windows (PowerShell) | `.\demo.ps1` — or double-click `demo.cmd` |
| WSL / Linux | `sh demo.sh` |

## Why is it safe?

- The program only **reads** files and compares them; it never **modifies** any file, record or system setting.
- The "patch" step happens on a **copy of the binary inside its own `output/` folder**; the real program file is
  never touched. Rerunning the script deletes `output/` first.

## Try it yourself

1. Patch a **different** offset in the copy. Does the HMAC still change? (Yes — HMAC depends on the whole file.)
2. Edit the golden value file (`output/golden.hmac`) as an attacker would. What can the check no longer catch?
   This is why "where should the golden value be stored?" matters.
3. Why is this check **alone** not enough? (Hint: an attacker could patch the checking code itself.) Directions
   forward: multiple/overlapping checkers, turning the result into a **data dependency** (Demo 5), server-side
   attestation.
