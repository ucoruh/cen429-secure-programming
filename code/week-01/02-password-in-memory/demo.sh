#!/bin/sh
# CEN429 — Week 1 — Demo 2: Password left in memory (Linux / WSL)
# Build first: ../../build.sh     Then: ./demo.sh
# Starts the program under gdb (no extra permission is needed since gdb is the parent),
# stops it in wait_here(), dumps its memory to the dump/ folder and searches the dump for
# the password. Only produces files inside this folder.
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/password_no_wipe" ] || { echo "Build first: ../../build.sh"; exit 1; }
command -v gdb >/dev/null || { echo "gdb is required: sudo apt install gdb"; exit 1; }
PASSWORD=$(tr -d '\r\n' < password.txt)
mkdir -p dump
line() { echo "--------------------------------------------------------------"; }

dump() {  # $1 = program name
    rm -f "dump/$1.core"
    gdb -q -batch -ex 'set pagination off' -ex 'break wait_here' -ex 'run password.txt' \
        -ex "gcore dump/$1.core" -ex 'kill' "$B/$1" > "dump/$1.gdb.log" 2>&1
    COUNT=$(strings "dump/$1.core" | grep -c -F "$PASSWORD" || true)
    echo "  Memory dump: dump/$1.core ($(wc -c < "dump/$1.core") bytes)"
    if [ "$COUNT" -gt 0 ]; then
        echo "  RESULT: password FOUND in the dump in $COUNT place(s)  ->  $PASSWORD"
    else
        echo "  RESULT: password not found in the dump"
    fi
}

echo "Password file: password.txt  ->  $PASSWORD"
line; echo "STEP 1 - Version that never wipes the password";          dump password_no_wipe
line; echo "STEP 2 - Version that wipes with memset (-O2)";           dump password_memset
line; echo "STEP 3 - Version that wipes with explicit_bzero (-O2)";   dump password_explicit
line; echo "Why? machine code of the log_in() function:"
M=$(objdump -d --no-show-raw-insn "$B/password_memset" | awk '/<log_in>:/,/ret/' | grep -c -E 'memset|rep stos|movaps|movups|pxor' || true)
E=$(objdump -d --no-show-raw-insn "$B/password_explicit" | awk '/<log_in>:/,/ret/' | grep -c 'explicit_bzero' || true)
echo "  number of wipe instructions in the memset version    ->  $M"
echo "  explicit_bzero calls in the explicit version         ->  $E"
echo "  (To see the machine code yourself: objdump -d $B/password_memset | less  and search for log_in)"
