# CEN429 - Hafta 5 - Demo 1: SQL enjeksiyonu (Windows)
# Ana demo Python'un yerlesik sqlite3 modulu ile calisir (INDIRME YOK).
# Istege bagli Java (JDBC) bolumu icin: .\hazirla.ps1  (sqlite-jdbc indirir).
Set-Location $PSScriptRoot
$py = $null
foreach ($aday in @("py", "python", "python3")) {
    if (Get-Command $aday -ErrorAction SilentlyContinue) { $py = $aday; break }
}
if (-not $py) { "Python 3 bulunamadi. https://www.python.org adresinden kurun."; exit 1 }
$arg = @(); if ($py -eq "py") { $arg = @("-3") }
function Cizgi { "==============================================================" }

Cizgi; "BOLUM A - Python + sqlite3 (indirme gerektirmez)"; Cizgi
& $py @arg sqli.py

""
Cizgi; "BOLUM B - Java + JDBC (PreparedStatement) - istege bagli"; Cizgi
if (-not (Get-Command javac -ErrorAction SilentlyContinue)) {
    "JDK bulunamadi (javac yok). Java bolumu atlaniyor."
    "Kurulum: Eclipse Temurin JDK 21 (https://adoptium.net)."
    exit 0
}
$jar = Get-ChildItem lib\sqlite-jdbc-*.jar -ErrorAction SilentlyContinue |
    Select-Object -First 1
New-Item -ItemType Directory -Force bin | Out-Null
& javac --release 17 -d bin SqlDemo.java
if ($LASTEXITCODE -ne 0) { "Derleme hatasi"; exit 1 }
if ($jar) {
    "Surucu bulundu: $($jar.Name)"
    & java -cp "bin;$($jar.FullName)" SqlDemo
} else {
    "SQLite JDBC surucusu yok (lib\ bos)."
    "Java bolumunu calistirmak icin once:  .\hazirla.ps1"
    "(SqlDemo.java derlendi; Python demosu zaten sonucu gosterdi.)"
}
