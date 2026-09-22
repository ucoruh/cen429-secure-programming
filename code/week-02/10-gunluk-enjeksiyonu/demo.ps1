# CEN429 - Hafta 2 - Demo 10: Gunluk enjeksiyonu (CWE-117) (Windows)
# Once derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
# Yalniz bu klasordeki calisma\ altina yazar; sistem gunlugune dokunmaz.
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\gunluk.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
$A = ".\$B\gunluk.exe"
$C = "calisma"
if (Test-Path $C) { Remove-Item $C -Recurse -Force }
New-Item -ItemType Directory -Force $C | Out-Null
function Cizgi { "--------------------------------------------------------------" }

# Kontrol karakterlerini gorunur kilan yardimci (cat -v benzeri).
function Goster([string]$dosya) {
    $bytes = [IO.File]::ReadAllBytes((Join-Path $PSScriptRoot $dosya))
    $sb = New-Object System.Text.StringBuilder
    foreach ($b in $bytes) {
        if ($b -eq 10) { [void]$sb.Append("$")  ; [void]$sb.Append("`r`n    ") }
        elseif ($b -eq 13) { [void]$sb.Append("^M") }
        elseif ($b -eq 27) { [void]$sb.Append("^[") }
        elseif ($b -lt 32) { [void]$sb.Append("^" + [char]($b + 64)) }
        else { [void]$sb.Append([char]$b) }
    }
    "    " + $sb.ToString()
}

"Ornek girdiler (bir kisminda satir sonu / kontrol karakteri var):"
& $A uret $C | Out-Host
Cizgi; "ADIM 1 - GUVENSIZ gunluk: alan denetlenmeden yaziliyor"
& $A yaz guvensiz "$C\01-normal.bin"     "$C\guvensiz.log"
& $A yaz guvensiz "$C\02-enjeksiyon.bin" "$C\guvensiz.log"
& $A yaz guvensiz "$C\03-kontrol.bin"    "$C\guvensiz.log"
"  --- guvensiz.log icerigi (kontrol karakterleri ^ ile gosterildi):"
Goster "$C\guvensiz.log"
Cizgi; "ADIM 2 - Sahte satiri say:"
& $A say "$C\guvensiz.log" | Out-Host
Cizgi; "ADIM 3 - GUVENLI gunluk: kacislama + sinir + sabit bicim dizgesi"
& $A yaz guvenli "$C\01-normal.bin"     "$C\guvenli.log"
& $A yaz guvenli "$C\02-enjeksiyon.bin" "$C\guvenli.log"
& $A yaz guvenli "$C\03-kontrol.bin"    "$C\guvenli.log"
& $A yaz guvenli "$C\04-cok-uzun.bin"   "$C\guvenli.log"
"  --- guvenli.log icerigi:"
Goster "$C\guvenli.log"
Cizgi; "ADIM 4 - Sahte satiri say (guvenli):"
& $A say "$C\guvenli.log" | Out-Host
Cizgi
"Sonuc: Guvensiz surumde 3 girdi 4 satir uretti (enjeksiyon)."
"Guvenli surumde her girdi TEK satir; CR/LF ve ESC \xNN olarak"
"kacislandi, uzun alan kirpildi. Sahte admin satiri uretilmedi."
