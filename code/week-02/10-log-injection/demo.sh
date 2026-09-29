#!/bin/sh
# CEN429 - Week 2 - Demo 10: log injection (CWE-117) (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
# Only writes under this folder's work/; never touches a system log.
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/logtool" ] || { echo "Build first: ../../build.sh"; exit 1; }
A="$B/logtool"
C=work
rm -rf "$C"; mkdir -p "$C"
line() { echo "--------------------------------------------------------------"; }

echo "Sample inputs (some contain a line ending / control character):"
"$A" generate "$C"
line
echo "STEP 1 - UNSAFE log: the field is written without any check"
"$A" write unsafe "$C/01-normal.bin"    "$C/unsafe.log"
"$A" write unsafe "$C/02-injection.bin" "$C/unsafe.log"
"$A" write unsafe "$C/03-control.bin"   "$C/unsafe.log"
echo "  --- contents of unsafe.log (control characters shown via cat -v):"
cat -v "$C/unsafe.log" | sed 's/^/    /'
line
echo "STEP 2 - Count the forged line:"
"$A" count "$C/unsafe.log"
line
echo "STEP 3 - SAFE log: escaping + a length limit + a fixed format string"
"$A" write safe "$C/01-normal.bin"    "$C/safe.log"
"$A" write safe "$C/02-injection.bin" "$C/safe.log"
"$A" write safe "$C/03-control.bin"   "$C/safe.log"
"$A" write safe "$C/04-too-long.bin"  "$C/safe.log"
echo "  --- contents of safe.log:"
cat -v "$C/safe.log" | sed 's/^/    /'
line
echo "STEP 4 - Count the forged line (safe):"
"$A" count "$C/safe.log"
echo "   ^ The counter still finds the same words -- it only greps text, it"
echo "     does not parse records -- but they now sit INSIDE bob's own single"
echo "     line, escaped. No FIFTH line was created: 4 inputs -> 4 lines."
line
echo "Result: the unsafe version turned 3 inputs into 4 lines (an injection);"
echo "one of those lines is a brand new, standalone, believable admin record."
echo "In the safe version every input is still a SINGLE line (4 in, 4 out);"
echo "CR/LF and ESC were escaped as \\xNN, the long field was truncated, and"
echo "the injected text stays trapped, visibly mangled, inside bob's own line."
