#!/bin/sh
# CEN429 - Week 3 - Demo 9: security layers (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/security_layers" ] || { echo "Build first: ../../build.sh"; exit 1; }
"$B/security_layers"
