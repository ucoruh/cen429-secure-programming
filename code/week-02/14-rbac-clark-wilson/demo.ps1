# CEN429 - Week 2 - Demo 14: RBAC + separation of duty + Clark-Wilson (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
# A simulator; it touches no file, network, or system setting.
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\bank.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
function Line { "--------------------------------------------------------------" }

Line; "Scenario: scenario.txt (roles, constraints, TPs, and steps)"
& ".\$B\bank.exe" scenario.txt

Line; "Result: RBAC says 'who may do which operation'; Clark-Wilson says"
"'touch data only through a certified transaction, validate external input,"
"write everything to the ledger, separate duties'. The E-rules cannot stop a"
"broken but certified TP; the IVP (integrity verification) is what catches it."
