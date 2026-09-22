# CEN429 - Hafta 3 - Demo 2: Nonce yeniden kullanimi (Windows)
# Once derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\nonce.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
& "$B\nonce.exe"
