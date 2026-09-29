#!/bin/sh
# CEN429 — Week 2 — Demo 6: a TOCTOU race condition (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
# Everything happens under the demo folder's work/ subfolder; no system file is touched.
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/logwriter" ] || { echo "Build first: ../../build.sh"; exit 1; }
line() { echo "--------------------------------------------------------------"; }

line; echo "STEP 1 - UNSAFE version: check first, then open (the race window)"
sh attack.sh unsafe
line; echo "STEP 2 - SAFE version: opens in one step with O_NOFOLLOW"
sh attack.sh safe
line; echo "Result: the gap between the check (lstat) and the use (fopen)"
echo "is a race an attacker can step into. The fix: do the check and the use"
echo "in one atomic step (O_NOFOLLOW, O_EXCL, ...)."
