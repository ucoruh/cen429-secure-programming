#!/bin/sh
# CEN429 - Hafta 6 - Demo 6: Bilesen/paket imza dogrulama (Linux / WSL)
# Once derleyin: ../../build.sh     Sonra: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/imza" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
rm -rf cikti && mkdir -p cikti
cizgi() { echo "--------------------------------------------------------------"; }

cizgi; echo "ADIM 1 - Ornek bir 'eklenti modulu' dosyasi olustur"
printf 'SURUM=1.0\nODEME-MODULU\nyetki=onay' > cikti/modul.dat
echo "modul.dat icerigi:"; sed 's/^/   /' cikti/modul.dat; echo

cizgi; echo "ADIM 2 - Uretimde modul imzalanir (ayrik HMAC imzasi)"
"$B/imza" uret cikti/modul.dat cikti/modul.imza

cizgi; echo "ADIM 3 - Yukleme oncesi dogrulama (modul degismedi): TUTAR"
"$B/imza" dogrula cikti/modul.dat cikti/modul.imza && echo "   (cikis kodu 0 - tuttu)"

cizgi; echo "ADIM 4 - Saldiri: modul YENIDEN PAKETLENIR (tek bayt eklenir)"
printf 'X' >> cikti/modul.dat
echo "> modul.dat sonuna 'X' eklendi"
"$B/imza" dogrula cikti/modul.dat cikti/modul.imza \
    || echo "   (cikis kodu 3 - repackaging ALGILANDI)"

cizgi
echo "Not: APK v2/v3 ACIK ANAHTAR (asimetrik) imza kullanir; dogrulayan yalniz acik"
echo "anahtara ihtiyac duyar. Burada ogretim icin paylasilan anahtarli HMAC var;"
echo "asimetrik imza Hafta 10'da. Ilke ayni: yuklemeden once butunluk + kaynak."
