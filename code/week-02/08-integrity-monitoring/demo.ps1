# CEN429 - Week 2 - Demo 08: integrity monitoring (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
# Only generates synthetic files under this folder's output\ and looks at them.
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\integrity_monitor.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
$T = ".\$B\integrity_monitor.exe"
$K = "output\monitored"
$M = "output\manifest.txt"
$A = "output\seal.key"
function Line { "--------------------------------------------------------------" }
# Identical bytes on both platforms: ASCII, LF line endings, no BOM
function Write-Sample($name, $text) {
    [IO.File]::WriteAllBytes((Join-Path $PSScriptRoot $name), [Text.Encoding]::ASCII.GetBytes($text))
}
function Append-Sample($name, $text) {
    [IO.File]::AppendAllText((Join-Path $PSScriptRoot $name), $text, [Text.Encoding]::ASCII)
}

if (Test-Path output) { Remove-Item -Recurse -Force output }
New-Item -ItemType Directory -Force $K | Out-Null
Write-Sample "$K\config.conf" "server=127.0.0.1`nport=8443`nlogging=on`n"
Write-Sample "$K\library.bin" "CEN429 sample library version 1.0`nfunc_a func_b`n"
Write-Sample "$K\start.txt"   "run: app --secure`n"
Write-Sample "$K\data.txt"    "record 1`nrecord 2`nrecord 3`n"

Line; "STEP 1 - A baseline while everything is known good (a SHA-256 manifest)"
& $T create $K $M

Line; "STEP 2 - The defender seals the manifest with HMAC (the key lives elsewhere)"
& $T key $A
& $T seal $M $A

Line; "STEP 3 - Verification with nothing changed"
& $T verify $K $M

Line; "STEP 4 - Simulation: an 'attacker' touches the files"
"  a line was added to library.bin, data.txt was removed, hidden.bin was dropped"
Append-Sample "$K\library.bin" "func_backdoor`n"
Remove-Item -Force "$K\data.txt"
Write-Sample "$K\hidden.bin" "a dropped file`n"
& $T verify $K $M

Line; "STEP 5 - To cover their tracks, the attacker rewrites the manifest too"
& $T create $K $M | Out-Null
& $T verify $K $M
"   ^ If the manifest isn't protected, the monitor is FOOLED: everything looks OK."

Line; "STEP 6 - But the seal (HMAC) cannot be regenerated without the key"
& $T verify-seal $M $A

Line; "Result: the digest catches changes; the expected values need protecting too."
