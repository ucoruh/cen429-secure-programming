# CEN429 - Week 4 - Demo 3: undefined behavior (UBSan) (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\ub.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
function Line { "--------------------------------------------------------------" }

Line; "STEP 1 - Unprotected: UB 'looks like it works', the result is WRONG"
"> .\$B\ub.exe overflow 1"; & ".\$B\ub.exe" overflow 1
"> .\$B\ub.exe shift 31"; & ".\$B\ub.exe" shift 31
"> .\$B\ub.exe unaligned"; & ".\$B\ub.exe" unaligned
Line; "STEP 2 - Windows has NO UBSan: what can we do instead?"
"   MSVC does not have UndefinedBehaviorSanitizer. Options:"
"   - Static analysis: cl /analyze (flags some overflow/shift cases)"
"   - Run-time checks: /RTC1 /RTCc (Debug; catches data loss)"
"   - SEI CERT C rules + portable checks (this demo's secure version)"
"   - AddressSanitizer catches memory errors but NOT integer overflow."
. "$PSScriptRoot\..\..\common\cen429_msvc.ps1"
"> cl /analyze /I..\..\common ub.c"
Invoke-Cl /nologo /Zs /analyze /I..\..\common ub.c |
    Select-String -Pattern 'warning|C4\d{3}|C6\d{3}|C28\d{3}' | Select-Object -First 4
Line; "STEP 3 - Fixed version: explicit checks (the same on both platforms)"
"> .\$B\ub_secure.exe overflow 1"; & ".\$B\ub_secure.exe" overflow 1
"> .\$B\ub_secure.exe shift 31"; & ".\$B\ub_secure.exe" shift 31
"> .\$B\ub_secure.exe shift 8"; & ".\$B\ub_secure.exe" shift 8
"> .\$B\ub_secure.exe unaligned"; & ".\$B\ub_secure.exe" unaligned
