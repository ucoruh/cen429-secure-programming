#!/bin/sh
# CEN429 — Week 1 — Demo 4: Signed length error (Linux / WSL)
# Build first: ../../build.sh     Then: ./demo.sh
# Commands that are expected to crash are only restricted for that one command (no crash
# dump, and there is a time limit).
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/copy" ] || { echo "Build first: ../../build.sh"; exit 1; }
RUN="prlimit --core=1:1 timeout 20"
ASAN="$RUN setarch $(uname -m) -R"
line() { echo "--------------------------------------------------------------"; }

line; echo "STEP 0 - Does the compiler see this bug?"
echo "\$ gcc -Wall -Wextra -fsyntax-only -I../../common copy.c"
gcc -Wall -Wextra -fsyntax-only -I../../common copy.c 2>&1 | grep -E 'warning' | head -3
echo "   -> No warning: -Wall -Wextra never reports this conversion."
echo "\$ gcc -Wsign-conversion -fsyntax-only -I../../common copy.c"
gcc -Wsign-conversion -fsyntax-only -I../../common copy.c 2>&1 | grep -E 'warning' | head -3
line; echo "STEP 1 - Normal use";                              echo "\$ ./$B/copy 8";   "./$B/copy" 8
line; echo "STEP 2 - A length that's too large: the check catches it"; echo "\$ ./$B/copy 100"; "./$B/copy" 100 || true
line; echo "STEP 3 - Attack: a negative length slips past the check"
echo "\$ ./$B/copy -1"
$RUN "./$B/copy" -1; echo "   (exit code: $? -- 139 = memory error, SIGSEGV)"
line; echo "STEP 4 - Same attack, with AddressSanitizer"
echo "\$ ./$B/copy_asan -1"
$ASAN "./$B/copy_asan" -1 2>&1 | grep -E 'ERROR|negative|SUMMARY' || true
line; echo "STEP 5 - The fixed version"
echo "\$ ./$B/copy_secure -1 ; ./$B/copy_secure 12abc ; ./$B/copy_secure 8"
"./$B/copy_secure" -1 || true
"./$B/copy_secure" 12abc || true
"./$B/copy_secure" 8
