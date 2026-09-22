#!/bin/sh
# CEN429 - Hafta 9 - Demo 1: Manuel gizleme ve maliyet olcumu (Linux / WSL)
# Once derleyin: ../../build.sh    Sonra: ./demo.sh
# GUVENLI: yalniz bu klasorde calisir; dosya/ag/sistem islemi yok, kendi kodunu olcer.
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/erisim_temiz" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
JETON="CEN429-OK"     # gecerli sentetik jeton (ikiliye gomulu DEGIL, buradan gecilir)
cizgi() { echo "--------------------------------------------------------------"; }

cizgi; echo "ADIM 1 - Davranis korundu mu? (iki surum ayni cikti)"
echo "\$ erisim_temiz $JETON CEN429-XX kisa"
"$B/erisim_temiz" "$JETON" CEN429-XX kisa
if diff -q "$B/erisim_temiz" "$B/erisim_temiz" >/dev/null 2>&1 && \
   diff <("$B/erisim_temiz" "$JETON" CEN429-XX kisa "") \
        <("$B/erisim_gizli" "$JETON" CEN429-XX kisa "") >/dev/null; then
  echo "  -> Iki surumun ciktisi BIREBIR AYNI. Davranis korundu."
else
  echo "  -> UYARI: ciktilar farkli!"
fi

cizgi; echo "ADIM 2 - Sir 'strings' ile gorunuyor mu?"
echo -n "  temiz: "; strings "$B/erisim_temiz" | grep -q "$JETON" && echo "GORUNUYOR (korumasiz)" || echo "yok"
echo -n "  gizli: "; strings "$B/erisim_gizli" | grep -q "$JETON" && echo "GORUNUYOR" || echo "GORUNMUYOR  <- K-07 dize kodlama"

cizgi; echo "ADIM 3 - Maliyet: yalniz erisim_ver fonksiyonunun makine kodu"
olc() {
  objdump -d "$1" 2>/dev/null | awk '/<erisim_ver>:/{a=1;next} /^$/{a=0} a{n++; if($0 ~ /\t(j|call)/)b++} END{printf "%d komut, %d dal/cagri", n, b}'
}
echo "  temiz erisim_ver: $(olc "$B/erisim_temiz")"
echo "  gizli erisim_ver: $(olc "$B/erisim_gizli")"
echo "  -> Gizli surumde komut ve dal sayisi artar = gizlemenin OLCULEN maliyeti."

cizgi; echo "Sonuc: ayni davranis, sir gizli, maliyet olculdu. Bu tablo projede S9'a girer."
