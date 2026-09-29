#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CEN429 — Week 2 — Demo 5: CVSS v3.1 Base Score calculator

Usage:
    python3 cvss.py "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
    python3 cvss.py --examples        (solves the built-in examples)

CVSS (Common Vulnerability Scoring System) turns a vulnerability's severity
into a number between 0.0 and 10.0. This script computes only the BASE score,
from scratch, using the formulas in FIRST's v3.1 specification; it makes no
network request.

Metrics:
  AV  Attack vector          N(etwork) A(djacent) L(ocal) P(hysical)
  AC  Attack complexity      L(ow) H(igh)
  PR  Privileges required    N(one) L(ow) H(igh)
  UI  User interaction       N(one) R(equired)
  S   Scope                  U(nchanged) C(hanged)
  C   Confidentiality impact H(igh) L(ow) N(one)
  I   Integrity impact       H(igh) L(ow) N(one)
  A   Availability impact    H(igh) L(ow) N(one)
"""
import sys
import math

AV = {"N": 0.85, "A": 0.62, "L": 0.55, "P": 0.20}
AC = {"L": 0.77, "H": 0.44}
# PR takes different multipliers once the scope (S) has changed.
PR_U = {"N": 0.85, "L": 0.62, "H": 0.27}
PR_C = {"N": 0.85, "L": 0.68, "H": 0.50}
UI = {"N": 0.85, "R": 0.62}
CIA = {"H": 0.56, "L": 0.22, "N": 0.00}

LABEL = {
    "AV": {"N": "Network", "A": "Adjacent", "L": "Local", "P": "Physical"},
    "AC": {"L": "Low", "H": "High"},
    "PR": {"N": "None", "L": "Low", "H": "High"},
    "UI": {"N": "None", "R": "Required"},
    "S":  {"U": "Unchanged", "C": "Changed"},
}


def round_up(x):
    """CVSS's own 'roundup': round up to one decimal place."""
    whole = int(round(x * 100000))
    if whole % 10000 == 0:
        return whole / 100000.0
    return (math.floor(whole / 10000) + 1) / 10.0


def parse_vector(vector):
    parts = vector.strip().split("/")
    m = {}
    for p in parts:
        if ":" in p:
            k, v = p.split(":", 1)
            m[k] = v
    for required in ("AV", "AC", "PR", "UI", "S", "C", "I", "A"):
        if required not in m:
            raise ValueError("missing metric: " + required)
    return m


def base_score(m):
    changed = m["S"] == "C"
    pr = (PR_C if changed else PR_U)[m["PR"]]

    # ISS: how much of the security properties is broken
    iss = 1 - (1 - CIA[m["C"]]) * (1 - CIA[m["I"]]) * (1 - CIA[m["A"]])
    if not changed:
        impact = 6.42 * iss
    else:
        impact = 7.52 * (iss - 0.029) - 3.25 * (iss - 0.02) ** 15

    exploitability = 8.22 * AV[m["AV"]] * AC[m["AC"]] * pr * UI[m["UI"]]

    if impact <= 0:
        return 0.0, impact, exploitability
    if changed:
        base = min(1.08 * (impact + exploitability), 10)
    else:
        base = min(impact + exploitability, 10)
    return round_up(base), impact, exploitability


def severity(p):
    if p == 0.0:
        return "None"
    if p < 4.0:
        return "Low"
    if p < 7.0:
        return "Medium"
    if p < 9.0:
        return "High"
    return "Critical"


def bar(p):
    filled = int(round(p / 10.0 * 20))
    return "#" * filled + "." * (20 - filled)


def solve(vector, description=""):
    try:
        m = parse_vector(vector)
    except ValueError as e:
        print("  ERROR (%s): %s" % (vector, e))
        return
    p, impact, exp = base_score(m)
    if description:
        print("  " + description)
    print("  %s" % vector)
    summary = "AV=%s AC=%s PR=%s UI=%s S=%s | C=%s I=%s A=%s" % (
        LABEL["AV"][m["AV"]], LABEL["AC"][m["AC"]], LABEL["PR"][m["PR"]],
        LABEL["UI"][m["UI"]], LABEL["S"][m["S"]], m["C"], m["I"], m["A"])
    print("    " + summary)
    print("    Impact=%.1f  Exploitability=%.1f" % (impact, exp))
    print("    BASE SCORE = %.1f  |%s|  %s\n" % (p, bar(p), severity(p)))


EXAMPLES = [
    ("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
     "1) Remote, no authentication needed, full takeover (Heartbleed-like severity)"),
    ("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H",
     "2) The same, but the SCOPE changed (impact spills outside the box) -> higher"),
    ("CVSS:3.1/AV:N/AC:H/PR:H/UI:R/S:U/C:L/I:N/A:N",
     "3) Hard conditions, needs privilege+interaction, only limited confidentiality -> low"),
    ("CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H",
     "4) Local privilege escalation (the device is in the attacker's hands) -> high"),
    ("CVSS:3.1/AV:P/AC:H/PR:N/UI:N/S:U/C:H/I:N/A:N",
     "5) Physical access + high complexity, only confidentiality -> medium"),
]


def main():
    args = sys.argv[1:]
    if not args or args[0] in ("-h", "--help"):
        print(__doc__)
        return
    if args[0] == "--examples":
        for vec, desc in EXAMPLES:
            solve(vec, desc)
        return
    for vec in args:
        solve(vec)


if __name__ == "__main__":
    main()
