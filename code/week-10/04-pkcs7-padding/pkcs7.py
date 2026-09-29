#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# CEN429 - Week 10 - Demo 4: PKCS#7 padding (RFC 5652 section 6.3), the padding check, and why a
# padding ORACLE is dangerous -- shown conceptually, with no real attack carried out.
BLOCK_SIZE = 8  # bytes; small on purpose, so every padded message fits on one line


def pad(data: bytes, block_size: int = BLOCK_SIZE) -> bytes:
    """Appends N bytes, each of value N, so the total length becomes a multiple of block_size. If the
    data is already a multiple of block_size, a FULL extra block of padding is still added (N =
    block_size) -- otherwise unpad could not tell "no padding" from "padding of length block_size"."""
    pad_len = block_size - (len(data) % block_size)
    return data + bytes([pad_len]) * pad_len


def unpad(data: bytes, block_size: int = BLOCK_SIZE) -> bytes:
    """Removes and validates PKCS#7 padding. Raises ValueError("padding error") -- the SAME message
    and shape for every way padding can be wrong -- on purpose: a caller that can tell "wrong length"
    apart from "wrong last byte" apart from "wrong padding bytes" has just been handed a padding
    ORACLE (Vaudenay, 2002): each distinguishable answer leaks one more fact about the plaintext to
    an attacker who can resubmit modified ciphertext and observe which error comes back."""
    if not data or len(data) % block_size != 0:
        raise ValueError("padding error")
    pad_len = data[-1]
    if pad_len < 1 or pad_len > block_size:
        raise ValueError("padding error")
    if data[-pad_len:] != bytes([pad_len]) * pad_len:
        raise ValueError("padding error")
    return data[:-pad_len]


def unpad_bad_oracle(data: bytes, block_size: int = BLOCK_SIZE):
    """The INSECURE way to write this check: three DIFFERENT, distinguishable error strings. Returns
    (plaintext_or_None, message). Used only to demonstrate, side by side with unpad() above, why the
    distinction matters -- never call this from real code."""
    if not data or len(data) % block_size != 0:
        return None, "length error"
    pad_len = data[-1]
    if pad_len < 1 or pad_len > block_size:
        return None, "bad pad length byte"
    if data[-pad_len:] != bytes([pad_len]) * pad_len:
        return None, "bad pad bytes"
    return data[:-pad_len], "ok"


def demo():
    print("pad(b'HELLO', 8)       =", pad(b"HELLO").hex(), "(3 bytes of 0x03 added)")
    print("pad(b'12345678', 8)    =", pad(b"12345678").hex(), "(a full extra block: 8 bytes of 0x08)")
    print("unpad(pad(b'HELLO'))   =", unpad(pad(b"HELLO")))

    print("\n-- a tampered last byte --")
    good = pad(b"HELLO")
    bad = bytearray(good); bad[-1] ^= 0x01
    try:
        unpad(bytes(bad))
        print("unexpected: accepted")
    except ValueError as e:
        print("unpad() raises:", e, "(always the same message/shape, regardless of WHY it failed)")

    print("\n-- the padding-oracle danger (conceptual; unpad_bad_oracle() is shown ONLY to contrast) --")
    for label, blob in [("good padding", good), ("bad last byte", bytes(bad))]:
        pt, msg = unpad_bad_oracle(blob)
        print("  %-14s -> unpad_bad_oracle() says: %r" % (label, msg))
    print("  A caller who can see WHICH of these messages came back (or how long each one took) can, "
          "one byte at a time, ask a server thousands of crafted questions and reconstruct an entire "
          "encrypted block without ever knowing the key -- this is the shape of Vaudenay's 2002 "
          "padding-oracle attack on CBC. unpad() above returns one identical error for every case; "
          "Demo 6 shows the other half of the real fix: check the MAC BEFORE touching the padding "
          "at all (encrypt-then-MAC), so a tampered ciphertext never reaches unpad() in the first place.")


if __name__ == "__main__":
    demo()
