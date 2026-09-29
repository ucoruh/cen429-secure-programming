#!/bin/sh
# CEN429 - Week 3 - Demo 8: data in use - secure wiping (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/memory_wipe" ] || { echo "Build first: ../../build.sh"; exit 1; }
"$B/memory_wipe"
echo "--------------------------------------------------------------"
echo "crypto_wipe() compiles to a real call in the machine code; unlike"
echo "memset it cannot be removed as a \"dead store\":"
if command -v objdump >/dev/null 2>&1; then
    N=$(objdump -d --no-show-raw-insn "$B/memory_wipe" 2>/dev/null \
        | grep -c -E 'call.*OPENSSL_cleanse|jmp.*OPENSSL_cleanse' || true)
    echo "  OPENSSL_cleanse call count -> $N"
else
    echo "  (objdump not found: sudo apt-get install -y binutils)"
fi
