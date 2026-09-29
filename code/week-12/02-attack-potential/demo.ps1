# CEN429 - Week 12 - Demo 2: Attack potential calculator (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\attack_potential.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
function Line { "--------------------------------------------------------------" }

Line; "STEP 1 - No arguments: score the three built-in example findings"
& "$B\attack_potential.exe"

Line; "STEP 2 - Explicit factor levels (time expertise knowledge opportunity equipment)"
"> unprotected license check"
& "$B\attack_potential.exe" 0 1 0 0 0
"> the SAME check, after adding the Week 9 protections"
& "$B\attack_potential.exe" 1 2 1 1 0

Line
"Note: a LOW total score means an EASY attack -- that is a SERIOUS finding, not a safe one."
