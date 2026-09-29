# Demo 3 — Block cipher modes: ECB, CBC, CTR, GCM-like

**Topic:** Modes of operation (chaining, IV/nonce, integrity) · **Week:** 10 ·
**Book:** Viega & Messier ch. 11 (symmetric encryption)

## What it shows

`block_modes.py` uses a small TOY byte-cipher (a fixed, keyed substitution — **not secure, teaching
only**) so a whole 16-byte message and its ciphertext fit on one screen. The four properties it
demonstrates are properties of the **mode**, true for AES or any other real block cipher too:

| Mode | Property shown |
| --- | --- |
| ECB | Identical plaintext bytes produce identical ciphertext bytes — patterns leak through |
| CBC | A one-bit ciphertext flip garbles that whole block, and flips the *same* bit position one block later (controlled malleability) |
| CTR | A one-bit ciphertext flip changes *exactly* that one plaintext bit — nothing else |
| GCM-like | Confidentiality (CTR) plus a tag that rejects **any** tampering, checked before plaintext is returned |

## Running it

```sh
sh demo.sh          # or: python block_modes.py
```

## Why it's safe

Pure Python, no files written, no network access, no external library required.

## Try it yourself

1. Change `MSG` to two identical 4-byte halves and watch ECB's ciphertext repeat exactly.
2. In `demo()`, flip a bit in the **tag** instead of the ciphertext for the GCM-like case — is it
   still rejected? Why must an attacker be unable to forge a valid tag for a *modified* message?
3. Neither CBC nor CTR *detect* tampering by themselves (they only misbehave predictably) — that is
   exactly why Demo 6 adds a MAC on top, and why the order (encrypt-then-MAC vs MAC-then-encrypt)
   matters.
