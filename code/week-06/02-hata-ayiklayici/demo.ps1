# CEN429 - Hafta 6 - Demo 2: Hata ayiklayici algilama (Windows)
# Once derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\antidebug.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
function Cizgi { "--------------------------------------------------------------" }

Cizgi; "ADIM 1 - Normal calisma (hata ayiklayici YOK): temiz beklenir"
& "$B\antidebug.exe"
"   (cikis kodu $LASTEXITCODE - 0 = temiz)"

Cizgi
"ADIM 2 - Hata ayiklayici altinda gormek icin:"
"  Visual Studio: antidebug hedefini baslangic yapin, F5 ile calistirin."
"  IsDebuggerPresent EVET donecek ve SONUC 'algilandi' olacak."
"  Ya da: cdb/windbg ile ekleyip calistirin."
