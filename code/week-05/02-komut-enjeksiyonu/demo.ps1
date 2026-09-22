# CEN429 - Hafta 5 - Demo 2: Komut enjeksiyonu (Windows)
# INDIRME GEREKTIRMEZ. Python bolumu her zaman calisir; Java bolumu JDK varsa.
Set-Location $PSScriptRoot
$py = $null
foreach ($aday in @("py", "python", "python3")) {
    if (Get-Command $aday -ErrorAction SilentlyContinue) { $py = $aday; break }
}
$arg = @(); if ($py -eq "py") { $arg = @("-3") }
function Cizgi { "==============================================================" }

Cizgi; "BOLUM A - Python (subprocess: shell=True vs arguman listesi)"; Cizgi
if ($py) {
    & $py @arg komut.py
} else {
    "Python 3 bulunamadi (https://www.python.org); Python bolumu atlandi."
}

""
Cizgi; "BOLUM B - Java (Runtime.exec vs ProcessBuilder)"; Cizgi
if (-not (Get-Command javac -ErrorAction SilentlyContinue)) {
    "JDK bulunamadi (javac yok). Java bolumu atlaniyor."
    "Kurulum: Eclipse Temurin JDK 21 (https://adoptium.net)."
    exit 0
}
New-Item -ItemType Directory -Force bin | Out-Null
& javac --release 17 -d bin Yazici.java KomutDemo.java
if ($LASTEXITCODE -ne 0) { "Derleme hatasi"; exit 1 }
& java -cp bin KomutDemo
