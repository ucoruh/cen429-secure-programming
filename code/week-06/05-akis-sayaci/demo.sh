#!/bin/sh
# CEN429 - Hafta 6 - Demo 5: Kontrol akisi sayaci (Linux / WSL)
# Once derleyin: ../../build.sh     Sonra: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/sayac" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
cizgi() { echo "=============================================================="; }

cizgi; echo "SENARYO 1 - Normal: butun kontrol noktalari sirayla calisir"
"$B/sayac" normal
cizgi; echo "SENARYO 2 - Saldiri: kontroller tamamen ATLANIR"
"$B/sayac" atlat
cizgi; echo "SENARYO 3 - Saldiri: yalniz ilk kontrol calisir (kismi)"
"$B/sayac" kismi
cizgi; echo "SENARYO 4 - Saldiri: kontroller YANLIS SIRADA calisir"
"$B/sayac" sirasiz
cizgi
echo "Ders: tek 'if' yamalanip atlanabilir; ama kritik islem dogru sonucu ancak"
echo "butun kontrollerden SIRAYLA gecilmisse (dogru anahtar zinciri) uretir."
