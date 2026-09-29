#!/bin/sh
# CEN429 - Week 6 - Demo 7: Root/privilege indicator detection (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/privilege" ] || { echo "Build first: ../../build.sh"; exit 1; }
rm -rf output && mkdir -p output
line() { echo "--------------------------------------------------------------"; }

line; echo "STEP 1 - Normal run (not root, no indicator): clean is expected"
"$B/privilege"; echo "   (exit code $?)"

line; echo "STEP 2 - Flagged case: a fake 'su' indicator file is created"
echo "fake root indicator" > output/fake_su
echo "> output/fake_su created; passed in as an extra indicator"
"$B/privilege" output/fake_su || echo "   (exit code 3 - indicator DETECTED)"

line
echo "Try it: sudo is NOT required. For the curious, 'geteuid()==0' only holds"
echo "under real root; this demo changes nothing so it is safe under root too,"
echo "but no demo in this course ever requires root/sudo."
