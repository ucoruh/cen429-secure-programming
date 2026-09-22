#!/bin/sh
# CEN429 - Hafta 3 - Demo 3: ECB deseni sizdirir (Linux / WSL)
# Once derleyin: ../../build.sh     Sonra: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/ecb" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
"$B/ecb"
