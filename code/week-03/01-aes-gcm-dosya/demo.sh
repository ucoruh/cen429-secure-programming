#!/bin/sh
# CEN429 - Hafta 3 - Demo 1: AES-256-GCM ile dosya sifreleme (Linux / WSL)
# Once derleyin: ../../build.sh     Sonra: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/aesgcm" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
rm -rf cikti && mkdir -p cikti
cizgi() { echo "--------------------------------------------------------------"; }

cizgi; echo "ADIM 1 - 32 baytlik rastgele anahtar ve ornek gizli dosya"
head -c 32 /dev/urandom > cikti/anahtar.bin
printf 'IBAN: TR00 0000 0000 0000 0000 0000 00\nBakiye: 12345\n' \
    > cikti/gizli.txt
echo "gizli.txt icerigi:"; sed 's/^/   /' cikti/gizli.txt

cizgi; echo "ADIM 2 - Sifrele"
"$B/aesgcm" sifrele cikti/anahtar.bin cikti/gizli.txt cikti/gizli.enc
echo "Sifreli dosyanin ilk baytlari (nonce + sifreli metin):"
od -A x -t x1z cikti/gizli.enc | head -3 | sed 's/^/   /'

cizgi; echo "ADIM 3 - Dogru sekilde coz (etiket tutar)"
"$B/aesgcm" coz cikti/anahtar.bin cikti/gizli.enc cikti/cozulen.txt
echo "Cozulen icerik:"; sed 's/^/   /' cikti/cozulen.txt

cizgi; echo "ADIM 4 - Saldiri: sifreli metnin 20. baytini degistir"
cp cikti/gizli.enc cikti/bozuk.enc
printf '\377' | dd of=cikti/bozuk.enc bs=1 seek=20 count=1 conv=notrunc \
    status=none 2>/dev/null
echo "> aesgcm coz ... bozuk.enc"
"$B/aesgcm" coz cikti/anahtar.bin cikti/bozuk.enc cikti/olmaz.txt \
    || echo "   (cikis kodu 2 - cozme reddedildi)"

cizgi; echo "ADIM 5 - Saldiri: yalniz ETIKETin son baytini degistir"
cp cikti/gizli.enc cikti/etiket_bozuk.enc
SON=$(($(wc -c < cikti/etiket_bozuk.enc) - 1))
printf '\000' | dd of=cikti/etiket_bozuk.enc bs=1 seek="$SON" count=1 \
    conv=notrunc status=none 2>/dev/null
"$B/aesgcm" coz cikti/anahtar.bin cikti/etiket_bozuk.enc cikti/olmaz2.txt \
    || echo "   (cikis kodu 2 - etiket tutmadi)"
