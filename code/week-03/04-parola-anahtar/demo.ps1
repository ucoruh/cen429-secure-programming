# CEN429 - Hafta 3 - Demo 4: Paroladan anahtar turetme (Windows)
# Once derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\pbkdf2demo.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
& "$B\pbkdf2demo.exe"
"=============================================================="
"3) Argon2id notu"
"   Windows'ta ayri bir argon2 araci gelmez. Argon2id, OWASP'in"
"   birinci tercih parola KDF'sidir: PBKDF2'den farkli olarak BELLEK"
"   maliyeti de ister ve boylece GPU/ASIC ile kaba kuvveti daha cok"
"   zorlastirir. WSL'de 'sudo apt-get install -y argon2' ile denenebilir."
