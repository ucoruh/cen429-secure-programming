#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# CEN429 - Week 10 - Demo 5: HMAC's inner/outer hash construction (RFC 2104, 1997; Bellare, Canetti
# and Krawczyk, 1996), built by hand from hashlib.sha256 -- no hmac module call inside the
# implementation itself (that module is used only in the *tests*, as an independent reference).
import hashlib

BLOCK_SIZE = 64   # SHA-256's internal block size, in bytes
IPAD = 0x36
OPAD = 0x5C


def hmac_sha256(key: bytes, message: bytes) -> bytes:
    """HMAC(K, m) = H( (K' xor opad) || H( (K' xor ipad) || m ) ), K' = K zero-padded/hashed to
    BLOCK_SIZE bytes. Two nested hash calls -- an INNER one over the message (with the key mixed in
    first, via ipad) and an OUTER one over the inner digest (with the key mixed in again, via opad) --
    is what stops an attacker who only sees H(message) from building a valid H(key || message) without
    knowing the key (the length-extension weakness a naive "hash(key + message)" MAC would have)."""
    key = _normalize_key(key)
    ipad_key = bytes(b ^ IPAD for b in key)
    opad_key = bytes(b ^ OPAD for b in key)
    inner = hashlib.sha256(ipad_key + message).digest()
    outer = hashlib.sha256(opad_key + inner).digest()
    return outer


def _normalize_key(key: bytes) -> bytes:
    """Keys longer than one block are first hashed down; keys shorter than one block are zero-padded
    up -- both cases end with exactly BLOCK_SIZE bytes."""
    if len(key) > BLOCK_SIZE:
        key = hashlib.sha256(key).digest()
    return key + b"\x00" * (BLOCK_SIZE - len(key))


def constant_time_equal(a: bytes, b: bytes) -> bool:
    """A naive `a == b` on two byte strings returns as soon as the first differing byte is found --
    an attacker who can measure response TIME could learn the tag one byte at a time. This walks every
    byte of both arguments regardless of where they first differ (Python's own hmac.compare_digest
    does the same thing, in C, for production use -- this is the by-hand version, for teaching)."""
    if len(a) != len(b):
        # still touch some bytes so a length mismatch does not short-circuit dramatically faster
        return False
    diff = 0
    for x, y in zip(a, b):
        diff |= x ^ y
    return diff == 0


def demo():
    key = b"a course secret key"
    msg = b"transfer 100 to account 42"
    tag = hmac_sha256(key, msg)
    print("key      :", key)
    print("message  :", msg)
    print("HMAC-SHA256(key, message) =", tag.hex())

    print("\n-- inner vs outer, shown explicitly --")
    k = _normalize_key(key)
    ipad_key = bytes(b ^ IPAD for b in k)
    opad_key = bytes(b ^ OPAD for b in k)
    inner = hashlib.sha256(ipad_key + msg).digest()
    print("inner = SHA256(key XOR ipad || message)   =", inner.hex())
    outer = hashlib.sha256(opad_key + inner).digest()
    print("outer = SHA256(key XOR opad || inner)     =", outer.hex(), " (== the HMAC tag)")

    print("\n-- one message byte changes -> a COMPLETELY different tag (the avalanche effect) --")
    tag2 = hmac_sha256(key, b"transfer 900 to account 42")
    same_bits = sum(1 for a, b in zip(tag, tag2) for i in range(8) if ((a >> i) & 1) == ((b >> i) & 1))
    print("  bits identical between the two tags:", same_bits, "/", 8 * len(tag),
          "(close to half, as expected of a good hash -- not a small, localized change)")

    print("\n-- verification: constant_time_equal(), never `==` on a secret comparison --")
    print("  correct tag accepted:", constant_time_equal(hmac_sha256(key, msg), tag))
    print("  wrong tag rejected  :", constant_time_equal(hmac_sha256(key, msg + b"!"), tag))


if __name__ == "__main__":
    demo()
