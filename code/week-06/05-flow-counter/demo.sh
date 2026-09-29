#!/bin/sh
# CEN429 - Week 6 - Demo 5: Control-flow counter (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/flow_counter" ] || { echo "Build first: ../../build.sh"; exit 1; }
line() { echo "=============================================================="; }

line; echo "SCENARIO 1 - Normal: every checkpoint runs in order"
"$B/flow_counter" normal
line; echo "SCENARIO 2 - Attack: the checks are SKIPPED entirely"
"$B/flow_counter" skip
line; echo "SCENARIO 3 - Attack: only the first check runs (partial)"
"$B/flow_counter" partial
line; echo "SCENARIO 4 - Attack: the checks run in the WRONG ORDER"
"$B/flow_counter" reorder
line
echo "Lesson: a single 'if' can be patched and skipped; but the critical operation"
echo "only produces the right result when every check was passed IN ORDER (the"
echo "correct key chain)."
