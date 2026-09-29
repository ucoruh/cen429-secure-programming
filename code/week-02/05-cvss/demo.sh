#!/bin/sh
# CEN429 — Week 2 — Demo 5: CVSS v3.1 base score calculator (Linux / WSL)
# No build needed; Python 3.8+ is enough.  Run with: sh demo.sh
cd "$(dirname "$0")"
PY=python3
command -v "$PY" >/dev/null || PY=python
command -v "$PY" >/dev/null || { echo "Python 3 is required: sudo apt install python3"; exit 1; }
line() { echo "--------------------------------------------------------------"; }

line; echo "STEP 1 - Score the built-in vulnerability vectors"
"$PY" cvss.py --examples
line; echo "STEP 2 - Score a single vector by hand"
echo "\$ python3 cvss.py CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
"$PY" cvss.py "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
line; echo "STEP 3 - Verification: compare against the FIRST v3.1 specification's scores"
"$PY" test_cvss.py
line; echo "Result: the same flaw scores differently once authentication/interaction/scope change."
echo "The score sets a priority; but you add the context (the value of your asset)."
