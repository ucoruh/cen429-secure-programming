# CEN429 - Hafta 4 - Demo 2: use-after-free ve double-free (Windows)
# Once derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\uaf.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
function Cizgi { "--------------------------------------------------------------" }

Cizgi; "ADIM 1 - Korumasiz: use-after-free ile yetki yukseltme"
"> .\$B\uaf.exe uaf"
& ".\$B\uaf.exe" uaf 2>&1 | ForEach-Object { "$_" }
"   ^ Askidaki isaretci serbest bellegi okudu/cagirdi (tanimsiz davranis)."
"     Ayirici o yeri 'admin' nesnesiyle yeniden kullanmissa saldirgan verisi"
"     gelir; kullanmamissa eski deger. Sonuc ayirici/platforma gore DEGISIR"
"     -> ustelik ODevi ASan (Adim 2) her zaman kesin yakalar."
Cizgi; "ADIM 2 - Ayni kod AddressSanitizer (/fsanitize=address) ile: YAKALANIR"
"> .\$B\uaf_asan.exe uaf"
& ".\$B\uaf_asan.exe" uaf 2>&1 | ForEach-Object { "$_" } |
    Select-String -Pattern 'ERROR|heap-use-after-free|freed|previously|SUMMARY' |
    Select-Object -First 8
Cizgi; "ADIM 3 - Korumasiz: cift serbest birakma (double-free)"
"> .\$B\uaf.exe cift"
& ".\$B\uaf.exe" cift 2>&1 | ForEach-Object { "$_" }
"   (cikis kodu: $LASTEXITCODE)"
Cizgi; "ADIM 4 - Ayni kod AddressSanitizer ile: double-free YAKALANIR"
"> .\$B\uaf_asan.exe cift"
& ".\$B\uaf_asan.exe" cift 2>&1 | ForEach-Object { "$_" } |
    Select-String -Pattern 'ERROR|double-free|attempting|SUMMARY' | Select-Object -First 6
Cizgi; "ADIM 5 - Duzeltilmis surum: free+NULL, sahiplik, tek nokta"
"> .\$B\uaf_guvenli.exe uaf"; & ".\$B\uaf_guvenli.exe" uaf
"> .\$B\uaf_guvenli.exe cift"; & ".\$B\uaf_guvenli.exe" cift
