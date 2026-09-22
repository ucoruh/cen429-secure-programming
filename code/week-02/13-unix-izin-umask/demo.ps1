# CEN429 - Hafta 2 - Demo 13: Unix izinleri, umask ve setuid (Windows)
# Once derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
# Benzetim iki platformda aynidir. Gercek Unix adimlari icin WSL gerekir;
# Windows'ta umask yerine KALITIM vardir: bunu cikti\ altinda gosteririz.
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\izin.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
$E = ".\$B\izin.exe"
function Cizgi { "--------------------------------------------------------------" }

Cizgi; "ADIM 1 - Benzetim: izin algoritmasi, umask, setuid, sticky bit"
& $E sim

Cizgi; "ADIM 2 - Gercek cekirdek adimi (POSIX ister)"
& $E gercek

Cizgi; "ADIM 3 - umask'in Windows karsiligi: ust klasorden kalitim"
New-Item -ItemType Directory -Force cikti | Out-Null
Set-Content -Path cikti\yeni.txt -Value "yeni dosya" -Encoding ascii
"> icacls cikti"
icacls cikti
"> icacls cikti\yeni.txt"
icacls cikti\yeni.txt
"   ^ Yeni dosya izinlerini kendisi secmedi: (I) isaretli ACE'ler ust"
"     klasorden miras geldi. Unix'te bu isi umask + open() modu yapar."

Cizgi; "Temizlik: cikti\ klasoru siliniyor"
Remove-Item -Recurse -Force cikti
"Gercek Unix adimlari (umask, chmod, ACL, yetenekler) icin WSL'de:"
"  sh demo.sh"
