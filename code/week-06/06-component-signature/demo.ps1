# CEN429 - Week 6 - Demo 6: Component/package signature verification (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\signature.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
if (Test-Path output) { Remove-Item -Recurse -Force output }
New-Item -ItemType Directory -Force output | Out-Null
function Line { "--------------------------------------------------------------" }

Line; "STEP 1 - Create a sample 'plugin module' file"
Set-Content -Path output\module.dat -Value "VERSION=1.0`nPAYMENT-MODULE`nprivilege=approve" -NoNewline
"module.dat content:"; Get-Content output\module.dat | ForEach-Object { "   $_" }

Line; "STEP 2 - At build time the module is signed (detached HMAC signature)"
& "$B\signature.exe" generate output\module.dat output\module.sig

Line; "STEP 3 - Verify before loading (module unchanged): HOLDS"
& "$B\signature.exe" verify output\module.dat output\module.sig
"   (exit code $LASTEXITCODE - 0 = held)"

Line; "STEP 4 - Attack: the module is REPACKAGED (one character changes)"
Add-Content -Path output\module.dat -Value "X"
"> appended 'X' to the end of module.dat"
& "$B\signature.exe" verify output\module.dat output\module.sig
if ($LASTEXITCODE -ne 0) { "   (exit code $LASTEXITCODE - repackaging DETECTED)" }

Line
"Note: APK v2/v3 uses a PUBLIC-KEY (asymmetric) signature; the verifier only"
"needs the public key. Here we use shared-key HMAC for teaching; asymmetric"
"signing comes in Week 10. Same principle: integrity + provenance before loading."
