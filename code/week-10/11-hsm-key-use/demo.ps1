# CEN429 - Week 10 - Demo 11: simulated HSM / PKCS#11-style key-handle API (Windows)
Set-Location $PSScriptRoot
$py = $null
foreach ($candidate in @("py", "python", "python3")) {
    if (Get-Command $candidate -ErrorAction SilentlyContinue) { $py = $candidate; break }
}
if (-not $py) { "Python 3 not found (https://www.python.org)."; exit 1 }
$arg = @(); if ($py -eq "py") { $arg = @("-3") }
& $py @arg hsm_sim.py
