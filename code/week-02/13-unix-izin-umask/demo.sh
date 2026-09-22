#!/bin/sh
# CEN429 — Hafta 2 — Demo 13: Unix izinleri, umask ve setuid (Linux / WSL)
# Önce derleyin: ../../build.sh     Sonra: sh demo.sh
# Yalniz cikti/ altinda dosya uretir; sudo gerekmez, gercek setuid ikili
# olusturulmaz. Sistemdeki setuid programlar yalniz LISTELENIR (salt okuma).
cd "$(dirname "$0")" || exit 1
B=bin/linux
[ -x "$B/izin" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
cizgi() { echo "--------------------------------------------------------------"; }

# Dosya sistemi Unix izinlerini tutuyor mu? (/mnt/c altinda tutmayabilir)
mkdir -p cikti
: > cikti/.deneme
chmod 600 cikti/.deneme
if [ "$(stat -c %a cikti/.deneme)" != "600" ]; then
    echo "UYARI: Bu dosya sistemi Unix izinlerini saklamiyor (or. /mnt/c)."
    echo "Depoyu WSL icinde ~ altina kopyalayip orada calistirin."
fi
rm -f cikti/.deneme

cizgi; echo "ADIM 1 — Benzetim: izin algoritmasi, umask, setuid, sticky bit"
"$B/izin" sim

cizgi; echo "ADIM 2 — Ayni kurallar gercek cekirdekte (cikti/ altinda)"
"$B/izin" gercek

cizgi; echo "ADIM 3 — POSIX ACL: ucten fazla sinif gerekince (Tarif 2.1+)"
if command -v setfacl >/dev/null 2>&1; then
    : > cikti/acl.txt
    chmod 640 cikti/acl.txt
    echo "\$ setfacl -m u:nobody:r cikti/acl.txt   # adlandirilmis kullanici"
    if setfacl -m u:nobody:r cikti/acl.txt 2>/dev/null; then
        ls -l cikti/acl.txt | awk '{print "  " $1, $NF}'
        getfacl -c cikti/acl.txt 2>/dev/null | sed 's/^/  /'
        echo "\$ setfacl -m m::- cikti/acl.txt        # maske: hepsini kis"
        setfacl -m m::- cikti/acl.txt
        getfacl -c cikti/acl.txt 2>/dev/null | sed 's/^/  /'
        echo "   ^ maske, adlandirilmis girdilerin ve grubun UST SINIRIdir;"
        echo "     '#effective' gercekte gecerli olan haktir."
        setfacl -b cikti/acl.txt
    else
        echo "  (bu dosya sistemi POSIX ACL desteklemiyor)"
    fi
else
    echo "  (setfacl yok; kurmak isterseniz: sudo apt install acl)"
fi

cizgi; echo "ADIM 4 — Sistemdeki setuid programlar (yalniz listeleme)"
echo "\$ ls -l /usr/bin/passwd"
ls -l /usr/bin/passwd 2>/dev/null | awk '{print "  " $1, $3, $4, $NF}'
echo "\$ find /usr/bin -maxdepth 1 -perm -4000 | wc -l"
echo "  $(find /usr/bin -maxdepth 1 -perm -4000 2>/dev/null | wc -l) setuid program"
echo "   ^ 's' biti: program SAHIBININ (root) kimligiyle calisir. Her biri"
echo "     bir saldiri yuzeyidir; yenisini eklemek yerine yetenek kullanin."

cizgi; echo "Temizlik: cikti/ klasoru siliniyor"
rm -rf cikti
echo "Sonuc: izinler ilk eslesen sinifa gore denetlenir; umask yalniz"
echo "olusturma aninda kisar; setuid'de sakli UID'yi unutmayin; acik"
echo "tanitici bir yetenektir; ACL ve yetenekler ince ayar saglar."
