#!/bin/sh
# CEN429 - Hafta 3 - Demo 7: SQLite alan sifreleme (Linux / WSL)
# Once derleyin: ../../build.sh     Sonra: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/sqlite_alan" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
rm -rf cikti && mkdir -p cikti
# Sentetik 32 baytlik anahtar (demo icin sabit; gercekte KDF'den gelir).
AN=000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f
KOTU=ff0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f
cizgi() { echo "--------------------------------------------------------------"; }

cizgi; echo "ADIM 1 - Veritabanini kur (hassas alan sifreli)"
SIM_ANAHTAR=$AN "$B/sqlite_alan" olustur cikti/musteri.db

cizgi; echo "ADIM 2 - Saldirgan DB dosyasini caldi ve sqlite3 ile aciyor:"
echo "> sqlite3 cikti/musteri.db 'SELECT id, ad, hex(kart_sifreli) ...'"
if command -v sqlite3 >/dev/null 2>&1; then
    sqlite3 cikti/musteri.db \
      'SELECT id, ad, hex(kart_sifreli) FROM musteri;' | sed 's/^/   /'
else
    echo "   (sqlite3 araci yok: sudo apt-get install -y sqlite3)"
fi
echo "   ^ Kart alani yalniz sifreli bayt yigini; anahtar yok."

cizgi; echo "ADIM 3 - Dogru anahtarla uygulama okuyor (coz ve dogrula):"
SIM_ANAHTAR=$AN "$B/sqlite_alan" oku cikti/musteri.db | sed 's/^/   /'

cizgi; echo "ADIM 4 - YANLIS anahtarla okuma denemesi (GCM etiketi tutmaz):"
SIM_ANAHTAR=$KOTU "$B/sqlite_alan" oku cikti/musteri.db | sed 's/^/   /'
