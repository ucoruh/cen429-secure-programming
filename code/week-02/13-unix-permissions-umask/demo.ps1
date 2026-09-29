# CEN429 - Week 2 - Demo 13: Unix permissions, umask, and setuid (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
# The simulation is identical on both platforms. The real Unix steps need
# WSL; Windows has INHERITANCE instead of umask: we show that under output\.
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\permissions.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
$E = ".\$B\permissions.exe"
function Line { "--------------------------------------------------------------" }

Line; "STEP 1 - Simulation: the permission algorithm, umask, setuid, the sticky bit"
& $E sim

Line; "STEP 2 - The real-kernel step (needs POSIX)"
& $E real

Line; "STEP 3 - umask's Windows counterpart: inheritance from the parent folder"
New-Item -ItemType Directory -Force output | Out-Null
Set-Content -Path output\new.txt -Value "a new file" -Encoding ascii
"> icacls output"
icacls output
"> icacls output\new.txt"
icacls output\new.txt
"   ^ The new file did not choose its own permissions: the (I)-marked ACEs"
"     were inherited from the parent folder. On Unix, umask + the open() mode do this job."

Line; "Cleanup: deleting the output\ folder"
Remove-Item -Recurse -Force output
"For the real Unix steps (umask, chmod, ACL, capabilities), in WSL:"
"  sh demo.sh"
