#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# CEN429 - Week 10 - Demo 7 unit tests: textbook RSA with toy primes. The n=3233, d=2753, c=2790
# values below are the published Wikipedia "RSA (cryptosystem)" worked example (p=61, q=53, e=17,
# m=65) -- an independently verifiable known-answer test, not a value taken from running rsa_toy.py.
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import rsa_toy as rsa  # noqa: E402

failed = 0


def check(label, cond):
    global failed
    print("  %-70s %s" % (label, "OK" if cond else "FAIL"))
    if not cond:
        failed += 1


def main():
    # --- helper functions, checked independently -----------------------------------------------------
    check("is_prime agrees with a brute-force check for every n in [2, 200)",
          all(rsa.is_prime(n) == _brute_force_prime(n) for n in range(2, 200)))
    check("modinv(3, 11) == 4 (3*4 = 12 = 1 mod 11)", rsa.modinv(3, 11) == 4)
    check("modinv(17, 3120) == 2753 (the published Wikipedia RSA example)", rsa.modinv(17, 3120) == 2753)
    check("modinv raises when no inverse exists (gcd(6, 9) = 3)", _raises(lambda: rsa.modinv(6, 9)))

    # --- keygen rejects bad inputs ---------------------------------------------------------------------
    check("keygen rejects a non-prime p", _raises(lambda: rsa.keygen(60, 53)))
    check("keygen rejects p == q", _raises(lambda: rsa.keygen(61, 61)))
    check("keygen rejects an e not coprime with phi(n)", _raises(lambda: rsa.keygen(61, 53, e=2)))

    # --- the published Wikipedia worked example (p=61, q=53, e=17, m=65) --------------------------------
    pub, priv = rsa.keygen(61, 53, e=17)
    check("n == 3233", pub[1] == 3233)
    check("public exponent e == 17", pub[0] == 17)
    check("private exponent d == 2753 (published value)", priv[0] == 2753)
    c = rsa.encrypt(65, pub)
    check("encrypt(65) == 2790 (published value)", c == 2790)
    check("decrypt(2790) == 65", rsa.decrypt(c, priv) == 65)

    # --- round trips for every message in the valid range, with a default (auto-picked) e --------------
    pub2, priv2 = rsa.keygen(11, 13)  # n = 143, small enough to check every message
    for m in (0, 1, 2, 17, 55, 100, 142):
        check("round trip for message %d (n=%d)" % (m, pub2[1]),
              rsa.decrypt(rsa.encrypt(m, pub2), priv2) == m)
    check("every message in [0, n) round-trips through encrypt/decrypt (all %d values)" % pub2[1],
          all(rsa.decrypt(rsa.encrypt(m, pub2), priv2) == m for m in range(pub2[1])))
    check("encrypt rejects a message >= n", _raises(lambda: rsa.encrypt(pub2[1], pub2)))
    check("encrypt rejects a negative message", _raises(lambda: rsa.encrypt(-1, pub2)))

    # --- sign/verify: correct, tampered signature, wrong message, cross-key -----------------------------
    sig = rsa.sign(65, priv)
    check("verify accepts a genuine signature", rsa.verify(65, sig, pub))
    check("verify rejects a signature off by one", not rsa.verify(65, (sig + 1) % pub[1], pub))
    sig2 = rsa.sign(42, priv)
    check("a signature over message 42 does not verify message 65", not rsa.verify(65, sig2, pub))
    other_pub, other_priv = rsa.keygen(97, 101, e=7)
    check("a signature made with one key pair does not verify under an UNRELATED public key",
          not rsa.verify(65, sig, other_pub))

    # --- encrypt/decrypt and sign/verify are mirror operations (textbook RSA, no padding) --------------
    check("encrypt(sign(m)) == m (textbook RSA's sign/verify mirrors decrypt/encrypt)",
          rsa.encrypt(rsa.sign(65, priv), pub) == 65)
    check("decrypt(m) reused as 'signing': verify(m, decrypt(m, priv), pub) is True",
          rsa.verify(65, rsa.decrypt(65, priv), pub))

    print("  ---")
    if failed:
        print("  %d TEST(S) FAILED" % failed)
        return 1
    print("  ALL TESTS PASSED")
    return 0


def _brute_force_prime(n):
    if n < 2:
        return False
    for d in range(2, n):
        if d * d > n:
            break
        if n % d == 0:
            return False
    return True


def _raises(fn):
    try:
        fn()
        return False
    except ValueError:
        return True


if __name__ == "__main__":
    sys.exit(main())
