#!/bin/sh
# CEN429 — Week 2 — Demo 1: signatures, polymorphism, heuristics, emulation
# Build first: ../../build.sh     Then: sh demo.sh
# The program only reads; it never modifies, deletes, or runs any file.
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/scanner" ] || { echo "Build first: ../../build.sh"; exit 1; }
I=signatures.txt
O=output
T="$B/scanner"
line() { echo "--------------------------------------------------------------"; }

mkdir -p "$O"
"$B/generate_samples" "$O" >/dev/null

line; echo "STEP 1 - The lab examines the captured sample: digest and entropy"
"$T" digest "$I" "$O/sample_a.bin"
echo "  Signature database entries:"
grep -v '^#' "$I" | cut -c1-64 | sed 's/^/    /'

line; echo "STEP 2 - Hash (digest) signature: catches the exact same file"
"$T" hash "$I" "$O/clean.txt" "$O/sample_a.bin" "$O/sample_a_1byte.bin"
echo "   ^ Change a single byte and the digest is completely different: the hash signature is evaded."

line; echo "STEP 3 - Pattern (byte sequence) signature: survives small changes"
"$T" pattern "$I" "$O/sample_a.bin" "$O/sample_a_1byte.bin" \
    "$O/poly_1.bin" "$O/poly_2.bin" "$O/poly_3.bin"
echo "   ^ poly_1/poly_2 were caught by the decoder pattern; poly_3, whose"
echo "     decoder changed, was never caught at all (polymorphism)."

line; echo "STEP 4 - Same body, different key: the encrypted copies look nothing alike"
"$T" body16 "$I" "$O/poly_1.bin" "$O/poly_2.bin" "$O/poly_3.bin"

line; echo "STEP 5 - Heuristic analysis: no signature, score suspicious traits"
"$T" heuristic "$I" "$O/clean.txt" "$O/sample_a.bin" "$O/poly_1.bin" \
    "$O/poly_3.bin" "$O/archive.bin"
echo "   ^ archive.bin is a harmless high-entropy file: a FALSE POSITIVE."
echo "     sample_a.bin slipped past the heuristic (a false negative)."

line; echo "STEP 6 - Emulation: run the decoder in a safe environment, then scan"
"$T" emulation "$I" "$O/clean.txt" "$O/sample_a.bin" "$O/poly_1.bin" \
    "$O/poly_2.bin" "$O/poly_3.bin" "$O/archive.bin"

line; echo "Result: a single method is not enough; scanners work in layers."
