#!/bin/sh
# CEN429 — Week 2 — Demo 12: Windows ACE evaluation simulator (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
# The simulator is pure computation; the real-system step only creates a file
# under output/ and READS its permissions. No system setting is touched, no sudo needed.
cd "$(dirname "$0")" || exit 1
B=bin/linux
[ -x "$B/ace" ] || { echo "Build first: ../../build.sh"; exit 1; }
line() { echo "--------------------------------------------------------------"; }

line; echo "STEP 1 - ACE ORDER: the first matching DENY stops the request (the book's example)"
"$B/ace" scenario-1-order.txt

line; echo "STEP 2 - a NULL DACL (every right to everyone) vs an EMPTY DACL (no right to anyone)"
"$B/ace" scenario-2-null-empty.txt

line; echo "STEP 3 - INHERITANCE: explicit ACEs come before inherited ACEs"
"$B/ace" scenario-3-inheritance.txt

line; echo "STEP 4 - the UAC filter (a deny-only group) and integrity levels (MIC)"
"$B/ace" scenario-4-uac-mic.txt

line; echo "STEP 5 - OWNER_RIGHTS and the TAKE_OWNERSHIP privilege"
"$B/ace" scenario-5-owner-privilege.txt

line; echo "STEP 6 - the real system: the same question on Linux (read-only)"
mkdir -p output
echo "sample data" > output/sample.txt
chmod 640 output/sample.txt
echo "\$ id"
id
echo "\$ stat -c '%A %a %U:%G %n' output/sample.txt"
stat -c '%A %a %U:%G %n' output/sample.txt
if command -v getfacl >/dev/null 2>&1; then
    echo "\$ getfacl output/sample.txt"
    getfacl output/sample.txt 2>/dev/null
else
    echo "(getfacl is not installed; to install it: sudo apt install acl)"
fi
echo "   ^ Instead of an 'ACE list', Linux has three classes (owner/group/other);"
echo "     if POSIX ACLs are added, getfacl shows extra lines (see Demo 13)."

line; echo "Result: Windows walks ACEs IN ORDER; a DENY only ever blocks a right"
echo "not yet granted; a NULL DACL opens up to everyone, an EMPTY DACL closes to"
echo "everyone; MIC comes before the DACL; the owner can always change the DACL via WRITE_DAC."
