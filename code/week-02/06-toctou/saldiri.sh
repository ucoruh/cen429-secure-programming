#!/bin/sh
# CEN429 — Hafta 2 — Demo 6: TOCTOU yarışını gösteren saldırı benzetimi
#
# Bu betik YALNIZ bu demo klasöründe çalışır ve yalnız bu klasörde dosya
# oluşturur. Hiçbir sistem dosyasına dokunmaz, yönetici yetkisi istemez.
#
# Kurgu: Program "gunluk.txt"e yazacağını sanıyor. Saldırgan tam denetim ile
# yazma arasında gunluk.txt'i "gizli_hedef.txt"e giden bir sembolik bağa
# çeviriyor. Güvensiz sürüm bağı izleyip yanlış dosyaya yazar; güvenli sürüm
# reddeder.
set -u
cd "$(dirname "$0")" || exit 1   # nereden çağrılırsa çağrılsın yalnız demo klasöründe çalış
KIP="$1"            # guvensiz | guvenli
YAZ="bin/linux/yaz"
[ -x "$YAZ" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
IS="calisma"        # her şey bu alt klasörde
rm -rf "$IS"
mkdir -p "$IS"

echo "iceride onemli veri var" > "$IS/gizli_hedef.txt"
: > "$IS/gunluk.txt"          # başta normal, boş bir günlük dosyası

# Program denetim ile yazma arasında 300 ms bekleyecek; o sırada saldırıyoruz.
export TOCTOU_GECIKME_US=300000

# Programı arka planda başlat
"$YAZ" "$KIP" "$IS/gunluk.txt" "SAHTE-KAYIT-tarafimizca-eklendi" &
PID=$!

# Kısa bir an sonra gunluk.txt'i sembolik bağla değiştir (yarış!)
sleep 0.1
rm -f "$IS/gunluk.txt"
ln -s gizli_hedef.txt "$IS/gunluk.txt"

wait "$PID"

echo "  --- Sonuc: gizli_hedef.txt icerigi ---"
sed 's/^/    /' "$IS/gizli_hedef.txt"
if grep -q "SAHTE-KAYIT" "$IS/gizli_hedef.txt"; then
    echo "  >>> SALDIRI BASARILI: yaziyi baska dosyaya yonlendirdik!"
else
    echo "  >>> Saldiri engellendi: gizli_hedef.txt bozulmadi."
fi
