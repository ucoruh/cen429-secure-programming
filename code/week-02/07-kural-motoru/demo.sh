#!/bin/sh
# CEN429 — Hafta 2 — Demo 07: Mini kural motoru (Linux / WSL)
# Önce derleyin: ../../build.sh     Sonra: sh demo.sh
# Yalnız okur; örnek dosyalar bu klasördeki cikti/ altında üretilir.
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/kural_motoru" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
M="$B/kural_motoru"
O=cikti
cizgi() { echo "--------------------------------------------------------------"; }

mkdir -p "$O"
"$B/kural_ornek" "$O" >/dev/null

cizgi; echo "ADIM 1 — Kural dosyasi: bes kural (kendi zararsiz desenlerimiz)"
grep '^kural' kurallar.txt | sed 's/^/    /'

cizgi; echo "ADIM 2 — Bes dosyayi bes kuralla tara"
"$M" kurallar.txt "$O/temiz.txt" "$O/kilavuz.txt" "$O/kapsul.bin" \
     "$O/varyant.bin" "$O/notlar.txt"

cizgi; echo "ADIM 3 — Yanlis pozitif: zararsiz kilavuz neden eslesti?"
"$M" -a kurallar.txt "$O/kilavuz.txt"
echo "   ^ Kelime_Cifti kelimelere bakti, BAGLAMA bakmadi: YANLIS POZITIF."
echo "     Baglamli kural (Kelime_Baglam) ayni dosyada eslesmedi."

cizgi; echo "ADIM 4 — Degistirilmis varyant: joker (??) ne kazandirdi?"
"$M" -a kurallar.txt "$O/varyant.bin"
echo "   ^ Kapsul_Bicimi kacirdi (COZUCU: yok); hex desendeki joker"
echo "     'MAVI_KEDI' ayracini tolere edip yakaladi."

cizgi; echo "ADIM 5 — Kural dosyasi da girdidir: bozuk dosya reddedilir"
"$M" bozuk_kural.txt "$O/temiz.txt"
echo "   (cikis kodu $?)"

cizgi; echo "Sonuc: dar kural kacirir, genis kural yanlis alarm verir."
