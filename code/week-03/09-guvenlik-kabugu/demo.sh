#!/bin/sh
# CEN429 - Hafta 3 - Demo 9: Guvenlik kabuklari (Linux / WSL)
# Once derleyin: ../../build.sh     Sonra: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/kabuk" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
"$B/kabuk"
