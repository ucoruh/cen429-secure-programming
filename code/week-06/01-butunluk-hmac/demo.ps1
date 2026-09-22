# CEN429 - Hafta 6 - Demo 1: Calisma zamani butunluk denetimi (Windows)
# Once derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\butunluk.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
if (Test-Path cikti) { Remove-Item -Recurse -Force cikti }
New-Item -ItemType Directory -Force cikti | Out-Null
function Cizgi { "--------------------------------------------------------------" }

Cizgi; "ADIM 1 - Uygulama KENDI ikili dosyasinin altin HMAC degerini kaydeder"
& "$B\butunluk.exe" kaydet oz cikti\altin.hmac

Cizgi; "ADIM 2 - Normal calisma: butunluk dogrulanir (yama yok)"
& "$B\butunluk.exe" dogrula oz cikti\altin.hmac
"   (cikis kodu $LASTEXITCODE - 0 = temiz)"

Cizgi; "ADIM 3 - Saldiri: ikili dosyanin bir KOPYASI alinip 1 bayti degistiriliyor"
Copy-Item "$B\butunluk.exe" cikti\butunluk_yamali.exe
$ham = [IO.File]::ReadAllBytes("$PWD\cikti\butunluk_yamali.exe")
$ofset = [int]($ham.Length / 2)
"> ofset $ofset baytini degistir (0x{0:X2} -> 0x{1:X2})" -f $ham[$ofset], ($ham[$ofset] -bxor 0xFF)
$ham[$ofset] = $ham[$ofset] -bxor 0xFF
[IO.File]::WriteAllBytes("$PWD\cikti\butunluk_yamali.exe", $ham)

Cizgi; "ADIM 4 - Yamali kopyanin HMAC'i altin degerle karsilastiriliyor"
& "$B\butunluk.exe" dogrula cikti\butunluk_yamali.exe cikti\altin.hmac
if ($LASTEXITCODE -ne 0) { "   (cikis kodu $LASTEXITCODE - yama ALGILANDI)" }

Cizgi
"Not: HMAC anahtari ikili dosyanin icindedir; tek basina yeterli degildir."
"Saldirgan denetleyiciyi de yamalar. Gercek RASP: coklu/ortusen denetleyici,"
"sonucu veri bagimliligi yapma (Demo 5) ve sunucu tarafli attestation."
