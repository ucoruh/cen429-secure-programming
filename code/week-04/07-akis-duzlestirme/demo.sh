#!/bin/sh
# CEN429 - Hafta 4 - Demo 7: Kontrol akisi duzlestirme (Linux / WSL)
# Once derleyin: ../../build.sh     Sonra: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/pin_duz_degil" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
cizgi() { echo "--------------------------------------------------------------"; }

cizgi; echo "ADIM 1 - Iki surum de AYNI sonucu verir (dogru PIN: 4291)"
for p in 4291 1234 42910; do
    A=$("./$B/pin_duz_degil" "$p"); D=$("./$B/pin_duz" "$p")
    echo "  PIN $p -> duz: [$A] | duzlestirilmis: [$D]"
done
cizgi; echo "ADIM 2 - CFG farki: pin_dogrula'nin makine kodu (objdump)"
if command -v objdump >/dev/null 2>&1; then
    N1=$(objdump -d "$B/pin_duz_degil" | awk '/<pin_dogrula>:/{f=1;next}/^$/{f=0}f' | wc -l)
    N2=$(objdump -d "$B/pin_duz"       | awk '/<pin_dogrula>:/{f=1;next}/^$/{f=0}f' | wc -l)
    J1=$(objdump -d "$B/pin_duz_degil" | awk '/<pin_dogrula>:/{f=1;next}/^$/{f=0}f' | grep -cE '\bjmp|\bje|\bjne')
    J2=$(objdump -d "$B/pin_duz"       | awk '/<pin_dogrula>:/{f=1;next}/^$/{f=0}f' | grep -cE '\bjmp|\bje|\bjne')
    echo "  DUZ surum      : $N1 komut, $J1 atlama (dogal if-zinciri)"
    echo "  DUZLESTIRILMIS : $N2 komut, $J2 atlama (switch-dagitici dongusu)"
    echo "  ^ Duzlestirilmis surumde bloklar dagiticidan gecer; komsuluk kaybolur."
else
    echo "  (objdump yok: sudo apt-get install -y binutils)"
fi
cizgi; echo "ADIM 3 - Maliyet: ayni isin suresi"
"./$B/pin_duz_degil" sure
"./$B/pin_duz" sure
echo "  ^ Duzlestirme okumayi zorlastirir ama sure/kod boyutu maliyeti getirir."
echo "    Bu yuzden yalniz KRITIK fonksiyonlara uygulanir (lisans/PIN/anahtar)."
