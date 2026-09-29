#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# CEN429 - Week 10 - Demo 3: block cipher modes (ECB, CBC, CTR, and a simplified authenticated mode
# in the shape of GCM).
#
# The block cipher used below is a TOY, single-byte substitution cipher (a fixed, key-dependent
# permutation of 0..255) -- small enough that a whole message fits on one screen and every step can be
# traced by hand. It is NOT secure and must NEVER be used for anything but this demo. The four
# properties shown here, however, are properties of the MODE, not of this particular cipher: they hold
# exactly the same way with AES or any other real block cipher.
import hashlib

# --------------------------------------------------------------------------------------------------
# The toy "block cipher": one byte in, one byte out, keyed, reversible.
# --------------------------------------------------------------------------------------------------
_PERM = None


def _permutation():
    """A fixed bijection on 0..255, derived from SHA-256 so it is reproducible without a hardcoded
    256-entry table in the source. Built once, cached."""
    global _PERM
    if _PERM is not None:
        return _PERM
    order = list(range(256))
    # Deterministic shuffle: repeatedly hash a counter, use the digest bytes as swap indices.
    for i in range(255, 0, -1):
        h = hashlib.sha256(b"cen429-toy-cipher-perm" + i.to_bytes(2, "big")).digest()
        j = h[0] | (h[1] << 8)
        j %= (i + 1)
        order[i], order[j] = order[j], order[i]
    _PERM = order
    return order


def toy_encrypt_block(byte, key_byte):
    """One toy-cipher call: substitute after XOR-ing in the (1-byte) key. Reversible for any key_byte."""
    perm = _permutation()
    return perm[(byte ^ key_byte) & 0xFF]


def toy_decrypt_block(byte, key_byte):
    perm = _permutation()
    inv = perm.index(byte)  # small table (256 entries): a linear search is fine for a byte-sized demo
    return inv ^ key_byte


def _xor(a, b):
    return bytes(x ^ y for x, y in zip(a, b))


# --------------------------------------------------------------------------------------------------
# ECB - Electronic Codebook: every block enciphered independently, with the SAME key.
# --------------------------------------------------------------------------------------------------
def ecb_encrypt(plaintext: bytes, key_byte: int) -> bytes:
    return bytes(toy_encrypt_block(b, key_byte) for b in plaintext)


def ecb_decrypt(ciphertext: bytes, key_byte: int) -> bytes:
    return bytes(toy_decrypt_block(b, key_byte) for b in ciphertext)


# --------------------------------------------------------------------------------------------------
# CBC - Cipher Block Chaining: each plaintext block is XORed with the PREVIOUS ciphertext block (the
# first block with the IV) before being enciphered.
# --------------------------------------------------------------------------------------------------
def cbc_encrypt(plaintext: bytes, key_byte: int, iv: int) -> bytes:
    out = bytearray()
    prev = iv & 0xFF
    for b in plaintext:
        c = toy_encrypt_block(b ^ prev, key_byte)
        out.append(c)
        prev = c
    return bytes(out)


def cbc_decrypt(ciphertext: bytes, key_byte: int, iv: int) -> bytes:
    out = bytearray()
    prev = iv & 0xFF
    for c in ciphertext:
        p = toy_decrypt_block(c, key_byte) ^ prev
        out.append(p)
        prev = c
    return bytes(out)


# --------------------------------------------------------------------------------------------------
# CTR - Counter mode: a keystream is built by enciphering an increasing counter (starting at the
# nonce); the message is only ever XORed with that keystream -- encryption and decryption are the
# SAME operation.
# --------------------------------------------------------------------------------------------------
def ctr_keystream(length: int, key_byte: int, nonce: int) -> bytes:
    return bytes(toy_encrypt_block((nonce + i) & 0xFF, key_byte) for i in range(length))


def ctr_apply(data: bytes, key_byte: int, nonce: int) -> bytes:
    return _xor(data, ctr_keystream(len(data), key_byte, nonce))


ctr_encrypt = ctr_apply
ctr_decrypt = ctr_apply  # XOR with the same keystream undoes itself


