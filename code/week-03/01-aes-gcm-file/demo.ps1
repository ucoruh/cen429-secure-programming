# CEN429 - Week 3 - Demo 1: AES-256-GCM file encryption (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\aes_gcm_file.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
if (Test-Path output) { Remove-Item -Recurse -Force output }
New-Item -ItemType Directory -Force output | Out-Null
function Line { "--------------------------------------------------------------" }

Line; "STEP 1 - A 32-byte random key and a sample secret file"
$key = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($key)
[IO.File]::WriteAllBytes("$PWD\output\key.bin", $key)
[IO.File]::WriteAllText("$PWD\output\secret.txt",
    "IBAN: TR00 0000 0000 0000 0000 0000 00`nBalance: 12345`n")
"secret.txt contents:"; Get-Content output\secret.txt | ForEach-Object { "   $_" }

Line; "STEP 2 - Encrypt"
& "$B\aes_gcm_file.exe" encrypt output\key.bin output\secret.txt output\secret.enc
"First 32 bytes of the ciphertext file (nonce + ciphertext):"
$enc = [IO.File]::ReadAllBytes("$PWD\output\secret.enc")
"   " + (($enc[0..31] | ForEach-Object { $_.ToString("x2") }) -join " ")

Line; "STEP 3 - Decrypt correctly (the tag matches)"
& "$B\aes_gcm_file.exe" decrypt output\key.bin output\secret.enc output\decrypted.txt
"Decrypted contents:"; Get-Content output\decrypted.txt | ForEach-Object { "   $_" }

Line; "STEP 4 - Attack: change byte 20 of the ciphertext"
$raw = [IO.File]::ReadAllBytes("$PWD\output\secret.enc")
$raw[20] = $raw[20] -bxor 0xFF
[IO.File]::WriteAllBytes("$PWD\output\tampered.enc", $raw)
"> aes_gcm_file decrypt ... tampered.enc"
& "$B\aes_gcm_file.exe" decrypt output\key.bin output\tampered.enc output\wont-happen.txt
if ($LASTEXITCODE -ne 0) { "   (exit code $LASTEXITCODE - decryption rejected)" }

Line; "STEP 5 - Attack: change only the last byte of the TAG"
$raw = [IO.File]::ReadAllBytes("$PWD\output\secret.enc")
$raw[$raw.Length - 1] = $raw[$raw.Length - 1] -bxor 0x01
[IO.File]::WriteAllBytes("$PWD\output\tag-tampered.enc", $raw)
& "$B\aes_gcm_file.exe" decrypt output\key.bin output\tag-tampered.enc output\wont-happen2.txt
if ($LASTEXITCODE -ne 0) { "   (exit code $LASTEXITCODE - the tag did not match)" }
