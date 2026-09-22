# CEN429 — demo betikleri için yardımcı: Visual Studio'nun cl.exe derleyicisini
# "Developer PowerShell" açmadan çalıştırır. Kullanım (demo.ps1 içinde):
#   . "$PSScriptRoot\..\..\common\cen429_msvc.ps1"
#   Invoke-Cl /nologo /Zs /W4 kaynak.c
function Invoke-Cl {
    $vswhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
    if (-not (Test-Path $vswhere)) { "   (Visual Studio bulunamadi: bu adim atlandi)"; return }
    $vs = & $vswhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
    if (-not $vs) { "   (C++ ile masaustu gelistirme is yuku kurulu degil: bu adim atlandi)"; return }
    $ortam = Join-Path $vs "VC\Auxiliary\Build\vcvars64.bat"
    $argumanlar = ($args | ForEach-Object { if ("$_" -match '\s') { "`"$_`"" } else { "$_" } }) -join ' '
    cmd /c "`"$ortam`" >nul 2>nul && cl $argumanlar" 2>&1 | ForEach-Object { "$_" }
}
