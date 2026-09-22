# CEN429 - Hafta 2 - Demo 14: RBAC + gorev ayriligi + Clark-Wilson (Windows)
# Once derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
# Simulator; hicbir dosyaya, aga ya da sistem ayarina dokunmaz.
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\banka.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
function Cizgi { "--------------------------------------------------------------" }

Cizgi; "Senaryo: senaryo.txt (roller, kisitlar, TP'ler ve adimlar)"
& ".\$B\banka.exe" senaryo.txt

Cizgi; "Sonuc: RBAC 'kim hangi islemi' der; Clark-Wilson 'veriye yalniz"
"sertifikali islemle dokun, dis girdiyi dogrula, her seyi deftere yaz,"
"gorevleri ayir' der. Hatali ama sertifikali bir TP'yi E-kurallari"
"durduramaz; onu IVP (butunluk dogrulama) yakalar."
