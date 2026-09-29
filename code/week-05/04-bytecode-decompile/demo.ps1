# CEN429 - Week 5 - Demo 4: bytecode and decompiling (Windows).
# NO DOWNLOAD REQUIRED; only the JDK's own javac and javap tools are used.
Set-Location $PSScriptRoot
if (-not (Get-Command javac -ErrorAction SilentlyContinue)) {
    "JDK not found (javac missing)."
    "Install: Eclipse Temurin JDK 21 (https://adoptium.net)."
    exit 1
}
function Line { "==============================================================" }
New-Item -ItemType Directory -Force bin | Out-Null
& javac --release 17 -d bin LicenseCheck.java
if ($LASTEXITCODE -ne 0) { "Compile error"; exit 1 }

Line; "STEP 1 - The program runs normally (with a wrong PIN)"; Line
& java -cp bin LicenseCheck 1234

Line; "STEP 2 - 'javap -p': private field and method NAMES are visible"; Line
& javap -p -cp bin LicenseCheck

Line; "STEP 3 - 'javap -c -p': the constant STRINGS and logic are visible"; Line
"(WITHOUT the source code, from the .class file alone)"
& javap -c -p -cp bin LicenseCheck |
    Select-String -Pattern "String","pinCorrect","licenseValid","boolean"

Line
"Result: 'javac' output is reversible. PIN='4729' and the license key"
"stand in plain sight in the bytecode; the method names give the logic away."
"Demo 5 will make this harder with string hiding + reflection."
