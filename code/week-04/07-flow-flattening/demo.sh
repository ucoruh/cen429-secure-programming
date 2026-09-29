#!/bin/sh
# CEN429 - Week 4 - Demo 7: control-flow flattening and opaque predicates (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/pin_plain" ] || { echo "Build first: ../../build.sh"; exit 1; }
line() { echo "--------------------------------------------------------------"; }

line; echo "STEP 1 - Both versions give the SAME result (correct PIN: 4291)"
for p in 4291 1234 42910; do
    A=$("./$B/pin_plain" "$p"); D=$("./$B/pin_flattened" "$p")
    echo "  PIN $p -> plain: [$A] | flattened: [$D]"
done
line; echo "STEP 2 - CFG difference: pin_verify's machine code (objdump)"
if command -v objdump >/dev/null 2>&1; then
    N1=$(objdump -d "$B/pin_plain"     | awk '/<pin_verify>:/{f=1;next}/^$/{f=0}f' | wc -l)
    N2=$(objdump -d "$B/pin_flattened" | awk '/<pin_verify>:/{f=1;next}/^$/{f=0}f' | wc -l)
    J1=$(objdump -d "$B/pin_plain"     | awk '/<pin_verify>:/{f=1;next}/^$/{f=0}f' | grep -cE '\bjmp|\bje|\bjne')
    J2=$(objdump -d "$B/pin_flattened" | awk '/<pin_verify>:/{f=1;next}/^$/{f=0}f' | grep -cE '\bjmp|\bje|\bjne')
    echo "  PLAIN      : $N1 instructions, $J1 jump(s) (a natural if-chain)"
    echo "  FLATTENED  : $N2 instructions, $J2 jump(s) (a switch-dispatcher loop)"
    echo "  ^ In the flattened version every block passes through the dispatcher; adjacency is gone."
else
    echo "  (objdump not found: sudo apt-get install -y binutils)"
fi
line; echo "STEP 3 - Cost: timing the same work"
"./$B/pin_plain" timing
"./$B/pin_flattened" timing
echo "  ^ Flattening makes reading harder but costs time/code size."
echo "    That is why it is only applied to CRITICAL functions (license/PIN/key checks)."
line; echo "STEP 4 - Opaque predicate: a branch that LOOKS reachable but never is"
echo "\$ ./$B/opaque 4291 7"; "./$B/opaque" 4291 7
echo "\$ ./$B/opaque 0000 -50"; "./$B/opaque" 0000 -50
echo "\$ ./$B/opaque verify"; "./$B/opaque" verify
echo "  ^ The result never depends on x; the decoy branch never printed. That is the predicate:"
echo "    always true (or always false) for every x, but not obvious without the modular-arithmetic fact."
