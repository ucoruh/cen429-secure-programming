#!/bin/sh
# CEN429 — Hafta 2 — Demo 5: CVSS v3.1 taban puan hesaplayici (Linux / WSL)
# Derleme gerekmez; Python 3.8+ yeterlidir.  Calistirma: sh demo.sh
cd "$(dirname "$0")"
PY=python3
command -v "$PY" >/dev/null || PY=python
command -v "$PY" >/dev/null || { echo "Python 3 gerekli: sudo apt install python3"; exit 1; }
cizgi() { echo "--------------------------------------------------------------"; }

cizgi; echo "ADIM 1 — Hazir zafiyet vektorlerini puanla"
"$PY" cvss.py --ornekler
cizgi; echo "ADIM 2 — Tek bir vektoru elle puanla"
echo "\$ python3 cvss.py CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
"$PY" cvss.py "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
cizgi; echo "ADIM 3 — Dogrulama: FIRST v3.1 belgesindeki puanlarla karsilastir"
"$PY" test_cvss.py
cizgi; echo "Sonuc: Ayni acik, kimlik/etkilesim/kapsam degisince farkli puan alir."
echo "Puan onceligi verir; ama baglami (varliginiz) siz eklersiniz."
