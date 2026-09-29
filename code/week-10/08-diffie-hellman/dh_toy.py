#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# CEN429 - Week 10 - Demo 8: Diffie-Hellman key exchange (Diffie and Hellman, 1976) with a toy
# modulus, and an active man-in-the-middle (MITM) simulation showing why UNAUTHENTICATED DH is
# vulnerable.
import random


def modexp(base, exp, mod):
    """Independent of Python's pow(): the classic square-and-multiply, by hand, so a reader can trace
    it -- Python's built-in pow(base, exp, mod) is used only in the *tests*, as a second, independent
    way to compute the same value."""
    result = 1
    base %= mod
    while exp > 0:
        if exp & 1:
            result = (result * base) % mod
        base = (base * base) % mod
        exp >>= 1
    return result


def generate_private(p, rng=random):
    """A private exponent in [2, p-2] -- 1 and p-1 are excluded because they make the public value
    trivial (g^1 = g, g^(p-1) = 1 mod p, by Fermat's little theorem when g is a primitive root)."""
    return rng.randint(2, p - 2)


def public_value(private, g, p):
    return modexp(g, private, p)


def shared_secret(their_public, my_private, p):
    return modexp(their_public, my_private, p)


def demo():
    # The classic textbook parameters (p=23, g=5) -- small enough that every exponentiation below
    # can be checked on paper, and public/shared values match the standard Diffie-Hellman worked
    # example found in most textbooks (a=6 -> A=8, b=15 -> B=19, shared=2).
    p, g = 23, 5
    print("public parameters: p=%d (modulus), g=%d (generator)" % (p, g))

    print("\n== Honest exchange: Alice and Bob, nobody listening ==")
    a, b = 6, 15
    A = public_value(a, g, p)
    B = public_value(b, g, p)
    print("Alice picks private a=%d, sends A = g^a mod p = %d" % (a, A))
    print("Bob   picks private b=%d, sends B = g^b mod p = %d" % (b, B))
    s_alice = shared_secret(B, a, p)
    s_bob = shared_secret(A, b, p)
    print("Alice computes B^a mod p = %d" % s_alice)
    print("Bob   computes A^b mod p = %d" % s_bob)
    print("shared secrets match:", s_alice == s_bob)

    print("\n== Man-in-the-middle: Mallory sits between Alice and Bob, relaying nothing unchanged ==")
    a, b, m = 6, 15, 11
    A = public_value(a, g, p)   # Alice -> (intercepted by Mallory, who forwards her OWN public value)
    B = public_value(b, g, p)   # Bob   -> (same)
    M = public_value(m, g, p)   # Mallory's own public value, sent to BOTH sides in place of A and B
    print("Alice sends A=%d toward Bob; Mallory intercepts it and forwards M=%d instead" % (A, M))
    print("Bob   sends B=%d toward Alice; Mallory intercepts it and forwards M=%d instead" % (B, M))
    key_alice_mallory = shared_secret(M, a, p)   # Alice thinks this is shared with Bob
    key_mallory_alice = shared_secret(A, m, p)   # Mallory's matching half
    key_mallory_bob = shared_secret(B, m, p)     # Mallory's other half
    key_bob_mallory = shared_secret(M, b, p)     # Bob thinks this is shared with Alice
    print("Alice's key (with what she thinks is Bob) = %d" % key_alice_mallory)
    print("Mallory's key with Alice                  = %d  (matches Alice's: %s)" %
          (key_mallory_alice, key_mallory_alice == key_alice_mallory))
    print("Mallory's key with Bob                    = %d" % key_mallory_bob)
    print("Bob's key (with what he thinks is Alice)   = %d  (matches Mallory's: %s)" %
          (key_bob_mallory, key_bob_mallory == key_mallory_bob))
    print("Alice's key == Bob's key directly?        ", key_alice_mallory == key_bob_mallory,
          "-- they are talking through Mallory the whole time, unaware of it, and Mallory can read "
          "(and re-encrypt) every message in both directions.")
    print("\nThe fix is not a bigger modulus: it is AUTHENTICATING the exchange (each side's public "
          "value signed by a key the other side already trusts -- Demo 2's signatures, or a "
          "certificate chain -- Demo 1) so an unauthenticated substitution like Mallory's is caught.")


if __name__ == "__main__":
    demo()
