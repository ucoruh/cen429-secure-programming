# CEN429 — Hafta 1 — Demo 2: Bellekte kalan parola (Windows)
# Önce derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
# Program, bekle() noktasında kendi belleğinin dökümünü dokum\ klasörüne yazar (MiniDumpWriteDump);
# betik dökümde parolayı arar. Yalnız bu klasörde dosya üretir.
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\parola_silmez.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
$parola = (Get-Content parola.txt -Raw).Trim()
New-Item -ItemType Directory -Force dokum | Out-Null
function Cizgi { "--------------------------------------------------------------" }

function Dok([string]$ad) {
    $dosya = Join-Path $PSScriptRoot "dokum\$ad.dmp"
    if (Test-Path $dosya) { Remove-Item $dosya -Force }
    $env:CEN429_DOKUM = $dosya
    & ".\$B\$ad.exe" parola.txt | Out-Host
    Remove-Item Env:\CEN429_DOKUM
    $bayt = [IO.File]::ReadAllBytes($dosya)
    $metin = [Text.Encoding]::ASCII.GetString($bayt)
    $adet = ([regex]::Matches($metin, [regex]::Escape($parola))).Count
    "  Bellek dokumu: dokum\$ad.dmp ($($bayt.Length) bayt)"
    if ($adet -gt 0) { "  SONUC: parola dokumde $adet yerde BULUNDU  ->  $parola" }
    else { "  SONUC: parola dokumde bulunamadi" }
}

"Parola dosyasi: parola.txt  ->  $parola"
Cizgi; "ADIM 1 — Parolayi hic silmeyen surum";                  Dok parola_silmez
Cizgi; "ADIM 2 — memset ile silen surum (/O2)";                 Dok parola_memset
Cizgi; "ADIM 3 — SecureZeroMemory ile silen surum (/O2)";       Dok parola_explicit
Cizgi
"Not: Derleyiciler 'olu yazma' kaldirma konusunda farkli davranabilir. memset'in kalip kalmadigi"
"derleyiciye ve surume baglidir; SecureZeroMemory / explicit_bzero ise her zaman korunur."
