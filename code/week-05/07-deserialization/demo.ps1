# CEN429 - Week 5 - Demo 7: safe deserialization (Windows).
# NO DOWNLOAD REQUIRED; only the JDK is needed.
Set-Location $PSScriptRoot
if (-not (Get-Command javac -ErrorAction SilentlyContinue)) {
    "JDK not found (javac missing)."
    "Install: Eclipse Temurin JDK 21 (https://adoptium.net)."
    exit 1
}
New-Item -ItemType Directory -Force bin | Out-Null
& javac --release 17 -d bin SerializationDemo.java
if ($LASTEXITCODE -ne 0) { "Compile error"; exit 1 }
& java -cp bin SerializationDemo
