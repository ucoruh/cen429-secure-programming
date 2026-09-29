# CEN429 - Week 5 - Demo 6: SBOM generation (Windows). NO DOWNLOAD REQUIRED.
Set-Location $PSScriptRoot
$py = $null
foreach ($candidate in @("py", "python", "python3")) {
    if (Get-Command $candidate -ErrorAction SilentlyContinue) { $py = $candidate; break }
}
if (-not $py) { "Python 3 not found. Install it from https://www.python.org"; exit 1 }
$arg = @(); if ($py -eq "py") { $arg = @("-3") }
if (Test-Path output) { Remove-Item -Recurse -Force output }
function Line { "==============================================================" }

Line; "SBOM (CycloneDX 1.5) generation and vulnerability matching"; Line
& $py @arg sbom.py

""
"First lines of the generated SBOM JSON (output\sbom.cyclonedx.json):"
Get-Content output\sbom.cyclonedx.json -TotalCount 20 |
    ForEach-Object { "   $_" }
