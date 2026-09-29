#!/bin/sh
# CEN429 - Week 9 - Demo 1: Manual obfuscation and cost measurement (Linux / WSL)
# Build first: ../../build.sh    Then: ./demo.sh
# SAFE: only measures files inside this folder; no file/network/system operation.
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/access_clean" ] || { echo "Build first: ../../build.sh"; exit 1; }
TOKEN="CEN429-OK"     # valid synthetic token (NOT embedded in the binary, passed in here)
line() { echo "--------------------------------------------------------------"; }

line; echo "STEP 1 - Was behavior preserved? (both versions give the same output)"
echo "\$ access_clean $TOKEN CEN429-XX short"
"$B/access_clean" "$TOKEN" CEN429-XX short
# Plain temp files, not <(...) process substitution: this script runs under POSIX 'sh' (dash on
# Ubuntu/WSL), which does not support that bash-only syntax.
t1=$(mktemp); t2=$(mktemp)
"$B/access_clean" "$TOKEN" CEN429-XX short "" > "$t1"
"$B/access_obfuscated" "$TOKEN" CEN429-XX short "" > "$t2"
if diff -q "$t1" "$t2" >/dev/null; then
  echo "  -> Both versions' output is BYTE-IDENTICAL. Behavior was preserved."
else
  echo "  -> WARNING: outputs differ!"
fi
rm -f "$t1" "$t2"

line; echo "STEP 2 - Is the secret visible with 'strings'?"
echo -n "  clean:      "; strings "$B/access_clean" | grep -q "$TOKEN" && echo "VISIBLE (unprotected)" || echo "not found"
echo -n "  obfuscated: "; strings "$B/access_obfuscated" | grep -q "$TOKEN" && echo "VISIBLE" || echo "NOT VISIBLE  <- R-07 string encoding"

line; echo "STEP 3 - Cost: machine code of grant_access() alone"
measure() {
  objdump -d "$1" 2>/dev/null | awk '/<grant_access>:/{a=1;next} /^$/{a=0} a{n++; if($0 ~ /\t(j|call)/)b++} END{printf "%d instructions, %d branches/calls", n, b}'
}
echo "  clean      grant_access: $(measure "$B/access_clean")"
echo "  obfuscated grant_access: $(measure "$B/access_obfuscated")"
echo "  -> The obfuscated version's instruction and branch counts go up = the MEASURED cost of obfuscation."

line; echo "Result: same behavior, secret hidden, cost measured. This table feeds into the term project's S9."
