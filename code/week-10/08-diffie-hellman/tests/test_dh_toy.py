#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# CEN429 - Week 10 - Demo 8 unit tests: Diffie-Hellman with a toy modulus, and the MITM simulation.
# The p=23, g=5, a=6 -> A=8, b=15 -> B=19, shared=2 values are the standard Diffie-Hellman textbook
# worked example, checked here against Python's own built-in pow(base, exp, mod) -- an independent
# implementation of modular exponentiation -- never against dh_toy.py's own modexp().
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import dh_toy as dh  # noqa: E402

failed = 0


def check(label, cond):
    global failed
    print("  %-70s %s" % (label, "OK" if cond else "FAIL"))
    if not cond:
        failed += 1


def main():
    # --- modexp checked against Python's built-in pow() for many random cases -----------------------
    rng = random.Random(7)
    for _ in range(200):
        base = rng.randint(0, 5000)
        exp = rng.randint(0, 5000)
        mod = rng.randint(1, 5000)
        check("modexp matches Python's pow() for a random case (base=%d exp=%d mod=%d)" % (base, exp, mod),
              dh.modexp(base, exp, mod) == pow(base, exp, mod))

    check("modexp(2, 10, 1000) == 24 (2**10 = 1024, 1024 mod 1000 = 24)", dh.modexp(2, 10, 1000) == 24)
    check("modexp(x, 0, m) == 1 for any x, m > 1", all(dh.modexp(x, 0, 7) == 1 for x in range(7)))

    # --- the textbook worked example: p=23, g=5, a=6, b=15 -> A=8, B=19, shared=2 -------------------
    p, g = 23, 5
    A = dh.public_value(6, g, p)
    B = dh.public_value(15, g, p)
    check("A = g^6 mod 23 == 8 (published textbook value)", A == 8)
    check("B = g^15 mod 23 == 19 (published textbook value)", B == 19)
    check("Alice's shared secret B^6 mod 23 == 2", dh.shared_secret(B, 6, p) == 2)
    check("Bob's shared secret A^15 mod 23 == 2 (matches Alice's)", dh.shared_secret(A, 15, p) == 2)

    # --- generic correctness: for MANY random private exponents, both sides land on the same secret -
    for _ in range(100):
        a = dh.generate_private(p, rng)
        b = dh.generate_private(p, rng)
        Aa = dh.public_value(a, g, p)
        Bb = dh.public_value(b, g, p)
        if not (dh.shared_secret(Bb, a, p) == dh.shared_secret(Aa, b, p)):
            check("random DH exchange a=%d b=%d agrees on both sides" % (a, b), False)
            break
    else:
        check("100 random DH exchanges all agree on both sides", True)

    check("generate_private always returns a value in [2, p-2]",
          all(2 <= dh.generate_private(p, rng) <= p - 2 for _ in range(500)))

    # --- MITM: Mallory's two separate shared secrets each match one honest party, and generally
    #     differ from each other (the observable break: Alice and Bob do NOT end up sharing one key) -
    trials, mismatched, mallory_knows_both = 0, 0, 0
    for _ in range(50):
        a = dh.generate_private(p, rng)
        b = dh.generate_private(p, rng)
        m = dh.generate_private(p, rng)
        Aa, Bb, Mm = dh.public_value(a, g, p), dh.public_value(b, g, p), dh.public_value(m, g, p)
        key_alice = dh.shared_secret(Mm, a, p)          # Alice, talking to "Bob" (really Mallory)
        key_mallory_with_alice = dh.shared_secret(Aa, m, p)
        key_bob = dh.shared_secret(Mm, b, p)             # Bob, talking to "Alice" (really Mallory)
        key_mallory_with_bob = dh.shared_secret(Bb, m, p)
        trials += 1
        if key_alice == key_mallory_with_alice and key_bob == key_mallory_with_bob:
            mallory_knows_both += 1
        if key_alice != key_bob:
            mismatched += 1
    check("Mallory always derives a key matching each honest party's own key (both directions)",
          mallory_knows_both == trials)
    check("Alice's and Bob's own keys generally end up DIFFERENT from each other (they are not "
          "really sharing one key at all -- Mallory is)", mismatched >= trials * 0.5)

    print("  ---")
    if failed:
        print("  %d TEST(S) FAILED" % failed)
        return 1
    print("  ALL TESTS PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
