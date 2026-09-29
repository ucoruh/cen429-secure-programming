# Demo 6 — A TOCTOU race condition (CWE-367)

**Topic:** Vulnerability classification (CWE-367: Time-of-check Time-of-use), Unix access control · **Week:** 2 ·
**Book:** Viega & Messier, Recipe 2.3 (checking a user's access to a file; TOCTOU races)

## What it shows

A "log writer" program checks "is it safe for me to write to this file?" before writing. The **unsafe** version
looks with `lstat()` first, then opens with `fopen()`. If an attacker replaces the target with a **symbolic
link** between the two operations, the program writes to a different file than the one it checked. The **safe**
version opens with `O_NOFOLLOW | O_CREAT`; because the check and the use happen in one atomic step, it refuses
the symbolic link.

| Step | Version | Result |
| --- | --- | --- |
| 1 | Unsafe (check → then open) | The write is redirected to `secret_target.txt`: **the attack succeeds** |
| 2 | Safe (`O_NOFOLLOW`) | The symbolic link is refused: **the attack is blocked** |

## Running it

This demo runs **only on Linux / WSL** (symbolic links, `O_NOFOLLOW`, and the POSIX file API). It does not build
on Windows; `demo.ps1` explains how to run it under WSL.

First build all the demos once (inside the `code/` folder, on WSL/Linux): `./build.sh` (or in Visual Studio,
**Build All** with the **WSL (GCC)** configuration). Then, inside this folder:

| Environment | Command |
| --- | --- |
| WSL / Linux | `sh demo.sh` |
| Windows | `.\demo.ps1` — shows you how to run it under WSL |

## Why it's safe (ethics)

- Every file is produced **inside the `work/` subfolder**; no system file is touched.
- Administrator (sudo) rights are **never needed**; no system setting changes.
- `secret_target.txt` is a harmless demo file standing in for "the file the attack needs to protect."
- To make the race visible in class, the program adds a small delay through the `TOCTOU_DELAY_US` environment
  variable; a real attack does not need this delay (the attacker simply retries many times).

## Try it yourself

- Set the `TOCTOU_DELAY_US` delay to 0 (remove the `export` line from the attack script). Does the attack still
  work? Why do real attackers automate the attempt?
- Remove `O_NOFOLLOW` from the safe version. Which version does it now behave like?
- What is this vulnerability's CWE number? How is the "temp file" vulnerability in the same family (CWE-377)
  prevented? (Hint: `O_EXCL`, `mkstemp`.)
