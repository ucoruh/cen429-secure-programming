# CEN429 — Week 1 — Demo 3: Privilege escalation through buffer overflow (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\login.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
$short = "AAAAAAAAAAAAAAAAB"                         # 16 characters + 'B' (0x42)
$long  = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"   # 40 characters: overflows past the struct
function Line { "--------------------------------------------------------------" }

Line; "STEP 1 - Normal login"; "> .\$B\login.exe alice"; & ".\$B\login.exe" alice
Line; "STEP 2 - Attack: a name 1 byte longer than the 16-byte field (17 characters)"
"> .\$B\login.exe $short"; & ".\$B\login.exe" $short
Line; "STEP 3 - Same attack, with AddressSanitizer (/fsanitize=address)"
"> .\$B\login_asan.exe $short"; & ".\$B\login_asan.exe" $short
"   ^ ASan stayed silent: the overflow stayed INSIDE the struct."
"     (name -> admin; tools have their limits too)"
Line; "STEP 4 - A long name that overflows past the struct, ASan version"
"> .\$B\login_asan.exe <40 characters>"
& ".\$B\login_asan.exe" $long 2>&1 | ForEach-Object { "$_" } | Select-String -Pattern 'ERROR|WRITE of size|SUMMARY'
Line; "STEP 5 - Same short attack, in the 'checked' build using strcpy_s (C11 Annex K)"
"> .\$B\login_checked.exe $short"
& ".\$B\login_checked.exe" $short 2>&1 | ForEach-Object { "$_" }
"   (exit code: $LASTEXITCODE)"
Line; "STEP 6 - The fixed version"
"> .\$B\login_secure.exe $short"; & ".\$B\login_secure.exe" $short 2>&1 | ForEach-Object { "$_" }
"> .\$B\login_secure.exe alice"; & ".\$B\login_secure.exe" alice
