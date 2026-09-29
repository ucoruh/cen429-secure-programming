#!/bin/sh
# CEN429 — Week 2 — Demo 08: integrity monitoring (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
# Only generates synthetic files under this folder's output/ and looks at them.
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/integrity_monitor" ] || { echo "Build first: ../../build.sh"; exit 1; }
T="$B/integrity_monitor"
K=output/monitored
M=output/manifest.txt
A=output/seal.key
line() { echo "--------------------------------------------------------------"; }

rm -rf output
mkdir -p "$K"
printf 'server=127.0.0.1\nport=8443\nlogging=on\n'                  > "$K/config.conf"
printf 'CEN429 sample library version 1.0\nfunc_a func_b\n'         > "$K/library.bin"
printf 'run: app --secure\n'                                        > "$K/start.txt"
printf 'record 1\nrecord 2\nrecord 3\n'                             > "$K/data.txt"

line; echo "STEP 1 - A baseline while everything is known good (a SHA-256 manifest)"
"$T" create "$K" "$M"

line; echo "STEP 2 - The defender seals the manifest with HMAC (the key lives elsewhere)"
"$T" key "$A"
"$T" seal "$M" "$A"

line; echo "STEP 3 - Verification with nothing changed"
"$T" verify "$K" "$M"

line; echo "STEP 4 - Simulation: an 'attacker' touches the files"
echo "  a line was added to library.bin, data.txt was removed, hidden.bin was dropped"
printf 'func_backdoor\n' >> "$K/library.bin"
rm -f "$K/data.txt"
printf 'a dropped file\n' > "$K/hidden.bin"
"$T" verify "$K" "$M"

line; echo "STEP 5 - To cover their tracks, the attacker rewrites the manifest too"
"$T" create "$K" "$M" >/dev/null
"$T" verify "$K" "$M"
echo "   ^ If the manifest isn't protected, the monitor is FOOLED: everything looks OK."

line; echo "STEP 6 - But the seal (HMAC) cannot be regenerated without the key"
"$T" verify-seal "$M" "$A"

line; echo "Result: the digest catches changes; the expected values need protecting too."
