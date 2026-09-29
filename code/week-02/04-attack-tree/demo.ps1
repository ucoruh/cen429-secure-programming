# CEN429 - Week 2 - Demo 4: attack tree cost calculator (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
# A calculator; it never carries out an attack, it never touches a file.
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\tree.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
$A = ".\$B\tree.exe"
function Line { "--------------------------------------------------------------" }

Line; "STEP 1 - Before: the key in memory is the weakest point"
& $A tree-payment.txt
Line; "STEP 2 - After: RASP was added to the 'read from memory' branch"
& $A tree-defense.txt
Line; "STEP 3 - Multi-attribute: cost + time + skill"
& $A tree-attributed.txt
Line; "Result: the defense raised the cheapest attack from 2 to 8 units."
"The weakest point is now a different branch; the defender should focus there."
"AND nodes make an attack more expensive (defence in depth)."
