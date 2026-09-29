#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# CEN429 - Week 10 - Demo 6 unit tests: encrypt-then-MAC vs MAC-then-encrypt.
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import ordering as ord_  # noqa: E402  (module named ord_ to avoid shadowing the builtin `ord`)

failed = 0


def check(label, cond):
    global failed
    print("  %-70s %s" % (label, "OK" if cond else "FAIL"))
    if not cond:
        failed += 1


def main():
    enc_key, mac_key, iv = 0x2A, b"a course mac key", 0x7F
    msg = b"transfer 100 usd"

    # --- EtM: round trip -----------------------------------------------------------------------------
    ct, tag = ord_.etm_protect(msg, enc_key, mac_key, iv)
    check("EtM round trip", ord_.etm_unprotect(ct, tag, enc_key, mac_key, iv) == msg)
    check("EtM tag is an independently-verifiable HMAC-SHA256 over the ciphertext",
          tag == ord_.mac(mac_key, ct))

    # --- EtM: any ciphertext tamper is caught by the MAC, BEFORE decrypt/unpad ever run --------------
    def calls_decrypt(fn):
        """Returns True if fn() reaches cbc_decrypt (proxy: monkeypatch and observe a call)."""
        called = []
        real = ord_.cbc_decrypt

        def spy(*a, **kw):
            called.append(1)
            return real(*a, **kw)
        ord_.cbc_decrypt = spy
        try:
            try:
                fn()
            except ValueError:
                pass
        finally:
            ord_.cbc_decrypt = real
        return bool(called)

    for i in range(len(ct)):
        tampered = bytearray(ct); tampered[i] ^= 0x01
        check("EtM rejects a tampered byte at position %d" % i,
              _raises(lambda t=bytes(tampered): ord_.etm_unprotect(t, tag, enc_key, mac_key, iv)))
    check("EtM never calls cbc_decrypt on a tampered ciphertext (MAC checked first)",
          not calls_decrypt(lambda: ord_.etm_unprotect(bytes(bytearray(ct[:0]) + bytearray([ct[0] ^ 1]) + ct[1:]),
                                                         tag, enc_key, mac_key, iv)))
    check("EtM rejects a tampered tag (correct ciphertext, wrong tag)",
          _raises(lambda: ord_.etm_unprotect(ct, bytes(bytearray(tag[:0]) + bytearray([tag[0] ^ 1]) + tag[1:]),
                                              enc_key, mac_key, iv)))

    # --- MtE: round trip -----------------------------------------------------------------------------
    ct2 = ord_.mte_protect(msg, enc_key, mac_key, iv)
    check("MtE round trip", ord_.mte_unprotect(ct2, enc_key, mac_key, iv) == msg)

    # --- MtE: cbc_decrypt DOES run even on a tampered ciphertext (the structural difference from EtM)
    check("MtE calls cbc_decrypt even on a tampered ciphertext (decrypts before it can check the MAC)",
          calls_decrypt(lambda: ord_.mte_unprotect(bytes(bytearray([ct2[0] ^ 1]) + ct2[1:]),
                                                     enc_key, mac_key, iv)))

    # --- MtE: both failure shapes exist and are distinguishable (the padding-oracle-shaped risk) -----
    tampered_first = bytes(bytearray([ct2[0] ^ 1]) + ct2[1:])
    tampered_last = bytes(ct2[:-1] + bytearray([ct2[-1] ^ 1]))
    msg1 = _error_message(lambda: ord_.mte_unprotect(tampered_first, enc_key, mac_key, iv))
    msg2 = _error_message(lambda: ord_.mte_unprotect(tampered_last, enc_key, mac_key, iv))
    check("MtE: a tamper that corrupts padding raises a DIFFERENT message than a tamper that doesn't",
          msg1 is not None and msg2 is not None and msg1 != msg2)
    check("MtE: the padding-corrupting tamper's error is 'padding error'", msg2 == "padding error")
    check("MtE: the other tamper's error is 'MAC invalid'", msg1 == "MAC invalid")

    # --- both constructions still reject EVERY tamper (neither is "insecure" here, only distinguishable)
    all_rejected = all(_raises(lambda i=i: ord_.mte_unprotect(
        bytes(bytearray(ct2[:i]) + bytearray([ct2[i] ^ 1]) + ct2[i + 1:]), enc_key, mac_key, iv))
        for i in range(len(ct2)))
    check("MtE still rejects every single-byte tamper (it is not broken, only shaped differently)",
          all_rejected)

    # --- edge cases -----------------------------------------------------------------------------------
    for m in (b"", b"x", bytes(range(40))):
        ct3, tag3 = ord_.etm_protect(m, enc_key, mac_key, iv)
        check("EtM round trip for %d-byte message" % len(m),
              ord_.etm_unprotect(ct3, tag3, enc_key, mac_key, iv) == m)
        ct4 = ord_.mte_protect(m, enc_key, mac_key, iv)
        check("MtE round trip for %d-byte message" % len(m),
              ord_.mte_unprotect(ct4, enc_key, mac_key, iv) == m)

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


def _error_message(fn):
    try:
        fn()
        return None
    except ValueError as e:
        return str(e)


if __name__ == "__main__":
    sys.exit(main())
