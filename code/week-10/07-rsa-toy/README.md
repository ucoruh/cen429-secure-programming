# Demo 7 — Textbook RSA with toy primes

**Topic:** RSA key generation, encryption, decryption, signing, verification · **Week:** 10 ·
**History:** Rivest, Shamir and Adleman, 1977

## What it shows

`rsa_toy.py` runs the exact arithmetic of RSA with primes small enough to trace on paper: the
published Wikipedia worked example `p=61, q=53, e=17` gives `n=3233`, `d=2753`, and
`encrypt(65) = 65^17 mod 3233 = 2790`. Signing and verifying reuse the very same modular
exponentiation as decrypt/encrypt, just with the two exponents swapped.

**This is not secure RSA.** Real RSA needs primes hundreds of digits long, and — just as
important — a padding scheme (OAEP for encryption, PSS for signing; see PKCS#1 and the Bleichenbacher
attack, 1998, for what goes wrong without one). This file exists only to make the numbers traceable.

## Running it

```sh
sh demo.sh          # or: python rsa_toy.py
```

## Why it's safe

Pure Python, `math`/`random` from the standard library only, no files, no network.

## Try it yourself

1. Pick two of your own small primes (`is_prime()` will check them) and re-run `keygen`; verify by
   hand that `(m**e)**d mod n == m` for a message of your choice.
2. `sign()` and `decrypt()` are literally the same function call in textbook RSA — why does that
   matter for a real system that offers both a "decrypt this for me" and a "sign this for me" service
   using the *same* key? (Hint: what could a caller submit as one that is really the other in
   disguise?)
