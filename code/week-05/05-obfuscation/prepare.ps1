# CEN429 - Week 5 - Demo 5: downloads the optional ProGuard tool.
# Downloads the official release (zip) at a PINNED version, verified by
# SHA-256, and extracts only lib\proguard.jar into lib\.
# The main demo (string hiding + reflection) works without it; *.jar never
# enters the repository.
Set-Location $PSScriptRoot
$version = "7.4.2"
$zip = "proguard-$version.zip"
$url = "https://github.com/Guardsquare/proguard/releases/download/v$version/$zip"
$sha = "164b26a6ca655296bede9b1474ee47e24369d59860fdcebaa64d210221bce5fa"
New-Item -ItemType Directory -Force lib | Out-Null
if (Test-Path "lib\proguard.jar") { "Already present: lib\proguard.jar"; exit 0 }
"Downloading (~32 MB): $url"
try {
    Invoke-WebRequest -Uri $url -OutFile "lib\$zip" -UseBasicParsing
} catch {
    "Download failed: $($_.Exception.Message)"; exit 1
}
$got = (Get-FileHash "lib\$zip" -Algorithm SHA256).Hash.ToLower()
if ($got -ne $sha) {
    "SHA-256 MISMATCH!"; "  Expected: $sha"; "  Got     : $got"
    Remove-Item "lib\$zip" -Force; exit 1
}
"Verified (SHA-256 matched)."
Expand-Archive -Path "lib\$zip" -DestinationPath "lib\_pg" -Force
Copy-Item "lib\_pg\proguard-$version\lib\proguard.jar" "lib\proguard.jar" -Force
Remove-Item "lib\_pg" -Recurse -Force
Remove-Item "lib\$zip" -Force
"Ready: lib\proguard.jar  ->  now run: .\demo.ps1"
