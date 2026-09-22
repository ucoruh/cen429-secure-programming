#!/bin/sh
# CEN429 - Hafta 6 - Demo 2: Hata ayiklayici algilama (Linux / WSL)
# Once derleyin: ../../build.sh     Sonra: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/antidebug" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
cizgi() { echo "--------------------------------------------------------------"; }

cizgi; echo "ADIM 1 - Normal calisma (hata ayiklayici YOK): temiz beklenir"
"$B/antidebug" && echo "   (cikis kodu 0 - temiz)"

cizgi; echo "ADIM 2 - gdb altinda calistir (TracerPid > 0 beklenir)"
if command -v gdb >/dev/null 2>&1; then
    # gdb programi izleyerek (ptrace) calistirir; ciktinin ilgili satirlarini gosteriyoruz.
    gdb -batch -nx -ex run -ex quit "$B/antidebug" 2>/dev/null | grep -E "TracerPid|SONUC" \
        || echo "   (gdb ciktisi filtrelenemedi)"
else
    echo "   (gdb kurulu degil: sudo apt install -y gdb)"
    echo "   strace ile de denenebilir: strace -f $B/antidebug"
fi

cizgi
echo "Not: gdb'siz calistirinca TracerPid=0 (temiz), gdb altinda >0 (algilandi)."
echo "Her sinyal atlatilabilir; onemli olan birden cok sinyal + tepki (Demo 8)."
