#!/bin/sh
# CEN429 — Week 2 — Demo 07: mini rule engine (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
# Only reads; sample files are generated under this folder's output/.
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/rule_engine" ] || { echo "Build first: ../../build.sh"; exit 1; }
M="$B/rule_engine"
O=output
line() { echo "--------------------------------------------------------------"; }

mkdir -p "$O"
"$B/rule_samples" "$O" >/dev/null

line; echo "STEP 1 - Rule file: five rules (our own harmless patterns)"
grep '^rule' rules.txt | sed 's/^/    /'

line; echo "STEP 2 - Scan five files with five rules"
"$M" rules.txt "$O/clean.txt" "$O/guide.txt" "$O/capsule.bin" \
     "$O/variant.bin" "$O/notes.txt"

line; echo "STEP 3 - False positive: why did the harmless guide match?"
"$M" -a rules.txt "$O/guide.txt"
echo "   ^ Word_Pair looked at words, not CONTEXT: a FALSE POSITIVE."
echo "     The context-aware rule (Word_Context) did not match the same file."

line; echo "STEP 4 - The modified variant: what did the wildcard (??) buy us?"
"$M" -a rules.txt "$O/variant.bin"
echo "   ^ Capsule_Format missed it (no DECODER:); the wildcard in the hex"
echo "     pattern tolerated the 'BLUE_CATS' separator and caught it."

line; echo "STEP 5 - The rule file is input too: a broken file is rejected"
"$M" broken_rule.txt "$O/clean.txt"
echo "   (exit code $?)"

line; echo "Result: a narrow rule misses things, a broad rule raises false alarms."
