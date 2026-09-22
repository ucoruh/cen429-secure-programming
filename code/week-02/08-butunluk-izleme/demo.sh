#!/bin/sh
# CEN429 — Hafta 2 — Demo 08: Butunluk izleme (Linux / WSL)
# Önce derleyin: ../../build.sh     Sonra: sh demo.sh
# Yalnız bu klasördeki cikti/ altında sentetik dosyalar üretir ve onlara bakar.
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/butunluk_izle" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
T="$B/butunluk_izle"
K=cikti/izlenen
M=cikti/manifest.txt
A=cikti/muhur.anahtar
cizgi() { echo "--------------------------------------------------------------"; }

rm -rf cikti
mkdir -p "$K"
printf 'sunucu=127.0.0.1\nport=8443\nkayit=acik\n'            > "$K/ayar.conf"
printf 'CEN429 ornek kutuphane surum 1.0\nislev_a islev_b\n'  > "$K/kutuphane.bin"
printf 'calistir: uygulama --guvenli\n'                       > "$K/baslat.txt"
printf 'kayit 1\nkayit 2\nkayit 3\n'                          > "$K/veri.txt"

cizgi; echo "ADIM 1 — Bilinen iyi durumda taban cizgisi (SHA-256 manifesti)"
"$T" olustur "$K" "$M"

cizgi; echo "ADIM 2 — Savunmaci manifesti HMAC ile muhurler (anahtar ayri yerde)"
"$T" anahtar "$A"
"$T" muhurle "$M" "$A"

cizgi; echo "ADIM 3 — Hicbir sey degismeden dogrulama"
"$T" dogrula "$K" "$M"

cizgi; echo "ADIM 4 — Benzetim: bir 'saldirgan' dosyalara dokunur"
echo "  kutuphane.bin'e satir eklendi, veri.txt kaldirildi, gizli.bin birakildi"
printf 'islev_arka_kapi\n' >> "$K/kutuphane.bin"
rm -f "$K/veri.txt"
printf 'birakilan dosya\n' > "$K/gizli.bin"
"$T" dogrula "$K" "$M"

cizgi; echo "ADIM 5 — Saldirgan izini ortmek icin manifesti de yeniden yazar"
"$T" olustur "$K" "$M" >/dev/null
"$T" dogrula "$K" "$M"
echo "   ^ Manifest korunmazsa izleyici KANDIRILIR: hepsi TAMAM gorunuyor."

cizgi; echo "ADIM 6 — Ama muhur (HMAC) anahtarsiz yeniden uretilemez"
"$T" muhur-dogrula "$M" "$A"

cizgi; echo "Sonuc: ozet degisikligi yakalar; beklenen degerler de korunmali."
