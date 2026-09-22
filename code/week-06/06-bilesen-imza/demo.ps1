# CEN429 - Hafta 6 - Demo 6: Bilesen/paket imza dogrulama (Windows)
# Once derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\imza.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
if (Test-Path cikti) { Remove-Item -Recurse -Force cikti }
New-Item -ItemType Directory -Force cikti | Out-Null
function Cizgi { "--------------------------------------------------------------" }

Cizgi; "ADIM 1 - Ornek bir 'eklenti modulu' dosyasi olustur"
Set-Content -Path cikti\modul.dat -Value "SURUM=1.0`nODEME-MODULU`nyetki=onay" -NoNewline
"modul.dat icerigi:"; Get-Content cikti\modul.dat | ForEach-Object { "   $_" }

Cizgi; "ADIM 2 - Uretimde modul imzalanir (ayrik HMAC imzasi)"
& "$B\imza.exe" uret cikti\modul.dat cikti\modul.imza

Cizgi; "ADIM 3 - Yukleme oncesi dogrulama (modul degismedi): TUTAR"
& "$B\imza.exe" dogrula cikti\modul.dat cikti\modul.imza
"   (cikis kodu $LASTEXITCODE - 0 = tuttu)"

Cizgi; "ADIM 4 - Saldiri: modul YENIDEN PAKETLENIR (tek karakter degisir)"
Add-Content -Path cikti\modul.dat -Value "X"
"> modul.dat sonuna 'X' eklendi"
& "$B\imza.exe" dogrula cikti\modul.dat cikti\modul.imza
if ($LASTEXITCODE -ne 0) { "   (cikis kodu $LASTEXITCODE - repackaging ALGILANDI)" }

Cizgi
"Not: APK v2/v3 ACIK ANAHTAR (asimetrik) imza kullanir; dogrulayan yalniz acik"
"anahtara ihtiyac duyar. Burada ogretim icin paylasilan anahtarli HMAC var;"
"asimetrik imza Hafta 10'da. Ilke ayni: yuklemeden once butunluk + kaynak."
