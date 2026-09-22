#!/bin/sh
# CEN429 - Hafta 6 - Demo 7: Root/ayricalik gostergesi algilama (Linux / WSL)
# Once derleyin: ../../build.sh     Sonra: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/yetki" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
rm -rf cikti && mkdir -p cikti
cizgi() { echo "--------------------------------------------------------------"; }

cizgi; echo "ADIM 1 - Normal calisma (root degil, isaret yok): temiz beklenir"
"$B/yetki"; echo "   (cikis kodu $?)"

cizgi; echo "ADIM 2 - Isaretli durum: sahte bir 'su' isaret dosyasi olusturuluyor"
echo "sahte root isareti" > cikti/sahte_su
echo "> cikti/sahte_su olusturuldu; ek isaret olarak veriliyor"
"$B/yetki" cikti/sahte_su || echo "   (cikis kodu 3 - gosterge ALGILANDI)"

cizgi
echo "Deneme: sudo GEREKMEZ. Yine de merak edenler icin 'geteuid()==0' ancak"
echo "gercek root'ta olur; bu demo hicbir sey degistirmedigi icin root'ta da"
echo "guvenlidir, ama bu derste hicbir demo root/sudo istemez."
