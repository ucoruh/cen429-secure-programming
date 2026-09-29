# Demo 8 — Diffie–Hellman key exchange, and its man-in-the-middle weakness

**Topic:** Key exchange without a pre-shared secret · **Week:** 10 ·
**History:** Diffie and Hellman, "New Directions in Cryptography", 1976

## What it shows

`dh_toy.py` runs the standard textbook example — modulus `p=23`, generator `g=5` — where Alice and
Bob each pick a private exponent, exchange `g^private mod p`, and both compute the same shared secret
from the other side's public value. Then it simulates **Mallory**, an active attacker who intercepts
both public values and substitutes her own: Alice ends up sharing a key *with Mallory*, thinking it is
Bob; Bob ends up sharing a *different* key with Mallory, thinking it is Alice. Mallory can now decrypt,
read, re-encrypt and forward everything — plain Diffie–Hellman authenticates nothing about *who* sent
which public value.

## Running it

```sh
sh demo.sh          # or: python dh_toy.py
```

## Why it's safe

Pure Python, `random` from the standard library only, no files, no network — the "Alice"/"Bob"/
"Mallory" exchange is simulated entirely as function calls in one process.

## Try it yourself

1. Real protocols (TLS, Signal) fix this by *authenticating* the exchange — signing each side's public
   value with a key the other side already trusts. Which of this week's other demos supplies that
   trusted key? (Demo 1's certificate chain, or Demo 2's signature.)
2. Demo 9 does the same key-exchange idea with elliptic-curve point addition instead of modular
   exponentiation — same vulnerability to an unauthenticated MITM, different underlying math.
