# CEN429 - Hafta 6 - Demo 8: RASP motoru + tepki politikasi (Windows)
# Once derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\rasp.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
function Cizgi { "==============================================================" }

Cizgi; "SENARYO 1 - Normal: kontroller gecer, cihaz dogru -> sir acilir"
& "$B\rasp.exe" normal
Cizgi; "SENARYO 2 - Tamper: bir kontrol basarisiz -> sil + decoy + bayrak"
& "$B\rasp.exe" tamper
Cizgi; "SENARYO 3 - Baska cihaz: kontroller gecer ama cihaz anahtari tutmaz"
& "$B\rasp.exe" baska-cihaz
Cizgi
"Ders: algilama tek basina yetmez; onemli olan TEPKI politikasidir (sil, decoy,"
"bayrak) ve cihaz/surum baglamasi (anahtarlar kopyalansa bile baska cihazda acilmaz)."
