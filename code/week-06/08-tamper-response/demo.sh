#!/bin/sh
# CEN429 - Week 6 - Demo 8: RASP engine + response policy (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/rasp" ] || { echo "Build first: ../../build.sh"; exit 1; }
line() { echo "=============================================================="; }

line; echo "SCENARIO 1 - normal: 0 failed checks, device matches -> NORMAL"
"$B/rasp" normal
line; echo "SCENARIO 2 - warn: 1 failed check -> WARN (still opens, just logged)"
"$B/rasp" warn
line; echo "SCENARIO 3 - degrade: 2 failed checks -> DEGRADE (wiped, redacted result)"
"$B/rasp" degrade
line; echo "SCENARIO 4 - lock: 3 failed checks -> LOCK (wipe + decoy + flag)"
"$B/rasp" lock
line; echo "SCENARIO 5 - other-device: checks pass, device key does not hold -> LOCK"
"$B/rasp" other-device
line
echo "Lesson: detection alone is not enough; what matters is a GRADED RESPONSE"
echo "policy (warn/degrade/lock, not just block-or-allow) plus device/version"
echo "binding (a copied key still will not open on a different device)."
