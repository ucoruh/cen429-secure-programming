# CEN429 - Week 6 - Demo 1: Runtime integrity check (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\integrity.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
if (Test-Path output) { Remove-Item -Recurse -Force output }
New-Item -ItemType Directory -Force output | Out-Null
function Line { "--------------------------------------------------------------" }

Line; "STEP 1 - The application saves the golden HMAC of its OWN binary"
& "$B\integrity.exe" save self output\golden.hmac

Line; "STEP 2 - Normal run: integrity verifies OK (no patch)"
& "$B\integrity.exe" verify self output\golden.hmac
"   (exit code $LASTEXITCODE - 0 = clean)"

Line; "STEP 3 - Attack: a COPY of the binary is made and 1 byte is changed"
Copy-Item "$B\integrity.exe" output\integrity_patched.exe
$raw = [IO.File]::ReadAllBytes("$PWD\output\integrity_patched.exe")
$offset = [int]($raw.Length / 2)
"> flip byte at offset $offset (0x{0:X2} -> 0x{1:X2})" -f $raw[$offset], ($raw[$offset] -bxor 0xFF)
$raw[$offset] = $raw[$offset] -bxor 0xFF
[IO.File]::WriteAllBytes("$PWD\output\integrity_patched.exe", $raw)

Line; "STEP 4 - The patched copy's HMAC is compared with the golden value"
& "$B\integrity.exe" verify output\integrity_patched.exe output\golden.hmac
if ($LASTEXITCODE -ne 0) { "   (exit code $LASTEXITCODE - patch DETECTED)" }

Line
"Note: the HMAC key lives inside the binary; that alone is not enough."
"An attacker could patch the checker too. Real RASP: multiple/overlapping"
"checkers, a data dependency on the result (Demo 5), server-side attestation."
