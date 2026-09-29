# Demo 7 — Root / elevated-environment indicator detection

**Topic:** RASP detection — root/jailbreak indicators (mobile), privilege level · **Week:** 6 ·
**Catalog:** K4 (root detection), K5 (OS-based integrity/attestation)

## What it shows

Mobile RASP's root detection looks at indicators such as the `su` binary, dangerous packages and writable system
paths. The portable, safe desktop equivalent:

1. **Privilege level:** is the application running as administrator/root? (Linux `geteuid()==0`, Windows an
   elevated token.) Payment-like applications refuse to run as root under least privilege.
2. **Dangerous-indicator scan:** checks the existence of known marker paths by **reading only**. On a desktop,
   typical mobile markers (su, magisk) are not found → clean. To make the demo deterministic, an extra "fake
   marker" path can be given on the command line (`demo.sh` creates one inside `output/`).

## Running it

First build (inside `code/`). Then, in this folder: Windows `.\demo.ps1` · WSL/Linux `sh demo.sh`. Step 1 is
clean, step 2 shows "detected" with a fake marker file.

## Why is it safe?

It only **reads** whether a file exists and queries its own privilege level; it changes no file or setting and
**needs no** administrator rights. The fake marker lives only in the demo's own `output/` folder.

## Try it yourself

1. Why are these indicators "a signal, not proof"? How does root hiding (Magisk Hide) evade them?
2. What happens to a legitimate user who rooted their own device if an application refuses to run just because
   it saw root? (The false-positive / user-experience trade-off.)
3. On Windows, run the demo **as Administrator** once (optional). How did the privilege level change?
