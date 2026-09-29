# CEN429 - Week 5 - Demo 3: path traversal (Windows). NO DOWNLOAD REQUIRED.
Set-Location $PSScriptRoot
$py = $null
foreach ($candidate in @("py", "python", "python3")) {
    if (Get-Command $candidate -ErrorAction SilentlyContinue) { $py = $candidate; break }
}
$arg = @(); if ($py -eq "py") { $arg = @("-3") }
if (Test-Path output) { Remove-Item -Recurse -Force output }
function Line { "==============================================================" }

Line; "PART A - Python (pathlib)"; Line
if ($py) {
    & $py @arg path_traversal.py
} else {
    "Python 3 not found (https://www.python.org); Python part skipped."
}

""
Line; "PART B - Java (java.nio.file)"; Line
if (-not (Get-Command javac -ErrorAction SilentlyContinue)) {
    "JDK not found (javac missing). Skipping the Java part."
    "Install: Eclipse Temurin JDK 21 (https://adoptium.net)."
    exit 0
}
if (Test-Path output) { Remove-Item -Recurse -Force output }
New-Item -ItemType Directory -Force bin | Out-Null
& javac --release 17 -d bin PathDemo.java
if ($LASTEXITCODE -ne 0) { "Compile error"; exit 1 }
& java -cp bin PathDemo
