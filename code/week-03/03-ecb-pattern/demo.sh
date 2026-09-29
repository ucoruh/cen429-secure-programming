#!/bin/sh
# CEN429 - Week 3 - Demo 3: ECB mode leaks patterns (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/ecb_pattern" ] || { echo "Build first: ../../build.sh"; exit 1; }
"$B/ecb_pattern"
