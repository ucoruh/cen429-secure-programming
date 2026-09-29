# CEN429 - Week 3 - Demo 4: deriving a key from a password (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\password_to_key.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
& "$B\password_to_key.exe"
"=============================================================="
"3) A note on Argon2id"
"   Windows does not ship a separate argon2 tool. Argon2id is OWASP's"
"   first-choice password KDF: unlike PBKDF2, it also demands MEMORY"
"   cost, which makes brute force with a GPU/ASIC much harder. Try it in"
"   WSL with 'sudo apt-get install -y argon2'."
