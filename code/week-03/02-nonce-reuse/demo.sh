#!/bin/sh
# CEN429 - Week 3 - Demo 2: nonce reuse (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/nonce_reuse" ] || { echo "Build first: ../../build.sh"; exit 1; }
"$B/nonce_reuse"
