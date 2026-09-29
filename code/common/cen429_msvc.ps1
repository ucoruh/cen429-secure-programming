# CEN429 — helper for demo scripts: runs Visual Studio's cl.exe compiler without having to open a
# "Developer PowerShell". Usage (inside demo.ps1):
#   . "$PSScriptRoot\..\..\common\cen429_msvc.ps1"
#   Invoke-Cl /nologo /Zs /W4 source.c
function Invoke-Cl {
    $vswhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
    if (-not (Test-Path $vswhere)) { "   (Visual Studio not found: this step was skipped)"; return }
    $vs = & $vswhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
    if (-not $vs) { "   (the 'Desktop development with C++' workload is not installed: this step was skipped)"; return }
    $vcvarsPath = Join-Path $vs "VC\Auxiliary\Build\vcvars64.bat"
    $argsLine = ($args | ForEach-Object { if ("$_" -match '\s') { "`"$_`"" } else { "$_" } }) -join ' '
    cmd /c "`"$vcvarsPath`" >nul 2>nul && cl $argsLine" 2>&1 | ForEach-Object { "$_" }
}
