# CEN429 - Week 6 - Demo 7: Root/privilege indicator detection (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\privilege.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
if (Test-Path output) { Remove-Item -Recurse -Force output }
New-Item -ItemType Directory -Force output | Out-Null
function Line { "--------------------------------------------------------------" }

Line; "STEP 1 - Normal run (not admin, no indicator): clean is expected"
& "$B\privilege.exe"
"   (exit code $LASTEXITCODE)"

Line; "STEP 2 - Flagged case: a fake 'su' indicator file is created"
Set-Content -Path output\fake_su -Value "fake root indicator" -NoNewline
"> output\fake_su created; passed in as an extra indicator"
& "$B\privilege.exe" "output\fake_su"
if ($LASTEXITCODE -ne 0) { "   (exit code $LASTEXITCODE - indicator DETECTED)" }

Line
"Try it: open PowerShell 'as Administrator' and run the demo again. The"
"privilege level will come out 'ELEVATED'. (No demo in this course ever"
"REQUIRES administrator rights; this is only an optional experiment.)"
