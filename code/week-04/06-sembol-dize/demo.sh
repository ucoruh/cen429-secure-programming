#!/bin/sh
# CEN429 - Hafta 4 - Demo 6: Sembol ve dize sizintisi (Linux / WSL)
# Once derleyin: ../../build.sh     Sonra: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/gizli_acik" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
cizgi() { echo "--------------------------------------------------------------"; }

cizgi; echo "ADIM 1 - Iki surum de AYNI calisir (dogru anahtar: CEN429-LISANS-2026)"
echo "\$ ./$B/gizli_acik  CEN429-LISANS-2026"; "./$B/gizli_acik"  CEN429-LISANS-2026
echo "\$ ./$B/gizli_kapali CEN429-LISANS-2026"; "./$B/gizli_kapali" CEN429-LISANS-2026
cizgi; echo "ADIM 2 - 'strings' ile gizli dize sizdi mi?"
echo "\$ strings ./$B/gizli_acik  | grep -i 'LISANS\\|LOG'"
strings "$B/gizli_acik"  | grep -iE 'LISANS|\[LOG\]' | head -4
echo "   ^ ACIK surumde lisans dizesi ve LOG metinleri GORUNUYOR."
echo "\$ strings ./$B/gizli_kapali | grep -i 'LISANS\\|LOG'"
strings "$B/gizli_kapali" | grep -iE 'LISANS|\[LOG\]' | head -4 \
    || echo "   (bulunamadi -> KAPALI surumde dize gizli, LOG derlenmemis)"
cizgi; echo "ADIM 3 - 'nm' ile fonksiyon adlari gorunur mu?"
echo "\$ nm ./$B/gizli_acik | grep lisans_dogrula"
nm "$B/gizli_acik" 2>/dev/null | grep -i 'lisans_dogrula\|gizli_metin' | head -3
echo "\$ nm ./$B/gizli_kapali"
nm "$B/gizli_kapali" 2>&1 | head -1
echo "   ^ KAPALI surum strip'li: 'no symbols'. Adlar tersine muhendise ipucu vermez."
cizgi
echo "Not: -fvisibility=hidden asil paylasilan kutuphanelerde (.so) disa acilan"
echo "sembolleri azaltir; calistirilabilir dosyada asil kazanc strip'tir."
