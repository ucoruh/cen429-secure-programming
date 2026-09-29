# CEN429 - Week 9 - Demo 1: Manual obfuscation and cost measurement (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
# SAFE: only measures files inside this folder; no file/network/system operation.
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\access_clean.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
$TOKEN = "CEN429-OK"     # valid synthetic token (NOT embedded in the binary, passed in here)
function Line { "--------------------------------------------------------------" }

Line; "STEP 1 - Was behavior preserved? (both versions give the same output)"
"> access_clean.exe $TOKEN CEN429-XX short"
& ".\$B\access_clean.exe" $TOKEN CEN429-XX short
$outClean = & ".\$B\access_clean.exe" $TOKEN CEN429-XX short ""
$outObf   = & ".\$B\access_obfuscated.exe" $TOKEN CEN429-XX short ""
if (($outClean -join "`n") -eq ($outObf -join "`n")) {
    "  -> Both versions' output is BYTE-IDENTICAL. Behavior was preserved."
} else {
    "  -> WARNING: outputs differ!"
}

Line; "STEP 2 - Is the secret visible in the binary? (poor man's 'strings')"
$inClean = (Select-String -Path ".\$B\access_clean.exe" -Pattern $TOKEN -SimpleMatch -Quiet)
$inObf   = (Select-String -Path ".\$B\access_obfuscated.exe" -Pattern $TOKEN -SimpleMatch -Quiet)
"  clean:      $(if ($inClean) { 'VISIBLE (unprotected)' } else { 'not found' })"
"  obfuscated: $(if ($inObf) { 'VISIBLE' } else { 'NOT VISIBLE  <- R-07 string encoding' })"

Line; "STEP 3 - Cost: machine code size (dumpbin)"
. "$PSScriptRoot\..\..\week-04\cen429_arac.ps1"
$d1 = Invoke-Dumpbin /disasm:nobytes ".\$B\access_clean.exe"
$d2 = Invoke-Dumpbin /disasm:nobytes ".\$B\access_obfuscated.exe"
function JumpCount($lines) { ($lines | Select-String -Pattern '\bjmp\b|\bje\b|\bjne\b').Count }
"  clean      : $((($d1) | Measure-Object).Count) disasm lines total, $(JumpCount $d1) jump(s)"
"  obfuscated : $((($d2) | Measure-Object).Count) disasm lines total, $(JumpCount $d2) jump(s)"
"  ^ The obfuscated version's line and jump counts go up = the MEASURED cost of obfuscation."
"    For an exact per-function (grant_access only) count, run demo.sh under WSL (objdump)."

Line; "Result: same behavior, secret hidden, cost measured. This table feeds into the term project's S9."
