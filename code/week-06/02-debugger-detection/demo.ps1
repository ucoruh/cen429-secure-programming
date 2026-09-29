# CEN429 - Week 6 - Demo 2: Debugger detection (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\antidebug.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
function Line { "--------------------------------------------------------------" }

Line; "STEP 1 - Normal run (NO debugger): clean is expected"
& "$B\antidebug.exe"
"   (exit code $LASTEXITCODE - 0 = clean)"

Line
"STEP 2 - To see it under a debugger:"
"  Visual Studio: set 'antidebug' as the startup project, run with F5."
"  IsDebuggerPresent will return YES and the RESULT will say 'detected'."
"  Or: attach with cdb/windbg and run."
