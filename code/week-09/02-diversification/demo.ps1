# CEN429 - Week 9 - Demo 2: Diversification (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
# SAFE: only measures files inside this folder; no file/network/system operation.
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\access_seed1001.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
function Line { "--------------------------------------------------------------" }

Line; "STEP 1 - Behavior: both seeds must give the same result"
& ".\$B\access_seed1001.exe" CEN429-OK
& ".\$B\access_seed2002.exe" CEN429-OK
& ".\$B\access_seed1001.exe" wrong
& ".\$B\access_seed2002.exe" wrong
$r1 = (& ".\$B\access_seed1001.exe" CEN429-OK) -replace '^\[seed \d+\] ', ''
$r2 = (& ".\$B\access_seed2002.exe" CEN429-OK) -replace '^\[seed \d+\] ', ''
if ($r1 -eq $r2) { "  -> Behavior is the SAME." } else { "  -> WARNING: behavior differs!" }

Line; "STEP 2 - Machine code: the two seeds must produce DIFFERENT binaries"
$h1 = (Get-FileHash ".\$B\access_seed1001.exe" -Algorithm SHA256).Hash
$h2 = (Get-FileHash ".\$B\access_seed2002.exe" -Algorithm SHA256).Hash
if ($h1 -eq $h2) {
    "  -> Binaries are identical (unexpected)."
} else {
    "  -> Binaries are DIFFERENT (SHA-256 differs: $($h1.Substring(0,12))... vs $($h2.Substring(0,12))...)."
    "     A patch written into one copy does not work on the other."
}

Line; "STEP 3 - grant_access() is encoded differently per seed (dumpbin)"
. "$PSScriptRoot\..\..\week-04\cen429_arac.ps1"
$d1 = Invoke-Dumpbin /disasm:nobytes ".\$B\access_seed1001.exe"
$d2 = Invoke-Dumpbin /disasm:nobytes ".\$B\access_seed2002.exe"
"  seed1001: $((($d1) | Measure-Object).Count) disasm lines total"
"  seed2002: $((($d2) | Measure-Object).Count) disasm lines total"
"  ^ For an exact per-function (grant_access only) count, run demo.sh under WSL (objdump)."

Line; "Result: diversification does not break the STRENGTH of obfuscation, it breaks its SCALABILITY (week 9 Rule 2)."
