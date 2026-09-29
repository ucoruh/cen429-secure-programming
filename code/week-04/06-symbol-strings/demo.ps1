# CEN429 - Week 4 - Demo 6: symbol and string leakage (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\secret_exposed.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
function Line { "--------------------------------------------------------------" }

# Does an ASCII string occur in a binary? (a pure-PowerShell 'strings' substitute)
# Resolve-Path (not a bare relative path) before ReadAllBytes: .NET's relative-path resolution
# follows the process's Environment.CurrentDirectory, which some PowerShell hosts do NOT keep in
# sync with Set-Location/$PWD -- a bare relative path can then silently miss the file.
function Has-String($file, $pattern) {
    $full = (Resolve-Path $file).Path
    $bytes = [System.IO.File]::ReadAllBytes($full)
    $text = -join ($bytes | ForEach-Object { if ($_ -ge 32 -and $_ -lt 127) { [char]$_ } else { " " } })
    return ($text -match $pattern)
}

Line; "STEP 1 - Both versions behave the SAME (correct key: CEN429-LICENSE-2026)"
"> .\$B\secret_exposed.exe  CEN429-LICENSE-2026"; & ".\$B\secret_exposed.exe"  CEN429-LICENSE-2026
"> .\$B\secret_hidden.exe CEN429-LICENSE-2026"; & ".\$B\secret_hidden.exe" CEN429-LICENSE-2026
Line; "STEP 2 - Does the secret string appear in the binary as plain text?"
if (Has-String "$B\secret_exposed.exe" 'CEN429-LICENSE-2026') {
    "   secret_exposed.exe : 'CEN429-LICENSE-2026' FOUND (leak!)" }
else { "   secret_exposed.exe : not found" }
if (Has-String "$B\secret_hidden.exe" 'CEN429-LICENSE-2026') {
    "   secret_hidden.exe : 'CEN429-LICENSE-2026' FOUND" }
else { "   secret_hidden.exe : not found -> string is hidden (XOR-obfuscated)" }
if (Has-String "$B\secret_exposed.exe" '\[LOG\]') { "   secret_exposed.exe : '[LOG]' text FOUND" }
else { "   secret_exposed.exe : '[LOG]' text not found" }
if (-not (Has-String "$B\secret_hidden.exe" '\[LOG\]')) { "   secret_hidden.exe : no LOG text (not compiled in)" }
else { "   secret_hidden.exe : '[LOG]' text FOUND (unexpected)" }
Line; "STEP 3 - Symbols and the PDB"
"   On Windows, function names live in the .pdb file, not the EXE."
$pdbExposed = Test-Path "$B\secret_exposed.pdb"
$pdbHidden = Test-Path "$B\secret_hidden.pdb"
"   secret_exposed.pdb exists? $pdbExposed   (debug info; should NOT be shipped)"
"   secret_hidden.pdb exists? $pdbHidden   (not produced, thanks to /DEBUG:NONE)"
"   dumpbin /symbols on a release EXE usually returns empty anyway."
Line
"Lesson: a shipped binary should not carry logging strings, hidden constants or debug symbols."
"Hide the strings, strip the symbols, do not ship the PDB."
