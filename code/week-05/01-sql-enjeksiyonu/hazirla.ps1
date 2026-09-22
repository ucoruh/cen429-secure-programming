# CEN429 - Hafta 5 - Demo 1: istege bagli SQLite JDBC surucusunu indirir.
# Maven Central'dan SABIT surum + SHA-256 dogrulamasiyla lib\ altina koyar.
# Bu dosya .gitignore geregi depoya girmez (*.jar). Ana demo bunsuz da calisir.
Set-Location $PSScriptRoot
$surum = "3.42.0.0"
$jar = "sqlite-jdbc-$surum.jar"
$url = "https://repo1.maven.org/maven2/org/xerial/sqlite-jdbc/$surum/$jar"
$sha = "53174d76087bb73cc29db9c02766fb921fd7fc652f7952f3609e0018e3dd5ded"
New-Item -ItemType Directory -Force lib | Out-Null
if (Test-Path "lib\$jar") { "Zaten var: lib\$jar"; exit 0 }
"Indiriliyor: $url"
try {
    Invoke-WebRequest -Uri $url -OutFile "lib\$jar" -UseBasicParsing
} catch {
    "Indirme basarisiz: $($_.Exception.Message)"; exit 1
}
$gelen = (Get-FileHash "lib\$jar" -Algorithm SHA256).Hash.ToLower()
if ($gelen -ne $sha) {
    "SHA-256 UYUSMADI!"
    "  Beklenen: $sha"
    "  Gelen   : $gelen"
    Remove-Item "lib\$jar" -Force; exit 1
}
"Dogrulandi (SHA-256 tuttu): lib\$jar"
"Simdi calistirin: .\demo.ps1"
