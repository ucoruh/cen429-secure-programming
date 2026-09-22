#!/bin/sh
# CEN429 - Hafta 10 - Demo 2: Ed25519 imza olusturma/dogrulama ve tuzaklar.
# Calistirma:  sh demo.sh        (openssl 3.x gerekir; Ed25519 -rawin)
# GUVENLI: yalniz bu klasorde gecici dosyalar uretir ve siler; ag/sistem islemi yok.
cd "$(dirname "$0")"
command -v openssl >/dev/null 2>&1 || { echo "openssl bulunamadi."; exit 1; }
W=imza; rm -rf "$W"; mkdir "$W"; cd "$W"
cizgi() { echo "--------------------------------------------------------------"; }

cizgi; echo "ADIM 1 - Ed25519 anahtar cifti uret"
openssl genpkey -algorithm ed25519 -out ed.key >/dev/null 2>&1
openssl pkey -in ed.key -pubout -out ed.pub >/dev/null 2>&1 && echo "  ed.key (gizli) + ed.pub (acik) uretildi"

cizgi; echo "ADIM 2 - Guncelleme dosyasini imzala (SURUM iceriğe dahil!)"
printf 'surum=1.2.0\ngovde=guncelleme icerigi\n' > guncelleme.bin
openssl pkeyutl -sign -inkey ed.key -rawin -in guncelleme.bin -out guncelleme.sig >/dev/null 2>&1 \
  && echo "  guncelleme.sig uretildi ($(wc -c < guncelleme.sig) bayt)"

cizgi; echo "ADIM 3 - Dogrulama: dogru imza"
if openssl pkeyutl -verify -pubin -inkey ed.pub -rawin -in guncelleme.bin -sigfile guncelleme.sig >/dev/null 2>&1; then
  echo "  -> Imza GECERLI (kur). openssl cikis kodu = 0."
else
  echo "  -> Beklenmeyen: gecerli imza reddedildi."
fi

cizgi; echo "ADIM 4 - Kurcalama: govde 1 bayt degistirilirse"
printf 'surum=1.2.0\ngovde=guncelleme icerigX\n' > kurcali.bin
if openssl pkeyutl -verify -pubin -inkey ed.pub -rawin -in kurcali.bin -sigfile guncelleme.sig >/dev/null 2>&1; then
  echo "  -> Beklenmeyen: kurcali dosya gecerli sayildi!"
else
  echo "  -> Imza GECERSIZ. Kurcali guncelleme REDDEDILDI (cikis kodu != 0)."
fi

cizgi; echo "TUZAKLAR (slaytlar):"
echo "  * Kodda 'if (EVP_DigestVerify(...))' YANLIS: negatif hata da dogru sayilir; '== 1' olmali."
echo "  * Imzali icerik SURUMU kapsamali; yoksa eski ama gecerli imzali surum geri yuklenebilir (downgrade)."
echo "  * Dogrulama anahtari (ed.pub) guvenilir olmali; saldirganin anahtariyla dogrularsan onun imzasi 'gecerli' olur."
cd ..; rm -rf "$W"; echo "(gecici imza/ silindi)"
