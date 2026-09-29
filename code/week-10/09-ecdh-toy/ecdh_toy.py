#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# CEN429 - Week 10 - Demo 9: elliptic-curve Diffie-Hellman (ECDH), shown CONCEPTUALLY as point
# addition on a tiny curve over a small prime field (Koblitz, 1987; Miller, 1985, independently
# proposed using elliptic curves for cryptography).
#
# Curve: y^2 = x^3 + a*x + b (mod p), a short Weierstrass curve -- the same shape as NIST P-256 and
# the other curves used in real TLS/ECDH, just with tiny numbers so points can be found and checked
# by hand. This is NOT a secure curve (p is far too small); it exists only to make point addition and
# scalar multiplication traceable.
import random

A, B, P = 2, 2, 17  # y^2 = x^3 + 2x + 2 (mod 17)


def on_curve(point, a=A, b=B, p=P):
    if point is None:  # the point at infinity, the curve group's identity element
        return True
    x, y = point
    return (y * y - (x ** 3 + a * x + b)) % p == 0


def modinv(x, p):
    return pow(x, p - 2, p)  # p is prime here (Fermat's little theorem), the same trick as RSA's e


def point_add(p1, p2, a=A, p=P):
    """Standard short-Weierstrass point addition/doubling formulas over a prime field."""
    if p1 is None:
        return p2
    if p2 is None:
        return p1
    x1, y1 = p1
    x2, y2 = p2
    if x1 == x2 and (y1 + y2) % p == 0:
        return None  # P + (-P) = the point at infinity
    if p1 == p2:
        if y1 == 0:
            return None
        m = (3 * x1 * x1 + a) * modinv(2 * y1, p) % p
    else:
        m = (y2 - y1) * modinv((x2 - x1) % p, p) % p
    x3 = (m * m - x1 - x2) % p
    y3 = (m * (x1 - x3) - y1) % p
    return (x3, y3)


def scalar_mult(k, point, a=A, p=P):
    """Double-and-add. Independently checked in the tests against repeated, one-at-a-time addition."""
    result = None
    addend = point
    while k > 0:
        if k & 1:
            result = point_add(result, addend, a, p)
        addend = point_add(addend, addend, a, p)
        k >>= 1
    return result


def find_generator(a=A, b=B, p=P):
    """Finds the first point on the curve (smallest x, smallest matching y) -- used as the base point
    G. Found by search, not hardcoded, so this file is self-checking: if A/B/P above were edited to a
    combination with no points at all, this raises instead of silently using a wrong value."""
    for x in range(p):
        rhs = (x ** 3 + a * x + b) % p
        for y in range(p):
            if (y * y) % p == rhs:
                return (x, y)
    raise ValueError("no point found on this curve -- check a, b, p")


def demo():
    G = find_generator()
    print("curve: y^2 = x^3 + %dx + %d (mod %d)" % (A, B, P))
    print("base point G =", G, " on curve:", on_curve(G))

    print("\n-- point addition and doubling, traced by hand --")
    G2 = point_add(G, G)
    G3 = point_add(G2, G)
    print("2G = G + G =", G2, " on curve:", on_curve(G2))
    print("3G = 2G + G =", G3, " on curve:", on_curve(G3))
    print("3G via scalar_mult(3, G) =", scalar_mult(3, G), " (matches:", scalar_mult(3, G) == G3, ")")

    print("\n== ECDH key exchange ==")
    a_priv, b_priv = 6, 11
    A_pub = scalar_mult(a_priv, G)
    B_pub = scalar_mult(b_priv, G)
    print("Alice picks private a=%d, sends A = a*G = %s" % (a_priv, A_pub))
    print("Bob   picks private b=%d, sends B = b*G = %s" % (b_priv, B_pub))
    shared_alice = scalar_mult(a_priv, B_pub)
    shared_bob = scalar_mult(b_priv, A_pub)
    print("Alice computes a*B =", shared_alice)
    print("Bob   computes b*A =", shared_bob)
    print("shared points match:", shared_alice == shared_bob,
          "(both sides reach a*b*G, the same point, without either ever seeing the OTHER side's "
          "private scalar -- the discrete-log problem on this curve is what an attacker who only "
          "sees G, A and B would have to solve to recover a or b)")


if __name__ == "__main__":
    demo()
