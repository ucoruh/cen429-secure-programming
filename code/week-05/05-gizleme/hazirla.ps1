# CEN429 - Hafta 5 - Demo 5: istege bagli ProGuard'i indirir.
# Resmi surumu (zip) SABIT surum + SHA-256 dogrulamasiyla indirir ve icinden
# yalnizca lib\proguard.jar dosyasini lib\ altina cikarir.
# Ana demo (dize gizleme + yansima) bunsuz da calisir; *.jar depoya girmez.
Set-Location $PSScriptRoot
$surum = "7.4.2"
$zip = "proguard-$surum.zip"
$url = "https://github.com/Guardsquare/proguard/releases/download/v$surum/$zip"
$sha = "164b26a6ca655296bede9b1474ee47e24369d59860fdcebaa64d210221bce5fa"
New-Item -ItemType Directory -Force lib | Out-Null
if (Test-Path "lib\proguard.jar") { "Zaten var: lib\proguard.jar"; exit 0 }
"Indiriliyor (~32 MB): $url"
try {
    Invoke-WebRequest -Uri $url -OutFile "lib\$zip" -UseBasicParsing
} catch {
    "Indirme basarisiz: $($_.Exception.Message)"; exit 1
}
$gelen = (Get-FileHash "lib\$zip" -Algorithm SHA256).Hash.ToLower()
if ($gelen -ne $sha) {
    "SHA-256 UYUSMADI!"; "  Beklenen: $sha"; "  Gelen   : $gelen"
    Remove-Item "lib\$zip" -Force; exit 1
}
"Dogrulandi (SHA-256 tuttu)."
Expand-Archive -Path "lib\$zip" -DestinationPath "lib\_pg" -Force
Copy-Item "lib\_pg\proguard-$surum\lib\proguard.jar" "lib\proguard.jar" -Force
Remove-Item "lib\_pg" -Recurse -Force
Remove-Item "lib\$zip" -Force
"Hazir: lib\proguard.jar  ->  simdi: .\demo.ps1"
