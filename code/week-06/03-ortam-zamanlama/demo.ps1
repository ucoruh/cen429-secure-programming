# CEN429 - Hafta 6 - Demo 3: Ortam (VM/emulator) + zamanlama algilama (Windows)
# Once derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\ortam.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
& "$B\ortam.exe"
"--------------------------------------------------------------"
"Not: Cogu Windows makinesinde Hyper-V/VBS/WSL2 nedeniyle 'hipervizor VAR'"
"cikabilir. Bu, analiz ortami OLDUGUNU kanitlamaz; zayif bir sinyaldir."
