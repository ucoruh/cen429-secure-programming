#!/bin/sh
# CEN429 — Week 1 — Demo 1: PATH spoofing (Linux / WSL)
# Build first: ../../build.sh     Then: ./demo.sh
# Only works inside this folder; does not touch system settings.
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/report" ] || { echo "Build first: ../../build.sh"; exit 1; }
chmod +x fake/date
line() { echo "--------------------------------------------------------------"; }

line; echo "STEP 1 - Normal run: the program finds the real date"
echo "\$ ./$B/report"
"./$B/report"

line; echo "STEP 2 - Attack: the fake/ folder is added to the front of PATH"
echo "\$ PATH=\"\$PWD/fake:\$PATH\" ./$B/report"
PATH="$PWD/fake:$PATH" "./$B/report"

line; echo "STEP 3 - The fixed version under the same attack"
echo "\$ PATH=\"\$PWD/fake:\$PATH\" ./$B/report_secure"
PATH="$PWD/fake:$PATH" "./$B/report_secure"

line; echo "Result: the secure version uses an absolute path + shell-less launch + a clean environment."