# --------------------------------------------------------------------------------------------------
# A simplified authenticated mode, in the SHAPE of GCM: encrypt with CTR, then compute a tag that
# authenticates the CIPHERTEXT (never the plaintext). This is NOT real GCM (real GCM authenticates
# with GHASH, a multiplication in GF(2^128), which needs 128-bit blocks); it shows the same structure
# real AES-GCM uses: one pass that gives you both confidentiality (CTR) and integrity (the tag), and a
# tag that changes if ANY ciphertext byte changes.
# --------------------------------------------------------------------------------------------------
def _tag(key_byte: int, nonce: int, ciphertext: bytes) -> int:
    acc = toy_encrypt_block(nonce & 0xFF, key_byte)
    for c in ciphertext:
        acc = toy_encrypt_block(acc ^ c, key_byte)
    return acc


def gcm_like_encrypt(plaintext: bytes, key_byte: int, nonce: int):
    """Returns (ciphertext, tag)."""
    ct = ctr_encrypt(plaintext, key_byte, nonce)
    return ct, _tag(key_byte, nonce, ct)


def gcm_like_decrypt(ciphertext: bytes, tag: int, key_byte: int, nonce: int):
    """Returns (plaintext, True) if the tag matches, else (None, False). The plaintext is computed
    ONLY after the tag has been checked -- "verify, then decrypt" (see Demo 6, Encrypt-then-MAC)."""
    if _tag(key_byte, nonce, ciphertext) != (tag & 0xFF):
        return None, False
    return ctr_decrypt(ciphertext, key_byte, nonce), True


def flip_bit(data: bytes, byte_index: int, bit_index: int) -> bytes:
    """Returns a copy of data with one bit flipped -- simulates a bit error or an active attacker
    changing one bit of the ciphertext on the wire."""
    out = bytearray(data)
    out[byte_index] ^= (1 << bit_index)
    return bytes(out)


# --------------------------------------------------------------------------------------------------
# Narrated demo (this file run directly).
# --------------------------------------------------------------------------------------------------
def _hex(b):
    return b.hex()


def demo():
    key, iv, nonce = 0x2A, 0x7F, 0x10
    msg = b"ATTACK AT DAWN!!"  # 16 bytes, two identical-looking runs to show the ECB pattern leak
    print("plaintext       :", msg, "(%d bytes)" % len(msg))

    print("\n== ECB == (every block enciphered independently)")
    ct = ecb_encrypt(msg, key)
    print("ciphertext      :", _hex(ct))
    print("byte 0 vs byte 3:", _hex(ct[0:1]), "vs", _hex(ct[3:4]),
          "-- identical plaintext bytes ('A' at positions 0 and 3) give the SAME ciphertext byte: a "
          "pattern in the plaintext leaks straight through ECB.")
    tampered = flip_bit(ct, 3, 0)
    print("bit-flip @byte3 -> decrypts to:", ecb_decrypt(tampered, key),
          "(ONLY block 3 is affected; every other block still decrypts correctly)")

    print("\n== CBC == (each block XORed with the previous ciphertext block before enciphering)")
    ct = cbc_encrypt(msg, key, iv)
    print("ciphertext      :", _hex(ct))
    tampered = flip_bit(ct, 3, 0)
    pt2 = cbc_decrypt(tampered, key, iv)
    print("bit-flip @byte3 -> decrypts to:", pt2,
          "-- block 3 comes out as GARBAGE, but block 4 flips the SAME single bit position as the "
          "attacker flipped (a controlled, single-bit change) -- this is CBC's malleability.")

    print("\n== CTR == (XOR with a keystream built from an increasing counter)")
    ct = ctr_encrypt(msg, key, nonce)
    print("ciphertext      :", _hex(ct))
    tampered = flip_bit(ct, 3, 0)
    pt2 = ctr_decrypt(tampered, key, nonce)
    print("bit-flip @byte3 -> decrypts to:", pt2,
          "-- ONLY that one bit of the plaintext flips; every other byte decrypts correctly. Neither "
          "CBC nor CTR detects tampering by themselves -- that needs a MAC (see below and Demo 6).")

    print("\n== GCM-like == (CTR encryption + a tag over the ciphertext)")
    ct, tag = gcm_like_encrypt(msg, key, nonce)
    print("ciphertext      :", _hex(ct), " tag =", "%02x" % tag)
    pt, ok = gcm_like_decrypt(ct, tag, key, nonce)
    print("correct tag     -> accepted =", ok, " plaintext =", pt)
    tampered = flip_bit(ct, 3, 0)
    pt, ok = gcm_like_decrypt(tampered, tag, key, nonce)
    print("bit-flip @byte3 -> accepted =", ok, " (the tag no longer matches: tampering is DETECTED "
          "before any plaintext is returned)")


if __name__ == "__main__":
    demo()
