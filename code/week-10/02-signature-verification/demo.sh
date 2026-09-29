#!/bin/sh
# CEN429 - Week 10 - Demo 2: ECDSA (P-256) signature creation/verification and its pitfalls.
# Run:  sh demo.sh        (needs OpenSSL 1.1.1+ / 3.x -- dgst -sign/-verify with an EC key work on both)
# SAFE: only creates temporary files inside this folder and deletes them; no network/system changes.
cd "$(dirname "$0")"
command -v openssl >/dev/null 2>&1 || { echo "openssl not found."; exit 1; }
W=sig; rm -rf "$W"; mkdir "$W"; cd "$W"
line() { echo "--------------------------------------------------------------"; }

line; echo "STEP 1 - Generate an ECDSA P-256 key pair (the real publisher)"
openssl ecparam -name prime256v1 -genkey -noout -out signer.key >/dev/null 2>&1
openssl ec -in signer.key -pubout -out signer.pub >/dev/null 2>&1 \
  && echo "  signer.key (private) + signer.pub (public) created"

line; echo "STEP 2 - Sign an update file (the VERSION is part of the signed content!)"
printf 'version=1.2.0\nbody=update contents\n' > update.bin
openssl dgst -sha256 -sign signer.key -out update.sig update.bin >/dev/null 2>&1 \
  && echo "  update.sig created ($(wc -c < update.sig) bytes)"

line; echo "STEP 3 - Verify: correct signature, correct key"
if openssl dgst -sha256 -verify signer.pub -signature update.sig update.bin >/dev/null 2>&1; then
  echo "  VERIFY-RESULT: VALID (install). openssl exit code = 0."
else
  echo "  VERIFY-RESULT: unexpected rejection of a valid signature."
fi

line; echo "STEP 4 - Tampering: one byte of the body is changed after signing"
printf 'version=1.2.0\nbody=update contentX\n' > tampered.bin
if openssl dgst -sha256 -verify signer.pub -signature update.sig tampered.bin >/dev/null 2>&1; then
  echo "  VERIFY-RESULT: unexpected accept of a tampered file!"
else
  echo "  VERIFY-RESULT: INVALID. The tampered update is REJECTED (exit code != 0)."
fi

line; echo "STEP 5 - Downgrade: an OLDER, but still validly signed, version is offered again"
printf 'version=1.0.0\nbody=update contents\n' > old.bin
openssl dgst -sha256 -sign signer.key -out old.sig old.bin >/dev/null 2>&1
if openssl dgst -sha256 -verify signer.pub -signature old.sig old.bin >/dev/null 2>&1; then
  echo "  VERIFY-RESULT: VALID -- the signature alone cannot tell version 1.0.0 from 1.2.0."
  echo "  (the caller must ALSO check that 1.0.0 is not older than the version already installed)"
fi

line; echo "STEP 6 - Wrong trust: verifying with the ATTACKER's own key 'validates' the attacker's own message"
openssl ecparam -name prime256v1 -genkey -noout -out attacker.key >/dev/null 2>&1
openssl ec -in attacker.key -pubout -out attacker.pub >/dev/null 2>&1
printf 'version=9.9.9\nbody=malicious payload\n' > evil.bin
openssl dgst -sha256 -sign attacker.key -out evil.sig evil.bin >/dev/null 2>&1
if openssl dgst -sha256 -verify attacker.pub -signature evil.sig evil.bin >/dev/null 2>&1; then
  echo "  VERIFY-RESULT: VALID against attacker.pub -- a signature only means something if the CALLER"
  echo "  pinned the RIGHT public key in advance; a self-consistent attacker key is not that key."
fi
if openssl dgst -sha256 -verify signer.pub -signature evil.sig evil.bin >/dev/null 2>&1; then
  echo "  VERIFY-RESULT: unexpected accept of evil.bin against the real signer.pub."
else
  echo "  VERIFY-RESULT: correctly REJECTED against the real signer.pub (the only key that should be trusted)."
fi

line; echo "PITFALLS (see slides):"
echo "  * In code, 'if (EVP_DigestVerify(...))' is WRONG: a negative error code is also truthy; compare with '== 1'."
echo "  * The signed content must include the VERSION, or an old-but-validly-signed release enables a downgrade."
echo "  * The verification key must be the right one, pinned in advance -- verifying with the attacker's"
echo "    own key 'validates' the attacker's own message."
cd ..; rm -rf "$W"; echo "(temporary sig/ deleted)"
