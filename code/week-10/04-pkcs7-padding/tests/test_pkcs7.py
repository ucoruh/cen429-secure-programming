#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# CEN429 - Week 10 - Demo 4 unit tests: PKCS#7 padding (RFC 5652 6.3). Expected byte values are the
# padding scheme worked out by hand from the RFC's rule ("pad with N bytes of value N"), not copied
# from running pkcs7.py.
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import pkcs7  # noqa: E402

failed = 0


def check(label, cond):
    global failed
    print("  %-70s %s" % (label, "OK" if cond else "FAIL"))
    if not cond:
        failed += 1


def main():
    # --- normal cases, expected bytes worked out by hand -------------------------------------------
    check("pad(b'HELLO', 8) == HELLO + 3x0x03",
          pkcs7.pad(b"HELLO", 8) == b"HELLO" + b"\x03\x03\x03")
    check("pad(b'1234567', 8) == 1234567 + 1x0x01",
          pkcs7.pad(b"1234567", 8) == b"1234567" + b"\x01")
    check("pad(b'', 8) == 8x0x08 (empty input still gets a full padding block)",
          pkcs7.pad(b"", 8) == bytes([8]) * 8)

    # --- exact multiple of the block size still gets a FULL extra padding block ---------------------
    check("pad(b'12345678', 8) adds a full block of 0x08 (16 bytes total)",
          pkcs7.pad(b"12345678", 8) == b"12345678" + bytes([8]) * 8)

    # --- round trips --------------------------------------------------------------------------------
    for msg in (b"", b"A", b"HELLO", b"12345678", b"a payload right at 24 bytes long!!!!!!!"[:24],
                bytes(range(37))):
        check("round trip pad/unpad for %d-byte input" % len(msg),
              pkcs7.unpad(pkcs7.pad(msg)) == msg)

    # --- padding length checked against the byte value, not just "non-zero" -------------------------
    check("unpad rejects pad_len == 0",
          _raises(lambda: pkcs7.unpad(b"HELLO123" + b"\x00")))
    check("unpad rejects pad_len > block_size",
          _raises(lambda: pkcs7.unpad(b"HELLOAB0" + bytes([9]))))

    # --- every padding byte must equal pad_len, not just the last one -------------------------------
    good = pkcs7.pad(b"HELLO")  # b"HELLO\x03\x03\x03"
    for i in (5, 6, 7):
        corrupted = bytearray(good); corrupted[i] ^= 0xFF
        check("unpad rejects a corrupted padding byte at position %d" % i,
              _raises(lambda c=bytes(corrupted): pkcs7.unpad(c)))

    # --- length must be a multiple of the block size -------------------------------------------------
    check("unpad rejects data whose length is not a multiple of block_size",
          _raises(lambda: pkcs7.unpad(b"1234567")))
    check("unpad rejects an empty buffer", _raises(lambda: pkcs7.unpad(b"")))

    # --- every failure raises the SAME exception TYPE and MESSAGE (no distinguishable oracle) -------
    messages = set()
    for bad in (b"HELLO123\x00", b"HELLOAB0" + bytes([9]),
                bytes(bytearray(good[:-1]) + bytearray([good[-1] ^ 0xFF])), b"1234567", b""):
        try:
            pkcs7.unpad(bad)
            check("bad input %r must raise" % bad, False)
        except ValueError as e:
            messages.add(str(e))
    check("every rejection path raises the exact same message (no padding-oracle-shaped leak)",
          messages == {"padding error"})

    print("  ---")
    if failed:
        print("  %d TEST(S) FAILED" % failed)
        return 1
    print("  ALL TESTS PASSED")
    return 0


def _raises(fn):
    try:
        fn()
        return False
    except ValueError:
        return True


if __name__ == "__main__":
    sys.exit(main())
