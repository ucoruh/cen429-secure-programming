# CEN429 - Week 6 - Demo 3: Environment (VM/emulator) + timing detection (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\environment.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
& "$B\environment.exe"
"--------------------------------------------------------------"
"Note: on most Windows machines Hyper-V/VBS/WSL2 can make the hypervisor bit"
"come out 'PRESENT'. That does not prove an analysis environment; it is a weak signal."
