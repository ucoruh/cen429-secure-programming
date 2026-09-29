# Demo 5 — Control-flow counter (control-flow integrity)

**Topic:** RASP defense — control-flow integrity, resistance to skip attacks · **Week:** 6 ·
**Catalog:** K17 (control-flow counter / double overlapping counter)

## What it shows

A single `if (safe) ...` check is easily bypassed: an attacker patches the conditional jump (`je` → `jmp`).
Defense: tie the security checks to a **data dependency**. Here, each checkpoint advances a key chain one step
(`acc = HMAC(acc, "stage-i")`); the critical operation **opens a secret with AES-GCM** using a key derived from
that chain.

| Scenario | Checks | Result |
| --- | --- | --- |
| `normal` | All three, in order | Chain correct → key correct → **APPROVED** |
| `skip` | None (straight to the critical operation) | Chain wrong → GCM rejects → **decoy** |
| `partial` | Only the first | Chain incomplete → **decoy** |
| `reorder` | Wrong order | Chain different → **decoy** |

Because the critical operation can **only** produce the right result once every check has been passed in order, a
single `jmp` patch is useless.

## Running it

First build (inside `code/`). Then, in this folder: Windows `.\demo.ps1` · WSL/Linux `sh demo.sh`. By hand:
`./bin/linux/flow_counter normal|skip|partial|reorder`.

## Why is it safe?

It only does an in-memory computation (HMAC chain + AES-GCM); it touches no file, record or system setting.

## Try it yourself

1. Is there any way to get the real result in `skip` mode? Why not? (Hint: the key chain is data-dependent.)
2. Raise `STAGE_COUNT` to 5 and add two more checkpoints. How does the chain change?
3. Why does this get even stronger when combined with a "double/overlapping counter" (K17)? (The count, the
   visited-stage bitmask, and the key chain must all three agree.)
