# CEN429 - Hafta 5 - Demo 6: SBOM uretimi (Windows). INDIRME GEREKTIRMEZ.
Set-Location $PSScriptRoot
$py = $null
foreach ($aday in @("py", "python", "python3")) {
    if (Get-Command $aday -ErrorAction SilentlyContinue) { $py = $aday; break }
}
if (-not $py) { "Python 3 bulunamadi. https://www.python.org adresinden kurun."; exit 1 }
$arg = @(); if ($py -eq "py") { $arg = @("-3") }
if (Test-Path cikti) { Remove-Item -Recurse -Force cikti }
function Cizgi { "==============================================================" }

Cizgi; "SBOM (CycloneDX 1.5) uretimi ve zafiyet eslestirme"; Cizgi
& $py @arg sbom.py

""
"Uretilen SBOM JSON'in ilk satirlari (cikti\sbom.cyclonedx.json):"
Get-Content cikti\sbom.cyclonedx.json -TotalCount 20 |
    ForEach-Object { "   $_" }
