# CEN429 - Week 3 - Demo 2: nonce reuse (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\nonce_reuse.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
& "$B\nonce_reuse.exe"
