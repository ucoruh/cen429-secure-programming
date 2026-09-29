#!/bin/sh
# CEN429 - Week 12 - Demo 2: Attack potential calculator (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/attack_potential" ] || { echo "Build first: ../../build.sh"; exit 1; }
line() { echo "--------------------------------------------------------------"; }

line; echo "STEP 1 - No arguments: score the three built-in example findings"
"$B/attack_potential"

line; echo "STEP 2 - Explicit factor levels (time expertise knowledge opportunity equipment)"
echo "> unprotected license check"
"$B/attack_potential" 0 1 0 0 0
echo "> the SAME check, after adding the Week 9 protections"
"$B/attack_potential" 1 2 1 1 0

line
echo "Note: a LOW total score means an EASY attack -- that is a SERIOUS finding, not a safe one."
