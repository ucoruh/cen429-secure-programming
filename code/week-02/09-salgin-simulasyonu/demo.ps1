# CEN429 - Hafta 2 - Demo 09: Solucan salgin simulasyonu (Windows)
# Once derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
# Program yalniz hesap yapar; hicbir aga baglanmaz, dosya uretmez.
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\salgin.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
function Cizgi { "--------------------------------------------------------------" }

Cizgi; "SI modeliyle uc yayilma stratejisi karsilastiriliyor"
& ".\$B\salgin.exe"
Cizgi
"Not: Gercek Slammer ilk dakikadan sonra AG BANT GENISLIGINE"
"doydugu icin yavasladi (duyarli makine degil, bant siniri)."
