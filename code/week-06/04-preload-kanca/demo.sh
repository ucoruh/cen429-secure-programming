#!/bin/sh
# CEN429 - Hafta 6 - Demo 4: LD_PRELOAD / kanca algilama (Linux / WSL)
# Once derleyin: ../../build.sh     Sonra: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/kanca_ana" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
HOOK="$B/libsahtekanca.so"
cizgi() { echo "--------------------------------------------------------------"; }

cizgi; echo "ADIM 1 - Normal calisma (LD_PRELOAD yok): temiz beklenir"
"$B/kanca_ana" && echo "   (cikis kodu 0 - temiz)"

cizgi; echo "ADIM 2 - Saldiri: sahte kanca LD_PRELOAD ile YALNIZ bu surece yukleniyor"
if [ -f "$HOOK" ]; then
    echo "> LD_PRELOAD=$HOOK $B/kanca_ana"
    LD_PRELOAD="$HOOK" "$B/kanca_ana" || echo "   (cikis kodu 3 - kanca ALGILANDI)"
else
    echo "   (libsahtekanca.so yok; ../../build.sh calistirin)"
fi

cizgi
echo "Dikkat: LD_PRELOAD yalniz yukaridaki tek komutu etkiler; kabuk ortamina"
echo "ya da sisteme kalici bir sey yazilmaz. time() sahte deger dondurdu ve"
echo "dladdr fonksiyonun libc yerine libsahtekanca.so'dan geldigini gosterdi."
