#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# CEN429 - Week 10 - Demo 5 unit tests: HMAC-SHA256, checked against (a) the official RFC 4231 test
# vectors (published independently of this codebase) and (b) Python's own stdlib `hmac` module (a
# completely separate implementation) for random inputs -- never against hmac_construction.py's own
# earlier output.
import hmac as stdlib_hmac
import hashlib
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import hmac_construction as hc  # noqa: E402

failed = 0


def check(label, cond):
    global failed
    print("  %-70s %s" % (label, "OK" if cond else "FAIL"))
    if not cond:
        failed += 1


# RFC 4231 section 4.2/4.3 test vectors for HMAC-SHA-256 (published values, not derived from this code)
RFC4231_CASES = [
    # (key, data, expected HMAC-SHA-256 hex)
    (bytes([0x0b] * 20), b"Hi There",
     "b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7"),
    (b"Jefe", b"what do ya want for nothing?",
     "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843"),
    (bytes([0xaa] * 20), bytes([0xdd] * 50),
     "773ea91e36800e46854db8ebd09181a72959098b3ef8c122d9635514ced565fe"),
]


def main():
    # --- RFC 4231 known-answer tests -----------------------------------------------------------------
    for i, (key, data, expected_hex) in enumerate(RFC4231_CASES, 1):
        got = hc.hmac_sha256(key, data).hex()
        check("RFC 4231 test case %d matches the published HMAC-SHA-256 value" % i,
              got == expected_hex)

    # --- cross-check against Python's own stdlib hmac module (independent implementation) -----------
    import random
    rng = random.Random(12345)
    for trial in range(30):
        key = bytes(rng.randrange(256) for _ in range(rng.randrange(0, 130)))
        msg = bytes(rng.randrange(256) for _ in range(rng.randrange(0, 200)))
        want = stdlib_hmac.new(key, msg, hashlib.sha256).digest()
        got = hc.hmac_sha256(key, msg)
        check("matches Python's stdlib hmac module (trial %d, key=%dB msg=%dB)" % (trial, len(key), len(msg)),
              got == want)

    # --- edge cases: empty key, empty message, key exactly one block, key longer than one block -----
    check("empty key + empty message matches stdlib hmac",
          hc.hmac_sha256(b"", b"") == stdlib_hmac.new(b"", b"", hashlib.sha256).digest())
    check("key exactly BLOCK_SIZE (64) bytes matches stdlib hmac",
          hc.hmac_sha256(b"k" * 64, b"msg") == stdlib_hmac.new(b"k" * 64, b"msg", hashlib.sha256).digest())
    check("key longer than BLOCK_SIZE (100 bytes, gets hashed down) matches stdlib hmac",
          hc.hmac_sha256(b"k" * 100, b"msg") == stdlib_hmac.new(b"k" * 100, b"msg", hashlib.sha256).digest())

    # --- structural property: changing one message byte changes roughly half the tag's bits ---------
    t1 = hc.hmac_sha256(b"key", b"message A")
    t2 = hc.hmac_sha256(b"key", b"message B")
    same_bits = sum(1 for a, b in zip(t1, t2) for i in range(8) if ((a >> i) & 1) == ((b >> i) & 1))
    check("changing one message byte flips roughly half the tag's bits (avalanche, not a local change)",
          80 <= same_bits <= 176)  # 256 bits total; a generous band around the expected ~128
    check("changing the key (same message) also gives a different tag",
          hc.hmac_sha256(b"key1", b"same message") != hc.hmac_sha256(b"key2", b"same message"))

    # --- constant_time_equal(): correctness, independent of Python's own == --------------------------
    check("constant_time_equal(x, x) is True", hc.constant_time_equal(b"abc", b"abc"))
    check("constant_time_equal differs by one byte -> False", hc.constant_time_equal(b"abc", b"abd") is False)
    check("constant_time_equal differs by length -> False", hc.constant_time_equal(b"abc", b"abcd") is False)
    check("constant_time_equal(b'', b'') is True", hc.constant_time_equal(b"", b""))

    print("  ---")
    if failed:
        print("  %d TEST(S) FAILED" % failed)
        return 1
    print("  ALL TESTS PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
