#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# CEN429 - Week 10 - Demo 1 end-to-end test: runs the real demo.sh (root -> intermediate -> server
# certificate chain) in its own temporary "pki/" lab folder (created and deleted by the script itself,
# same as a student running it by hand) and checks the REAL printed output of every verification step.
#
# Skips cleanly (CTest "Not Run", exit code 125) when either `sh` or `openssl` is not on PATH, per the
# course instruction that this test must not fail a machine that simply has no OpenSSL CLI installed.
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

    lab = DEMO_DIR / "pki"
    shutil.rmtree(lab, ignore_errors=True)  # in case a previous crashed run left it behind

    proc = subprocess.run([sh, "demo.sh"], cwd=str(DEMO_DIR), capture_output=True,
                           text=True, timeout=60)
    out = proc.stdout + proc.stderr

    failed = 0

    def check(label, cond):
        nonlocal failed
        print("  %-70s %s" % (label, "OK" if cond else "FAIL"))
        if not cond:
            failed += 1

    # --- the script itself must run to completion (it never exits non-zero on a rejection: every
    # "REJECTED" line comes from `cmd || echo ...`, not from the script's own exit code) -------------
    check("demo.sh exits 0", proc.returncode == 0)

    # --- step 1-3: the chain is actually built ---------------------------------------------------
    check("step 1: root.crt created", "root.crt created" in out)
    check("step 2: intermediate.crt created (CA:TRUE)", "intermediate.crt created (CA:TRUE)" in out)
    check("step 3: server.crt created", "server.crt created" in out)

    # --- step 4: missing intermediate -> the chain does not reach the trusted root -----------------
    check("step 4: rejected without the intermediate",
          "VERIFY-RESULT: REJECTED (chain does not reach the root: the intermediate is missing)" in out)

    # --- step 5: full chain -> verifies -------------------------------------------------------------
    check("step 5: OK with the intermediate",
          "VERIFY-RESULT: OK (chain complete: signature + path to the trust anchor)" in out)

    # --- step 6: an expired certificate (checked with -attime, no clock change) is rejected --------
    check("step 6: rejected once expired",
          "VERIFY-RESULT: REJECTED (the certificate has expired" in out)

    # --- step 7: a certificate that does not chain to the given trust anchor is rejected -----------
    check("step 7: rejected under an unrelated root (wrong CA)",
          "VERIFY-RESULT: REJECTED (does not chain to this trust anchor)" in out)

    # --- step 8: basicConstraints CA:FALSE must not be accepted as an issuer -----------------------
    check("step 8: rejected when the issuer has CA:FALSE",
          "VERIFY-RESULT: REJECTED (server.crt has CA:FALSE, it may not sign certificates)" in out)

    # --- step 9: hostname/SAN check is a separate, application-level step --------------------------
    check("step 9: accepted for the matching SAN (example.test)",
          "VERIFY-RESULT: OK (the SAN entry matches example.test)" in out)
    check("step 9: rejected for a non-matching hostname (wrong.test)",
          "VERIFY-RESULT: REJECTED (the SAN list does not include wrong.test)" in out)

    # --- no verification step should ever have printed "unexpected" (that marks a real bug in the
    # certificate setup, not a demonstrated rejection) ----------------------------------------------
    check("no step printed 'unexpected'", "unexpected" not in out.lower())

    # --- safety: the demo only touches its own temporary folder, and deletes it at the end ---------
    check("temporary pki/ lab folder was deleted", not lab.exists())
    check("cleanup message printed", "(temporary pki/ deleted)" in out)

    # --- the four validation questions are named in the closing line -------------------------------
    check("closing summary line printed",
          "signature? reaches a trusted root? still valid? right name?" in out)

    print("  ---")
    if failed:
        print("  %d TEST(S) FAILED" % failed)
        print(out[-3000:])
        return 1
    print("  ALL TESTS PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
