#!/bin/sh
# CEN429 - Hafta 5 - Demo 4: Bytecode ve decompile (Linux / WSL).
# INDIRME GEREKTIRMEZ; yalnizca JDK'nin javac ve javap araclari kullanilir.
cd "$(dirname "$0")"
if ! command -v javac >/dev/null 2>&1; then
    echo "JDK bulunamadi (javac yok)."
    echo "Kurulum: sudo apt-get install -y openjdk-17-jdk-headless"
    exit 1
fi
cizgi() { echo "=============================================================="; }
mkdir -p bin
javac --release 17 -d bin LisansDenetimi.java || { echo "Derleme hatasi"; exit 1; }

cizgi; echo "ADIM 1 - Program normal calisiyor (yanlis PIN ile)"; cizgi
java -cp bin LisansDenetimi 1234

cizgi; echo "ADIM 2 - 'javap -p': private alan ve metot ADLARI gorunur"; cizgi
javap -p -cp bin LisansDenetimi

cizgi; echo "ADIM 3 - 'javap -c -p': sabit DIZELER ve mantik gorunur"; cizgi
echo "(Kaynak kod OLMADAN, sadece .class dosyasindan)"
javap -c -p -cp bin LisansDenetimi | grep -E "String|pinDogru|lisansGecerli|boolean"

cizgi
echo "Sonuc: 'javac' geri cevrilebilir. PIN='4729' ve lisans anahtari"
echo "bytecode'da ACIK duruyor; metot adlari mantigi ele veriyor."
echo "Demo 5: dize gizleme + yansima ile bunu zorlastiracagiz."
