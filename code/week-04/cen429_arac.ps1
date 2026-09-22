# CEN429 - Hafta 4 demolari icin yardimci: Visual Studio'nun dumpbin araci
# "Developer PowerShell" acmadan calistirir (cen429_msvc.ps1 kalibi).
# Kullanim (demo.ps1 icinde):
#   . "$PSScriptRoot\..\cen429_arac.ps1"
#   Invoke-Dumpbin /headers bin\windows\giris_sert.exe
function Invoke-Dumpbin {
    $vswhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
    if (-not (Test-Path $vswhere)) { "   (Visual Studio bulunamadi: bu adim atlandi)"; return }
    $vs = & $vswhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
    if (-not $vs) { "   (C++ ile masaustu gelistirme is yuku kurulu degil: bu adim atlandi)"; return }
    $ortam = Join-Path $vs "VC\Auxiliary\Build\vcvars64.bat"
    $argumanlar = ($args | ForEach-Object { if ("$_" -match '\s') { "`"$_`"" } else { "$_" } }) -join ' '
    cmd /c "`"$ortam`" >nul 2>nul && dumpbin $argumanlar" 2>&1 | ForEach-Object { "$_" }
}
