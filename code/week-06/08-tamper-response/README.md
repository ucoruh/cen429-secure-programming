# Demo 8 — RASP engine: detection + response policy + device/version binding

**Topic:** RASP defense+deterrence — tamper response, decoy, secure wipe, device/version binding · **Week:** 6 ·
**Catalog:** K15 (tamper response/data destruction), K16 (randomized decoy output), L1 (device binding), L2
(version binding)

## What it shows

The week's **capstone** demo; it combines the earlier pieces under one "self-protection engine":

- **Detection:** a set of checks (integrity, anti-debug, environment, hook, root) runs.
- **Device/version binding:** the valuable secret is sealed with AES-GCM, using a key derived with **HKDF** from
  a device fingerprint + version. On a different device the key comes out different → the secret cannot be
  opened.
- **Response policy:** not a single block-or-allow switch, but a **graded state machine**:

| State | Trigger | What happens |
| --- | --- | --- |
| `NORMAL` | 0 failed checks, device matches | The secret opens normally, is used, then wiped |
| `WARN` | 1 failed check | The secret still opens; the event is logged, monitoring tightens |
| `DEGRADE` | 2 failed checks | The secret is wiped; only a REDACTED result is returned, the app keeps running |
| `LOCK` | 3+ failed checks, OR the device/version binding fails entirely | The secret is wiped, a tamper flag is raised, a DECOY result is returned instead of crashing |

## Running it

First build (inside `code/`). Then, in this folder: Windows `.\demo.ps1` · WSL/Linux `sh demo.sh`. By hand:
`./bin/linux/rasp normal|warn|degrade|lock|other-device`.

## Why is it safe?

Only an in-memory computation (HKDF + AES-GCM + secure wipe); it touches no file, record, network or system
setting.

## Try it yourself

1. Why is returning a **decoy** preferred over **crashing** in the LOCK state? (No hint to the attacker; which
   check triggered it stays hidden.)
2. Is there any way to open the secret in the `other-device` scenario? Why does device binding make a stolen
   data file useless on another phone? (Connects to Week 3 Demo 9's "security layers".)
3. Why does a graded WARN/DEGRADE/LOCK response work better than a single block-or-allow switch? (Hint: one weak
   signal alone should not cost a paying user their whole session — false-positive risk vs. real damage.)
4. An attacker who evades a single check (e.g. anti-debug) still fails. Why? (Hint: the combination of checks +
   device binding + Demo 5's flow counter.)
