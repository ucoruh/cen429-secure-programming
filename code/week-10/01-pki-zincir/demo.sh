#!/bin/sh
# CEN429 - Hafta 10 - Demo 1: OpenSSL ile sertifika zinciri (kok -> ara -> sunucu)
# Calistirma:  sh demo.sh        (openssl gerekir; surum 1.1.1+ / 3.x)
# GUVENLI: yalniz bu klasorde gecici bir 'pki/' olusturur, sonunda siler.
#          Ag'a cikmaz; hicbir sertifika sisteme kurulmaz; sudo yok.
cd "$(dirname "$0")"
export MSYS_NO_PATHCONV=1   # Windows Git-Bash: -subj "/CN=.." yol'a cevrilmesin (Linux'ta zararsiz)
command -v openssl >/dev/null 2>&1 || { echo "openssl bulunamadi."; exit 1; }
W=pki; rm -rf "$W"; mkdir "$W"; cd "$W"
cizgi() { echo "--------------------------------------------------------------"; }
S=">/dev/null 2>&1"

cizgi; echo "ADIM 1 - Kok CA (kendini imzalar; basicConstraints CA:TRUE varsayilan)"
openssl req -x509 -newkey ed25519 -keyout kok.key -out kok.crt -nodes \
  -subj "/CN=Ders Kok CA" -days 3650 >/dev/null 2>&1 && echo "  kok.crt uretildi"

cizgi; echo "ADIM 2 - Ara CA (kok imzalar; CA:TRUE uzantisiyla)"
printf "basicConstraints=critical,CA:TRUE,pathlen:0\nkeyUsage=critical,keyCertSign,cRLSign\n" > ara.ext
openssl req -newkey ed25519 -keyout ara.key -out ara.csr -nodes -subj "/CN=Ders Ara CA" >/dev/null 2>&1
openssl x509 -req -in ara.csr -CA kok.crt -CAkey kok.key -CAcreateserial \
  -out ara.crt -days 1825 -extfile ara.ext >/dev/null 2>&1 && echo "  ara.crt uretildi (CA:TRUE)"

cizgi; echo "ADIM 3 - Sunucu sertifikasi (ara imzalar; CA:FALSE + SAN=ornek.test)"
printf "basicConstraints=CA:FALSE\nkeyUsage=digitalSignature\nsubjectAltName=DNS:ornek.test\n" > sunucu.ext
openssl req -newkey ed25519 -keyout sunucu.key -out sunucu.csr -nodes -subj "/CN=ornek.test" >/dev/null 2>&1
openssl x509 -req -in sunucu.csr -CA ara.crt -CAkey ara.key -CAcreateserial \
  -out sunucu.crt -days 365 -extfile sunucu.ext >/dev/null 2>&1 && echo "  sunucu.crt uretildi"

cizgi; echo "ADIM 4 - Dogrulama: ARA sertifika OLMADAN (yaygin yapilandirma hatasi)"
echo "\$ openssl verify -CAfile kok.crt sunucu.crt"
openssl verify -CAfile kok.crt sunucu.crt || echo "  ^ Zincir koke ULASAMADI (ara eksik)."

cizgi; echo "ADIM 5 - Dogrulama: ARA sertifika ILE"
echo "\$ openssl verify -CAfile kok.crt -untrusted ara.crt sunucu.crt"
openssl verify -CAfile kok.crt -untrusted ara.crt sunucu.crt && echo "  ^ Zincir tamamlandi: OK."

cizgi; echo "Zincir dogrulamanin dort sorusu: imza? koke ulasti mi? sure? ad (SAN)?"
echo "  (Not: 'verify' AD denetlemez; uygulama SAN'i ayrica denetler.)"
cd ..; rm -rf "$W"; echo "(gecici pki/ silindi)"
