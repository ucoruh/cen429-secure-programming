#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# CEN429 - Week 10 - Demo 11 unit tests: the simulated HSM's key-handle API.
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import hsm_sim  # noqa: E402

failed = 0


def check(label, cond):
    global failed
    print("  %-70s %s" % (label, "OK" if cond else "FAIL"))
    if not cond:
        failed += 1


def main():
    hsm = hsm_sim.SimulatedHSM()

    # --- the public API surface never offers a way to read a private key out ------------------------
    api = hsm.public_api()
    check("public_api() lists the expected operations",
          set(api) == {"destroy_keypair", "generate_keypair", "get_public_key", "public_api",
                        "sign", "verify"})
    check("no method name on the public API contains 'private' or 'export'",
          not any("private" in n.lower() or "export" in n.lower() for n in api))

    # --- generate_keypair returns a usable handle, distinct from the next one ------------------------
    h1 = hsm.generate_keypair()
    h2 = hsm.generate_keypair()
    check("two calls to generate_keypair return different handles", h1 != h2)
    check("get_public_key returns bytes", isinstance(hsm.get_public_key(h1), (bytes, bytearray)))
    check("the two key pairs have different public keys", hsm.get_public_key(h1) != hsm.get_public_key(h2))

    # --- sign/verify: correct, tampered data, cross-key -----------------------------------------------
    doc = b"purchase order #4711: pay 10000 to account A"
    sig = hsm.sign(h1, doc)
    check("a genuine signature verifies under the SAME handle", hsm.verify(h1, doc, sig))
    check("a tampered document fails verification", not hsm.verify(h1, doc + b"!", sig))
    check("a signature made with one handle does not verify under a DIFFERENT handle",
          not hsm.verify(h2, doc, sig))
    sig_h2 = hsm.sign(h2, doc)
    check("h1's and h2's signatures over the same document are different (different keys)",
          sig != sig_h2)

    # --- unknown handles are rejected, not silently accepted -----------------------------------------
    check("sign() with an unknown handle raises KeyError", _raises_key_error(lambda: hsm.sign(9999, doc)))
    check("verify() with an unknown handle raises KeyError",
          _raises_key_error(lambda: hsm.verify(9999, doc, sig)))
    check("get_public_key() with an unknown handle raises KeyError",
          _raises_key_error(lambda: hsm.get_public_key(9999)))

    # --- destroying a key makes it permanently unusable, even from inside the HSM --------------------
    hsm.destroy_keypair(h1)
    check("sign() after destroy_keypair on the same handle raises KeyError",
          _raises_key_error(lambda: hsm.sign(h1, doc)))
    check("get_public_key() after destroy_keypair raises KeyError",
          _raises_key_error(lambda: hsm.get_public_key(h1)))
    check("destroying an already-destroyed (or unknown) handle does not raise (idempotent cleanup)",
          _does_not_raise(lambda: hsm.destroy_keypair(h1)))
    check("the OTHER handle is unaffected by destroying h1", hsm.verify(h2, doc, sig_h2))

    # --- two independently generated HSM instances never share key material --------------------------
    hsm_other = hsm_sim.SimulatedHSM()
    h3 = hsm_other.generate_keypair()
    check("a fresh SimulatedHSM instance's key is unrelated to the first instance's keys",
          hsm_other.get_public_key(h3) not in (hsm.get_public_key(h2),))

    print("  ---")
    if failed:
        print("  %d TEST(S) FAILED" % failed)
        return 1
    print("  ALL TESTS PASSED")
    return 0


def _raises_key_error(fn):
    try:
        fn()
        return False
    except KeyError:
        return True


def _does_not_raise(fn):
    try:
        fn()
        return True
    except Exception:
        return False


if __name__ == "__main__":
    sys.exit(main())
