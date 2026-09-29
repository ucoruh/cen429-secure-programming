#!/bin/sh
# CEN429 - Week 10 - Demo 1: certificate chain with OpenSSL (root -> intermediate -> server)
# Run:  sh demo.sh        (needs OpenSSL 1.1.1+ / 3.x; Windows: run from Git Bash)
# SAFE: only creates a temporary 'pki/' folder inside this directory and deletes it at the end.
#       No network access; no certificate is installed on the system; no sudo/admin rights used.
cd "$(dirname "$0")"
export MSYS_NO_PATHCONV=1   # Windows Git Bash: do not rewrite "/CN=.." as a file path (harmless on Linux)
command -v openssl >/dev/null 2>&1 || { echo "openssl not found."; exit 1; }
W=pki; rm -rf "$W"; mkdir "$W"; cd "$W"
line() { echo "--------------------------------------------------------------"; }

line; echo "STEP 1 - Root CA (self-signed; basicConstraints CA:TRUE by default)"
openssl req -x509 -newkey ed25519 -keyout root.key -out root.crt -nodes \
  -subj "/CN=Course Root CA" -days 3650 >/dev/null 2>&1 && echo "  root.crt created"

line; echo "STEP 2 - Intermediate CA (signed by the root; CA:TRUE extension)"
printf "basicConstraints=critical,CA:TRUE,pathlen:0\nkeyUsage=critical,keyCertSign,cRLSign\n" > intermediate.ext
openssl req -newkey ed25519 -keyout intermediate.key -out intermediate.csr -nodes \
  -subj "/CN=Course Intermediate CA" >/dev/null 2>&1
openssl x509 -req -in intermediate.csr -CA root.crt -CAkey root.key -CAcreateserial \
  -out intermediate.crt -days 1825 -extfile intermediate.ext >/dev/null 2>&1 \
  && echo "  intermediate.crt created (CA:TRUE)"

line; echo "STEP 3 - Server certificate (signed by the intermediate; CA:FALSE + SAN=example.test)"
printf "basicConstraints=CA:FALSE\nkeyUsage=digitalSignature\nsubjectAltName=DNS:example.test\n" > server.ext
openssl req -newkey ed25519 -keyout server.key -out server.csr -nodes -subj "/CN=example.test" >/dev/null 2>&1
openssl x509 -req -in server.csr -CA intermediate.crt -CAkey intermediate.key -CAcreateserial \
  -out server.crt -days 365 -extfile server.ext >/dev/null 2>&1 && echo "  server.crt created"

line; echo "STEP 4 - Verify WITHOUT the intermediate certificate (a common misconfiguration)"
echo "\$ openssl verify -CAfile root.crt server.crt"
openssl verify -CAfile root.crt server.crt 2>/dev/null \
  && echo "  VERIFY-RESULT: OK (unexpected)" \
  || echo "  VERIFY-RESULT: REJECTED (chain does not reach the root: the intermediate is missing)"

line; echo "STEP 5 - Verify WITH the intermediate certificate"
echo "\$ openssl verify -CAfile root.crt -untrusted intermediate.crt server.crt"
openssl verify -CAfile root.crt -untrusted intermediate.crt server.crt 2>/dev/null \
  && echo "  VERIFY-RESULT: OK (chain complete: signature + path to the trust anchor)" \
  || echo "  VERIFY-RESULT: REJECTED (unexpected)"

line; echo "STEP 6 - Validity dates: verify AS OF a time after expiry (-attime, no clock change needed)"
FUTURE=$(( $(date +%s) + 400*24*3600 ))   # ~400 days ahead: past the server certificate's 365-day validity
echo "\$ openssl verify -attime $FUTURE -CAfile root.crt -untrusted intermediate.crt server.crt"
openssl verify -attime "$FUTURE" -CAfile root.crt -untrusted intermediate.crt server.crt 2>/dev/null \
  && echo "  VERIFY-RESULT: OK (unexpected)" \
  || echo "  VERIFY-RESULT: REJECTED (the certificate has expired by time $FUTURE)"

line; echo "STEP 7 - Trust anchor: verify against an UNRELATED root (wrong CA)"
openssl req -x509 -newkey ed25519 -keyout rogue-root.key -out rogue-root.crt -nodes \
  -subj "/CN=Unrelated Root CA" -days 3650 >/dev/null 2>&1
echo "\$ openssl verify -CAfile rogue-root.crt -untrusted intermediate.crt server.crt"
openssl verify -CAfile rogue-root.crt -untrusted intermediate.crt server.crt 2>/dev/null \
  && echo "  VERIFY-RESULT: OK (unexpected)" \
  || echo "  VERIFY-RESULT: REJECTED (does not chain to this trust anchor)"

line; echo "STEP 8 - basicConstraints: a CA:FALSE certificate must not be able to sign other certificates"
printf "basicConstraints=CA:FALSE\nkeyUsage=digitalSignature\nsubjectAltName=DNS:other.test\n" > other.ext
openssl req -newkey ed25519 -keyout other.key -out other.csr -nodes -subj "/CN=other.test" >/dev/null 2>&1
openssl x509 -req -in other.csr -CA server.crt -CAkey server.key -CAcreateserial \
  -out other.crt -days 365 -extfile other.ext >/dev/null 2>&1
echo "\$ openssl verify -CAfile root.crt -untrusted intermediate.crt -untrusted server.crt other.crt"
openssl verify -CAfile root.crt -untrusted intermediate.crt -untrusted server.crt other.crt 2>/dev/null \
  && echo "  VERIFY-RESULT: OK (unexpected)" \
  || echo "  VERIFY-RESULT: REJECTED (server.crt has CA:FALSE, it may not sign certificates)"

line; echo "STEP 9 - Application-level check: 'verify' checks the CHAIN, not the hostname, unless asked to"
echo "\$ openssl verify -verify_hostname example.test -CAfile root.crt -untrusted intermediate.crt server.crt"
openssl verify -verify_hostname example.test -CAfile root.crt -untrusted intermediate.crt server.crt 2>/dev/null \
  && echo "  VERIFY-RESULT: OK (the SAN entry matches example.test)"
echo "\$ openssl verify -verify_hostname wrong.test -CAfile root.crt -untrusted intermediate.crt server.crt"
openssl verify -verify_hostname wrong.test -CAfile root.crt -untrusted intermediate.crt server.crt 2>/dev/null \
  && echo "  VERIFY-RESULT: OK (unexpected)" \
  || echo "  VERIFY-RESULT: REJECTED (the SAN list does not include wrong.test)"

line; echo "The four questions of chain validation: signature? reaches a trusted root? still valid? right name?"
cd ..; rm -rf "$W"; echo "(temporary pki/ deleted)"
