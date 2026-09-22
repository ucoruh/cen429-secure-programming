# CEN429 - Hafta 6 - Demo 5: Kontrol akisi sayaci (Windows)
# Once derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\sayac.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
function Cizgi { "==============================================================" }

Cizgi; "SENARYO 1 - Normal: butun kontrol noktalari sirayla calisir"
& "$B\sayac.exe" normal
Cizgi; "SENARYO 2 - Saldiri: kontroller tamamen ATLANIR (dogrudan kritik islem)"
& "$B\sayac.exe" atlat
Cizgi; "SENARYO 3 - Saldiri: yalniz ilk kontrol calisir (kismi)"
& "$B\sayac.exe" kismi
Cizgi; "SENARYO 4 - Saldiri: kontroller YANLIS SIRADA calisir"
& "$B\sayac.exe" sirasiz
Cizgi
"Ders: tek 'if' yamalanip atlanabilir; ama kritik islem dogru sonucu ancak"
"butun kontrollerden SIRAYLA gecilmisse (dogru anahtar zinciri) uretir."
