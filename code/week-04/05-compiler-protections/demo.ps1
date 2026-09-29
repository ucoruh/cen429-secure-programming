# CEN429 - Week 4 - Demo 5: compiler and OS protections (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\overflow_weak.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
function Line { "--------------------------------------------------------------" }
$long = ("A" * 200)

Line; "STEP 1 - Normal input: both versions run fine"
"> .\$B\overflow_weak.exe island"; & ".\$B\overflow_weak.exe" island
"> .\$B\overflow_hardened.exe  island"; & ".\$B\overflow_hardened.exe"  island
Line; "STEP 2 - WEAK version (/GS-), a 200-byte overflow"
"> .\$B\overflow_weak.exe <200xA>"
& ".\$B\overflow_weak.exe" $long 2>&1 | ForEach-Object { "$_" }
$code = "0x{0:X8}" -f ($LASTEXITCODE -band 0xFFFFFFFF)
"   (exit code: $code)"
Line; "STEP 3 - HARDENED version (/GS), same overflow: the /GS canary CATCHES it"
"> .\$B\overflow_hardened.exe <200xA>"
& ".\$B\overflow_hardened.exe" $long 2>&1 | ForEach-Object { "$_" }
$code = "0x{0:X8}" -f ($LASTEXITCODE -band 0xFFFFFFFF)
$meaning = if ($code -eq "0xC0000409") { "stack buffer overrun (/GS); Windows stopped the process" }
           elseif ($code -eq "0xC0000005") { "access violation" } else { "stopped" }
"   (exit code: $code = $meaning)"
Line; "STEP 4 - Which protections are on in each binary? (dumpbin)"
. "$PSScriptRoot\..\cen429_arac.ps1"
function Protections($exe) {
    # The PE header's "DLL characteristics" flags are the definitive indicator of protections.
    $h = Invoke-Dumpbin /headers $exe
    $section = $h | Select-String -Pattern 'DLL characteristics' -Context 0,6
    function Has($pattern) { if ("$section" -match $pattern) { "ON" } else { "off" } }
    "  DYNAMICBASE (ASLR)      : $(Has 'Dynamic base')"
    "  HIGH_ENTROPY_VA (64-bit): $(Has 'High Entropy')"
    "  NX_COMPAT (DEP)         : $(Has 'NX compatible')"
    "  GUARD_CF (/guard:cf)    : $(Has 'Control Flow Guard')"
}
"WEAK binary:";     Protections "$B\overflow_weak.exe"
"HARDENED binary:"; Protections "$B\overflow_hardened.exe"
Line
"Lesson: these protections do NOT fix the bug; they only make exploitation harder/stop it."
"The real fix is input validation and bounds checking (Demos 1-4)."
"Note: no PDB (debug symbol) file is shipped; RELRO has no Windows equivalent"
"(RELRO is specific to the GOT/PLT)."
