# CEN429 - Hafta 3 - Demo 7: SQLite alan sifreleme (Windows)
# Once derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\sqlite_alan.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
if (Test-Path cikti) { Remove-Item -Recurse -Force cikti }
New-Item -ItemType Directory -Force cikti | Out-Null
# Sentetik 32 baytlik anahtar (demo icin sabit; gercekte KDF'den gelir).
$AN = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f"
$KOTU = "ff0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f"
function Cizgi { "--------------------------------------------------------------" }

Cizgi; "ADIM 1 - Veritabanini kur (hassas alan sifreli)"
$env:SIM_ANAHTAR = $AN
& "$B\sqlite_alan.exe" olustur cikti\musteri.db

Cizgi; "ADIM 2 - Saldirgan ham DB dosyasini caldi ve icinde arama yapiyor:"
$bytes = [IO.File]::ReadAllBytes("$PWD\cikti\musteri.db")
$text = [Text.Encoding]::ASCII.GetString($bytes)
$adBulundu = if ($text -match "Ayse") { "BULUNDU (ad alani acik)" } else { "yok" }
$kartBulundu = if ($text -match "4242-4242") { "BULUNDU" } else { "YOK - sifreli" }
"   Ham DB icinde 'Ayse' (ad)      : $adBulundu"
"   Ham DB icinde '4242-4242' (kart): $kartBulundu"
"   ^ Kart alani sifreli oldugu icin ham dosyada acik gorunmuyor."

Cizgi; "ADIM 3 - Dogru anahtarla uygulama okuyor (coz ve dogrula):"
$env:SIM_ANAHTAR = $AN
& "$B\sqlite_alan.exe" oku cikti\musteri.db | ForEach-Object { "   $_" }

Cizgi; "ADIM 4 - YANLIS anahtarla okuma denemesi (GCM etiketi tutmaz):"
$env:SIM_ANAHTAR = $KOTU
& "$B\sqlite_alan.exe" oku cikti\musteri.db | ForEach-Object { "   $_" }
Remove-Item Env:\SIM_ANAHTAR
