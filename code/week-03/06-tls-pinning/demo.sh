#!/bin/sh
# CEN429 - Hafta 3 - Demo 6: TLS dogrulama, hostname ve SPKI pinning (Linux / WSL)
# Once derleyin: ../../build.sh     Sonra: sh demo.sh
# Kendi CA'mizi, "gercek" ve "saldirgan" sunuculari uretir; iki yerel TLS
# sunucusu baslatir ve istemciyi uc modda dener. Yalniz 127.0.0.1.
set -u
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/tls_istemci" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
command -v openssl >/dev/null || { echo "openssl gerekli"; exit 1; }

D=cikti
rm -rf "$D" && mkdir -p "$D"
# Onceki calismalardan kalmis yerel sunucular varsa portlari serbest birak.
fuser -k 14443/tcp 14444/tcp 2>/dev/null || true

# --- 1) Sertifikalar ------------------------------------------------
# Kendi kok CA'miz
openssl req -x509 -newkey rsa:2048 -nodes -keyout "$D/ca.key" \
  -out "$D/ca.crt" -days 2 -subj "/CN=CEN429 Demo CA" >/dev/null 2>&1
# Gercek sunucu: CN=localhost, CA tarafindan imzali
openssl req -newkey rsa:2048 -nodes -keyout "$D/gercek.key" \
  -out "$D/gercek.csr" -subj "/CN=localhost" >/dev/null 2>&1
printf 'subjectAltName=DNS:localhost,IP:127.0.0.1\n' > "$D/san.ext"
openssl x509 -req -in "$D/gercek.csr" -CA "$D/ca.crt" \
  -CAkey "$D/ca.key" -CAcreateserial -days 2 \
  -extfile "$D/san.ext" -out "$D/gercek.crt" >/dev/null 2>&1
# Saldirgan sunucu: CN=localhost ama KENDI IMZALI (bizim CA'da yok)
openssl req -x509 -newkey rsa:2048 -nodes -keyout "$D/saldirgan.key" \
  -out "$D/saldirgan.crt" -days 2 -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" >/dev/null 2>&1

# Gercek sunucunun SPKI SHA-256 pini (istemciye gomecegimiz referans)
PIN=$(openssl x509 -in "$D/gercek.crt" -pubkey -noout \
      | openssl pkey -pubin -outform der 2>/dev/null \
      | openssl dgst -sha256 -binary | xxd -p -c 32)
echo "Gercek sunucu SPKI pini (SHA-256): $PIN"
echo "=============================================================="

# --- 2) Sunuculari baslat -------------------------------------------
openssl s_server -quiet -www -accept 127.0.0.1:14443 \
  -cert "$D/gercek.crt" -key "$D/gercek.key" >/dev/null 2>&1 &
GPID=$!
openssl s_server -quiet -www -accept 127.0.0.1:14444 \
  -cert "$D/saldirgan.crt" -key "$D/saldirgan.key" >/dev/null 2>&1 &
SPID=$!
# Sunucular dinlemeye baslasin (yerel; bir saniye fazlasiyla yeter).
sleep 1
temizle() { kill "$GPID" "$SPID" 2>/dev/null; }
trap temizle EXIT INT TERM

# --- 3) Senaryolar ---------------------------------------------------
echo "SENARYO 1 - Guvensiz istemci SALDIRGAN sunucuya (port 14444):"
"$B/tls_istemci" guvensiz localhost 14444 || true
echo "   ^ Sahte sertifika kabul edildi. MITM basarili olurdu."
echo "=============================================================="
echo "SENARYO 2 - Dogrulayan istemci GERCEK sunucuya (port 14443):"
"$B/tls_istemci" dogrula localhost 14443 "$D/ca.crt" || true
echo "=============================================================="
echo "SENARYO 3 - Dogrulayan istemci SALDIRGAN sunucuya (port 14444):"
"$B/tls_istemci" dogrula localhost 14444 "$D/ca.crt" || true
echo "   ^ Kendi imzali sertifika guvenilir CA'da yok: REDDEDILDI."
echo "=============================================================="
echo "SENARYO 4 - Pinleyen istemci GERCEK sunucuya, DOGRU pin:"
"$B/tls_istemci" pin localhost 14443 "$PIN" || true
echo "=============================================================="
echo "SENARYO 5 - Pinleyen istemci SALDIRGAN sunucuya, GERCEK pin ile:"
"$B/tls_istemci" pin localhost 14444 "$PIN" || true
echo "   ^ Anahtar tutmadi: pinning MITM'i durdurdu."

temizle
trap - EXIT INT TERM
