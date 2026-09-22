#!/bin/sh
# CEN429 - Hafta 4 - Demo 4: Fuzzing (libFuzzer) (Linux / WSL)
# Once derleyin: ../../build.sh     Sonra: sh demo.sh
# Fuzzing HER ZAMAN sure sinirlidir (-max_total_time) ve butun cikti bu demo
# klasorundeki fuzz-cikti/ altina yazilir; sistemde iz birakmaz.
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/ayristirici" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
CALISTIR="prlimit --core=1:1 timeout 40"
ASAN="$CALISTIR setarch $(uname -m) -R"
cizgi() { echo "--------------------------------------------------------------"; }

D=fuzz-cikti
rm -rf "$D"; mkdir -p "$D/corpus"
cp tohum/normal.bin "$D/corpus/" 2>/dev/null || true

cizgi; echo "ADIM 1 - Normal girdi sorunsuz ayristirilir"
echo "\$ ./$B/ayristirici tohum/normal.bin"
$ASAN "./$B/ayristirici" tohum/normal.bin 2>&1 | grep -vE '^(==|  )' | head -3 || true

if [ -x "$B/ayristirici_fuzz" ]; then
    cizgi; echo "ADIM 2 - HATALI ayristiriciyi libFuzzer ile fuzzla (<=10 sn)"
    echo "\$ ./$B/ayristirici_fuzz -max_total_time=10 $D/corpus"
    $ASAN "./$B/ayristirici_fuzz" -max_total_time=10 -artifact_prefix="$D/" \
        "$D/corpus" 2>&1 | grep -E 'ERROR|overflow|Test unit|SUMMARY|crash-' | head -8 || true
    CRASH=$(ls "$D"/crash-* 2>/dev/null | head -1)
    cizgi; echo "ADIM 3 - Bulunan cokerten girdiyi reproducer ile oynat"
    if [ -n "$CRASH" ]; then
        echo "\$ ./$B/ayristirici $CRASH"
        $ASAN "./$B/ayristirici" "$CRASH" 2>&1 \
            | grep -E 'ERROR|overflow|READ of size|SUMMARY' | head -5 || true
    else
        echo "   (bu kosuda ayri bir crash dosyasi kalmadi; hazir tohumu kullanalim)"
        $ASAN "./$B/ayristirici" tohum/cokerten.bin 2>&1 \
            | grep -E 'ERROR|overflow|READ of size|SUMMARY' | head -5 || true
    fi
    cizgi; echo "ADIM 4 - DUZELTILMIS ayristiriciyi ayni sure fuzzla: cokme YOK"
    echo "\$ ./$B/ayristirici_fuzz_guvenli -max_total_time=10 $D/corpus"
    $ASAN "./$B/ayristirici_fuzz_guvenli" -max_total_time=10 \
        -artifact_prefix="$D/" "$D/corpus" 2>&1 \
        | grep -E 'Done|DONE|crash|ERROR' | tail -2 || true
    echo "   ^ 'Done ... 0 crashes' benzeri: duzeltilmis surumde cokme uretilemedi."
else
    cizgi; echo "ADIM 2 - Bu ortamda clang yok: libFuzzer hedefi uretilmedi"
    echo "   Ubuntu 24.04'te clang 18 hazir gelir. Ubuntu 20.04'te kurmak icin:"
    echo "     sudo apt-get install -y clang"
    echo "   Fuzzer olmadan da hatayi ASan reproducer ile GOREBILIRIZ:"
    cizgi; echo "ADIM 3 - Hazir cokerten tohumu reproducer ile oynat"
    echo "\$ ./$B/ayristirici tohum/cokerten.bin"
    $ASAN "./$B/ayristirici" tohum/cokerten.bin 2>&1 \
        | grep -E 'ERROR|overflow|READ of size|SUMMARY' | head -6 || true
fi

cizgi; echo "ADIM 5 - Duzeltilmis surum ayni tohumu guvenle reddeder"
echo "\$ ./$B/ayristirici_guvenli tohum/cokerten.bin"
$ASAN "./$B/ayristirici_guvenli" tohum/cokerten.bin 2>&1 | grep -vE '^(==|  )' | head -3 || true
rm -rf "$D"
