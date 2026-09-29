#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# CEN429 - Week 10 - Demo 6: encrypt-then-MAC (EtM) vs MAC-then-encrypt (MtE) -- the ORDER two
# correct primitives are combined in changes what an attacker who tampers with the ciphertext on the
# wire learns before the protocol rejects the message.
#
# Self-contained: a small CBC + PKCS#7 + HMAC-SHA256, the same constructions as Demos 3-5, repeated
# here (not imported) so this one file demonstrates the ordering question on its own.
import hashlib
import hmac as stdlib_hmac

BLOCK_SIZE = 8


# ---- toy block cipher (see Demo 3 for the full discussion; same idea, duplicated to stay self-contained)
def _permutation():
    order = list(range(256))
    for i in range(255, 0, -1):
        h = hashlib.sha256(b"cen429-toy-cipher-perm" + i.to_bytes(2, "big")).digest()
        j = (h[0] | (h[1] << 8)) % (i + 1)
        order[i], order[j] = order[j], order[i]
    return order


_PERM = _permutation()


def _enc_byte(b, key_byte):
    return _PERM[(b ^ key_byte) & 0xFF]


def _dec_byte(b, key_byte):
    return _PERM.index(b) ^ key_byte


def cbc_encrypt(plaintext, key_byte, iv):
    out = bytearray(); prev = iv & 0xFF
    for b in plaintext:
        c = _enc_byte(b ^ prev, key_byte); out.append(c); prev = c
    return bytes(out)


def cbc_decrypt(ciphertext, key_byte, iv):
    out = bytearray(); prev = iv & 0xFF
    for c in ciphertext:
        out.append(_dec_byte(c, key_byte) ^ prev); prev = c
    return bytes(out)


def pad(data, block_size=BLOCK_SIZE):
    n = block_size - (len(data) % block_size)
    return data + bytes([n]) * n


def unpad(data, block_size=BLOCK_SIZE):
    if not data or len(data) % block_size != 0:
        raise ValueError("padding error")
    n = data[-1]
    if n < 1 or n > block_size or data[-n:] != bytes([n]) * n:
        raise ValueError("padding error")
    return data[:-n]


def mac(key: bytes, data: bytes) -> bytes:
    return stdlib_hmac.new(key, data, hashlib.sha256).digest()  # RFC 2104 HMAC; see Demo 5


# ---------------------------------------------------------------------------------------------------
# Encrypt-then-MAC: authenticate the CIPHERTEXT. The MAC is checked FIRST; only if it matches does
# anything touch the ciphertext bytes at all -- decryption, and padding removal, never run on
# attacker-controlled bytes that have not already been proven untouched.
# ---------------------------------------------------------------------------------------------------
def etm_protect(plaintext, enc_key, mac_key, iv):
    ct = cbc_encrypt(pad(plaintext), enc_key, iv)
    tag = mac(mac_key, ct)
    return ct, tag


def etm_unprotect(ciphertext, tag, enc_key, mac_key, iv):
    if not stdlib_hmac.compare_digest(mac(mac_key, ciphertext), tag):
        raise ValueError("MAC invalid")  # <-- rejected HERE; unpad() below is never reached
    return unpad(cbc_decrypt(ciphertext, enc_key, iv))


# ---------------------------------------------------------------------------------------------------
# MAC-then-encrypt: authenticate the PLAINTEXT, then encrypt (plaintext || tag) together. To check the
# MAC, the receiver must first DECRYPT and UNPAD -- so an attacker's modified ciphertext is run
# through the padding check before authentication ever happens. If "bad padding" and "bad MAC" are
# distinguishable (different exception, different timing), this is exactly the padding-oracle shape
# from Demo 4 -- this is why TLS's historical CBC cipher suites (which used MtE) needed very careful,
# constant-time padding checks (and were still the target of real attacks, e.g. Lucky 13, 2013).
# ---------------------------------------------------------------------------------------------------
def mte_protect(plaintext, enc_key, mac_key, iv):
    tag = mac(mac_key, plaintext)
    return cbc_encrypt(pad(plaintext + tag), enc_key, iv)


def mte_unprotect(ciphertext, enc_key, mac_key, iv):
    inner = unpad(cbc_decrypt(ciphertext, enc_key, iv))   # <-- padding is evaluated BEFORE the MAC
    plaintext, tag = inner[:-32], inner[-32:]
    if not stdlib_hmac.compare_digest(mac(mac_key, plaintext), tag):
        raise ValueError("MAC invalid")
    return plaintext


def demo():
    enc_key, mac_key, iv = 0x2A, b"a course mac key", 0x7F
    msg = b"transfer 100 usd"

    print("== Encrypt-then-MAC ==")
    ct, tag = etm_protect(msg, enc_key, mac_key, iv)
    print("ciphertext:", ct.hex(), " tag:", tag.hex()[:16], "...")
    print("correct    ->", etm_unprotect(ct, tag, enc_key, mac_key, iv))
    tampered = bytearray(ct); tampered[0] ^= 0x01
    try:
        etm_unprotect(bytes(tampered), tag, enc_key, mac_key, iv)
        print("unexpected: tampered ciphertext accepted")
    except ValueError as e:
        print("tampered   -> rejected immediately by the MAC check:", e,
              "(cbc_decrypt/unpad were never even called)")

    print("\n== MAC-then-encrypt ==")
    ct = mte_protect(msg, enc_key, mac_key, iv)
    print("ciphertext:", ct.hex())
    print("correct    ->", mte_unprotect(ct, enc_key, mac_key, iv))
    tampered = bytearray(ct); tampered[0] ^= 0x01
    try:
        mte_unprotect(bytes(tampered), enc_key, mac_key, iv)
        print("unexpected: tampered ciphertext accepted")
    except ValueError as e:
        print("tampered (byte 0)    -> rejected by:", e,
              "(decryption already ran on attacker-controlled bytes; padding happened to still look valid)")
    tampered_last = bytearray(ct); tampered_last[-1] ^= 0x01
    try:
        mte_unprotect(bytes(tampered_last), enc_key, mac_key, iv)
        print("unexpected: tampered ciphertext accepted")
    except ValueError as e:
        print("tampered (last byte) -> rejected by:", e,
              "(this time the PADDING check itself is what failed, before the MAC was ever examined --"
              " the two rejection reasons are observably different)")

    print("\nBoth reject a tampered message -- the difference is WHAT RUNS before the rejection, and "
          "therefore what an attacker who can distinguish failure reasons or timings could learn. "
          "Encrypt-then-MAC is the construction recommended by modern guidance (e.g. IETF/NIST) for "
          "exactly this reason.")


if __name__ == "__main__":
    demo()
