#!/bin/sh
# CEN429 - Week 5 - Demo 6: SBOM generation (Linux / WSL). NO DOWNLOAD REQUIRED.
cd "$(dirname "$0")"
PY=python3
command -v "$PY" >/dev/null 2>&1 || PY=python
command -v "$PY" >/dev/null 2>&1 || { echo "Python 3 is required: sudo apt-get install -y python3"; exit 1; }
rm -rf output
line() { echo "=============================================================="; }

line; echo "SBOM (CycloneDX 1.5) generation and vulnerability matching"; line
"$PY" sbom.py

echo
echo "First lines of the generated SBOM JSON (output/sbom.cyclonedx.json):"
head -n 20 output/sbom.cyclonedx.json | sed 's/^/   /'
