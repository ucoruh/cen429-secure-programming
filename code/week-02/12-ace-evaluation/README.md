# Demo 12 — Windows ACE evaluation simulator

**Topic:** Windows access control: the access token, the DACL, ACE order, a NULL/empty DACL, inheritance, the
UAC filter, integrity levels (MIC), owner rights · **Week:** 2 · **Book:** Viega & Messier, Recipe 2.2 (and
Recipe 1.2)

## What it shows

For an access token and an object (owner, label, ACE list) defined in a text file, it computes Windows's access
decision **step by step**. It also fixes two mistakes from the book's 2003 text: Windows does not pick the
"best matching" ACE, it walks the ACEs **in order**; a DACL with no ACEs at all (an empty DACL) is not the same
thing as having no DACL at all (a NULL DACL).

| Step | Scenario | Result |
| --- | --- | --- |
| 1 | `scenario-1-order.txt` | The first matching DENY request stops it; if the order is broken, the deny is never seen; the owner can always change the DACL |
| 2 | `scenario-2-null-empty.txt` | A NULL DACL grants every right to everyone; an empty DACL grants none |
| 3 | `scenario-3-inheritance.txt` | An explicit ACE comes before an inherited ACE; breaking inheritance |
| 4 | `scenario-4-uac-mic.txt` | In the UAC filter, the administrators group is "deny-only"; low integrity cannot write to a medium label |
| 5 | `scenario-5-owner-privilege.txt` | An OWNER_RIGHTS ACE; the TAKE_OWNERSHIP privilege bypasses the DACL |
| 6 | (the real system) | Windows: `icacls`, `whoami /groups`, `whoami /priv` · Linux: `id`, `stat`, `getfacl` — read-only |

## Running it

Build first (inside `code/`, `.\build.ps1` or `./build.sh`), then inside this folder, on Windows `.\demo.ps1`
(or `demo.cmd`), on WSL/Linux `sh demo.sh`. A single scenario: `.\bin\windows\ace.exe scenario-1-order.txt`.

## Why it's safe

The simulator is pure computation. The real-system step only creates a file under `output/` and **reads** its
permissions; no ACL is ever changed, and no administrator right is needed.

## Try it yourself

- Add an `ACE DENY Administrators WRITE` line after the `ALLOW Administrators` line in
  `scenario-1-order.txt`, and try it with and without `CANONICAL`.
- In scenario 4a, add `ACE DENY Administrators WRITE`: does only the deny-only group match the DENY ACE?
- Convert your own file's `icacls` output into the simulator's format and compute the same decision by hand and
  with the simulator.
