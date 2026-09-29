#!/bin/sh
# CEN429 — Week 2 — Demo 2: entropy meter (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
# The program only reads; samples are only produced inside this folder.
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/entropy" ] || { echo "Build first: ../../build.sh"; exit 1; }
E="$B/entropy"
O=output
line() { echo "--------------------------------------------------------------"; }

mkdir -p "$O"
"$B/generate" "$O" >/dev/null

line; echo "STEP 1 - Entropy of different kinds of files (0 = uniform, 8 = random)"
echo "  file             bytes    H |0 bit ------------ 8 bit| verdict"
"$E" "$O/uniform.txt" "$O/document.txt" "$O/code.bin" "$O/encrypted.bin" \
     "$O/random.bin"
echo "   ^ Text is low, machine-code-like is medium, encrypted/random is high."

line; echo "STEP 2 - The same content in three forms: plain -> machine-code-like -> encrypted"
"$E" "$O/document.txt" "$O/code.bin" "$O/encrypted.bin"
echo "   ^ Encrypted and random data CANNOT BE TOLD APART by entropy alone."

line; echo "STEP 3 - A mixed file: an encrypted section hidden in the middle of text"
"$E" -p 512 "$O/mixed.bin"
echo "   ^ Packed programs show a similar 'hot spot':"
echo "     a small unpacking stub + a high-entropy encrypted body."

line; echo "STEP 4 - A sign of ransomware: when a file is encrypted in place"
printf '  before: '; "$E" "$O/document.txt"  | sed 's/^ *//'
printf '  after : '; "$E" "$O/encrypted.bin" | sed 's/^ *//'
echo "   ^ If a process does this jump to many files in a short time,"
echo "     behaviour-based protection raises an alarm."
