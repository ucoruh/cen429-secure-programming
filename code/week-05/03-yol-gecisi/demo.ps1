# CEN429 - Hafta 5 - Demo 3: Yol gecisi (Windows). INDIRME GEREKTIRMEZ.
Set-Location $PSScriptRoot
$py = $null
foreach ($aday in @("py", "python", "python3")) {
    if (Get-Command $aday -ErrorAction SilentlyContinue) { $py = $aday; break }
}
$arg = @(); if ($py -eq "py") { $arg = @("-3") }
if (Test-Path cikti) { Remove-Item -Recurse -Force cikti }
function Cizgi { "==============================================================" }

Cizgi; "BOLUM A - Python (pathlib)"; Cizgi
if ($py) {
    & $py @arg yol.py
} else {
    "Python 3 bulunamadi (https://www.python.org); Python bolumu atlandi."
}

""
Cizgi; "BOLUM B - Java (java.nio.file)"; Cizgi
if (-not (Get-Command javac -ErrorAction SilentlyContinue)) {
    "JDK bulunamadi (javac yok). Java bolumu atlaniyor."
    "Kurulum: Eclipse Temurin JDK 21 (https://adoptium.net)."
    exit 0
}
if (Test-Path cikti) { Remove-Item -Recurse -Force cikti }
New-Item -ItemType Directory -Force bin | Out-Null
& javac --release 17 -d bin YolDemo.java
if ($LASTEXITCODE -ne 0) { "Derleme hatasi"; exit 1 }
& java -cp bin YolDemo
