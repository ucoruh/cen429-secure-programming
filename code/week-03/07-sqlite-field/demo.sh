#!/bin/sh
# CEN429 - Week 3 - Demo 7: SQLite field encryption (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/sqlite_field" ] || { echo "Build first: ../../build.sh"; exit 1; }
rm -rf output && mkdir -p output
# Synthetic 32-byte key (fixed for the demo; in reality it would come from a KDF).
KEY=000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f
BAD=ff0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f
line() { echo "--------------------------------------------------------------"; }

line; echo "STEP 1 - Set up the database (the sensitive field is encrypted)"
SIM_KEY=$KEY "$B/sqlite_field" create output/customers.db

line; echo "STEP 2 - An attacker stole the DB file and opens it with sqlite3:"
echo "> sqlite3 output/customers.db 'SELECT id, name, hex(card_encrypted) ...'"
if command -v sqlite3 >/dev/null 2>&1; then
    sqlite3 output/customers.db \
      'SELECT id, name, hex(card_encrypted) FROM customer;' | sed 's/^/   /'
else
    echo "   (the sqlite3 tool is not installed: sudo apt-get install -y sqlite3)"
fi
echo "   ^ The card field is only a ciphertext blob; there is no key here."

line; echo "STEP 3 - The application reads with the correct key (decrypt and verify):"
SIM_KEY=$KEY "$B/sqlite_field" read output/customers.db | sed 's/^/   /'

line; echo "STEP 4 - A read attempt with the WRONG key (the GCM tag will not match):"
SIM_KEY=$BAD "$B/sqlite_field" read output/customers.db | sed 's/^/   /'
