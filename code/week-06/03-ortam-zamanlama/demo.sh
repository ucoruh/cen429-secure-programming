#!/bin/sh
# CEN429 - Hafta 6 - Demo 3: Ortam (VM/emulator) + zamanlama algilama (Linux / WSL)
# Once derleyin: ../../build.sh     Sonra: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/ortam" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
"$B/ortam"
echo "--------------------------------------------------------------"
echo "Deneme: bare-metal Linux'ta hipervizor 'yok', bir VM (VirtualBox/KVM/"
echo "VMware) ya da WSL2 icinde 'VAR' + satici imzasi cikar. Ayni ikili dosya,"
echo "farkli ortamda farkli sonuc: ortam algilamanin ozu budur."
