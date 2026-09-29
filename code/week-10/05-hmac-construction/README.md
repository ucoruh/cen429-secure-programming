# Demo 5 — HMAC: the inner/outer hash construction

**Topic:** Message authentication codes · **Week:** 10 ·
**History:** Bellare, Canetti and Krawczyk, 1996; standardized as RFC 2104, 1997

## What it shows

`hmac_construction.py` builds HMAC-SHA-256 by hand from `hashlib.sha256`: an **inner** hash over the
message (with the key mixed in via `ipad = 0x36`), then an **outer** hash over that inner digest (key
mixed in again via `opad = 0x5C`). Two nested calls, not one `SHA256(key || message)`, is what defeats
a length-extension attack. It also shows a `constant_time_equal()` comparison, and why a plain `==`
on a secret tag is itself a (smaller) timing side channel.

## Running it

```sh
sh demo.sh          # or: python hmac_construction.py
```

## Why it's safe

Pure Python, `hashlib` only, no files, no network.

## Try it yourself

1. Replace the two-call construction with a single `SHA256(key + message)` and compare: can you find
   a way to compute `H(key || message || extra)` from `H(key || message)` alone, *without knowing
   `key`*, for a hash built on the Merkle–Damgård construction (SHA-256 is)? That is exactly the
   length-extension weakness HMAC's inner/outer structure avoids.
2. The tests check this file against RFC 4231's own published vectors, and against Python's own
   `hmac` module, on 30 random key/message pairs — read `tests/test_hmac_construction.py` to see why
   neither reference could accidentally share a bug with the code under test.
