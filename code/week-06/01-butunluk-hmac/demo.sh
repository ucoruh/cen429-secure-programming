#!/bin/sh
# CEN429 - Hafta 6 - Demo 1: Calisma zamani butunluk denetimi (Linux / WSL)
# Once derleyin: ../../build.sh     Sonra: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/butunluk" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
rm -rf cikti && mkdir -p cikti
cizgi() { echo "--------------------------------------------------------------"; }

cizgi; echo "ADIM 1 - Uygulama KENDI ikili dosyasinin altin HMAC degerini kaydeder"
"$B/butunluk" kaydet oz cikti/altin.hmac

cizgi; echo "ADIM 2 - Normal calisma: butunluk dogrulanir (yama yok)"
"$B/butunluk" dogrula oz cikti/altin.hmac && echo "   (cikis kodu 0 - temiz)"

cizgi; echo "ADIM 3 - Saldiri: ikili dosyanin bir KOPYASI alinip 1 bayti degistiriliyor"
cp "$B/butunluk" cikti/butunluk_yamali
BOY=$(wc -c < cikti/butunluk_yamali)
OFSET=$((BOY / 2))
echo "> ofset $OFSET baytini XOR 0xFF ile degistir"
printf '\377' | dd of=cikti/butunluk_yamali bs=1 seek="$OFSET" count=1 conv=notrunc status=none 2>/dev/null

cizgi; echo "ADIM 4 - Yamali kopyanin HMAC'i altin degerle karsilastiriliyor"
"$B/butunluk" dogrula cikti/butunluk_yamali cikti/altin.hmac \
    || echo "   (cikis kodu 3 - yama ALGILANDI)"

cizgi
echo "Not: HMAC anahtari ikili dosyanin icindedir; tek basina yeterli degildir."
echo "Saldirgan denetleyiciyi de yamalar. Gercek RASP: coklu/ortusen denetleyici,"
echo "sonucu veri bagimliligi yapma (Demo 5) ve sunucu tarafli attestation."
