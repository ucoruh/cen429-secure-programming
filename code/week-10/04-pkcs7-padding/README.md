# Demo 4 — PKCS#7 padding, and why a padding oracle matters

**Topic:** Block padding (RFC 5652 §6.3) and the padding-oracle attack (conceptual) · **Week:** 10

## What it shows

`pkcs7.py` pads a message to a multiple of the block size by appending **N bytes, each of value N**,
and `unpad()` removes and checks that padding, raising the **same** `ValueError("padding error")` no
matter which of the three checks (length / last-byte range / every padding byte matches) actually
failed. `unpad_bad_oracle()` sits next to it and returns a **different** message for each case, purely
to make the contrast visible: distinguishable error messages (or timings) are exactly what let an
attacker replay modified ciphertext and ask "was the padding valid?" over and over — Vaudenay's 2002
padding-oracle attack — until an entire block is recovered without ever learning the key.

## Running it

```sh
sh demo.sh          # or: python pkcs7.py
```

## Why it's safe

Pure Python, no files, no network, no external library. No real oracle attack is carried out — only
the *shape* of the problem is shown, side by side with the constant-response fix.

## Try it yourself

1. Change `BLOCK_SIZE` to 16 (AES's real block size) and re-run: does anything about the *logic*
   change, or only the numbers?
2. `pad(b"12345678", 8)` adds a **full extra block**. What would go wrong in `unpad()` if it didn't?
3. Demo 6 (encrypt-then-MAC) shows the *complete* fix: never even call `unpad()` on ciphertext whose
   MAC hasn't already been checked.
