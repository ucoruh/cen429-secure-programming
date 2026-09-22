#!/bin/sh
# CEN429 - Hafta 6 - Demo 8: RASP motoru + tepki politikasi (Linux / WSL)
# Once derleyin: ../../build.sh     Sonra: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/rasp" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
cizgi() { echo "=============================================================="; }

cizgi; echo "SENARYO 1 - Normal: kontroller gecer, cihaz dogru -> sir acilir"
"$B/rasp" normal
cizgi; echo "SENARYO 2 - Tamper: bir kontrol basarisiz -> sil + decoy + bayrak"
"$B/rasp" tamper
cizgi; echo "SENARYO 3 - Baska cihaz: kontroller gecer ama cihaz anahtari tutmaz"
"$B/rasp" baska-cihaz
cizgi
echo "Ders: algilama tek basina yetmez; onemli olan TEPKI politikasidir (sil, decoy,"
echo "bayrak) ve cihaz/surum baglamasi (anahtarlar kopyalansa bile baska cihazda acilmaz)."
