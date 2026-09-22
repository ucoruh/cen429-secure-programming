#!/bin/sh
# CEN429 - Hafta 4 - Demo 5: Derleyici ve OS korumalari (Linux / WSL)
# Once derleyin: ../../build.sh     Sonra: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/giris_zayif" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
CALISTIR="prlimit --core=1:1 timeout 20"
UZUN=$(printf 'A%.0s' $(seq 1 200))
cizgi() { echo "--------------------------------------------------------------"; }

# Bir ELF ikilisinin korumalarini ozetler (readelf ile).
koruma_ozeti() {
    ELF="$1"
    printf "  PIE/ASLR : "; readelf -h "$ELF" | grep -q 'Type:.*DYN' \
        && echo "ACIK (Type=DYN, PIE)" || echo "kapali (Type=EXEC)"
    printf "  NX (DEP) : "; readelf -lW "$ELF" | grep -q 'GNU_STACK.*RWE' \
        && echo "kapali (yigin calistirilabilir)" || echo "ACIK (yigin RW, calistirilamaz)"
    printf "  RELRO    : "
    if readelf -lW "$ELF" | grep -q 'GNU_RELRO'; then
        readelf -dW "$ELF" | grep -q 'BIND_NOW\|FLAGS.*NOW' \
            && echo "TAM (RELRO + BIND_NOW)" || echo "kismi (yalniz GNU_RELRO)"
    else echo "yok"; fi
    printf "  Canary   : "; readelf -sW "$ELF" | grep -q '__stack_chk_fail' \
        && echo "ACIK (__stack_chk_fail)" || echo "kapali"
    printf "  FORTIFY  : "; readelf -sW "$ELF" | grep -qE '_chk@' \
        && echo "ACIK (*_chk sembolleri)" || echo "kapali"
}

cizgi; echo "ADIM 1 - Normal girdi: iki surum de calisir"
echo "\$ ./$B/giris_zayif ada"; $CALISTIR "./$B/giris_zayif" ada
echo "\$ ./$B/giris_sert  ada"; $CALISTIR "./$B/giris_sert"  ada
cizgi; echo "ADIM 2 - ZAYIF surum, 200 baytlik tasma (kanary yok)"
echo "\$ ./$B/giris_zayif <200xA>"
$CALISTIR "./$B/giris_zayif" "$UZUN" 2>&1; echo "   (cikis kodu: $? ; 139=SIGSEGV)"
cizgi; echo "ADIM 3 - SERT surum, ayni tasma: kanary bozulmayi YAKALAR"
echo "\$ ./$B/giris_sert <200xA>"
$CALISTIR "./$B/giris_sert" "$UZUN" 2>&1 | grep -iE 'stack smashing|terminated' | head -1
echo "   (cikis kodu: $? ; program guvenli bicimde durduruldu)"
cizgi; echo "ADIM 4 - Ikilide hangi korumalar acik? (readelf)"
echo "ZAYIF ikili:"; koruma_ozeti "$B/giris_zayif"
echo "SERT ikili:";  koruma_ozeti "$B/giris_sert"
cizgi
echo "Ders: bu korumalar hatayi DUZELTMEZ; sadece somurmeyi zorlastirir/durdurur."
echo "Asil cozum girdi dogrulama ve sinir denetimidir (Demo 1-4)."
