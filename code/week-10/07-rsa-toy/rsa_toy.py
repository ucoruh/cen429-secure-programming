#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# CEN429 - Week 10 - Demo 7: textbook RSA (Rivest, Shamir and Adleman, 1977) with TOY, tiny primes --
# small enough to compute every step by hand -- and NO padding.
#
# WARNING, said once here and repeated at every entry point below: this is NOT secure RSA. Real RSA
# needs primes hundreds of digits long AND a padding scheme (OAEP for encryption, PSS for signing,
# both far newer than 1977 -- see PKCS#1 and the Bleichenbacher attack, 1998). This file exists only
# to make the ARITHMETIC of keygen/encrypt/decrypt/sign/verify traceable by hand.
import math
import random


def egcd(a, b):
    """Extended Euclid: returns (g, x, y) with a*x + b*y == g == gcd(a, b)."""
    if b == 0:
        return a, 1, 0
    g, x1, y1 = egcd(b, a % b)
    return g, y1, x1 - (a // b) * y1


def modinv(a, m):
    g, x, _ = egcd(a % m, m)
    if g != 1:
        raise ValueError("%d has no inverse mod %d (gcd = %d)" % (a, m, g))
    return x % m


def is_prime(n):
    """Trial division -- fine for the toy sizes used here (n well under 10**6)."""
    if n < 2:
        return False
    for p in (2, 3, 5, 7, 11, 13):
        if n % p == 0:
            return n == p
    i = 17
    while i * i <= n:
        if n % i == 0:
            return False
        i += 2
    return True


def keygen(p, q, e=None):
    """Textbook RSA keygen. p, q: two distinct small primes. e: public exponent (default: the
    smallest odd number >= 3 that is coprime with phi(n); 17 for the classic textbook p=61, q=53
    example). Returns ((e, n), (d, n))."""
    if not is_prime(p) or not is_prime(q):
        raise ValueError("p and q must both be prime")
    if p == q:
        raise ValueError("p and q must be distinct")
    n = p * q
    phi = (p - 1) * (q - 1)
    if e is None:
        e = 3
        while math.gcd(e, phi) != 1:
            e += 2
    elif math.gcd(e, phi) != 1:
        raise ValueError("e=%d is not coprime with phi(n)=%d" % (e, phi))
    d = modinv(e, phi)
    return (e, n), (d, n)


def encrypt(m, pub):
    e, n = pub
    if not (0 <= m < n):
        raise ValueError("message %d out of range [0, %d)" % (m, n))
    return pow(m, e, n)


def decrypt(c, priv):
    d, n = priv
    return pow(c, d, n)


def sign(m, priv):
    """Textbook RSA "signing" is the SAME operation as decrypt (raise to the private exponent). Real
    signature schemes (PSS) additionally hash-then-pad the message first -- shown here without that
    step, on purpose, so the symmetry with decrypt() is visible."""
    d, n = priv
    return pow(m, d, n)


def verify(m, signature, pub):
    """Textbook verify: re-apply the PUBLIC exponent to the signature and compare with the message --
    this is why sign/verify and decrypt/encrypt are mirror images of each other in RSA."""
    e, n = pub
    return pow(signature, e, n) == m


def demo():
    p, q, e = 61, 53, 17  # the classic textbook example (Wikipedia's "RSA (cryptosystem)" worked example)
    pub, priv = keygen(p, q, e)
    print("p=%d q=%d  ->  n=p*q=%d  phi=(p-1)(q-1)=%d" % (p, q, p * q, (p - 1) * (q - 1)))
    print("public key  (e, n) =", pub)
    print("private key (d, n) =", priv)

    m = 65
    c = encrypt(m, pub)
    back = decrypt(c, priv)
    print("\nencrypt(%d) = %d^%d mod %d = %d" % (m, m, pub[0], pub[1], c))
    print("decrypt(%d) = %d^%d mod %d = %d  (== original message: %s)" %
          (c, c, priv[0], priv[1], back, back == m))

    sig = sign(m, priv)
    ok = verify(m, sig, pub)
    print("\nsign(%d)    = %d^%d mod %d = %d" % (m, m, priv[0], priv[1], sig))
    print("verify(%d, sig=%d) = %s" % (m, sig, ok))

    print("\n-- a tampered signature is rejected --")
    print("verify(%d, sig=%d) =" % (m, (sig + 1) % pub[1]), verify(m, (sig + 1) % pub[1], pub))

    print("\n-- a signature made for a DIFFERENT message does not verify against this one --")
    m2 = 42
    sig2 = sign(m2, priv)
    print("sign(%d) = %d ; verify(%d, that signature) =" % (m2, sig2, m), verify(m, sig2, pub))


if __name__ == "__main__":
    demo()
