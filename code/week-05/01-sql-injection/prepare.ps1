# CEN429 - Week 5 - Demo 1: downloads the optional SQLite JDBC driver.
# Downloads it from Maven Central at a PINNED version, verified by SHA-256, into lib\.
# This file never enters the repository (*.jar is in .gitignore). The main demo
# works fine without it.
Set-Location $PSScriptRoot
$version = "3.42.0.0"
$jar = "sqlite-jdbc-$version.jar"
$url = "https://repo1.maven.org/maven2/org/xerial/sqlite-jdbc/$version/$jar"
$sha = "53174d76087bb73cc29db9c02766fb921fd7fc652f7952f3609e0018e3dd5ded"
New-Item -ItemType Directory -Force lib | Out-Null
if (Test-Path "lib\$jar") { "Already present: lib\$jar"; exit 0 }
"Downloading: $url"
try {
    Invoke-WebRequest -Uri $url -OutFile "lib\$jar" -UseBasicParsing
} catch {
    "Download failed: $($_.Exception.Message)"; exit 1
}
$got = (Get-FileHash "lib\$jar" -Algorithm SHA256).Hash.ToLower()
if ($got -ne $sha) {
    "SHA-256 MISMATCH!"
    "  Expected: $sha"
    "  Got     : $got"
    Remove-Item "lib\$jar" -Force; exit 1
}
"Verified (SHA-256 matched): lib\$jar"
"Now run: .\demo.ps1"
