#!/bin/sh
# CEN429 - Hafta 4 - Demo 3: Tanimsiz davranis ve UBSan (Linux / WSL)
# Once derleyin: ../../build.sh     Sonra: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/ub" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
CALISTIR="prlimit --core=1:1 timeout 20"
cizgi() { echo "--------------------------------------------------------------"; }

cizgi; echo "ADIM 1 - Korumasiz: UB 'calisiyor gibi' gorunur, sonuc YANLIS"
echo "\$ ./$B/ub tasma 1"
$CALISTIR "./$B/ub" tasma 1
echo "\$ ./$B/ub kaydir 31"
$CALISTIR "./$B/ub" kaydir 31
echo "\$ ./$B/ub hizasiz"
$CALISTIR "./$B/ub" hizasiz
cizgi; echo "ADIM 2 - Ayni kod UBSan (-fsanitize=undefined) ile: hata BILDIRILIR"
if [ -x "$B/ub_ubsan" ]; then
    echo "\$ ./$B/ub_ubsan tasma 1"
    $CALISTIR "./$B/ub_ubsan" tasma 1 2>&1 | grep -i 'runtime error' | head -1
    echo "\$ ./$B/ub_ubsan kaydir 31"
    $CALISTIR "./$B/ub_ubsan" kaydir 31 2>&1 | grep -i 'runtime error' | head -1
    echo "\$ ./$B/ub_ubsan hizasiz"
    $CALISTIR "./$B/ub_ubsan" hizasiz 2>&1 | grep -i 'runtime error' | head -1
else
    echo "   (UBSan hedefi yok: bu derleyicide -fsanitize=undefined desteklenmiyor)"
fi
cizgi; echo "ADIM 3 - Duzeltilmis surum: acik denetim (CERT INT32/INT34/EXP36)"
echo "\$ ./$B/ub_guvenli tasma 1"; "./$B/ub_guvenli" tasma 1
echo "\$ ./$B/ub_guvenli kaydir 31"; "./$B/ub_guvenli" kaydir 31
echo "\$ ./$B/ub_guvenli kaydir 8"; "./$B/ub_guvenli" kaydir 8
echo "\$ ./$B/ub_guvenli hizasiz"; "./$B/ub_guvenli" hizasiz
