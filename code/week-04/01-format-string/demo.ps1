# CEN429 - Hafta 4 - Demo 1: Bicim dizisi (format string) acigi (Windows)
# Once derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\sizinti.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
function Cizgi { "--------------------------------------------------------------" }

. "$PSScriptRoot\..\..\common\cen429_msvc.ps1"
Cizgi; "ADIM 0 - Derleyici/statik cozumleyici bu hatayi goruyor mu?"
"> cl /analyze /I..\..\common sizinti.c"
Invoke-Cl /nologo /Zs /analyze /I..\..\common sizinti.c |
    Select-String -Pattern 'warning|C6\d{3}|C28\d{3}' | Select-Object -First 3
"   -> MSVC C derleyicisi varsayilan uyarmaz; /analyze bicim dizisini isaretler."
Cizgi; "ADIM 1 - Normal kullanim"
"> .\$B\sizinti.exe Merhaba"; & ".\$B\sizinti.exe" Merhaba
Cizgi; "ADIM 2 - Saldiri: %x ile yigindan bellek OKUMA (bilgi sizintisi)"
$fmt = ("%x." * 20)
"> .\$B\sizinti.exe '$fmt'"
$cikti = & ".\$B\sizinti.exe" $fmt 2>&1 | ForEach-Object { "$_" }
$cikti
if ($cikti -match '5ece7') { "   ^ gizli_deger sizdi -> 0x0005ece7 (yigindan okundu)" }
else { "   ^ hex sozcukleri yigin icerigidir; biri gizli_deger olabilir" }
Cizgi; "ADIM 3 - Saldiri: %n ile bellege YAZMA denemesi"
"> .\$B\sizinti.exe 'AAAA%n'"
& ".\$B\sizinti.exe" 'AAAA%n' 2>&1 | ForEach-Object { "$_" }
"   (cikis kodu: $LASTEXITCODE)"
Cizgi; "ADIM 4 - Windows notu"
"   MSVC C calisma kutuphanesinde %n VARSAYILAN OLARAK KAPALIDIR."
"   Bu yuzden %n cagrisi 'gecersiz parametre' isleyicisini tetikler ve"
"   program guvenli bicimde durur (Linux'ta bunu _FORTIFY_SOURCE saglar)."
Cizgi; "ADIM 5 - Duzeltilmis surum: %x ve %n artik sadece METIN"
"> .\$B\sizinti_guvenli.exe '%x %x %n saldiri denemesi'"
& ".\$B\sizinti_guvenli.exe" '%x %x %n saldiri denemesi'
