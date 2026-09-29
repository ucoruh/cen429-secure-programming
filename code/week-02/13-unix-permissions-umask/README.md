# Demo 13 — A Unix permissions, umask, and setuid lab

**Topic:** the Unix access model (UID/GID, real/effective/saved identity, rwx, setuid/setgid, the sticky bit,
umask, POSIX ACLs, Linux capabilities) · **Week:** 2 · **Book:** Viega & Messier, Recipe 2.1, 2.7 (also 1.3)

## What it shows

| Step | What happens | What it teaches |
| --- | --- | --- |
| 1 `permissions sim` | The kernel's permission algorithm, the umask table, setuid identity transitions, the sticky bit (simulation) | The first matching class decides; the saved-UID trap; the group is dropped first |
| 2 `permissions real` | Real files under `output/` (Linux/WSL only) | umask for real; "the owner can't read"; the r/x difference on a directory; an open fd is a capability; `CapEff` |
| 3 POSIX ACLs | `setfacl`/`getfacl` on the demo's own file | A named user, the mask, `#effective` |
| 4 The setuid list | `ls -l /usr/bin/passwd`, `find ... -perm -4000` (read-only) | The system's attack surface |
| Windows | `permissions sim` + inheritance via `icacls` | umask's Windows counterpart is inheritance |

## Running it

Build first (inside `code/`, `.\build.ps1` or `./build.sh`), then inside this folder, on Windows `.\demo.ps1`
(or `demo.cmd`), on WSL/Linux `sh demo.sh`. For the real Unix steps, copy the repository into WSL under `~`
(`/mnt/c` may not preserve Unix permissions; the script checks for this). Run it as a **normal user**: for
root, the kernel skips the permission bits (the program warns about this).

## Why it's safe

No real setuid binary is **ever created**, and `sudo` is never needed; setuid is explained only through
simulation. Every file lives under `output/`; the program opens the permissions back up, and the script deletes
the folder at the end. System files are only ever listed.

## Try it yourself

- Change the `paradox.txt` mode in `permissions.c` to `0707`: can `mark` (the group) read it? Why?
- In the C3 simulation, add the `setreuid(1001, 1001)` rule instead of `setresuid`: what happens to the saved
  UID?
- Run `umask 000` then `echo x > a.txt` and look with `ls -l`; then repeat with `umask 077`.
