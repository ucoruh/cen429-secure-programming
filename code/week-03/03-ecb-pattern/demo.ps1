# CEN429 - Week 3 - Demo 3: ECB mode leaks patterns (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\ecb_pattern.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
& "$B\ecb_pattern.exe"
