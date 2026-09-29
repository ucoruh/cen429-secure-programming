#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# CEN429 - Week 10 - Demo 3 unit tests: ECB / CBC / CTR / GCM-like block-mode properties.
#
# Every expected value below is either (a) computed a DIFFERENT way than block_modes.py computes it
# (e.g. re-deriving CBC by hand from the toy cipher's own encrypt function, one block at a time) or
# (b) a structural property of the mode that must hold for ANY correct block cipher, not just this
# toy one (identical ECB plaintext blocks -> identical ciphertext blocks; a single ciphertext bit
# flip changes exactly one plaintext bit in CTR; etc.) -- never a value copied from running the code
# under test.
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import block_modes as bm  # noqa: E402

failed = 0


def check(label, cond):
    global failed
    print("  %-70s %s" % (label, "OK" if cond else "FAIL"))
    if not cond:
        failed += 1


def main():
    KEY, IV, NONCE = 0x2A, 0x7F, 0x10
    MSG = b"ATTACK AT DAWN!!"  # 16 bytes

    # --- toy cipher: a bijection (every byte value round-trips) -------------------------------------
    ok = all(bm.toy_decrypt_block(bm.toy_encrypt_block(b, KEY), KEY) == b for b in range(256))
    check("toy cipher is a bijection over all 256 byte values", ok)
    check("toy cipher actually changes at least one byte (not the identity)",
          any(bm.toy_encrypt_block(b, KEY) != b for b in range(256)))

    # --- ECB: round trip, and the classic "identical blocks leak" property --------------------------
    ct = bm.ecb_encrypt(MSG, KEY)
    check("ECB round trip", bm.ecb_decrypt(ct, KEY) == MSG)
    check("ECB: identical plaintext bytes (positions 0 and 3 are both 'A') give identical ciphertext",
          ct[0] == ct[3] == bm.toy_encrypt_block(ord('A'), KEY))
    check("ECB ciphertext differs from plaintext (not the identity cipher)", ct != MSG)
    tampered = bm.flip_bit(ct, 5, 2)
    pt2 = bm.ecb_decrypt(tampered, KEY)
    check("ECB: a ciphertext bit flip garbles ONLY that one block",
          pt2[5] != MSG[5] and pt2[:5] == MSG[:5] and pt2[6:] == MSG[6:])

    # --- CBC: round trip, IV matters, independent re-derivation of block 0 --------------------------
    ct = bm.cbc_encrypt(MSG, KEY, IV)
    check("CBC round trip", bm.cbc_decrypt(ct, KEY, IV) == MSG)
    check("CBC with a different IV gives a different ciphertext",
          bm.cbc_encrypt(MSG, KEY, IV ^ 0xFF) != ct)
    # independent re-derivation of the first two ciphertext bytes, one block at a time by hand
    c0 = bm.toy_encrypt_block(MSG[0] ^ IV, KEY)
    c1 = bm.toy_encrypt_block(MSG[1] ^ c0, KEY)
    check("CBC block 0 matches an independent, by-hand derivation", ct[0] == c0)
    check("CBC block 1 matches an independent, by-hand derivation", ct[1] == c1)
    tampered = bm.flip_bit(ct, 3, 0)
    pt2 = bm.cbc_decrypt(tampered, KEY, IV)
    check("CBC: flipping ciphertext block i garbles plaintext block i",
          pt2[3] != MSG[3])
    check("CBC: the SAME bit position flips in plaintext block i+1 (controlled malleability)",
          pt2[4] == (MSG[4] ^ 0x01))
    check("CBC: blocks before i and after i+1 are unaffected",
          pt2[:3] == MSG[:3] and pt2[5:] == MSG[5:])

    # --- CTR: round trip (encrypt == decrypt), independent keystream re-derivation ------------------
    ct = bm.ctr_encrypt(MSG, KEY, NONCE)
    check("CTR round trip", bm.ctr_decrypt(ct, KEY, NONCE) == MSG)
    ks = [bm.toy_encrypt_block((NONCE + i) & 0xFF, KEY) for i in range(len(MSG))]
    check("CTR ciphertext matches an independently rebuilt keystream XOR",
          ct == bytes(m ^ k for m, k in zip(MSG, ks)))
    tampered = bm.flip_bit(ct, 3, 0)
    pt2 = bm.ctr_decrypt(tampered, KEY, NONCE)
    check("CTR: a ciphertext bit flip changes EXACTLY that one plaintext bit",
          pt2[3] == (MSG[3] ^ 0x01) and pt2[:3] == MSG[:3] and pt2[4:] == MSG[4:])
    check("CTR with a different nonce gives a different ciphertext",
          bm.ctr_encrypt(MSG, KEY, NONCE ^ 0xFF) != ct)

    # --- GCM-like: authenticated round trip, tamper detection on ciphertext/tag/nonce/key -----------
    ct, tag = bm.gcm_like_encrypt(MSG, KEY, NONCE)
    pt, ok = bm.gcm_like_decrypt(ct, tag, KEY, NONCE)
    check("GCM-like: correct ciphertext + correct tag -> accepted", ok and pt == MSG)
    _, ok = bm.gcm_like_decrypt(bm.flip_bit(ct, 0, 0), tag, KEY, NONCE)
    check("GCM-like: a tampered ciphertext byte is REJECTED (tag mismatch)", ok is False)
    _, ok = bm.gcm_like_decrypt(ct, tag ^ 0x01, KEY, NONCE)
    check("GCM-like: a tampered tag byte is REJECTED", ok is False)
    _, ok = bm.gcm_like_decrypt(ct, tag, KEY, NONCE ^ 0x01)
    check("GCM-like: the wrong nonce is REJECTED (an authenticated-decrypt input, not just plaintext)",
          ok is False)
    pt_none, ok = bm.gcm_like_decrypt(bm.flip_bit(ct, 0, 0), tag, KEY, NONCE)
    check("GCM-like: on a rejected tag, NO plaintext is returned (verify before you trust the bytes)",
          pt_none is None)

    # --- edge cases: empty message, single byte, key/nonce at the boundary (0 and 255) --------------
    check("ECB on an empty message round-trips to empty", bm.ecb_decrypt(bm.ecb_encrypt(b"", KEY), KEY) == b"")
    check("CBC on a single byte round-trips",
          bm.cbc_decrypt(bm.cbc_encrypt(b"X", KEY, IV), KEY, IV) == b"X")
    check("CTR on a single byte round-trips",
          bm.ctr_decrypt(bm.ctr_encrypt(b"X", KEY, NONCE), KEY, NONCE) == b"X")
    for edge_key in (0, 255):
        for edge_iv in (0, 255):
            rt = bm.cbc_decrypt(bm.cbc_encrypt(MSG, edge_key, edge_iv), edge_key, edge_iv)
            check("CBC round trip at boundary key=%d iv=%d" % (edge_key, edge_iv), rt == MSG)

    print("  ---")
    if failed:
        print("  %d TEST(S) FAILED" % failed)
        return 1
    print("  ALL TESTS PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
