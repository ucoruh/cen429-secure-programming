#!/bin/sh
# CEN429 - Hafta 3 - Demo 4: Paroladan anahtar turetme (Linux / WSL)
# Once derleyin: ../../build.sh     Sonra: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/pbkdf2demo" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
"$B/pbkdf2demo"
echo "=============================================================="
echo "3) Argon2id ile karsilastirma (argon2 araci varsa)"
if command -v argon2 >/dev/null 2>&1; then
    echo "> echo -n 'kopek123' | argon2 <tuz> -id -t 3 -m 16 -p 1 -l 32"
    printf 'kopek123' | argon2 tuzABCDEFGH -id -t 3 -m 16 -p 1 -l 32 \
        | sed 's/^/   /'
    echo "   ^ Argon2id ayrica BELLEK maliyeti (-m) ister; GPU/ASIC ile"
    echo "     kaba kuvveti PBKDF2'den daha cok zorlastirir."
else
    echo "   (argon2 araci kurulu degil: sudo apt-get install -y argon2)"
fi
