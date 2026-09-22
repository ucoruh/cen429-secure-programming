#!/bin/sh
# CEN429 — Hafta 1 — Demo 2: Bellekte kalan parola (Linux / WSL)
# Önce derleyin: ../../build.sh     Sonra: ./demo.sh
# Programı gdb altında başlatır (gdb ebeveyn olduğu için ek izin gerekmez), bekle()'de durdurur,
# belleği dokum/ klasörüne döker ve dökümde parolayı arar. Yalnız bu klasörde dosya üretir.
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/parola_silmez" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
command -v gdb >/dev/null || { echo "gdb gerekli: sudo apt install gdb"; exit 1; }
PAROLA=$(tr -d '\r\n' < parola.txt)
mkdir -p dokum
cizgi() { echo "--------------------------------------------------------------"; }

dok() {  # $1 = program adı
    rm -f "dokum/$1.core"
    gdb -q -batch -ex 'set pagination off' -ex 'break bekle' -ex 'run parola.txt' \
        -ex "gcore dokum/$1.core" -ex 'kill' "$B/$1" > "dokum/$1.gdb.log" 2>&1
    ADET=$(strings "dokum/$1.core" | grep -c -F "$PAROLA" || true)
    echo "  Bellek dokumu: dokum/$1.core ($(wc -c < "dokum/$1.core") bayt)"
    if [ "$ADET" -gt 0 ]; then
        echo "  SONUC: parola dokumde $ADET yerde BULUNDU  ->  $PAROLA"
    else
        echo "  SONUC: parola dokumde bulunamadi"
    fi
}

echo "Parola dosyasi: parola.txt  ->  $PAROLA"
cizgi; echo "ADIM 1 — Parolayi hic silmeyen surum";            dok parola_silmez
cizgi; echo "ADIM 2 — memset ile silen surum (-O2)";           dok parola_memset
cizgi; echo "ADIM 3 — explicit_bzero ile silen surum (-O2)";   dok parola_explicit
cizgi; echo "Neden? giris_yap() fonksiyonunun makine kodu:"
M=$(objdump -d --no-show-raw-insn "$B/parola_memset" | awk '/<giris_yap>:/,/ret/' | grep -c -E 'memset|rep stos|movaps|movups|pxor' || true)
E=$(objdump -d --no-show-raw-insn "$B/parola_explicit" | awk '/<giris_yap>:/,/ret/' | grep -c 'explicit_bzero' || true)
echo "  memset surumunde silme komutu sayisi    ->  $M"
echo "  explicit surumunde explicit_bzero cagrisi ->  $E"
echo "  (Makine kodunu gormek icin: objdump -d $B/parola_memset | less  ve  giris_yap'i arayin)"
