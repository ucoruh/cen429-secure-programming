# CEN429 - Hafta 3 - Demo 5: HKDF oturum anahtarlari (Windows)
# Once derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\hkdf.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
& "$B\hkdf.exe"
