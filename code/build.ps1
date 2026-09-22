# CEN429 — bütün demoları Windows'ta (Visual Studio 2022 derleyicisiyle) derler.
# Kullanım:  .\build.ps1            temizlemek için:  .\build.ps1 temizle
# Betik çalışmazsa:  powershell -ExecutionPolicy Bypass -File .\build.ps1
param([string]$Komut = "")
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
if ($Komut -eq "temizle") {
    if (Test-Path build) { Remove-Item -Recurse -Force build }
    Get-ChildItem -Recurse -Directory -Include bin, dokum | Remove-Item -Recurse -Force
    "Temizlendi."
    exit 0
}

# CMake PATH'te yoksa Visual Studio'nun kendi içindeki CMake kullanılır.
$cmake = (Get-Command cmake -ErrorAction SilentlyContinue).Source
if (-not $cmake) {
    $vswhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
    if (Test-Path $vswhere) {
        $vs = & $vswhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
        if ($vs) {
            $aday = Join-Path $vs "Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\cmake.exe"
            if (Test-Path $aday) { $cmake = $aday }
        }
    }
}
if (-not $cmake) { throw "CMake bulunamadı. Visual Studio 2022'yi 'C++ ile masaüstü geliştirme' iş yüküyle kurun." }

& $cmake --preset windows-msvc | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Yapılandırma başarısız: & '$cmake' --preset windows-msvc" }
& $cmake --build --preset windows-msvc -- /m /v:minimal /nologo
if ($LASTEXITCODE -ne 0) { throw "Derleme başarısız." }
"Derleme tamam: ikili dosyalar her demonun bin\windows\ klasöründe."
