#!/bin/sh
# CEN429 — Hafta 2 — Demo 12: Windows ACE degerlendirme simulatoru (Linux / WSL)
# Önce derleyin: ../../build.sh     Sonra: sh demo.sh
# Simulator saf hesaplamadir; gercek adimda yalniz cikti/ altinda bir dosya
# olusturulur ve izinleri OKUNUR. Sistem ayarina dokunulmaz, sudo gerekmez.
cd "$(dirname "$0")" || exit 1
B=bin/linux
[ -x "$B/ace" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
cizgi() { echo "--------------------------------------------------------------"; }

cizgi; echo "ADIM 1 — ACE SIRASI: ilk eslesen RET istegi keser (kitaptaki ornek)"
"$B/ace" senaryo-1-sira.txt

cizgi; echo "ADIM 2 — NULL DACL (herkese her hak) ile BOS DACL (kimseye hak yok)"
"$B/ace" senaryo-2-null-bos.txt

cizgi; echo "ADIM 3 — KALITIM: acik ACE'ler miras ACE'lerden once gelir"
"$B/ace" senaryo-3-kalitim.txt

cizgi; echo "ADIM 4 — UAC suzgeci (yalniz-ret grup) ve butunluk seviyeleri (MIC)"
"$B/ace" senaryo-4-uac-mic.txt

cizgi; echo "ADIM 5 — SAHIP_HAKLARI ve SAHIPLIK_AL ayricaligi"
"$B/ace" senaryo-5-sahip-ayricalik.txt

cizgi; echo "ADIM 6 — Gercek sistem: Linux'ta ayni soru (salt okuma)"
mkdir -p cikti
echo "ornek veri" > cikti/ornek.txt
chmod 640 cikti/ornek.txt
echo "\$ id"
id
echo "\$ stat -c '%A %a %U:%G %n' cikti/ornek.txt"
stat -c '%A %a %U:%G %n' cikti/ornek.txt
if command -v getfacl >/dev/null 2>&1; then
    echo "\$ getfacl cikti/ornek.txt"
    getfacl cikti/ornek.txt 2>/dev/null
else
    echo "(getfacl yok; kurmak isterseniz: sudo apt install acl)"
fi
echo "   ^ Linux'ta 'ACE listesi' yerine uc sinif (sahip/grup/diger) vardir;"
echo "     POSIX ACL eklenirse getfacl ek satirlari gosterir (bkz. Demo 13)."

cizgi; echo "Sonuc: Windows ACE'leri SIRAYLA gezer, RET yalniz henuz verilmemis"
echo "hakki keser; NULL DACL herkese acar, BOS DACL herkese kapatir; MIC"
echo "DACL'dan once gelir; sahip IZIN_YAZ ile DACL'i her zaman degistirebilir."
