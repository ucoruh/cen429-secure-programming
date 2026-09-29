# CEN429 - Week 2 - Demo 07: mini rule engine (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
# Only reads; sample files are generated under this folder's output\.
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\rule_engine.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
$M = ".\$B\rule_engine.exe"
$O = "output"
function Line { "--------------------------------------------------------------" }

New-Item -ItemType Directory -Force $O | Out-Null
& ".\$B\rule_samples.exe" $O | Out-Null

Line; "STEP 1 - Rule file: five rules (our own harmless patterns)"
Get-Content rules.txt | Where-Object { $_ -match '^rule' } | ForEach-Object { "    " + $_ }

Line; "STEP 2 - Scan five files with five rules"
& $M rules.txt "$O\clean.txt" "$O\guide.txt" "$O\capsule.bin" "$O\variant.bin" "$O\notes.txt"

Line; "STEP 3 - False positive: why did the harmless guide match?"
& $M -a rules.txt "$O\guide.txt"
"   ^ Word_Pair looked at words, not CONTEXT: a FALSE POSITIVE."
"     The context-aware rule (Word_Context) did not match the same file."

Line; "STEP 4 - The modified variant: what did the wildcard (??) buy us?"
& $M -a rules.txt "$O\variant.bin"
"   ^ Capsule_Format missed it (no DECODER:); the wildcard in the hex"
"     pattern tolerated the 'BLUE_CATS' separator and caught it."

Line; "STEP 5 - The rule file is input too: a broken file is rejected"
& $M broken_rule.txt "$O\clean.txt" 2>&1 | ForEach-Object { "$_" }
"   (exit code $LASTEXITCODE)"

Line; "Result: a narrow rule misses things, a broad rule raises false alarms."
