# CEN429 - Week 3 - Demo 8: data in use - secure wiping (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\memory_wipe.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
& "$B\memory_wipe.exe"
