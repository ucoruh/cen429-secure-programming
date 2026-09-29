#!/bin/sh
# CEN429 - Week 4 - Demo 6: symbol and string leakage (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/secret_exposed" ] || { echo "Build first: ../../build.sh"; exit 1; }
line() { echo "--------------------------------------------------------------"; }

line; echo "STEP 1 - Both versions behave the SAME (correct key: CEN429-LICENSE-2026)"
echo "\$ ./$B/secret_exposed  CEN429-LICENSE-2026"; "./$B/secret_exposed"  CEN429-LICENSE-2026
echo "\$ ./$B/secret_hidden CEN429-LICENSE-2026"; "./$B/secret_hidden" CEN429-LICENSE-2026
line; echo "STEP 2 - Did the secret string leak, according to 'strings'?"
echo "\$ strings ./$B/secret_exposed  | grep -i 'LICENSE\\|LOG'"
strings "$B/secret_exposed"  | grep -iE 'LICENSE|\[LOG\]' | head -4
echo "   ^ In the EXPOSED version the license string and LOG text are VISIBLE."
echo "\$ strings ./$B/secret_hidden | grep -i 'LICENSE\\|LOG'"
strings "$B/secret_hidden" | grep -iE 'LICENSE|\[LOG\]' | head -4 \
    || echo "   (not found -> in the HIDDEN version the string is hidden, LOG was never compiled in)"
line; echo "STEP 3 - Are function names visible with 'nm'?"
echo "\$ nm ./$B/secret_exposed | grep license_verify"
nm "$B/secret_exposed" 2>/dev/null | grep -i 'license_verify\|secret_text' | head -3
echo "\$ nm ./$B/secret_hidden"
nm "$B/secret_hidden" 2>&1 | head -1
echo "   ^ The HIDDEN version is stripped: 'no symbols'. Names give a reverse engineer no hints."
line
echo "Note: -fvisibility=hidden mainly reduces exported symbols in real shared libraries (.so);"
echo "in a plain executable, stripping is where the real win comes from."
