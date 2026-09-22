# CEN429 - Hafta 3 - Demo 9: Guvenlik kabuklari (Windows)
# Once derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\kabuk.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
& "$B\kabuk.exe"
