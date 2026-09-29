# CEN429 - Week 2 - Demo 10: log injection (CWE-117) (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
# Only writes under this folder's work\; never touches a system log.
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\logtool.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
$A = ".\$B\logtool.exe"
$C = "work"
if (Test-Path $C) { Remove-Item $C -Recurse -Force }
New-Item -ItemType Directory -Force $C | Out-Null
function Line { "--------------------------------------------------------------" }

# A helper that makes control characters visible (like cat -v).
function Show([string]$file) {
    $bytes = [IO.File]::ReadAllBytes((Join-Path $PSScriptRoot $file))
    $sb = New-Object System.Text.StringBuilder
    foreach ($b in $bytes) {
        if ($b -eq 10) { [void]$sb.Append("$")  ; [void]$sb.Append("`r`n    ") }
        elseif ($b -eq 13) { [void]$sb.Append("^M") }
        elseif ($b -eq 27) { [void]$sb.Append("^[") }
        elseif ($b -lt 32) { [void]$sb.Append("^" + [char]($b + 64)) }
        else { [void]$sb.Append([char]$b) }
    }
    "    " + $sb.ToString()
}

"Sample inputs (some contain a line ending / control character):"
& $A generate $C | Out-Host
Line; "STEP 1 - UNSAFE log: the field is written without any check"
& $A write unsafe "$C\01-normal.bin"    "$C\unsafe.log"
& $A write unsafe "$C\02-injection.bin" "$C\unsafe.log"
& $A write unsafe "$C\03-control.bin"   "$C\unsafe.log"
"  --- contents of unsafe.log (control characters shown with ^):"
Show "$C\unsafe.log"
Line; "STEP 2 - Count the forged line:"
& $A count "$C\unsafe.log" | Out-Host
Line; "STEP 3 - SAFE log: escaping + a length limit + a fixed format string"
& $A write safe "$C\01-normal.bin"    "$C\safe.log"
& $A write safe "$C\02-injection.bin" "$C\safe.log"
& $A write safe "$C\03-control.bin"   "$C\safe.log"
& $A write safe "$C\04-too-long.bin"  "$C\safe.log"
"  --- contents of safe.log:"
Show "$C\safe.log"
Line; "STEP 4 - Count the forged line (safe):"
& $A count "$C\safe.log" | Out-Host
"   ^ The counter still finds the same words -- it only greps text, it"
"     does not parse records -- but they now sit INSIDE bob's own single"
"     line, escaped. No FIFTH line was created: 4 inputs -> 4 lines."
Line
"Result: the unsafe version turned 3 inputs into 4 lines (an injection);"
"one of those lines is a brand new, standalone, believable admin record."
"In the safe version every input is still a SINGLE line (4 in, 4 out);"
"CR/LF and ESC were escaped as \xNN, the long field was truncated, and"
"the injected text stays trapped, visibly mangled, inside bob's own line."
