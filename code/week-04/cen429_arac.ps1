# CEN429 - Week 4 demos: helper for Visual Studio's dumpbin tool
# Runs it without opening "Developer PowerShell" (same pattern as cen429_msvc.ps1).
# Usage (inside demo.ps1):
#   . "$PSScriptRoot\..\cen429_arac.ps1"
#   Invoke-Dumpbin /headers bin\windows\overflow_hardened.exe
function Invoke-Dumpbin {
    $vswhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
    if (-not (Test-Path $vswhere)) { "   (Visual Studio not found: this step was skipped)"; return }
    $vs = & $vswhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
    if (-not $vs) { "   (the 'Desktop development with C++' workload is not installed: this step was skipped)"; return }
    $vcvarsPath = Join-Path $vs "VC\Auxiliary\Build\vcvars64.bat"
    $argsLine = ($args | ForEach-Object { if ("$_" -match '\s') { "`"$_`"" } else { "$_" } }) -join ' '
    cmd /c "`"$vcvarsPath`" >nul 2>nul && dumpbin $argsLine" 2>&1 | ForEach-Object { "$_" }
}
