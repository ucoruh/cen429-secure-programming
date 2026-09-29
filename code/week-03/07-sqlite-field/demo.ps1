# CEN429 - Week 3 - Demo 7: SQLite field encryption (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\sqlite_field.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
if (Test-Path output) { Remove-Item -Recurse -Force output }
New-Item -ItemType Directory -Force output | Out-Null
# Synthetic 32-byte key (fixed for the demo; in reality it would come from a KDF).
$KEY = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f"
$BAD = "ff0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f"
function Line { "--------------------------------------------------------------" }

Line; "STEP 1 - Set up the database (the sensitive field is encrypted)"
$env:SIM_KEY = $KEY
& "$B\sqlite_field.exe" create output\customers.db

Line; "STEP 2 - An attacker stole the raw DB file and is searching it:"
$bytes = [IO.File]::ReadAllBytes("$PWD\output\customers.db")
$text = [Text.Encoding]::ASCII.GetString($bytes)
$nameFound = if ($text -match "Jane") { "FOUND (the name field is plain)" } else { "not there" }
$cardFound = if ($text -match "4242-4242") { "FOUND" } else { "NOT THERE - encrypted" }
"   'Jane' (name) in the raw DB      : $nameFound"
"   '4242-4242' (card) in the raw DB : $cardFound"
"   ^ The card field is encrypted, so it does not show up in the raw file."

Line; "STEP 3 - The application reads with the correct key (decrypt and verify):"
$env:SIM_KEY = $KEY
& "$B\sqlite_field.exe" read output\customers.db | ForEach-Object { "   $_" }

Line; "STEP 4 - A read attempt with the WRONG key (the GCM tag will not match):"
$env:SIM_KEY = $BAD
& "$B\sqlite_field.exe" read output\customers.db | ForEach-Object { "   $_" }
Remove-Item Env:\SIM_KEY
