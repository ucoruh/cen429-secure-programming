#!/bin/sh
# CEN429 - Hafta 9 - Demo 2: Cesitlendirme. Once ../../build.sh, sonra ./demo.sh
# GUVENLI: yalniz bu klasorde olcum yapar; dosya/ag/sistem islemi yok.
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/erisim_t1" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
cizgi() { echo "--------------------------------------------------------------"; }

cizgi; echo "ADIM 1 - Davranis: iki tohum ayni sonucu vermeli"
"$B/erisim_t1" CEN429-OK; "$B/erisim_t2" CEN429-OK
"$B/erisim_t1" yanlis;    "$B/erisim_t2" yanlis
[ "$("$B/erisim_t1" CEN429-OK | sed 's/\[tohum [0-9]*\] //')" = \
  "$("$B/erisim_t2" CEN429-OK | sed 's/\[tohum [0-9]*\] //')" ] \
  && echo "  -> Davranis AYNI." || echo "  -> UYARI: davranis farkli!"

cizgi; echo "ADIM 2 - Makine kodu: iki tohum FARKLI ikili uretmeli"
if cmp -s "$B/erisim_t1" "$B/erisim_t2"; then
  echo "  -> Ikililer ayni (beklenmeyen)."
else
  fark=$(cmp -l "$B/erisim_t1" "$B/erisim_t2" 2>/dev/null | wc -l)
  echo "  -> Ikililer FARKLI: ~$fark bayt ayri. Bir kopyaya yazilan yama digerinde calismaz."
fi

cizgi; echo "ADIM 3 - erisim_ver fonksiyonu tohuma gore farkli kodlaniyor"
for t in t1 t2; do
  echo -n "  $t erisim_ver: "
  objdump -d "$B/erisim_$t" 2>/dev/null | awk '/<erisim_ver>:/{a=1;next} /^$/{a=0} a{n++} END{printf "%d komut\n", n}'
done
cizgi; echo "Sonuc: cesitlendirme gizlemenin gucunu degil OLCEKLENMESINI kirar (9. hafta Kural 2)."
