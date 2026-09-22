# CEN429 - Hafta 2 - Demo 4: Saldiri agaci maliyet hesaplayici (Windows)
# Once derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
# Hesap makinesi; hicbir saldiri yapmaz, hicbir dosyaya dokunmaz.
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\agac.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
$A = ".\$B\agac.exe"
function Cizgi { "--------------------------------------------------------------" }

Cizgi; "ADIM 1 - Once: bellekteki anahtar en zayif nokta"
& $A agac-odeme.txt
Cizgi; "ADIM 2 - Sonra: 'bellekten oku' dalina RASP eklendi"
& $A agac-savunma.txt
Cizgi; "ADIM 3 - Cok oznitelikli: maliyet + sure + beceri"
& $A agac-nitelikli.txt
Cizgi; "Sonuc: Savunma en ucuz saldiriyi 2 -> 8 birime cikardi."
"En zayif nokta artik baska bir dal; savunmaci oraya yonelir."
"VE dugumleri saldiriyi pahalilastirir (derinlemesine savunma)."
