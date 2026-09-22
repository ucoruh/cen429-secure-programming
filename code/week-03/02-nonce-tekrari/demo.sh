#!/bin/sh
# CEN429 - Hafta 3 - Demo 2: Nonce yeniden kullanimi (Linux / WSL)
# Once derleyin: ../../build.sh     Sonra: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/nonce" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
"$B/nonce"
