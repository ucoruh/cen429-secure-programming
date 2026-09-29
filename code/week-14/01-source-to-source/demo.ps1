# CEN429 - Week 14 - Demo 1: source-to-source obfuscation pipeline (Tigress) - Windows
# Build first: ..\..\build.ps1   Then: .\demo.ps1
# SAFE: only creates/reads files inside this folder; no network/system operation.
Set-Location $PSScriptRoot
$BinDir = "bin\windows"
if (-not (Test-Path "$BinDir\source.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
. "$PSScriptRoot\..\..\common\cen429_msvc.ps1"
. "$PSScriptRoot\..\..\week-04\cen429_arac.ps1"
function Line { "--------------------------------------------------------------" }

Line; "STEP 1 - Baseline: the plain, already-built program"
& ".\$BinDir\source.exe" CEN429-OK
& ".\$BinDir\source.exe" wrong

Line
$tigress = Get-Command tigress -ErrorAction SilentlyContinue
if ($tigress) {
    "STEP 2 - Tigress FOUND: running the real transform pipeline"
    "`$ tigress --Transform=EncodeLiterals --Transform=AddOpaque --Functions=grant_access --Seed=1001 --out=variant_1001.c source.c"
    & tigress --Environment=x86_64:Windows:Msvc:19 --Transform=EncodeLiterals --Functions=grant_access `
              --Transform=AddOpaque --Functions=grant_access --AddOpaqueKinds=call `
              --Seed=1001 --out=variant_1001.c source.c
    & tigress --Environment=x86_64:Windows:Msvc:19 --Transform=EncodeLiterals --Functions=grant_access `
              --Transform=AddOpaque --Functions=grant_access --AddOpaqueKinds=call `
              --Seed=2002 --out=variant_2002.c source.c
} else {
    "STEP 2 - Tigress NOT installed."
    "  Download it from the official site: https://tigress.wtf"
    "  License: free for non-profit (academic) use; commercial use needs a University of Arizona license."
    "  Once 'tigress' is on PATH (native or inside WSL), this script uses it automatically."
    "  Using the DOCUMENTED LOCAL FALLBACK instead (see fallback_transform.py's docstring):"
    py -3.12 fallback_transform.py source.c variant_1001.c --seed 1001
    py -3.12 fallback_transform.py source.c variant_2002.c --seed 2002
}

Line; "STEP 3 - Behavior preserved? (compile both variants, compare against the baseline)"
Invoke-Cl /nologo /O2 /Fe:variant_1001.exe variant_1001.c | Out-Null
Invoke-Cl /nologo /O2 /Fe:variant_2002.exe variant_2002.c | Out-Null
foreach ($tok in @("CEN429-OK", "wrong")) {
    $outOrig = & ".\$BinDir\source.exe" $tok
    $outSeed1 = & ".\variant_1001.exe" $tok
    $outSeed2 = & ".\variant_2002.exe" $tok
    if ($outOrig -eq $outSeed1 -and $outOrig -eq $outSeed2) { "  token=""$tok"": all three agree -> $outOrig" }
    else { "  token=""$tok"": MISMATCH original=[$outOrig] seed1001=[$outSeed1] seed2002=[$outSeed2]" }
}

Line; "STEP 4 - Cost: disassembly size (dumpbin; the whole file, not just grant_access)"
$d0 = Invoke-Dumpbin /disasm:nobytes ".\$BinDir\source.exe"
$d1 = Invoke-Dumpbin /disasm:nobytes ".\variant_1001.exe"
$d2 = Invoke-Dumpbin /disasm:nobytes ".\variant_2002.exe"
function JumpCount($lines) { ($lines | Select-String -Pattern '\bjmp\b|\bje\b|\bjne\b').Count }
"  original  : $((($d0) | Measure-Object).Count) disasm lines total, $(JumpCount $d0) jump(s)"
"  seed 1001 : $((($d1) | Measure-Object).Count) disasm lines total, $(JumpCount $d1) jump(s)"
"  seed 2002 : $((($d2) | Measure-Object).Count) disasm lines total, $(JumpCount $d2) jump(s)"
"  (For an exact per-function grant_access-only count, run demo.sh under WSL/Linux with objdump.)"

Line; "STEP 5 - Diversification: same source, two seeds, different binaries"
$bytes1 = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes("$PSScriptRoot\variant_1001.exe"))
$bytes2 = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes("$PSScriptRoot\variant_2002.exe"))
if ($bytes1 -eq $bytes2) {
    "  -> Binaries are identical (unexpected)."
} else {
    "  -> Binaries are DIFFERENT, same behavior. A patch written into one copy does not work on the other."
}

Line; "Rule: obfuscation does not change behavior, it raises cost; diversify the result, then measure both."
"See also: week-09/01-manual-obfuscation (the same idea applied BY HAND, no tool)."
Remove-Item -Force -ErrorAction SilentlyContinue variant_1001.c, variant_2002.c, variant_1001.exe, variant_2002.exe, variant_1001.obj, variant_2002.obj
