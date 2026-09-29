#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# CEN429 — Week 2 — Demo 5 verification: scores from the FIRST v3.1 specification.
#
# Every expected value below comes from the published FIRST CVSS v3.1 specification document
# (either its own worked examples, a well-known public CVE's official NVD score, or the "roundup"
# and severity-rating tables in the spec text) — never from running cvss.py itself.
import sys
import cvss

EXPECTED = {
    "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H": 9.8,
    "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H": 10.0,
    "CVSS:3.1/AV:N/AC:H/PR:H/UI:R/S:U/C:L/I:N/A:N": 2.0,
    "CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H": 7.8,
    "CVSS:3.1/AV:P/AC:H/PR:N/UI:N/S:U/C:H/I:N/A:N": 4.2,
    "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N": 7.5,  # Heartbleed CVE-2014-0160
    "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N": 6.1,  # a typical XSS
    "CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:N/A:H": 6.5,  # DoS with a privilege
    "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N": 0.0,  # no impact at all -> hard 0.0
    "CVSS:3.1/AV:P/AC:H/PR:H/UI:R/S:U/C:L/I:N/A:N": 1.6,  # every metric at its weakest
}


def check(label, actual, expected, tol=1e-9):
    ok = abs(actual - expected) < tol
    print("  %-55s expected=%s computed=%s  %s" %
          (label, expected, actual, "OK" if ok else "FAIL"))
    return 0 if ok else 1


def main():
    failed = 0

    # --- base_score(): known vectors from the FIRST spec / NVD -------------------------------
    for v, expected in EXPECTED.items():
        p = cvss.base_score(cvss.parse_vector(v))[0]
        failed += check(v.split("/", 1)[1], p, expected)

    # --- round_up(): the two worked examples in the FIRST v3.1 spec text ---------------------
    failed += check("round_up(4.02) == 4.1 (spec example)", cvss.round_up(4.02), 4.1)
    failed += check("round_up(4.00) == 4.0 (spec example)", cvss.round_up(4.00), 4.0)
    failed += check("round_up(0.0) == 0.0", cvss.round_up(0.0), 0.0)
    failed += check("round_up(1.001) == 1.1", cvss.round_up(1.001), 1.1)

    # --- severity(): the boundaries of the qualitative rating scale ---------------------------
    failed += check("severity(0.0) == None", cvss.severity(0.0) == "None", True)
    failed += check("severity(3.9) == Low", cvss.severity(3.9) == "Low", True)
    failed += check("severity(4.0) == Medium", cvss.severity(4.0) == "Medium", True)
    failed += check("severity(6.9) == Medium", cvss.severity(6.9) == "Medium", True)
    failed += check("severity(7.0) == High", cvss.severity(7.0) == "High", True)
    failed += check("severity(8.9) == High", cvss.severity(8.9) == "High", True)
    failed += check("severity(9.0) == Critical", cvss.severity(9.0) == "Critical", True)
    failed += check("severity(10.0) == Critical", cvss.severity(10.0) == "Critical", True)

    # --- parse_vector(): a missing metric is rejected ------------------------------------------
    try:
        cvss.parse_vector("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H")  # A is missing
        failed += check("parse_vector rejects a missing metric", False, True)
    except ValueError:
        failed += check("parse_vector rejects a missing metric", True, True)

    print("  ---")
    print("  %s" % ("ALL TESTS PASSED" if failed == 0 else "%d TEST(S) FAILED" % failed))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
