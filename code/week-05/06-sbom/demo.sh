#!/bin/sh
# CEN429 - Hafta 5 - Demo 6: SBOM uretimi (Linux / WSL). INDIRME GEREKTIRMEZ.
cd "$(dirname "$0")"
PY=python3
command -v "$PY" >/dev/null 2>&1 || PY=python
command -v "$PY" >/dev/null 2>&1 || { echo "Python 3 gerekli: sudo apt-get install -y python3"; exit 1; }
rm -rf cikti
cizgi() { echo "=============================================================="; }

cizgi; echo "SBOM (CycloneDX 1.5) uretimi ve zafiyet eslestirme"; cizgi
"$PY" sbom.py

echo
echo "Uretilen SBOM JSON'in ilk satirlari (cikti/sbom.cyclonedx.json):"
head -n 20 cikti/sbom.cyclonedx.json | sed 's/^/   /'
