#!/bin/sh
# CEN429 - Week 4 - Demo 2: use-after-free and double-free (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
# Steps that could crash are bounded with prlimit+timeout; ASan runs add setarch -R.
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/uaf" ] || { echo "Build first: ../../build.sh"; exit 1; }
RUN="prlimit --core=1:1 timeout 20"
ASAN="$RUN setarch $(uname -m) -R"
line() { echo "--------------------------------------------------------------"; }

line; echo "STEP 1 - Unprotected: privilege escalation through use-after-free"
echo "\$ ./$B/uaf uaf"
$RUN "./$B/uaf" uaf 2>&1 || true
echo "   ^ The freed spot was reused by the newly allocated 'admin' object;"
echo "     the dangling pointer now calls the admin panel."
line; echo "STEP 2 - Same code under AddressSanitizer: the bug IS CAUGHT"
echo "\$ ./$B/uaf_asan uaf"
$ASAN "./$B/uaf_asan" uaf 2>&1 \
    | grep -E 'ERROR|heap-use-after-free|freed by|previously|SUMMARY' | head -8 || true
line; echo "STEP 3 - Unprotected: double-free"
echo "\$ ./$B/uaf double"
$RUN "./$B/uaf" double 2>&1 || echo "   (the allocator detected the double-free/corruption and stopped)"
line; echo "STEP 4 - Same code under AddressSanitizer: double-free IS CAUGHT"
echo "\$ ./$B/uaf_asan double"
$ASAN "./$B/uaf_asan" double 2>&1 \
    | grep -E 'ERROR|double-free|SUMMARY' | head -5 || true
line; echo "STEP 5 - Fixed version: free+NULL, ownership, a single free point"
echo "\$ ./$B/uaf_secure uaf ; ./$B/uaf_secure double"
"./$B/uaf_secure" uaf
"./$B/uaf_secure" double
