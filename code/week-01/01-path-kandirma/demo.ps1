# CEN429 — Hafta 1 — Demo 1: PATH ile kandırma (Windows)
# Önce derleyin: ..\..\build.ps1  (ya da Visual Studio'da "Windows (MSVC)" ile Tümünü Derle)
# Sonra: .\demo.ps1   (çalışmazsa: powershell -ExecutionPolicy Bypass -File .\demo.ps1)
# Yalnız bu klasörde çalışır; PATH değişikliği yalnız bu betiğin içinde geçerlidir.
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\rapor.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
function Cizgi { "--------------------------------------------------------------" }

Cizgi; "ADIM 1 — Normal calisma: program gercek hostname'i buluyor"
"> .\$B\rapor.exe"
& ".\$B\rapor.exe"

Cizgi; "ADIM 2 — Saldiri: PATH'in basina sahte\ klasoru ekleniyor"
"> `$env:PATH = `"$PWD\sahte;`" + `$env:PATH ; .\$B\rapor.exe"
$eski = $env:PATH
$env:PATH = "$PSScriptRoot\sahte;" + $env:PATH
& ".\$B\rapor.exe"

Cizgi; "ADIM 3 — Duzeltilmis surum ayni saldiri altinda"
"> .\$B\rapor_guvenli.exe"
& ".\$B\rapor_guvenli.exe"
$env:PATH = $eski

Cizgi; "Sonuc: guvenli surum mutlak yol + kabuksuz calistirma (CreateProcessW) + kucuk ortam kullaniyor."
