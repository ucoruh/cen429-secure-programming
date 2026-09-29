#!/bin/sh
# CEN429 - Week 3 - Demo 5: HKDF session keys (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/hkdf_session" ] || { echo "Build first: ../../build.sh"; exit 1; }
"$B/hkdf_session"
