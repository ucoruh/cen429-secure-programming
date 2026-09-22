#!/bin/sh
# CEN429 — Hafta 2 — Demo 2: Entropi olcer (Linux / WSL)
# Önce derleyin: ../../build.sh     Sonra: sh demo.sh
# Program yalnız okur; örnekler yalnız bu klasörde üretilir.
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/entropi" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
E="$B/entropi"
O=cikti
cizgi() { echo "--------------------------------------------------------------"; }

mkdir -p "$O"
"$B/uret" "$O" >/dev/null

cizgi; echo "ADIM 1 — Farkli turde dosyalarin entropisi (0 = tekduze, 8 = rastgele)"
echo "  dosya            bayt     H |0 bit ------------ 8 bit| yorum"
"$E" "$O/tekduze.txt" "$O/belge.txt" "$O/kod.bin" "$O/sifreli.bin" \
     "$O/rastgele.bin"
echo "   ^ Metin dusuk, makine kodu benzeri orta, sifreli/rastgele yuksek."

cizgi; echo "ADIM 2 — Ayni icerik uc halde: duz -> makine-kodu-benzeri -> sifreli"
"$E" "$O/belge.txt" "$O/kod.bin" "$O/sifreli.bin"
echo "   ^ Sifreli ve rastgele veri entropiye bakarak AYIRT EDILEMEZ."

cizgi; echo "ADIM 3 — Karma dosya: metnin ortasina sifreli bir bolum gizlenmis"
"$E" -p 512 "$O/karma.bin"
echo "   ^ Paketlenmis programlarda da boyle bir 'sicak bolge' gorulur:"
echo "     kucuk acici kod + yuksek entropili sifreli govde."

cizgi; echo "ADIM 4 — Fidye yazilimi belirtisi: dosya yerinde sifrelenince"
printf '  once : '; "$E" "$O/belge.txt"   | sed 's/^ *//'
printf '  sonra: '; "$E" "$O/sifreli.bin" | sed 's/^ *//'
echo "   ^ Bir surec kisa surede cok sayida dosyada bu sicramayi"
echo "     yapiyorsa davranis tabanli koruma alarm verir."
