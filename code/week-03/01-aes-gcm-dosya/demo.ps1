# CEN429 - Hafta 3 - Demo 1: AES-256-GCM ile dosya sifreleme (Windows)
# Once derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\aesgcm.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
if (Test-Path cikti) { Remove-Item -Recurse -Force cikti }
New-Item -ItemType Directory -Force cikti | Out-Null
function Cizgi { "--------------------------------------------------------------" }

Cizgi; "ADIM 1 - 32 baytlik rastgele anahtar ve ornek gizli dosya"
$key = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($key)
[IO.File]::WriteAllBytes("$PWD\cikti\anahtar.bin", $key)
[IO.File]::WriteAllText("$PWD\cikti\gizli.txt",
    "IBAN: TR00 0000 0000 0000 0000 0000 00`nBakiye: 12345`n")
"gizli.txt icerigi:"; Get-Content cikti\gizli.txt | ForEach-Object { "   $_" }

Cizgi; "ADIM 2 - Sifrele"
& "$B\aesgcm.exe" sifrele cikti\anahtar.bin cikti\gizli.txt cikti\gizli.enc
"Sifreli dosyanin ilk 32 bayti (nonce + sifreli metin):"
$enc = [IO.File]::ReadAllBytes("$PWD\cikti\gizli.enc")
"   " + (($enc[0..31] | ForEach-Object { $_.ToString("x2") }) -join " ")

Cizgi; "ADIM 3 - Dogru sekilde coz (etiket tutar)"
& "$B\aesgcm.exe" coz cikti\anahtar.bin cikti\gizli.enc cikti\cozulen.txt
"Cozulen icerik:"; Get-Content cikti\cozulen.txt | ForEach-Object { "   $_" }

Cizgi; "ADIM 4 - Saldiri: sifreli metnin 20. baytini degistir"
$ham = [IO.File]::ReadAllBytes("$PWD\cikti\gizli.enc")
$ham[20] = $ham[20] -bxor 0xFF
[IO.File]::WriteAllBytes("$PWD\cikti\bozuk.enc", $ham)
"> aesgcm coz ... bozuk.enc"
& "$B\aesgcm.exe" coz cikti\anahtar.bin cikti\bozuk.enc cikti\olmaz.txt
if ($LASTEXITCODE -ne 0) { "   (cikis kodu $LASTEXITCODE - cozme reddedildi)" }

Cizgi; "ADIM 5 - Saldiri: yalniz ETIKETin son baytini degistir"
$ham = [IO.File]::ReadAllBytes("$PWD\cikti\gizli.enc")
$ham[$ham.Length - 1] = $ham[$ham.Length - 1] -bxor 0x01
[IO.File]::WriteAllBytes("$PWD\cikti\etiket_bozuk.enc", $ham)
& "$B\aesgcm.exe" coz cikti\anahtar.bin cikti\etiket_bozuk.enc cikti\olmaz2.txt
if ($LASTEXITCODE -ne 0) { "   (cikis kodu $LASTEXITCODE - etiket tutmadi)" }
