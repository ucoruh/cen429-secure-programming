# CEN429 - Hafta 5 - Demo 7: Guvenli seri durumdan cikarma (Windows).
# INDIRME GEREKTIRMEZ; yalnizca JDK gerekir.
Set-Location $PSScriptRoot
if (-not (Get-Command javac -ErrorAction SilentlyContinue)) {
    "JDK bulunamadi (javac yok)."
    "Kurulum: Eclipse Temurin JDK 21 (https://adoptium.net)."
    exit 1
}
New-Item -ItemType Directory -Force bin | Out-Null
& javac --release 17 -d bin SeriDemo.java
if ($LASTEXITCODE -ne 0) { "Derleme hatasi"; exit 1 }
& java -cp bin SeriDemo
