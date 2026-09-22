#!/bin/sh
# CEN429 — Hafta 2 — Demo 09: Solucan salgin simulasyonu (Linux / WSL)
# Önce derleyin: ../../build.sh     Sonra: sh demo.sh
# Program yalnız hesap yapar; hicbir aga baglanmaz, dosya uretmez.
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/salgin" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
cizgi() { echo "--------------------------------------------------------------"; }

cizgi; echo "SI modeliyle uc yayilma stratejisi karsilastiriliyor"
"$B/salgin"
cizgi
echo "Not: Gercek Slammer ilk dakikadan sonra AG BANT GENISLIGINE"
echo "doydugu icin yavasladi (duyarli makine degil, bant siniri)."
