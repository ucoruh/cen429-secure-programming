#!/bin/sh
# CEN429 - Week 2 - Demo 11: a tamper-evident log (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
# Only writes under this folder's work/.
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/log_chain" ] || { echo "Build first: ../../build.sh"; exit 1; }
A="$B/log_chain"
C=work
rm -rf "$C"; mkdir -p "$C/evolve" "$C/static"
line() { echo "--------------------------------------------------------------"; }
LOGE="$C/evolve/access.auditlog";  KE="$C/evolve/verifier.key"
STOLEN_E="$C/evolve/stolen.key"
LOGS="$C/static/access.auditlog";  KS="$C/static/verifier.key"
STOLEN_S="$C/static/stolen.key"

echo "STEP 1 - Generate two logs: key EVOLUTION and STATIC"
"$A" generate "$C/evolve"  evolve
"$A" generate "$C/static" static
line; echo "STEP 2 - Verify the sound log (evolve):"
"$A" verify "$LOGE" "$KE"
line; echo "STEP 3 - Raw tampering: change seq=4's message (the MAC is left stale)"
"$A" modify "$LOGE" 4 "payment approved amount=9999"
"$A" verify "$LOGE" "$KE"
echo "  (regenerating and continuing)"; "$A" generate "$C/evolve" evolve >/dev/null
line; echo "STEP 4 - DELETING a record: seq=5 is deleted"
"$A" delete  "$LOGE" 5
"$A" verify "$LOGE" "$KE"
"$A" generate "$C/evolve" evolve >/dev/null
line; echo "STEP 5 - REORDERING: seq=2 and seq=3 swap places"
"$A" swap    "$LOGE" 2 3
"$A" verify "$LOGE" "$KE"
"$A" generate "$C/evolve" evolve >/dev/null
line
echo "STEP 6 - CAPTURE: the attacker tries to rewrite history"
echo "  6a) EVOLVE mode: the attacker only knows the CURRENT key (K_N)"
"$A" forge "$LOGE" 2 "card loaded card=FORGED" "$STOLEN_E"
"$A" verify "$LOGE" "$KE"
echo "  6b) STATIC mode: the single key never changed (K_N == K_0)"
"$A" forge "$LOGS" 2 "card loaded card=FORGED" "$STOLEN_S"
"$A" verify "$LOGS" "$KS"
line
echo "Lesson: the digest chain catches modification/deletion/reordering. Key"
echo "evolution also protects the records BEFORE the capture: the attacker"
echo "cannot compute the old key backwards, so they cannot rewrite history (6a)."
echo "With a static key, history CAN be rewritten and it is NOT CAUGHT (6b)."
