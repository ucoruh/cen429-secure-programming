# CEN429 - Week 6 - Demo 5: Control-flow counter (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\flow_counter.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
function Line { "==============================================================" }

Line; "SCENARIO 1 - Normal: every checkpoint runs in order"
& "$B\flow_counter.exe" normal
Line; "SCENARIO 2 - Attack: the checks are SKIPPED entirely (straight to the critical operation)"
& "$B\flow_counter.exe" skip
Line; "SCENARIO 3 - Attack: only the first check runs (partial)"
& "$B\flow_counter.exe" partial
Line; "SCENARIO 4 - Attack: the checks run in the WRONG ORDER"
& "$B\flow_counter.exe" reorder
Line
"Lesson: a single 'if' can be patched and skipped; but the critical operation"
"only produces the right result when every check was passed IN ORDER (the"
"correct key chain)."
