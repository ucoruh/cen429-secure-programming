#!/bin/sh
# CEN429 — Hafta 1 — Demo 4: İşaretli uzunluk hatası (Linux / WSL)
# Önce derleyin: ../../build.sh     Sonra: ./demo.sh
# Çökmesi beklenen komutlar yalnız o komut için sınırlandırılır (çökme dökümü yok, zaman sınırı var).
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/kopya" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
CALISTIR="prlimit --core=1:1 timeout 20"
ASAN="$CALISTIR setarch $(uname -m) -R"
cizgi() { echo "--------------------------------------------------------------"; }

cizgi; echo "ADIM 0 — Derleyici bu hatayi goruyor mu?"
echo "\$ gcc -Wall -Wextra -fsyntax-only -I../../common kopya.c"
gcc -Wall -Wextra -fsyntax-only -I../../common kopya.c 2>&1 | grep -E 'warning' | head -3
echo "   -> Uyari yok: -Wall -Wextra bu donusumu bildirmez."
echo "\$ gcc -Wsign-conversion -fsyntax-only -I../../common kopya.c"
gcc -Wsign-conversion -fsyntax-only -I../../common kopya.c 2>&1 | grep -E 'warning' | head -3
cizgi; echo "ADIM 1 — Normal kullanim";                        echo "\$ ./$B/kopya 8";   "./$B/kopya" 8
cizgi; echo "ADIM 2 — Cok buyuk uzunluk: denetim yakalar";     echo "\$ ./$B/kopya 100"; "./$B/kopya" 100 || true
cizgi; echo "ADIM 3 — Saldiri: negatif uzunluk denetimi atlatir"
echo "\$ ./$B/kopya -1"
$CALISTIR "./$B/kopya" -1; echo "   (cikis kodu: $? — 139 = bellek hatasi, SIGSEGV)"
cizgi; echo "ADIM 4 — Ayni saldiri, AddressSanitizer ile"
echo "\$ ./$B/kopya_asan -1"
$ASAN "./$B/kopya_asan" -1 2>&1 | grep -E 'ERROR|negative|SUMMARY' || true
cizgi; echo "ADIM 5 — Duzeltilmis surum"
echo "\$ ./$B/kopya_guvenli -1 ; ./$B/kopya_guvenli 12abc ; ./$B/kopya_guvenli 8"
"./$B/kopya_guvenli" -1 || true
"./$B/kopya_guvenli" 12abc || true
"./$B/kopya_guvenli" 8
