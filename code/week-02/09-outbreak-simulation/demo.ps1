# CEN429 - Week 2 - Demo 09: worm outbreak simulation (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
# The program only computes; it connects to no network and produces no file.
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\outbreak.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
function Line { "--------------------------------------------------------------" }

Line; "Comparing three spreading strategies with the SI model"
& ".\$B\outbreak.exe"
Line
"Note: the real Slammer slowed down after the first minute because it"
"saturated NETWORK BANDWIDTH (not because it ran out of susceptible machines)."
