# Demo 11 — A tamper-evident log: an HMAC chain + key evolution

**Topic:** A forward-secure, tamper-evident audit record · **Week:** 2 ·
**Basis:** Schneier & Kelsey, "Secure audit logs to support computer forensics", 1999

## What it shows

If an audit log is kept on a machine that ends up in an attacker's hands, we want the attacker, once they've
taken over the machine, to be unable to change or delete past records **without it being noticed**. Two ideas
are combined:

1. **A digest chain:** `mac_i = HMAC(K_i, mac_{i-1} || seq_i || message_i)`. Because every record's MAC also
   covers the previous one's, **changing, deleting, or reordering** a record breaks the chain.
2. **Key evolution (forward security):** `K_{i+1} = HMAC(K_i, "cen429-evolve")`, and `K_i` is **wiped**. Because
   the key is derived one-way, an attacker who takes over the machine only ever sees the **current** key
   (`K_N`); they cannot compute the older keys (`K_j, j<N`) back from it. So they cannot produce a valid MAC
   for past records.

For comparison there is also a **static key** mode: a single fixed key. In static mode, the captured key = the
very first key, so the attacker can rewrite history; in **evolve** mode they cannot. This is the demo's key
moment (step 6).

| Step | Attack | Expected result |
| --- | --- | --- |
| 2 | (none) | The sound log **verifies** |
| 3 | Change a record's message (the MAC is stale) | That record shows **MAC:BROKEN** |
| 4 | Delete a record | The chain breaks → **TAMPERED** |
| 5 | Swap two records | Order + chain → **TAMPERED** |
| 6a | Rewrite history with the captured key (**evolve**) | **CAUGHT** |
| 6b | The same attack (**static**) | **NOT CAUGHT** (a warning) |

## Running it

First build all the demos once (inside the `code/` folder): Windows `.\build.ps1` · WSL / Linux `./build.sh`.
Then, inside this folder: Windows `.\demo.ps1` · WSL / Linux `sh demo.sh`.

The HMAC/SHA-256 calls come from the shared `code/common/cen429_kripto.h` header (OpenSSL on Linux, CNG on
Windows); you do not need to install a library yourself.

## Why it's safe

The program only writes under **this folder's own `work/`**. The "verifier's key" would, in reality, sit offline
in a secure location; here it is kept on disk for teaching purposes. Every value is synthetic; no network and
no administrator right is used.

## Try it yourself

1. Open `access.auditlog` in a text editor and change a single character of one MAC's hex; what does `verify`
   say?
2. In step 6a, if you write the message back to its original value (i.e. don't change it at all), does
   verification pass? Why?
3. Disable the `evolve_key()` function (so evolve mode runs like static) and watch how step 6a turns into "not
   caught" — that is exactly what key evolution buys you.
