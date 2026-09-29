#!/bin/sh
# CEN429 - Week 10 - Demo 4: PKCS#7 padding (Linux / WSL / Git Bash)
cd "$(dirname "$0")"
PY=python3
command -v "$PY" >/dev/null 2>&1 || PY=python
command -v "$PY" >/dev/null 2>&1 || { echo "Python 3 not found."; exit 1; }
"$PY" pkcs7.py
