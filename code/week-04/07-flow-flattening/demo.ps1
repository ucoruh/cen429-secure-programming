# CEN429 - Week 4 - Demo 7: control-flow flattening and opaque predicates (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\pin_plain.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
function Line { "--------------------------------------------------------------" }

Line; "STEP 1 - Both versions give the SAME result (correct PIN: 4291)"
foreach ($p in @("4291","1234","42910")) {
    $a = & ".\$B\pin_plain.exe" $p
    $d = & ".\$B\pin_flattened.exe" $p
    "  PIN $p -> plain: [$a] | flattened: [$d]"
}
Line; "STEP 2 - CFG difference: machine code (dumpbin /disasm)"
. "$PSScriptRoot\..\cen429_arac.ps1"
$d1 = Invoke-Dumpbin /disasm:nobytes "$B\pin_plain.exe"
$d2 = Invoke-Dumpbin /disasm:nobytes "$B\pin_flattened.exe"
function Jumps($lines) { ($lines | Select-String -Pattern '\bjmp\b|\bje\b|\bjne\b').Count }
"  PLAIN      : $((($d1) | Measure-Object).Count) lines total, $(Jumps $d1) jump(s)"
"  FLATTENED  : $((($d2) | Measure-Object).Count) lines total, $(Jumps $d2) jump(s)"
"  ^ The flattened version's switch-dispatcher loop produces more jumps;"
"    for a per-function breakdown, use 'objdump -d' in WSL or Ghidra."
Line; "STEP 3 - Cost: timing the same work"
& ".\$B\pin_plain.exe" timing
& ".\$B\pin_flattened.exe" timing
"  ^ Flattening makes reading harder but costs time/code size."
"    That is why it is only applied to CRITICAL functions (license/PIN/key checks)."
Line; "STEP 4 - Opaque predicate: a branch that LOOKS reachable but never is"
"> .\$B\opaque.exe 4291 7"; & ".\$B\opaque.exe" 4291 7
"> .\$B\opaque.exe 0000 -50"; & ".\$B\opaque.exe" 0000 -50
"> .\$B\opaque.exe verify"; & ".\$B\opaque.exe" verify
"  ^ The result never depends on x; the decoy branch never printed. That is the predicate:"
"    always true (or always false) for every x, but not obvious without the modular-arithmetic fact."
