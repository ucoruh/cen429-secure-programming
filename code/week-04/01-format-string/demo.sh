#!/bin/sh
# CEN429 - Hafta 4 - Demo 1: Bicim dizisi acigi (Linux / WSL)
# Once derleyin: ../../build.sh     Sonra: sh demo.sh
# Cokebilecek adimlar prlimit+timeout ile sinirlanir (core dump yok, zaman siniri var).
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/sizinti" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
CALISTIR="prlimit --core=1:1 timeout 20"
cizgi() { echo "--------------------------------------------------------------"; }

cizgi; echo "ADIM 0 - Derleyici bu hatayi goruyor mu?"
echo "\$ gcc -Wformat -Wformat-security -fsyntax-only -I../../common sizinti.c"
gcc -Wformat -Wformat-security -fsyntax-only -I../../common sizinti.c 2>&1 \
    | grep -i 'format' | head -2
echo "   -> -Wformat-security sabit olmayan bicim dizisini uyarir."
cizgi; echo "ADIM 1 - Normal kullanim"
echo "\$ ./$B/sizinti Merhaba"; "./$B/sizinti" Merhaba
cizgi; echo "ADIM 2 - Saldiri: %x ile yigindan bellek OKUMA (bilgi sizintisi)"
FMT='%x.%x.%x.%x.%x.%x.%x.%x.%x.%x.%x.%x.%x.%x.%x.%x.%x.%x.%x.%x'
echo "\$ ./$B/sizinti '$FMT'"
CIKTI=$("./$B/sizinti" "$FMT" 2>/dev/null)
echo "$CIKTI"
echo "$CIKTI" | grep -oq '5ece7' \
    && echo "   ^ gizli_deger sizdi -> 0x0005ece7 (yigindan okundu)" \
    || echo "   ^ hex sozcukleri yigin icerigidir; biri gizli_deger olabilir"
cizgi; echo "ADIM 3 - Saldiri: %n ile bellege YAZMA denemesi (korumasiz surum)"
echo "\$ ./$B/sizinti 'AAAA%n'"
$CALISTIR "./$B/sizinti" 'AAAA%n' 2>&1 || \
    echo "   (program cokecek/durdurulacak sekilde davrandi; cikis $?)"
cizgi; echo "ADIM 4 - Ayni %n saldirisi, _FORTIFY_SOURCE=2 ile derlenmis surum"
echo "\$ ./$B/sizinti_denetimli 'AAAA%n'"
$CALISTIR "./$B/sizinti_denetimli" 'AAAA%n' 2>&1 || \
    echo "   (FORTIFY: yazilabilir bellekteki %n reddedildi)"
cizgi; echo "ADIM 5 - Duzeltilmis surum: %x ve %n artik sadece METIN"
echo "\$ ./$B/sizinti_guvenli '%x %x %n saldiri denemesi'"
"./$B/sizinti_guvenli" '%x %x %n saldiri denemesi'
