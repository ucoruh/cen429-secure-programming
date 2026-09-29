#!/bin/sh
# CEN429 — Week 2 — Demo 14: RBAC + separation of duty + Clark-Wilson (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
# A simulator; it touches no file, network, or system setting.
cd "$(dirname "$0")" || exit 1
B=bin/linux
[ -x "$B/bank" ] || { echo "Build first: ../../build.sh"; exit 1; }
line() { echo "--------------------------------------------------------------"; }

line; echo "Scenario: scenario.txt (roles, constraints, TPs, and steps)"
"$B/bank" scenario.txt

line; echo "Result: RBAC says 'who may do which operation'; Clark-Wilson says"
echo "'touch data only through a certified transaction, validate external input,"
echo "write everything to the ledger, separate duties'. The E-rules cannot stop a"
echo "broken but certified TP; the IVP (integrity verification) is what catches it."
