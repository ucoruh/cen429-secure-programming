#!/bin/sh
# CEN429 — Hafta 2 — Demo 14: RBAC + gorev ayriligi + Clark-Wilson (Linux / WSL)
# Önce derleyin: ../../build.sh     Sonra: sh demo.sh
# Simulator; hicbir dosyaya, aga ya da sistem ayarina dokunmaz.
cd "$(dirname "$0")" || exit 1
B=bin/linux
[ -x "$B/banka" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
cizgi() { echo "--------------------------------------------------------------"; }

cizgi; echo "Senaryo: senaryo.txt (roller, kisitlar, TP'ler ve adimlar)"
"$B/banka" senaryo.txt

cizgi; echo "Sonuc: RBAC 'kim hangi islemi' der; Clark-Wilson 'veriye yalniz"
echo "sertifikali islemle dokun, dis girdiyi dogrula, her seyi deftere yaz,"
echo "gorevleri ayir' der. Hatali ama sertifikali bir TP'yi E-kurallari"
echo "durduramaz; onu IVP (butunluk dogrulama) yakalar."
