# CEN429 - Hafta 4 - Demo 4: Fuzzing (libFuzzer) (Windows)
# Once derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
# Fuzzing sure sinirlidir (-max_total_time) ve cikti fuzz-cikti\ altina yazilir.
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\ayristirici.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
function Cizgi { "--------------------------------------------------------------" }

$D = "fuzz-cikti"
if (Test-Path $D) { Remove-Item -Recurse -Force $D }
New-Item -ItemType Directory -Path "$D\corpus" | Out-Null
Copy-Item tohum\normal.bin "$D\corpus\" -ErrorAction SilentlyContinue

Cizgi; "ADIM 1 - Normal girdi sorunsuz ayristirilir"
"> .\$B\ayristirici.exe tohum\normal.bin"
& ".\$B\ayristirici.exe" tohum\normal.bin 2>&1 | ForEach-Object { "$_" } | Select-Object -First 3

if (Test-Path "$B\ayristirici_fuzz.exe") {
    Cizgi; "ADIM 2 - HATALI ayristiriciyi libFuzzer ile fuzzla (<=10 sn)"
    "> .\$B\ayristirici_fuzz.exe -max_total_time=10 $D\corpus"
    & ".\$B\ayristirici_fuzz.exe" "-max_total_time=10" "-artifact_prefix=$D\" "$D\corpus" 2>&1 |
        ForEach-Object { "$_" } |
        Select-String -Pattern 'ERROR|overflow|Test unit|SUMMARY|crash-' | Select-Object -First 8
    $crash = Get-ChildItem "$D\crash-*" -ErrorAction SilentlyContinue | Select-Object -First 1
    Cizgi; "ADIM 3 - Bulunan cokerten girdiyi reproducer ile oynat"
    if ($crash) {
        "> .\$B\ayristirici.exe $($crash.FullName)"
        & ".\$B\ayristirici.exe" $crash.FullName 2>&1 | ForEach-Object { "$_" } |
            Select-String -Pattern 'ERROR|overflow|READ of size|SUMMARY' | Select-Object -First 5
    } else {
        "   (ayri crash dosyasi kalmadi; hazir tohumu kullanalim)"
        & ".\$B\ayristirici.exe" tohum\cokerten.bin 2>&1 | ForEach-Object { "$_" } |
            Select-String -Pattern 'ERROR|overflow|READ of size|SUMMARY' | Select-Object -First 5
    }
    Cizgi; "ADIM 4 - DUZELTILMIS ayristiriciyi ayni sure fuzzla: cokme YOK"
    "> .\$B\ayristirici_fuzz_guvenli.exe -max_total_time=10 $D\corpus"
    & ".\$B\ayristirici_fuzz_guvenli.exe" "-max_total_time=10" "-artifact_prefix=$D\" "$D\corpus" 2>&1 |
        ForEach-Object { "$_" } | Select-String -Pattern 'Done|DONE|crash|ERROR' | Select-Object -Last 2
    "   ^ 'Done ... 0 crashes' benzeri: duzeltilmis surumde cokme uretilemedi."
} else {
    Cizgi; "ADIM 2 - Bu VS surumunde libFuzzer hedefi uretilmedi"
    "   Visual Studio 2022 'C++ AddressSanitizer' bileseni /fsanitize=fuzzer saglar."
    "   Fuzzer olmadan da hatayi ASan reproducer ile GOREBILIRIZ:"
    Cizgi; "ADIM 3 - Hazir cokerten tohumu reproducer ile oynat"
    "> .\$B\ayristirici.exe tohum\cokerten.bin"
    & ".\$B\ayristirici.exe" tohum\cokerten.bin 2>&1 | ForEach-Object { "$_" } |
        Select-String -Pattern 'ERROR|overflow|READ of size|SUMMARY' | Select-Object -First 6
}

Cizgi; "ADIM 5 - Duzeltilmis surum ayni tohumu guvenle reddeder"
"> .\$B\ayristirici_guvenli.exe tohum\cokerten.bin"
& ".\$B\ayristirici_guvenli.exe" tohum\cokerten.bin 2>&1 | ForEach-Object { "$_" } | Select-Object -First 3
if (Test-Path $D) { Remove-Item -Recurse -Force $D }
