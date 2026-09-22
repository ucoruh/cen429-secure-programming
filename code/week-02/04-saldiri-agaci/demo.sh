#!/bin/sh
# CEN429 — Hafta 2 — Demo 4: Saldiri agaci maliyet hesaplayici (Linux / WSL)
# Önce derleyin: ../../build.sh     Sonra: sh demo.sh
# Hesap makinesi; hicbir saldiri yapmaz, hicbir dosyaya dokunmaz.
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/agac" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
A="$B/agac"
cizgi() { echo "--------------------------------------------------------------"; }

cizgi; echo "ADIM 1 — Once: bellekteki anahtar en zayif nokta"
"$A" agac-odeme.txt
cizgi; echo "ADIM 2 — Sonra: 'bellekten oku' dalina RASP eklendi"
"$A" agac-savunma.txt
cizgi; echo "ADIM 3 — Cok oznitelikli: maliyet + sure + beceri"
"$A" agac-nitelikli.txt
cizgi; echo "Sonuc: Savunma en ucuz saldiriyi 2 -> 8 birime cikardi."
echo "En zayif nokta artik baska bir dal; savunmaci oraya yonelir."
echo "VE dugumleri saldiriyi pahalilastirir (derinlemesine savunma)."
