# Demo 11 — HSM / PKCS#11: keys that never leave

**Topic:** Hardware-backed key use, via the PKCS#11 API shape · **Week:** 10 ·
**Standard:** PKCS#11 (originally RSA Laboratories, now maintained by OASIS)

## What it shows

`hsm_sim.py`'s `SimulatedHSM` follows the same shape a real HSM, smart card or cloud KMS offers:
`generate_keypair()` returns an opaque **handle**, not the key; `sign(handle, data)` computes a
signature *inside* the object; `get_public_key(handle)` hands out only the public half. There is no
`get_private_key()` or `export_key()` method anywhere on the public API — signing is the **only**
operation a caller can perform with a private key, exactly as PKCS#11 defines it (there is no
`C_ExportPrivateKey` call in the standard).

## Running it

```sh
sh demo.sh          # or: python hsm_sim.py
```

## Why it's safe

Pure Python (`hashlib`, `hmac`, `os.urandom`), no files, no network, no real hardware involved — a
teaching stand-in for the *API shape*, not a cryptographic module.

## Try it yourself

1. `public_api()` lists every callable method — try adding a (deliberately bad) `export_key()` method
   yourself and see the tests' "no method name contains 'export'" check catch it.
2. This demo uses a symmetric HMAC as a stand-in "signature" for simplicity. A real PKCS#11 module
   would use RSA (Demo 7) or ECDSA (Demo 2) instead — what would change about `verify()` if it only
   ever needed the *public* key, never a handle back into the HSM at all?
