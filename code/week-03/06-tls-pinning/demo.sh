#!/bin/sh
# CEN429 - Week 3 - Demo 6: TLS verification, hostname and SPKI pinning (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
# Generates our own CA, a "real" and an "attacker" server, starts two local TLS servers and
# tries the client in three modes. Only 127.0.0.1.
set -u
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/tls_client" ] || { echo "Build first: ../../build.sh"; exit 1; }
command -v openssl >/dev/null || { echo "openssl is required"; exit 1; }

D=output
rm -rf "$D" && mkdir -p "$D"
# Free up the ports if a previous run left a local server behind.
fuser -k 14443/tcp 14444/tcp 2>/dev/null || true

# --- 1) Certificates -------------------------------------------------
# Our own root CA
openssl req -x509 -newkey rsa:2048 -nodes -keyout "$D/ca.key" \
  -out "$D/ca.crt" -days 2 -subj "/CN=CEN429 Demo CA" >/dev/null 2>&1
# The real server: CN=localhost, signed by our CA
openssl req -newkey rsa:2048 -nodes -keyout "$D/real.key" \
  -out "$D/real.csr" -subj "/CN=localhost" >/dev/null 2>&1
printf 'subjectAltName=DNS:localhost,IP:127.0.0.1\n' > "$D/san.ext"
openssl x509 -req -in "$D/real.csr" -CA "$D/ca.crt" \
  -CAkey "$D/ca.key" -CAcreateserial -days 2 \
  -extfile "$D/san.ext" -out "$D/real.crt" >/dev/null 2>&1
# The attacker's server: CN=localhost but SELF-SIGNED (not in our CA)
openssl req -x509 -newkey rsa:2048 -nodes -keyout "$D/attacker.key" \
  -out "$D/attacker.crt" -days 2 -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" >/dev/null 2>&1

# The real server's SPKI SHA-256 pin (the reference value we embed in the client)
PIN=$(openssl x509 -in "$D/real.crt" -pubkey -noout \
      | openssl pkey -pubin -outform der 2>/dev/null \
      | openssl dgst -sha256 -binary | xxd -p -c 32)
echo "The real server's SPKI pin (SHA-256): $PIN"
echo "=============================================================="

# --- 2) Start the servers -------------------------------------------
openssl s_server -quiet -www -accept 127.0.0.1:14443 \
  -cert "$D/real.crt" -key "$D/real.key" >/dev/null 2>&1 &
REAL_PID=$!
openssl s_server -quiet -www -accept 127.0.0.1:14444 \
  -cert "$D/attacker.crt" -key "$D/attacker.key" >/dev/null 2>&1 &
ATT_PID=$!
# Give the servers a moment to start listening (local; one second is plenty).
sleep 1
cleanup() { kill "$REAL_PID" "$ATT_PID" 2>/dev/null; }
trap cleanup EXIT INT TERM

# --- 3) Scenarios ---------------------------------------------------
echo "SCENARIO 1 - Insecure client to the ATTACKER's server (port 14444):"
"$B/tls_client" insecure localhost 14444 || true
echo "   ^ The fake certificate was accepted. A MITM would have succeeded."
echo "=============================================================="
echo "SCENARIO 2 - Verifying client to the REAL server (port 14443):"
"$B/tls_client" verify localhost 14443 "$D/ca.crt" || true
echo "=============================================================="
echo "SCENARIO 3 - Verifying client to the ATTACKER's server (port 14444):"
"$B/tls_client" verify localhost 14444 "$D/ca.crt" || true
echo "   ^ The self-signed certificate is not in our trusted CA: REJECTED."
echo "=============================================================="
echo "SCENARIO 4 - Pinning client to the REAL server, with the CORRECT pin:"
"$B/tls_client" pin localhost 14443 "$PIN" || true
echo "=============================================================="
echo "SCENARIO 5 - Pinning client to the ATTACKER's server, with the REAL pin:"
"$B/tls_client" pin localhost 14444 "$PIN" || true
echo "   ^ The key did not match: pinning stopped the MITM."

cleanup
trap - EXIT INT TERM
