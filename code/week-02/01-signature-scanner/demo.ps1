# CEN429 - Week 2 - Demo 1: signatures, polymorphism, heuristics, emulation (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
# The program only reads; it never modifies, deletes, or runs any file.
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\scanner.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
$I = "signatures.txt"
$O = "output"
$T = ".\$B\scanner.exe"
function Line { "--------------------------------------------------------------" }

New-Item -ItemType Directory -Force $O | Out-Null
& ".\$B\generate_samples.exe" $O | Out-Null

Line; "STEP 1 - The lab examines the captured sample: digest and entropy"
& $T digest $I "$O\sample_a.bin"
"  Signature database entries:"
Get-Content $I | Where-Object { $_ -notmatch '^#' } | ForEach-Object { "    " + $_.Substring(0, [Math]::Min(64, $_.Length)) }

Line; "STEP 2 - Hash (digest) signature: catches the exact same file"
& $T hash $I "$O\clean.txt" "$O\sample_a.bin" "$O\sample_a_1byte.bin"
"   ^ Change a single byte and the digest is completely different: the hash signature is evaded."

Line; "STEP 3 - Pattern (byte sequence) signature: survives small changes"
& $T pattern $I "$O\sample_a.bin" "$O\sample_a_1byte.bin" "$O\poly_1.bin" "$O\poly_2.bin" "$O\poly_3.bin"
"   ^ poly_1/poly_2 were caught by the decoder pattern; poly_3, whose"
"     decoder changed, was never caught at all (polymorphism)."

Line; "STEP 4 - Same body, different key: the encrypted copies look nothing alike"
& $T body16 $I "$O\poly_1.bin" "$O\poly_2.bin" "$O\poly_3.bin"

Line; "STEP 5 - Heuristic analysis: no signature, score suspicious traits"
& $T heuristic $I "$O\clean.txt" "$O\sample_a.bin" "$O\poly_1.bin" "$O\poly_3.bin" "$O\archive.bin"
"   ^ archive.bin is a harmless high-entropy file: a FALSE POSITIVE."
"     sample_a.bin slipped past the heuristic (a false negative)."

Line; "STEP 6 - Emulation: run the decoder in a safe environment, then scan"
& $T emulation $I "$O\clean.txt" "$O\sample_a.bin" "$O\poly_1.bin" "$O\poly_2.bin" "$O\poly_3.bin" "$O\archive.bin"

Line; "Result: a single method is not enough; scanners work in layers."
