#!/bin/sh
# CEN429 - Hafta 4 - Demo 2: use-after-free ve double-free (Linux / WSL)
# Once derleyin: ../../build.sh     Sonra: sh demo.sh
# Cokebilecek adimlar prlimit+timeout ile sinirlanir; ASan icin setarch -R eklenir.
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/uaf" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
CALISTIR="prlimit --core=1:1 timeout 20"
ASAN="$CALISTIR setarch $(uname -m) -R"
cizgi() { echo "--------------------------------------------------------------"; }

cizgi; echo "ADIM 1 - Korumasiz: use-after-free ile yetki yukseltme"
echo "\$ ./$B/uaf uaf"
$CALISTIR "./$B/uaf" uaf 2>&1 || true
echo "   ^ Serbest birakilan yer yeni ayrilan 'admin' nesnesiyle doldu;"
echo "     askidaki isaretci artik yonetici panelini cagirdi."
cizgi; echo "ADIM 2 - Ayni kod AddressSanitizer ile: hata YAKALANIR"
echo "\$ ./$B/uaf_asan uaf"
$ASAN "./$B/uaf_asan" uaf 2>&1 \
    | grep -E 'ERROR|heap-use-after-free|freed by|previously|SUMMARY' | head -8 || true
cizgi; echo "ADIM 3 - Korumasiz: cift serbest birakma (double-free)"
echo "\$ ./$B/uaf cift"
$CALISTIR "./$B/uaf" cift 2>&1 || echo "   (ayirici double-free/bozulmayi algilayip durdurdu)"
cizgi; echo "ADIM 4 - Ayni kod AddressSanitizer ile: double-free YAKALANIR"
echo "\$ ./$B/uaf_asan cift"
$ASAN "./$B/uaf_asan" cift 2>&1 \
    | grep -E 'ERROR|double-free|SUMMARY' | head -5 || true
cizgi; echo "ADIM 5 - Duzeltilmis surum: free+NULL, sahiplik, tek nokta"
echo "\$ ./$B/uaf_guvenli uaf ; ./$B/uaf_guvenli cift"
"./$B/uaf_guvenli" uaf
"./$B/uaf_guvenli" cift
