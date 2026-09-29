#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# CEN429 - Week 10 - Demo 2 end-to-end test: runs the real demo.sh (ECDSA P-256 sign/verify over an
# "update file", including a tampered copy, a downgrade replay and a wrong-key check) in its own
# temporary "sig/" lab folder and checks the REAL printed output of every step.
#
# Skips cleanly (CTest "Not Run", exit code 125) when either `sh` or `openssl` is not on PATH.
import shutil
import subprocess
import sys
from pathlib import Path

DEMO_DIR = Path(__file__).resolve().parent.parent
SKIP_RC = 125


def find_shell():
    for name in ("sh", "bash"):
        p = shutil.which(name)
        if p:
            return p
    return None


def main():
    sh = find_shell()
    openssl = shutil.which("openssl")
    if not sh or not openssl:
        missing = []
        if not sh:
            missing.append("a POSIX shell (sh/bash)")
        if not openssl:
            missing.append("the openssl CLI")
        print("SKIP: %s not found on PATH -- install it to run this demo's test." % " and ".join(missing))
        return SKIP_RC

    lab = DEMO_DIR / "sig"
    shutil.rmtree(lab, ignore_errors=True)

    proc = subprocess.run([sh, "demo.sh"], cwd=str(DEMO_DIR), capture_output=True,
                           text=True, timeout=60)
    out = proc.stdout + proc.stderr

    failed = 0

    def check(label, cond):
        nonlocal failed
        print("  %-70s %s" % (label, "OK" if cond else "FAIL"))
        if not cond:
            failed += 1

    check("demo.sh exits 0", proc.returncode == 0)

    # --- step 1-2: key pair and signature are actually produced -------------------------------------
    check("step 1: key pair created", "signer.key (private) + signer.pub (public) created" in out)
    check("step 2: update.sig created", "update.sig created (" in out)

    # --- step 3: a genuine signature over the genuine message verifies -----------------------------
    check("step 3: correct signature accepted",
          "VERIFY-RESULT: VALID (install). openssl exit code = 0." in out)

    # --- step 4: one flipped byte in the signed content is caught ----------------------------------
    check("step 4: tampered content rejected",
          "VERIFY-RESULT: INVALID. The tampered update is REJECTED (exit code != 0)." in out)

    # --- step 5: an older, but still validly signed, message also verifies (downgrade pitfall) -----
    check("step 5: old-but-valid signature also verifies",
          "VERIFY-RESULT: VALID -- the signature alone cannot tell version 1.0.0 from 1.2.0." in out)

    # --- step 6: the attacker's own key "validates" the attacker's own message, but the real
    #     publisher's key correctly rejects it -----------------------------------------------------
    check("step 6: attacker's message verifies against the attacker's OWN key",
          "VERIFY-RESULT: VALID against attacker.pub" in out)
    check("step 6: attacker's message is rejected against the REAL signer's key",
          "VERIFY-RESULT: correctly REJECTED against the real signer.pub" in out)

    # --- no step should ever have printed "unexpected" ----------------------------------------------
    check("no step printed 'unexpected'", "unexpected" not in out.lower())

    # --- the pitfalls block is printed (it is what the animation's captions quote) ------------------
    check("pitfall: EVP_DigestVerify return-value check", "== 1" in out)
    check("pitfall: version must be part of the signed content", "VERSION" in out)
    check("pitfall: verification key must be pinned", "pinned" in out)

    # --- safety: only a temporary folder was used, and it is gone afterwards -----------------------
    check("temporary sig/ lab folder was deleted", not lab.exists())
    check("cleanup message printed", "(temporary sig/ deleted)" in out)

    print("  ---")
    if failed:
        print("  %d TEST(S) FAILED" % failed)
        print(out[-3000:])
        return 1
    print("  ALL TESTS PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
