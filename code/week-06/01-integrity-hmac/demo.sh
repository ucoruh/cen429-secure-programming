#!/bin/sh
# CEN429 - Week 6 - Demo 1: Runtime integrity check (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/integrity" ] || { echo "Build first: ../../build.sh"; exit 1; }
rm -rf output && mkdir -p output
line() { echo "--------------------------------------------------------------"; }

line; echo "STEP 1 - The application saves the golden HMAC of its OWN binary"
"$B/integrity" save self output/golden.hmac

line; echo "STEP 2 - Normal run: integrity verifies OK (no patch)"
"$B/integrity" verify self output/golden.hmac && echo "   (exit code 0 - clean)"

line; echo "STEP 3 - Attack: a COPY of the binary is made and 1 byte is changed"
cp "$B/integrity" output/integrity_patched
SIZE=$(wc -c < output/integrity_patched)
OFFSET=$((SIZE / 2))
echo "> flip byte at offset $OFFSET with XOR 0xFF"
printf '\377' | dd of=output/integrity_patched bs=1 seek="$OFFSET" count=1 conv=notrunc status=none 2>/dev/null

line; echo "STEP 4 - The patched copy's HMAC is compared with the golden value"
"$B/integrity" verify output/integrity_patched output/golden.hmac \
    || echo "   (exit code 3 - patch DETECTED)"

line
echo "Note: the HMAC key lives inside the binary; that alone is not enough."
echo "An attacker could patch the checker too. Real RASP: multiple/overlapping"
echo "checkers, a data dependency on the result (Demo 5), server-side attestation."
