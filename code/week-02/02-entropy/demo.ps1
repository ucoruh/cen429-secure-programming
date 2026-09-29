# CEN429 - Week 2 - Demo 2: entropy meter (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
# The program only reads; samples are only produced inside this folder.
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\entropy.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
$E = ".\$B\entropy.exe"
$O = "output"
function Line { "--------------------------------------------------------------" }

New-Item -ItemType Directory -Force $O | Out-Null
& ".\$B\generate.exe" $O | Out-Null

Line; "STEP 1 - Entropy of different kinds of files (0 = uniform, 8 = random)"
"  file             bytes    H |0 bit ------------ 8 bit| verdict"
& $E "$O\uniform.txt" "$O\document.txt" "$O\code.bin" "$O\encrypted.bin" "$O\random.bin"
"   ^ Text is low, machine-code-like is medium, encrypted/random is high."

Line; "STEP 2 - The same content in three forms: plain -> machine-code-like -> encrypted"
& $E "$O\document.txt" "$O\code.bin" "$O\encrypted.bin"
"   ^ Encrypted and random data CANNOT BE TOLD APART by entropy alone."

Line; "STEP 3 - A mixed file: an encrypted section hidden in the middle of text"
& $E -p 512 "$O\mixed.bin"
"   ^ Packed programs show a similar 'hot spot':"
"     a small unpacking stub + a high-entropy encrypted body."

Line; "STEP 4 - A sign of ransomware: when a file is encrypted in place"
"  before: " + (& $E "$O\document.txt").Trim()
"  after : " + (& $E "$O\encrypted.bin").Trim()
"   ^ If a process does this jump to many files in a short time,"
"     behaviour-based protection raises an alarm."
