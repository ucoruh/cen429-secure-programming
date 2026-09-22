# CEN429 - Hafta 3 - Demo 8: Kullanimda veri - guvenli silme (Windows)
# Once derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\bellek.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
& "$B\bellek.exe"
