# Demo 6 — Component / package signature and digest verification

**Topic:** RASP — signature verification against repackaging; the general case of Android APK signature
verification · **Week:** 6 · **Catalog:** K2 (package hash), K3 (package signature), K6 (mutual native↔module
verification)

## What it shows

On Android, the application verifies the **APK signature** (Signature Scheme v2/v3) against repackaging. This is
the general case of "is the component I am loading the expected, unmodified version?" The demo shows this in
portable C: a "plugin module" file is verified with a detached signature (HMAC-SHA-256) **before** it is loaded.

| Step | What happens |
| --- | --- |
| 1–2 | The module is created and signed at build time (`module.sig`) |
| 3 | Module unchanged → signature **holds** → safe to load |
| 4 | Module is repackaged (1 byte changes) → signature **does not hold** → loading **rejected** |

## Important difference

APK v2/v3 uses a **public-key (asymmetric)** signature; the verifier needs only the public key, never the
signing key. Here we use **shared-key HMAC** for teaching; asymmetric signing (Ed25519 / RSA-PSS) comes in
**Week 10**. The principle is the same: integrity + provenance verification before loading.

## Running it

First build (inside `code/`). Then, in this folder: Windows `.\demo.ps1` · WSL/Linux `sh demo.sh`.

## Why is it safe?

It only reads/writes files inside the demo's own `output/` folder; it touches no system file or setting.

## Try it yourself

1. Change `module.dat` and regenerate **the signature too** (`generate`). Does verification hold again? Why is
   this useless in a real attack? (Hint: the attacker does not have the signing key.)
2. Mutual verification (K6): if the module also carried the native binary's HMAC, the attacker would have to
   patch **both** consistently. How would you set that up?
3. Why does an asymmetric signature (Week 10) offer a stronger distribution model than HMAC?
