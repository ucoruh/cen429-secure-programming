# CEN429 - Week 5 - Demo 1: SQL injection (Windows)
# The main demo runs with Python's built-in sqlite3 module (NO DOWNLOAD).
# For the optional Java (JDBC) section run first: .\prepare.ps1  (downloads sqlite-jdbc).
Set-Location $PSScriptRoot
$py = $null
foreach ($candidate in @("py", "python", "python3")) {
    if (Get-Command $candidate -ErrorAction SilentlyContinue) { $py = $candidate; break }
}
if (-not $py) { "Python 3 not found. Install it from https://www.python.org"; exit 1 }
$arg = @(); if ($py -eq "py") { $arg = @("-3") }
function Line { "==============================================================" }

Line; "PART A - Python + sqlite3 (no download required)"; Line
& $py @arg sql_injection.py

""
Line; "PART B - Java + JDBC (PreparedStatement) - optional"; Line
if (-not (Get-Command javac -ErrorAction SilentlyContinue)) {
    "JDK not found (javac missing). Skipping the Java part."
    "Install: Eclipse Temurin JDK 21 (https://adoptium.net)."
    exit 0
}
$jar = Get-ChildItem lib\sqlite-jdbc-*.jar -ErrorAction SilentlyContinue |
    Select-Object -First 1
New-Item -ItemType Directory -Force bin | Out-Null
& javac --release 17 -d bin SqlDemo.java
if ($LASTEXITCODE -ne 0) { "Compile error"; exit 1 }
if ($jar) {
    "Driver found: $($jar.Name)"
    & java -cp "bin;$($jar.FullName)" SqlDemo
} else {
    "SQLite JDBC driver missing (lib\ is empty)."
    "To run the Java part first:  .\prepare.ps1"
    "(SqlDemo.java was compiled; the Python demo already showed the result.)"
}
