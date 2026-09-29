# CEN429 - Week 2 - Demo 11: a tamper-evident log (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
# Only writes under this folder's work\.
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\log_chain.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
$A = ".\$B\log_chain.exe"
$C = "work"
if (Test-Path $C) { Remove-Item $C -Recurse -Force }
New-Item -ItemType Directory -Force "$C\evolve","$C\static" | Out-Null
function Line { "--------------------------------------------------------------" }
$LOGE = "$C\evolve\access.auditlog";  $KE = "$C\evolve\verifier.key"
$STOLEN_E = "$C\evolve\stolen.key"
$LOGS = "$C\static\access.auditlog";  $KS = "$C\static\verifier.key"
$STOLEN_S = "$C\static\stolen.key"

"STEP 1 - Generate two logs: key EVOLUTION and STATIC"
& $A generate "$C\evolve"  evolve | Out-Host
& $A generate "$C\static" static | Out-Host
Line; "STEP 2 - Verify the sound log (evolve):"
& $A verify $LOGE $KE | Out-Host
Line; "STEP 3 - Raw tampering: change seq=4's message (the MAC is left stale)"
& $A modify $LOGE 4 "payment approved amount=9999" | Out-Host
& $A verify $LOGE $KE | Out-Host
"  (regenerating and continuing)"; & $A generate "$C\evolve" evolve | Out-Null
Line; "STEP 4 - DELETING a record: seq=5 is deleted"
& $A delete  $LOGE 5 | Out-Host
& $A verify  $LOGE $KE | Out-Host
& $A generate "$C\evolve" evolve | Out-Null
Line; "STEP 5 - REORDERING: seq=2 and seq=3 swap places"
& $A swap    $LOGE 2 3 | Out-Host
& $A verify  $LOGE $KE | Out-Host
& $A generate "$C\evolve" evolve | Out-Null
Line
"STEP 6 - CAPTURE: the attacker tries to rewrite history"
"  6a) EVOLVE mode: the attacker only knows the CURRENT key (K_N)"
& $A forge $LOGE 2 "card loaded card=FORGED" $STOLEN_E | Out-Host
& $A verify $LOGE $KE | Out-Host
"  6b) STATIC mode: the single key never changed (K_N == K_0)"
& $A forge $LOGS 2 "card loaded card=FORGED" $STOLEN_S | Out-Host
& $A verify $LOGS $KS | Out-Host
Line
"Lesson: the digest chain catches modification/deletion/reordering. Key"
"evolution also protects the records BEFORE the capture: the attacker"
"cannot compute the old key backwards, so they cannot rewrite history (6a)."
"With a static key, history CAN be rewritten and it is NOT CAUGHT (6b)."
