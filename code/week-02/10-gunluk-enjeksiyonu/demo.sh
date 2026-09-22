#!/bin/sh
# CEN429 - Hafta 2 - Demo 10: Gunluk enjeksiyonu (CWE-117) (Linux / WSL)
# Once derleyin: ../../build.sh     Sonra: sh demo.sh
# Yalniz bu klasordeki calisma/ altina yazar; sistem gunlugune dokunmaz.
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/gunluk" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
A="$B/gunluk"
C=calisma
rm -rf "$C"; mkdir -p "$C"
cizgi() { echo "--------------------------------------------------------------"; }

echo "Ornek girdiler (bir kisminda satir sonu / kontrol karakteri var):"
"$A" uret "$C"
cizgi
echo "ADIM 1 - GUVENSIZ gunluk: alan denetlenmeden yaziliyor"
"$A" yaz guvensiz "$C/01-normal.bin"     "$C/guvensiz.log"
"$A" yaz guvensiz "$C/02-enjeksiyon.bin" "$C/guvensiz.log"
"$A" yaz guvensiz "$C/03-kontrol.bin"    "$C/guvensiz.log"
echo "  --- guvensiz.log icerigi (cat -v ile kontrol karakterleri gorunur):"
cat -v "$C/guvensiz.log" | sed 's/^/    /'
cizgi
echo "ADIM 2 - Sahte satiri say:"
"$A" say "$C/guvensiz.log"
cizgi
echo "ADIM 3 - GUVENLI gunluk: kacislama + sinir + sabit bicim dizgesi"
"$A" yaz guvenli "$C/01-normal.bin"     "$C/guvenli.log"
"$A" yaz guvenli "$C/02-enjeksiyon.bin" "$C/guvenli.log"
"$A" yaz guvenli "$C/03-kontrol.bin"    "$C/guvenli.log"
"$A" yaz guvenli "$C/04-cok-uzun.bin"   "$C/guvenli.log"
echo "  --- guvenli.log icerigi:"
cat -v "$C/guvenli.log" | sed 's/^/    /'
cizgi
echo "ADIM 4 - Sahte satiri say (guvenli):"
"$A" say "$C/guvenli.log"
cizgi
echo "Sonuc: Guvensiz surumde 3 girdi 4 satir uretti (enjeksiyon)."
echo "Guvenli surumde her girdi TEK satir; CR/LF ve ESC \\xNN olarak"
echo "kacislandi, uzun alan kirpildi. Sahte admin satiri uretilmedi."
