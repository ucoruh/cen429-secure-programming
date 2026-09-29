#!/bin/sh
# CEN429 — Week 2 — Demo 4: attack tree cost calculator (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
# A calculator; it never carries out an attack, it never touches a file.
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/tree" ] || { echo "Build first: ../../build.sh"; exit 1; }
A="$B/tree"
line() { echo "--------------------------------------------------------------"; }

line; echo "STEP 1 - Before: the key in memory is the weakest point"
"$A" tree-payment.txt
line; echo "STEP 2 - After: RASP was added to the 'read from memory' branch"
"$A" tree-defense.txt
line; echo "STEP 3 - Multi-attribute: cost + time + skill"
"$A" tree-attributed.txt
line; echo "Result: the defense raised the cheapest attack from 2 to 8 units."
echo "The weakest point is now a different branch; the defender should focus there."
echo "AND nodes make an attack more expensive (defence in depth)."
