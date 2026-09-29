# CEN429 — builds every demo on Windows (with the Visual Studio 2022 compiler).
# Usage:  .\build.ps1            to clean up:  .\build.ps1 clean
# If the script won't run:  powershell -ExecutionPolicy Bypass -File .\build.ps1
param([string]$Command = "")
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
if ($Command -eq "clean") {
    if (Test-Path build) { Remove-Item -Recurse -Force build }
    Get-ChildItem -Recurse -Directory -Include bin, dokum, dump | Remove-Item -Recurse -Force
    "Cleaned."
    exit 0
}

# If CMake isn't on PATH, use the copy bundled inside Visual Studio.
$cmake = (Get-Command cmake -ErrorAction SilentlyContinue).Source
if (-not $cmake) {
    $vswhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
    if (Test-Path $vswhere) {
        $vs = & $vswhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
        if ($vs) {
            $candidate = Join-Path $vs "Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\cmake.exe"
            if (Test-Path $candidate) { $cmake = $candidate }
        }
    }
}
if (-not $cmake) { throw "CMake not found. Install Visual Studio 2022 with the 'Desktop development with C++' workload." }

& $cmake --preset windows-msvc | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Configuration failed: & '$cmake' --preset windows-msvc" }
& $cmake --build --preset windows-msvc -- /m /v:minimal /nologo
if ($LASTEXITCODE -ne 0) { throw "Build failed." }
"Build complete: binaries are in each demo's bin\windows\ folder."
