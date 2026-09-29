# CEN429 - Week 6 - Demo 8: RASP engine + response policy (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\rasp.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
function Line { "==============================================================" }

Line; "SCENARIO 1 - normal: 0 failed checks, device matches -> NORMAL"
& "$B\rasp.exe" normal
Line; "SCENARIO 2 - warn: 1 failed check -> WARN (still opens, just logged)"
& "$B\rasp.exe" warn
Line; "SCENARIO 3 - degrade: 2 failed checks -> DEGRADE (wiped, redacted result)"
& "$B\rasp.exe" degrade
Line; "SCENARIO 4 - lock: 3 failed checks -> LOCK (wipe + decoy + flag)"
& "$B\rasp.exe" lock
Line; "SCENARIO 5 - other-device: checks pass, device key does not hold -> LOCK"
& "$B\rasp.exe" other-device
Line
"Lesson: detection alone is not enough; what matters is a GRADED RESPONSE"
"policy (warn/degrade/lock, not just block-or-allow) plus device/version"
"binding (a copied key still will not open on a different device)."
