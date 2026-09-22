# CEN429 - Hafta 6 - Demo 7: Root/ayricalik gostergesi algilama (Windows)
# Once derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\yetki.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
if (Test-Path cikti) { Remove-Item -Recurse -Force cikti }
New-Item -ItemType Directory -Force cikti | Out-Null
function Cizgi { "--------------------------------------------------------------" }

Cizgi; "ADIM 1 - Normal calisma (yonetici degil, isaret yok): temiz beklenir"
& "$B\yetki.exe"
"   (cikis kodu $LASTEXITCODE)"

Cizgi; "ADIM 2 - Isaretli durum: sahte bir 'su' isaret dosyasi olusturuluyor"
Set-Content -Path cikti\sahte_su -Value "sahte root isareti" -NoNewline
"> cikti\sahte_su olusturuldu; ek isaret olarak veriliyor"
& "$B\yetki.exe" "cikti\sahte_su"
if ($LASTEXITCODE -ne 0) { "   (cikis kodu $LASTEXITCODE - gosterge ALGILANDI)" }

Cizgi
"Deneme: PowerShell'i 'Yonetici olarak calistir' ile acip demoyu tekrar"
"calistirin. Ayricalik seviyesi 'YUKSELTILMIS' cikacaktir. (Bu ders hicbir"
"demoda yonetici yetkisi GEREKTIRMEZ; bu yalniz istege bagli bir deneydir.)"
