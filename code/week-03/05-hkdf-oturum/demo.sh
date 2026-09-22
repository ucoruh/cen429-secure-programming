#!/bin/sh
# CEN429 - Hafta 3 - Demo 5: HKDF oturum anahtarlari (Linux / WSL)
# Once derleyin: ../../build.sh     Sonra: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/hkdf" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
"$B/hkdf"
