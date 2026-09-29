# CEN429 - Week 3 - Demo 9: security layers (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\security_layers.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
& "$B\security_layers.exe"
