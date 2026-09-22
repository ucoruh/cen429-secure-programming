#!/bin/sh
# CEN429 — Hafta 1 — Demo 1: PATH ile kandırma (Linux / WSL)
# Önce derleyin: ../../build.sh     Sonra: ./demo.sh
# Yalnız bu klasörde çalışır; sistem ayarlarına dokunmaz.
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/rapor" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
chmod +x sahte/date
cizgi() { echo "--------------------------------------------------------------"; }

cizgi; echo "ADIM 1 — Normal calisma: program gercek date'i buluyor"
echo "\$ ./$B/rapor"
"./$B/rapor"

cizgi; echo "ADIM 2 — Saldiri: PATH'in basina sahte/ klasoru ekleniyor"
echo "\$ PATH=\"\$PWD/sahte:\$PATH\" ./$B/rapor"
PATH="$PWD/sahte:$PATH" "./$B/rapor"

cizgi; echo "ADIM 3 — Duzeltilmis surum ayni saldiri altinda"
echo "\$ PATH=\"\$PWD/sahte:\$PATH\" ./$B/rapor_guvenli"
PATH="$PWD/sahte:$PATH" "./$B/rapor_guvenli"

cizgi; echo "Sonuc: guvenli surum mutlak yol + kabuksuz calistirma + temiz ortam kullaniyor."
