# CEN429 - Week 2 - Demo 12: Windows ACE evaluation simulator (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
# The simulator is pure computation; the real-system step only creates a file
# under output\ and READS its ACL (icacls, whoami). No administrator rights needed.
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\ace.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
$E = ".\$B\ace.exe"
function Line { "--------------------------------------------------------------" }

Line; "STEP 1 - ACE ORDER: the first matching DENY stops the request (the book's example)"
& $E scenario-1-order.txt

Line; "STEP 2 - a NULL DACL (every right to everyone) vs an EMPTY DACL (no right to anyone)"
& $E scenario-2-null-empty.txt

Line; "STEP 3 - INHERITANCE: explicit ACEs come before inherited ACEs"
& $E scenario-3-inheritance.txt

Line; "STEP 4 - the UAC filter (a deny-only group) and integrity levels (MIC)"
& $E scenario-4-uac-mic.txt

Line; "STEP 5 - OWNER_RIGHTS and the TAKE_OWNERSHIP privilege"
& $E scenario-5-owner-privilege.txt

Line; "STEP 6 - the real system: this demo's OWN file's DACL (read-only)"
New-Item -ItemType Directory -Force output | Out-Null
Set-Content -Path output\sample.txt -Value "sample data" -Encoding ascii
"> icacls output\sample.txt"
icacls output\sample.txt
"   ^ (I) = an ACE inherited from the parent folder, (F) full, (M) modify, (RX) read+execute"
""
"> whoami /groups   (only the integrity-label line: S-1-16-...)"
whoami /groups /fo csv | Select-String "S-1-16-"
"   ^ S-1-16-8192 = Medium: a normal (unelevated) process"
""
"> whoami /priv     (the privileges in this process's token)"
whoami /priv

Line; "Result: Windows walks ACEs IN ORDER; a DENY only ever blocks a right"
"not yet granted; a NULL DACL opens up to everyone, an EMPTY DACL closes to"
"everyone; MIC comes before the DACL; the owner can always change the DACL via WRITE_DAC."
