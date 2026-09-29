# CEN429 - Week 10 - Demo 8: Diffie-Hellman toy exchange + MITM (Windows)
Set-Location $PSScriptRoot
$py = $null
foreach ($candidate in @("py", "python", "python3")) {
    if (Get-Command $candidate -ErrorAction SilentlyContinue) { $py = $candidate; break }
}
if (-not $py) { "Python 3 not found (https://www.python.org)."; exit 1 }
$arg = @(); if ($py -eq "py") { $arg = @("-3") }
& $py @arg dh_toy.py
