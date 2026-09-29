# CEN429 - Week 3 - Demo 5: HKDF session keys (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\hkdf_session.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
& "$B\hkdf_session.exe"
