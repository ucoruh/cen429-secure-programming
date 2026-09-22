# CEN429 - Hafta 4 - Demo 3: Tanimsiz davranis (UBSan) (Windows)
# Once derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\ub.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
function Cizgi { "--------------------------------------------------------------" }

Cizgi; "ADIM 1 - Korumasiz: UB 'calisiyor gibi' gorunur, sonuc YANLIS"
"> .\$B\ub.exe tasma 1"; & ".\$B\ub.exe" tasma 1
"> .\$B\ub.exe kaydir 31"; & ".\$B\ub.exe" kaydir 31
"> .\$B\ub.exe hizasiz"; & ".\$B\ub.exe" hizasiz
Cizgi; "ADIM 2 - Windows'ta UBSan YOK: ne yapmali?"
"   MSVC'de UndefinedBehaviorSanitizer bulunmaz. Secenekler:"
"   - Statik cozumleme: cl /analyze (bazi tasma/kaydirmalari isaretler)"
"   - Calisma ani denetimleri: /RTC1 /RTCc (Debug; veri kaybini yakalar)"
"   - SEI CERT C kurallari + tasinabilir denetim (bu demonun guvenli surumu)"
"   - AddressSanitizer bellek hatasini yakalar ama tamsayi tasmasini YAKALAMAZ."
. "$PSScriptRoot\..\..\common\cen429_msvc.ps1"
"> cl /analyze /I..\..\common ub.c"
Invoke-Cl /nologo /Zs /analyze /I..\..\common ub.c |
    Select-String -Pattern 'warning|C4\d{3}|C6\d{3}|C28\d{3}' | Select-Object -First 4
Cizgi; "ADIM 3 - Duzeltilmis surum: acik denetim (her iki platformda ayni)"
"> .\$B\ub_guvenli.exe tasma 1"; & ".\$B\ub_guvenli.exe" tasma 1
"> .\$B\ub_guvenli.exe kaydir 31"; & ".\$B\ub_guvenli.exe" kaydir 31
"> .\$B\ub_guvenli.exe kaydir 8"; & ".\$B\ub_guvenli.exe" kaydir 8
"> .\$B\ub_guvenli.exe hizasiz"; & ".\$B\ub_guvenli.exe" hizasiz
