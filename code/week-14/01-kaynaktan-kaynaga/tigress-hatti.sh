#!/bin/sh
# CEN429 - Hafta 14 - Demo 1: Kaynaktan kaynaga gizleme hatti (Tigress)
# Tigress KURULUYSA bir donusum hatti uygular, olcum yapar; DEGILSE indirme/lisans
# yonergesini gosterir ve ornegi sade derleyip temel cizgiyi olcer.
# GUVENLI: yalniz bu klasorde calisir; ag'a cikmaz; kendi kodunu gizler/olcer.
cd "$(dirname "$0")"
CC=${CC:-cc}
command -v "$CC" >/dev/null 2>&1 || CC=gcc
cizgi() { echo "--------------------------------------------------------------"; }

olc() {   # $1 = ikili : erisim_ver fonksiyonunun komut/dal sayisi (Windows'ta .exe uzantisi)
  f="$1.exe"; [ -f "$f" ] || f="$1"   # Windows'ta .exe once (native objdump .exe cozmez)
  objdump -d "$f" 2>/dev/null | awk '/<erisim_ver>:/{a=1;next} /^$/{a=0} a{n++; if($0 ~ /\t(j|call)/)b++} END{printf "%d komut, %d dal/cagri", n, b}'
}

cizgi; echo "ADIM 1 - Temiz surumu derle ve calistir"
"$CC" -O2 -o ornek_temiz ornek.c && ./ornek_temiz "CEN429-OK" && ./ornek_temiz "yanlis"
echo "  temiz erisim_ver: $(olc ornek_temiz)"

cizgi
if command -v tigress >/dev/null 2>&1; then
  echo "ADIM 2 - Tigress BULUNDU: donusum hatti uygulaniyor"
  echo "\$ tigress --Transform=EncodeLiterals --Transform=EncodeArithmetic \\"
  echo "          --Transform=Flatten --Transform=InitOpaque --Transform=AddOpaque \\"
  echo "          --Functions=erisim_ver --out=gizli.c ornek.c"
  tigress --Environment=x86_64:Linux:Gcc:11 \
          --Transform=EncodeLiterals --Functions=erisim_ver \
          --Transform=EncodeArithmetic --Functions=erisim_ver \
          --Transform=Flatten --Functions=erisim_ver \
          --Transform=InitOpaque --Functions=main \
          --Transform=AddOpaque --Functions=erisim_ver --AddOpaqueKinds=call \
          --out=gizli.c ornek.c \
    && "$CC" -O2 -o ornek_gizli gizli.c \
    && echo "ADIM 3 - Davranis korundu mu?" \
    && { [ "$(./ornek_temiz CEN429-OK)" = "$(./ornek_gizli CEN429-OK)" ] && echo "  ✓ ayni cikti" || echo "  ✗ FARK"; } \
    && echo "  gizli erisim_ver: $(olc ornek_gizli)  (temiz'e gore artis = gizlemenin maliyeti)"
  echo "ADIM 4 - Cesitlendirme: iki tohum, iki farkli ikili"
  tigress --Seed=1001 --Transform=Flatten --Transform=AddOpaque --Functions=erisim_ver --out=a.c ornek.c 2>/dev/null
  tigress --Seed=2002 --Transform=Flatten --Transform=AddOpaque --Functions=erisim_ver --out=b.c ornek.c 2>/dev/null
  "$CC" -O2 -o A a.c 2>/dev/null; "$CC" -O2 -o B b.c 2>/dev/null
  if [ -f A ] && [ -f B ]; then
    cmp -s A B && echo "  (ayni)" || echo "  ✓ iki tohum farkli ikili uretti (cesitlendirme)"
  fi
else
  echo "ADIM 2 - Tigress KURULU DEGIL."
  echo "  Tigress'i resmi siteden indirin: https://tigress.wtf"
  echo "  Lisans: kar amaci gutmeyen (akademik) kullanim UCRETSIZ; ticari icin Arizona Univ. lisansi."
  echo "  Kurulumdan sonra 'tigress' PATH'te olunca bu betik hatti otomatik uygular ve olcer."
  echo
  echo "  Tigress olmadan bile: ayni kurallarin EL ILE surumu ve olcumu week-09'da CALISIR:"
  echo "    cd ../../week-09/01-manuel-gizleme && sh demo.sh"
fi
cizgi; echo "Kural: gizleme davranisi degistirmez, maliyet yukseltir; birlestir, cesitlendir, OLC."
rm -f ornek_temiz ornek_gizli A B gizli.c a.c b.c ornek_temiz.exe ornek_gizli.exe A.exe B.exe 2>/dev/null
