# CEN429 - Hafta 4 - Demo 6: Sembol ve dize sizintisi (Windows)
# Once derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\gizli_acik.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
function Cizgi { "--------------------------------------------------------------" }

# Bir ikilide bir ASCII dizesi geciyor mu? (strings benzeri, saf PowerShell)
function Dize-Var($dosya, $desen) {
    $bytes = [System.IO.File]::ReadAllBytes($dosya)
    $metin = -join ($bytes | ForEach-Object { if ($_ -ge 32 -and $_ -lt 127) { [char]$_ } else { " " } })
    return ($metin -match $desen)
}

Cizgi; "ADIM 1 - Iki surum de AYNI calisir (dogru anahtar: CEN429-LISANS-2026)"
"> .\$B\gizli_acik.exe  CEN429-LISANS-2026"; & ".\$B\gizli_acik.exe"  CEN429-LISANS-2026
"> .\$B\gizli_kapali.exe CEN429-LISANS-2026"; & ".\$B\gizli_kapali.exe" CEN429-LISANS-2026
Cizgi; "ADIM 2 - Ikili icinde gizli dize ACIK metin olarak geciyor mu?"
if (Dize-Var "$B\gizli_acik.exe" 'CEN429-LISANS-2026') {
    "   gizli_acik.exe   : 'CEN429-LISANS-2026' BULUNDU (sizinti!)" }
else { "   gizli_acik.exe   : bulunamadi" }
if (Dize-Var "$B\gizli_kapali.exe" 'CEN429-LISANS-2026') {
    "   gizli_kapali.exe : 'CEN429-LISANS-2026' BULUNDU" }
else { "   gizli_kapali.exe : bulunamadi -> dize gizli (XOR ile karistirilmis)" }
if (Dize-Var "$B\gizli_acik.exe" '\[LOG\]') { "   gizli_acik.exe   : '[LOG]' metinleri BULUNDU" }
if (-not (Dize-Var "$B\gizli_kapali.exe" '\[LOG\]')) { "   gizli_kapali.exe : LOG metinleri yok (derlenmemis)" }
Cizgi; "ADIM 3 - Semboller ve PDB"
"   Windows'ta fonksiyon adlari EXE'de degil, .pdb dosyasinda tutulur."
$pdbAcik = Test-Path "$B\gizli_acik.pdb"
$pdbKapali = Test-Path "$B\gizli_kapali.pdb"
"   gizli_acik.pdb   var mi? $pdbAcik   (hata ayiklama; DAGITILMAMALI)"
"   gizli_kapali.pdb var mi? $pdbKapali   (/DEBUG:NONE ile uretilmedi)"
". \$B\ araclari: dumpbin /symbols cogu surum EXE'sinde bos doner."
Cizgi
"Ders: sürüm ikilisinde loglama dizeleri, gizli sabitler ve hata ayiklama"
"sembolleri BIRAKILMAZ. Dizeleri gizle, sembolleri strip'le, PDB'yi dagitma."
