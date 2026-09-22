#!/bin/sh
# CEN429 - Hafta 3 - Demo 8: Kullanimda veri - guvenli silme (Linux / WSL)
# Once derleyin: ../../build.sh     Sonra: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/bellek" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
"$B/bellek"
echo "--------------------------------------------------------------"
echo "guvenli_sil()/kripto_temizle makine kodunda gercek bir cagriya"
echo "derlenir; memset gibi 'olu yazma' olarak silinemez:"
if command -v objdump >/dev/null 2>&1; then
    N=$(objdump -d --no-show-raw-insn "$B/bellek" 2>/dev/null \
        | grep -c -E 'call.*OPENSSL_cleanse|jmp.*OPENSSL_cleanse' || true)
    echo "  OPENSSL_cleanse cagrisi sayisi -> $N"
else
    echo "  (objdump yok: sudo apt-get install -y binutils)"
fi
