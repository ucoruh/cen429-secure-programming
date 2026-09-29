#!/bin/sh
# End-to-end test for tls_client: starts two local OpenSSL TLS servers (a "real" one and an
# "attacker" one) with freshly generated certificates, then runs the REAL compiled tls_client
# binary through all five demo.sh scenarios and asserts the expected accept/reject outcome for
# each. Prints "E2E_TLS_ALL_OK" only if every scenario matched; the CTest entry's PASS_REGEX
# looks for exactly that line, so any mismatch (wrong accept/reject, a crash, a missing tool)
# makes the test fail.
set -u
cd "$(dirname "$0")/.."     # the demo folder (CMAKE_CURRENT_SOURCE_DIR)
B=bin/linux
FAIL=0
note() { echo "  $1"; }
expect_pass() { if [ "$1" -eq 0 ]; then note "OK: $2"; else FAIL=1; note "MISMATCH (expected accept): $2"; fi; }
expect_reject() { if [ "$1" -ne 0 ]; then note "OK: $2"; else FAIL=1; note "MISMATCH (expected reject): $2"; fi; }

[ -x "$B/tls_client" ] || { echo "tls_client binary not found, build first"; exit 1; }
command -v openssl >/dev/null || { echo "openssl is required"; exit 1; }

D=tests/tmp-e2e
rm -rf "$D" && mkdir -p "$D"
fuser -k 15553/tcp 15554/tcp 2>/dev/null || true

openssl req -x509 -newkey rsa:2048 -nodes -keyout "$D/ca.key" \
  -out "$D/ca.crt" -days 2 -subj "/CN=CEN429 Test CA" >/dev/null 2>&1
openssl req -newkey rsa:2048 -nodes -keyout "$D/real.key" \
  -out "$D/real.csr" -subj "/CN=localhost" >/dev/null 2>&1
printf 'subjectAltName=DNS:localhost,IP:127.0.0.1\n' > "$D/san.ext"
openssl x509 -req -in "$D/real.csr" -CA "$D/ca.crt" \
  -CAkey "$D/ca.key" -CAcreateserial -days 2 \
  -extfile "$D/san.ext" -out "$D/real.crt" >/dev/null 2>&1
openssl req -x509 -newkey rsa:2048 -nodes -keyout "$D/attacker.key" \
  -out "$D/attacker.crt" -days 2 -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" >/dev/null 2>&1

PIN=$(openssl x509 -in "$D/real.crt" -pubkey -noout \
      | openssl pkey -pubin -outform der 2>/dev/null \
      | openssl dgst -sha256 -binary | xxd -p -c 32)
BAD_PIN=$(printf '%064d' 0)

openssl s_server -quiet -www -accept 127.0.0.1:15553 \
  -cert "$D/real.crt" -key "$D/real.key" >/dev/null 2>&1 &
REAL_PID=$!
openssl s_server -quiet -www -accept 127.0.0.1:15554 \
  -cert "$D/attacker.crt" -key "$D/attacker.key" >/dev/null 2>&1 &
ATT_PID=$!
cleanup() { kill "$REAL_PID" "$ATT_PID" 2>/dev/null; }
trap cleanup EXIT INT TERM
sleep 1

"$B/tls_client" insecure localhost 15554 >/dev/null 2>&1
expect_pass $? "insecure client accepts the attacker's certificate (MITM would succeed)"

"$B/tls_client" verify localhost 15553 "$D/ca.crt" >/dev/null 2>&1
expect_pass $? "verify client accepts the real server"

"$B/tls_client" verify localhost 15554 "$D/ca.crt" >/dev/null 2>&1
expect_reject $? "verify client rejects the attacker's self-signed certificate"

"$B/tls_client" pin localhost 15553 "$PIN" >/dev/null 2>&1
expect_pass $? "pin client accepts the real server with the correct pin"

"$B/tls_client" pin localhost 15554 "$PIN" >/dev/null 2>&1
expect_reject $? "pin client rejects the attacker even with a chain-agnostic pin check"

"$B/tls_client" pin localhost 15553 "$BAD_PIN" >/dev/null 2>&1
expect_reject $? "pin client rejects the real server when given the WRONG pin"

cleanup
trap - EXIT INT TERM
rm -rf "$D"

if [ "$FAIL" -eq 0 ]; then
    echo "E2E_TLS_ALL_OK"
else
    echo "E2E_TLS_FAILED"
    exit 1
fi
