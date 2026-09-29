# CEN429 - Week 2 - Demo 5: CVSS v3.1 base score calculator (Windows)
# No build needed; Python 3.8+ is enough.  Run with: .\demo.ps1
Set-Location $PSScriptRoot
$py = $null
foreach ($candidate in @("py", "python", "python3")) {
    if (Get-Command $candidate -ErrorAction SilentlyContinue) { $py = $candidate; break }
}
if (-not $py) { "Python 3 not found. Install it from https://www.python.org"; exit 1 }
# Add a version flag for the 'py' launcher (py -3); empty for the others.
$arg = @(); if ($py -eq "py") { $arg = @("-3") }
function Line { "--------------------------------------------------------------" }

Line; "STEP 1 - Score the built-in vulnerability vectors"
& $py @arg cvss.py --examples
Line; "STEP 2 - Score a single vector by hand"
"> python cvss.py CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
& $py @arg cvss.py "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
Line; "STEP 3 - Verification: compare against the FIRST v3.1 specification's scores"
& $py @arg test_cvss.py
Line; "Result: the same flaw scores differently once authentication/interaction/scope change."
"The score sets a priority; but you add the context (the value of your asset)."
