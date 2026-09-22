# CEN429 - Hafta 3 - Demo 3: ECB deseni sizdirir (Windows)
# Once derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\ecb.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
& "$B\ecb.exe"
