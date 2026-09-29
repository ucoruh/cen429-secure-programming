#!/bin/sh
# CEN429 - Week 3 - Demo 1: AES-256-GCM file encryption (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/aes_gcm_file" ] || { echo "Build first: ../../build.sh"; exit 1; }
rm -rf output && mkdir -p output
line() { echo "--------------------------------------------------------------"; }

line; echo "STEP 1 - A 32-byte random key and a sample secret file"
head -c 32 /dev/urandom > output/key.bin
printf 'IBAN: TR00 0000 0000 0000 0000 0000 00\nBalance: 12345\n' \
    > output/secret.txt
echo "secret.txt contents:"; sed 's/^/   /' output/secret.txt

line; echo "STEP 2 - Encrypt"
"$B/aes_gcm_file" encrypt output/key.bin output/secret.txt output/secret.enc
echo "First bytes of the ciphertext file (nonce + ciphertext):"
od -A x -t x1z output/secret.enc | head -3 | sed 's/^/   /'

line; echo "STEP 3 - Decrypt correctly (the tag matches)"
"$B/aes_gcm_file" decrypt output/key.bin output/secret.enc output/decrypted.txt
echo "Decrypted contents:"; sed 's/^/   /' output/decrypted.txt

line; echo "STEP 4 - Attack: change byte 20 of the ciphertext"
cp output/secret.enc output/tampered.enc
printf '\377' | dd of=output/tampered.enc bs=1 seek=20 count=1 conv=notrunc \
    status=none 2>/dev/null
echo "> aes_gcm_file decrypt ... tampered.enc"
"$B/aes_gcm_file" decrypt output/key.bin output/tampered.enc output/wont-happen.txt \
    || echo "   (exit code 2 - decryption rejected)"

line; echo "STEP 5 - Attack: change only the last byte of the TAG"
cp output/secret.enc output/tag-tampered.enc
LAST=$(($(wc -c < output/tag-tampered.enc) - 1))
printf '\000' | dd of=output/tag-tampered.enc bs=1 seek="$LAST" count=1 \
    conv=notrunc status=none 2>/dev/null
"$B/aes_gcm_file" decrypt output/key.bin output/tag-tampered.enc output/wont-happen2.txt \
    || echo "   (exit code 2 - the tag did not match)"
