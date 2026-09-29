#!/bin/sh
# CEN429 - Week 12 - Demo 1: Unit test runner (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/unit_test" ] || { echo "Build first: ../../build.sh"; exit 1; }
line() { echo "--------------------------------------------------------------"; }

line; echo "Running the six test cards for validate_input() and safe_add()"
"$B/unit_test"
echo "   (exit code $? - 0 = every test card PASSED)"

line
echo "Note: the exit code equals the number of FAILED test cards - this is what a CI pipeline"
echo "(and S16, the project's test-plan-and-results deliverable) checks."
