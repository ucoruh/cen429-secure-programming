# Demo 9 — ECDH: Diffie–Hellman with elliptic-curve points

**Topic:** Elliptic-curve key exchange, conceptually · **Week:** 10 ·
**History:** independently proposed by Neal Koblitz (1987) and Victor Miller (1985)

## What it shows

`ecdh_toy.py` implements point addition and "double-and-add" scalar multiplication on the curve
`y² = x³ + 2x + 2 (mod 17)` — the same short-Weierstrass shape as NIST P-256 and the curves real TLS
uses, just tiny enough to compute by hand. ECDH then follows exactly the same pattern as Demo 8's
modular-exponentiation Diffie–Hellman: each side picks a private scalar, sends `scalar · G`, and both
sides compute `a · (b · G) == b · (a · G)` without ever transmitting `a` or `b`.

## Running it

```sh
sh demo.sh          # or: python ecdh_toy.py
```

## Why it's safe

Pure Python, no files, no network. The curve/modulus are far too small for real security — the point
is to see the *group operation*, not to use this for anything real.

## Try it yourself

1. `find_generator()` searches for the first point on the curve rather than a hardcoded one — pick a
   different `A`, `B`, `P` in the module and see what base point it finds instead.
2. The tests check `scalar_mult` (double-and-add) against `repeated_add` (the naive, one-at-a-time
   version) — for a *real* curve with a 256-bit scalar, why would the naive version never finish in
   your lifetime, while double-and-add finishes instantly?
3. Just like Demo 8, this exchange is completely unauthenticated: sketch how the same Mallory
   substitution from Demo 8 would work here too.
