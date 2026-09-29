#!/bin/sh
# CEN429 - Week 3 - Demo 4: deriving a key from a password (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/password_to_key" ] || { echo "Build first: ../../build.sh"; exit 1; }
"$B/password_to_key"
echo "=============================================================="
echo "3) Comparing with Argon2id (if the argon2 tool is installed)"
if command -v argon2 >/dev/null 2>&1; then
    echo "> echo -n 'dog123' | argon2 <salt> -id -t 3 -m 16 -p 1 -l 32"
    printf 'dog123' | argon2 saltABCDEFGH -id -t 3 -m 16 -p 1 -l 32 \
        | sed 's/^/   /'
    echo "   ^ Argon2id also demands MEMORY cost (-m); this makes brute"
    echo "     force with a GPU/ASIC harder than PBKDF2."
else
    echo "   (the argon2 tool is not installed: sudo apt-get install -y argon2)"
fi
