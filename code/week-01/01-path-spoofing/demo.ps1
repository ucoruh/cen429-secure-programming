# CEN429 — Week 1 — Demo 1: PATH spoofing (Windows)
# Build first: ..\..\build.ps1  (or in Visual Studio: Build All with "Windows (MSVC)")
# Then: .\demo.ps1   (if it won't run: powershell -ExecutionPolicy Bypass -File .\demo.ps1)
# Only works inside this folder; the PATH change is only in effect inside this script.
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\report.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
function Line { "--------------------------------------------------------------" }

Line; "STEP 1 - Normal run: the program finds the real hostname"
"> .\$B\report.exe"
& ".\$B\report.exe"

Line; "STEP 2 - Attack: the fake\ folder is added to the front of PATH"
"> `$env:PATH = `"$PWD\fake;`" + `$env:PATH ; .\$B\report.exe"
$old = $env:PATH
$env:PATH = "$PSScriptRoot\fake;" + $env:PATH
& ".\$B\report.exe"

Line; "STEP 3 - The fixed version under the same attack"
"> .\$B\report_secure.exe"
& ".\$B\report_secure.exe"
$env:PATH = $old

Line; "Result: the secure version uses an absolute path + shell-less launch (CreateProcessW) + a small environment."
