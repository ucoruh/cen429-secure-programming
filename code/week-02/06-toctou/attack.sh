#!/bin/sh
# CEN429 — Week 2 — Demo 6: an attack simulation showing the TOCTOU race
#
# This script runs ONLY inside this demo folder and only creates files
# inside this folder. It touches no system file and needs no administrator
# privilege.
#
# Setup: the program thinks it will write to "log.txt". Between the check
# and the write, the attacker turns log.txt into a symbolic link pointing at
# "secret_target.txt". The unsafe version follows the link and writes to the
# wrong file; the safe version refuses.
set -u
cd "$(dirname "$0")" || exit 1   # always run inside the demo folder, no matter where it's called from
MODE="$1"            # unsafe | safe
WRITER="bin/linux/logwriter"
[ -x "$WRITER" ] || { echo "Build first: ../../build.sh"; exit 1; }
WORK="work"        # everything happens in this subfolder
rm -rf "$WORK"
mkdir -p "$WORK"

echo "important data lives in here" > "$WORK/secret_target.txt"
: > "$WORK/log.txt"          # starts out as a normal, empty log file

# The program will wait 300 ms between the check and the write; we attack during that window.
export TOCTOU_DELAY_US=300000

# Start the program in the background
"$WRITER" "$MODE" "$WORK/log.txt" "FORGED-RECORD-added-by-us" &
PID=$!

# A moment later, replace log.txt with a symbolic link (the race!)
sleep 0.1
rm -f "$WORK/log.txt"
ln -s secret_target.txt "$WORK/log.txt"

wait "$PID"

echo "  --- Result: contents of secret_target.txt ---"
sed 's/^/    /' "$WORK/secret_target.txt"
if grep -q "FORGED-RECORD" "$WORK/secret_target.txt"; then
    echo "  >>> ATTACK SUCCEEDED: we redirected the write to another file!"
else
    echo "  >>> Attack blocked: secret_target.txt was not corrupted."
fi
