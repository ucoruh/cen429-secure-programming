#!/bin/sh
# CEN429 - Week 4 - Demo 3: undefined behavior and UBSan (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/ub" ] || { echo "Build first: ../../build.sh"; exit 1; }
RUN="prlimit --core=1:1 timeout 20"
line() { echo "--------------------------------------------------------------"; }

line; echo "STEP 1 - Unprotected: UB 'looks like it works', the result is WRONG"
echo "\$ ./$B/ub overflow 1"
$RUN "./$B/ub" overflow 1
echo "\$ ./$B/ub shift 31"
$RUN "./$B/ub" shift 31
echo "\$ ./$B/ub unaligned"
$RUN "./$B/ub" unaligned
line; echo "STEP 2 - Same code under UBSan (-fsanitize=undefined): the bug IS REPORTED"
if [ -x "$B/ub_ubsan" ]; then
    echo "\$ ./$B/ub_ubsan overflow 1"
    $RUN "./$B/ub_ubsan" overflow 1 2>&1 | grep -i 'runtime error' | head -1
    echo "\$ ./$B/ub_ubsan shift 31"
    $RUN "./$B/ub_ubsan" shift 31 2>&1 | grep -i 'runtime error' | head -1
    echo "\$ ./$B/ub_ubsan unaligned"
    $RUN "./$B/ub_ubsan" unaligned 2>&1 | grep -i 'runtime error' | head -1
else
    echo "   (no UBSan target: -fsanitize=undefined is not supported by this compiler)"
fi
line; echo "STEP 3 - Fixed version: explicit checks (CERT INT32/INT34/EXP36)"
echo "\$ ./$B/ub_secure overflow 1"; "./$B/ub_secure" overflow 1
echo "\$ ./$B/ub_secure shift 31"; "./$B/ub_secure" shift 31
echo "\$ ./$B/ub_secure shift 8"; "./$B/ub_secure" shift 8
echo "\$ ./$B/ub_secure unaligned"; "./$B/ub_secure" unaligned
