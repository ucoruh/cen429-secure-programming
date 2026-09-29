#!/bin/sh
# CEN429 - Week 14 - Demo 1: source-to-source obfuscation pipeline (Tigress)
# Build first: ../../build.sh   Then: sh demo.sh
# SAFE: only creates/reads files inside this folder; no network/system operation.
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/source" ] || { echo "Build first: ../../build.sh"; exit 1; }
CC=${CC:-cc}
command -v "$CC" >/dev/null 2>&1 || CC=gcc
PY=${PY:-python3}
command -v "$PY" >/dev/null 2>&1 || PY=py
line() { echo "--------------------------------------------------------------"; }

line; echo "STEP 1 - Baseline: the plain, already-built program"
"./$B/source" CEN429-OK
"./$B/source" wrong

line
if command -v tigress >/dev/null 2>&1; then
  echo "STEP 2 - Tigress FOUND: running the real transform pipeline"
  echo "\$ tigress --Transform=EncodeLiterals --Transform=AddOpaque --Functions=grant_access \\"
  echo "          --Seed=1001 --out=variant_1001.c source.c"
  tigress --Environment=x86_64:Linux:Gcc:11 \
          --Transform=EncodeLiterals --Functions=grant_access \
          --Transform=AddOpaque --Functions=grant_access --AddOpaqueKinds=call \
          --Seed=1001 --out=variant_1001.c source.c
  tigress --Environment=x86_64:Linux:Gcc:11 \
          --Transform=EncodeLiterals --Functions=grant_access \
          --Transform=AddOpaque --Functions=grant_access --AddOpaqueKinds=call \
          --Seed=2002 --out=variant_2002.c source.c
else
  echo "STEP 2 - Tigress NOT installed."
  echo "  Download it from the official site: https://tigress.wtf"
  echo "  License: free for non-profit (academic) use; commercial use needs a University of Arizona license."
  echo "  Once 'tigress' is on PATH, this script uses it automatically."
  echo "  Using the DOCUMENTED LOCAL FALLBACK instead (see fallback_transform.py's docstring):"
  "$PY" fallback_transform.py source.c variant_1001.c --seed 1001
  "$PY" fallback_transform.py source.c variant_2002.c --seed 2002
fi

line; echo "STEP 3 - Behavior preserved? (compile both variants, compare against the baseline)"
"$CC" -O2 -o variant_1001 variant_1001.c && "$CC" -O2 -o variant_2002 variant_2002.c
for tok in CEN429-OK wrong; do
  a=$("./$B/source" "$tok"); b=$(./variant_1001 "$tok"); c=$(./variant_2002 "$tok")
  if [ "$a" = "$b" ] && [ "$a" = "$c" ]; then
    echo "  token=\"$tok\": all three agree -> $a"
  else
    echo "  token=\"$tok\": MISMATCH original=[$a] seed1001=[$b] seed2002=[$c]"
  fi
done

line; echo "STEP 4 - Cost: instructions/branches in grant_access() alone (objdump)"
cost() {
  objdump -d "$1" 2>/dev/null | awk '/<grant_access>:/{a=1;next} /^$/{a=0} a{n++; if($0 ~ /\t(j|call)/)b++} END{printf "%d instructions, %d jumps/calls", n, b}'
}
echo "  original  : $(cost "$B/source")"
echo "  seed 1001 : $(cost variant_1001)"
echo "  seed 2002 : $(cost variant_2002)"

line; echo "STEP 5 - Diversification: same source, two seeds, different binaries"
if cmp -s variant_1001 variant_2002; then
  echo "  -> Binaries are identical (unexpected)."
else
  diffcount=$(cmp -l variant_1001 variant_2002 2>/dev/null | wc -l)
  echo "  -> Binaries are DIFFERENT: ~$diffcount bytes apart, same behavior. A patch written into one copy does not work on the other."
fi

line; echo "Rule: obfuscation does not change behavior, it raises cost; diversify the result, then measure both."
echo "See also: week-09/01-manual-obfuscation (the same idea applied BY HAND, no tool)."
rm -f variant_1001.c variant_2002.c variant_1001 variant_2002 variant_1001.exe variant_2002.exe 2>/dev/null
