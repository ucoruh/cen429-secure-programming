# CEN429 - Week 12 - Demo 1: Unit test runner (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\unit_test.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
function Line { "--------------------------------------------------------------" }

Line; "Running the six test cards for validate_input() and safe_add()"
& "$B\unit_test.exe"
"   (exit code $LASTEXITCODE - 0 = every test card PASSED)"

Line
"Note: the exit code equals the number of FAILED test cards - this is what a CI pipeline"
"(and S16, the project's test-plan-and-results deliverable) checks."
