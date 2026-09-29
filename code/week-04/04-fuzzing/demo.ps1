# CEN429 - Week 4 - Demo 4: fuzzing (libFuzzer) (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
# Fuzzing is time-limited (-max_total_time); output is written under fuzz-out\.
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\parser.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
function Line { "--------------------------------------------------------------" }

$D = "fuzz-out"
if (Test-Path $D) { Remove-Item -Recurse -Force $D }
New-Item -ItemType Directory -Path "$D\corpus" | Out-Null
Copy-Item seeds\normal.bin "$D\corpus\" -ErrorAction SilentlyContinue

Line; "STEP 1 - Normal input parses without trouble"
"> .\$B\parser.exe seeds\normal.bin"
& ".\$B\parser.exe" seeds\normal.bin 2>&1 | ForEach-Object { "$_" } | Select-Object -First 3

if (Test-Path "$B\parser_fuzz.exe") {
    Line; "STEP 2 - Fuzz the BUGGY parser with libFuzzer (<=10 s)"
    "> .\$B\parser_fuzz.exe -max_total_time=10 $D\corpus"
    & ".\$B\parser_fuzz.exe" "-max_total_time=10" "-artifact_prefix=$D\" "$D\corpus" 2>&1 |
        ForEach-Object { "$_" } |
        Select-String -Pattern 'ERROR|overflow|Test unit|SUMMARY|crash-' | Select-Object -First 8
    $crash = Get-ChildItem "$D\crash-*" -ErrorAction SilentlyContinue | Select-Object -First 1
    Line; "STEP 3 - Replay the crashing input found, with the reproducer"
    if ($crash) {
        "> .\$B\parser.exe $($crash.FullName)"
        & ".\$B\parser.exe" $crash.FullName 2>&1 | ForEach-Object { "$_" } |
            Select-String -Pattern 'ERROR|overflow|READ of size|SUMMARY' | Select-Object -First 5
    } else {
        "   (no separate crash file survived this run; use the ready-made seed instead)"
        & ".\$B\parser.exe" seeds\crash.bin 2>&1 | ForEach-Object { "$_" } |
            Select-String -Pattern 'ERROR|overflow|READ of size|SUMMARY' | Select-Object -First 5
    }
    Line; "STEP 4 - Fuzz the FIXED parser for the same time: NO crash"
    "> .\$B\parser_fuzz_secure.exe -max_total_time=10 $D\corpus"
    & ".\$B\parser_fuzz_secure.exe" "-max_total_time=10" "-artifact_prefix=$D\" "$D\corpus" 2>&1 |
        ForEach-Object { "$_" } | Select-String -Pattern 'Done|DONE|crash|ERROR' | Select-Object -Last 2
    "   ^ something like 'Done ... 0 crashes': the fixed version never crashes."
} else {
    Line; "STEP 2 - No libFuzzer target with this VS install"
    "   Visual Studio 2022's 'C++ AddressSanitizer' component provides /fsanitize=fuzzer."
    "   We can still SEE the bug without a fuzzer, using the ASan reproducer:"
    Line; "STEP 3 - Replay the ready-made crashing seed with the reproducer"
    "> .\$B\parser.exe seeds\crash.bin"
    & ".\$B\parser.exe" seeds\crash.bin 2>&1 | ForEach-Object { "$_" } |
        Select-String -Pattern 'ERROR|overflow|READ of size|SUMMARY' | Select-Object -First 6
}

Line; "STEP 5 - The fixed version safely rejects the same seed"
"> .\$B\parser_secure.exe seeds\crash.bin"
& ".\$B\parser_secure.exe" seeds\crash.bin 2>&1 | ForEach-Object { "$_" } | Select-Object -First 3
if (Test-Path $D) { Remove-Item -Recurse -Force $D }
