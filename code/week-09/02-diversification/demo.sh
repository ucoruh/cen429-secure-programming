#!/bin/sh
# CEN429 - Week 9 - Demo 2: Diversification. Build first: ../../build.sh, then: ./demo.sh
# SAFE: only measures files inside this folder; no file/network/system operation.
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/access_seed1001" ] || { echo "Build first: ../../build.sh"; exit 1; }
line() { echo "--------------------------------------------------------------"; }

line; echo "STEP 1 - Behavior: both seeds must give the same result"
"$B/access_seed1001" CEN429-OK; "$B/access_seed2002" CEN429-OK
"$B/access_seed1001" wrong;     "$B/access_seed2002" wrong
[ "$("$B/access_seed1001" CEN429-OK | sed 's/\[seed [0-9]*\] //')" = \
  "$("$B/access_seed2002" CEN429-OK | sed 's/\[seed [0-9]*\] //')" ] \
  && echo "  -> Behavior is the SAME." || echo "  -> WARNING: behavior differs!"

line; echo "STEP 2 - Machine code: the two seeds must produce DIFFERENT binaries"
if cmp -s "$B/access_seed1001" "$B/access_seed2002"; then
  echo "  -> Binaries are identical (unexpected)."
else
  diffcount=$(cmp -l "$B/access_seed1001" "$B/access_seed2002" 2>/dev/null | wc -l)
  echo "  -> Binaries are DIFFERENT: ~$diffcount bytes apart. A patch written into one copy does not work on the other."
fi

line; echo "STEP 3 - grant_access() is encoded differently per seed"
for s in seed1001 seed2002; do
  echo -n "  $s grant_access: "
  objdump -d "$B/access_$s" 2>/dev/null | awk '/<grant_access>:/{a=1;next} /^$/{a=0} a{n++} END{printf "%d instructions\n", n}'
done
line; echo "Result: diversification does not break the STRENGTH of obfuscation, it breaks its SCALABILITY (week 9 Rule 2)."
