# CEN429 — Week 1 — Demo 2: Password left in memory (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
# At the wait_here() point the program writes a dump of its own memory to the dump\ folder
# (MiniDumpWriteDump); the script then searches the dump for the password. Only produces
# files inside this folder.
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\password_no_wipe.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
$password = (Get-Content password.txt -Raw).Trim()
New-Item -ItemType Directory -Force dump | Out-Null
function Line { "--------------------------------------------------------------" }

function Dump([string]$name) {
    $file = Join-Path $PSScriptRoot "dump\$name.dmp"
    if (Test-Path $file) { Remove-Item $file -Force }
    $env:CEN429_DUMP = $file
    & ".\$B\$name.exe" password.txt | Out-Host
    Remove-Item Env:\CEN429_DUMP
    $bytes = [IO.File]::ReadAllBytes($file)
    $text = [Text.Encoding]::ASCII.GetString($bytes)
    $count = ([regex]::Matches($text, [regex]::Escape($password))).Count
    "  Memory dump: dump\$name.dmp ($($bytes.Length) bytes)"
    if ($count -gt 0) { "  RESULT: password FOUND in the dump in $count place(s)  ->  $password" }
    else { "  RESULT: password not found in the dump" }
}

"Password file: password.txt  ->  $password"
Line; "STEP 1 - Version that never wipes the password";           Dump password_no_wipe
Line; "STEP 2 - Version that wipes with memset (/O2)";             Dump password_memset
Line; "STEP 3 - Version that wipes with SecureZeroMemory (/O2)";   Dump password_explicit
Line
"Note: compilers can behave differently about removing 'dead stores'. Whether memset survives"
"depends on the compiler and its version; SecureZeroMemory / explicit_bzero are always kept."
