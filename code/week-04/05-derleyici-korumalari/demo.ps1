# CEN429 - Hafta 4 - Demo 5: Derleyici ve OS korumalari (Windows)
# Once derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\giris_zayif.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
function Cizgi { "--------------------------------------------------------------" }
$uzun = ("A" * 200)

Cizgi; "ADIM 1 - Normal girdi: iki surum de calisir"
"> .\$B\giris_zayif.exe ada"; & ".\$B\giris_zayif.exe" ada
"> .\$B\giris_sert.exe  ada"; & ".\$B\giris_sert.exe"  ada
Cizgi; "ADIM 2 - ZAYIF surum (/GS-), 200 baytlik tasma"
"> .\$B\giris_zayif.exe <200xA>"
& ".\$B\giris_zayif.exe" $uzun 2>&1 | ForEach-Object { "$_" }
$kod = "0x{0:X8}" -f ($LASTEXITCODE -band 0xFFFFFFFF)
"   (cikis kodu: $kod)"
Cizgi; "ADIM 3 - SERT surum (/GS), ayni tasma: /GS kanary'si YAKALAR"
"> .\$B\giris_sert.exe <200xA>"
& ".\$B\giris_sert.exe" $uzun 2>&1 | ForEach-Object { "$_" }
$kod = "0x{0:X8}" -f ($LASTEXITCODE -band 0xFFFFFFFF)
$anlam = if ($kod -eq "0xC0000409") { "yigin tamponu asildi (/GS), Windows sureci durdurdu" }
         elseif ($kod -eq "0xC0000005") { "erisim ihlali" } else { "durdu" }
"   (cikis kodu: $kod = $anlam)"
Cizgi; "ADIM 4 - Ikilide hangi korumalar acik? (dumpbin)"
. "$PSScriptRoot\..\cen429_arac.ps1"
function Koruma($exe) {
    # PE basligindaki "DLL characteristics" bayraklari korumalarin kesin gostergesidir.
    $h = Invoke-Dumpbin /headers $exe
    $bolum = $h | Select-String -Pattern 'DLL characteristics' -Context 0,6
    function Icerir($d) { if ("$bolum" -match $d) { "ACIK" } else { "kapali" } }
    "  DYNAMICBASE (ASLR)      : $(Icerir 'Dynamic base')"
    "  HIGH_ENTROPY_VA (64-bit): $(Icerir 'High Entropy')"
    "  NX_COMPAT (DEP)         : $(Icerir 'NX compatible')"
    "  GUARD_CF (/guard:cf)    : $(Icerir 'Control Flow Guard')"
}
"ZAYIF ikili:"; Koruma "$B\giris_zayif.exe"
"SERT ikili:";  Koruma "$B\giris_sert.exe"
Cizgi
"Ders: bu korumalar hatayi DUZELTMEZ; sadece somurmeyi zorlastirir/durdurur."
"Asil cozum girdi dogrulama ve sinir denetimidir (Demo 1-4)."
"Not: PDB (hata ayiklama sembolu) dosyasi dagitilmaz; RELRO'nun Windows'ta"
"karsiligi yoktur (RELRO GOT/PLT'ye ozgudur)."
