# CEN429 - Week 4 - Demo 2: use-after-free and double-free (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\uaf.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
function Line { "--------------------------------------------------------------" }

Line; "STEP 1 - Unprotected: privilege escalation through use-after-free"
"> .\$B\uaf.exe uaf"
& ".\$B\uaf.exe" uaf 2>&1 | ForEach-Object { "$_" }
"   ^ The dangling pointer read/called freed memory (undefined behavior)."
"     If the allocator reused that spot for the 'admin' object, the attacker's"
"     data shows up; if not, the old value does. The result DEPENDS on the"
"     allocator/platform -> but ASan (Step 2) always catches it for certain."
Line; "STEP 2 - Same code under AddressSanitizer (/fsanitize=address): CAUGHT"
"> .\$B\uaf_asan.exe uaf"
& ".\$B\uaf_asan.exe" uaf 2>&1 | ForEach-Object { "$_" } |
    Select-String -Pattern 'ERROR|heap-use-after-free|freed|previously|SUMMARY' |
    Select-Object -First 8
Line; "STEP 3 - Unprotected: double-free"
"> .\$B\uaf.exe double"
& ".\$B\uaf.exe" double 2>&1 | ForEach-Object { "$_" }
"   (exit code: $LASTEXITCODE)"
Line; "STEP 4 - Same code under AddressSanitizer: double-free IS CAUGHT"
"> .\$B\uaf_asan.exe double"
& ".\$B\uaf_asan.exe" double 2>&1 | ForEach-Object { "$_" } |
    Select-String -Pattern 'ERROR|double-free|attempting|SUMMARY' | Select-Object -First 6
Line; "STEP 5 - Fixed version: free+NULL, ownership, a single free point"
"> .\$B\uaf_secure.exe uaf"; & ".\$B\uaf_secure.exe" uaf
"> .\$B\uaf_secure.exe double"; & ".\$B\uaf_secure.exe" double
