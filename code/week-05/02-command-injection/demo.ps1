# CEN429 - Week 5 - Demo 2: command injection (Windows)
# NO DOWNLOAD REQUIRED. The Python part always runs; the Java part runs if a JDK is present.
Set-Location $PSScriptRoot
$py = $null
foreach ($candidate in @("py", "python", "python3")) {
    if (Get-Command $candidate -ErrorAction SilentlyContinue) { $py = $candidate; break }
}
$arg = @(); if ($py -eq "py") { $arg = @("-3") }
function Line { "==============================================================" }

Line; "PART A - Python (subprocess: shell=True vs argument list)"; Line
if ($py) {
    & $py @arg command_injection.py
} else {
    "Python 3 not found (https://www.python.org); Python part skipped."
}

""
Line; "PART B - Java (Runtime.exec vs ProcessBuilder)"; Line
if (-not (Get-Command javac -ErrorAction SilentlyContinue)) {
    "JDK not found (javac missing). Skipping the Java part."
    "Install: Eclipse Temurin JDK 21 (https://adoptium.net)."
    exit 0
}
New-Item -ItemType Directory -Force bin | Out-Null
& javac --release 17 -d bin Printer.java CommandDemo.java
if ($LASTEXITCODE -ne 0) { "Compile error"; exit 1 }
& java -cp bin CommandDemo
