# CEN429 — Week 1 — Demo 4: Signed length error (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\copy.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
function Line { "--------------------------------------------------------------" }

. "$PSScriptRoot\..\..\common\cen429_msvc.ps1"
Line; "STEP 0 - Does the compiler see this bug?"
"> cl /Zs /W4 copy.c                  (compile as C)"
Invoke-Cl /nologo /Zs /W4 /I..\..\common copy.c | Select-String -Pattern 'warning|error'
"   -> No warning: MSVC's C compiler never reports this conversion, even with /Wall."
"> cl /Zs /W4 /w44365 /TP copy.c      (same code, as C++)"
Invoke-Cl /nologo /Zs /W4 /w44365 /TP /I..\..\common copy.c | Select-String -Pattern 'C4365'
"   -> C4365: int -> size_t sign mismatch. (On Linux, GCC: -Wsign-conversion)"
Line; "STEP 1 - Normal use";                    "> .\$B\copy.exe 8";   & ".\$B\copy.exe" 8
Line; "STEP 2 - A length that's too large: the check catches it"; "> .\$B\copy.exe 100"; & ".\$B\copy.exe" 100
Line; "STEP 3 - Attack: a negative length slips past the check"
"> .\$B\copy.exe -1"
& ".\$B\copy.exe" -1
$code = "0x{0:X8}" -f ($LASTEXITCODE -band 0xFFFFFFFF)
$meaning = switch ($code) {
    "0xC0000005" { "access violation" }
    "0xC0000409" { "stack buffer overflow detected, Windows terminated the process immediately" }
    default      { "unexpected exit" }
}
"   (exit code: $code = $meaning)"
Line; "STEP 4 - Same attack, with AddressSanitizer (/fsanitize=address)"
"> .\$B\copy_asan.exe -1"
& ".\$B\copy_asan.exe" -1 2>&1 | ForEach-Object { "$_" } | Select-String -Pattern 'ERROR|negative|SUMMARY'
Line; "STEP 5 - The fixed version"
"> .\$B\copy_secure.exe -1 ; 12abc ; 8"
& ".\$B\copy_secure.exe" -1
& ".\$B\copy_secure.exe" 12abc
& ".\$B\copy_secure.exe" 8
