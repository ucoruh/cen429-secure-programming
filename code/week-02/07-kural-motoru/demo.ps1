# CEN429 - Hafta 2 - Demo 07: Mini kural motoru (Windows)
# Once derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
# Yalniz okur; ornek dosyalar bu klasordeki cikti\ altinda uretilir.
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\kural_motoru.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
$M = ".\$B\kural_motoru.exe"
$O = "cikti"
function Cizgi { "--------------------------------------------------------------" }

New-Item -ItemType Directory -Force $O | Out-Null
& ".\$B\kural_ornek.exe" $O | Out-Null

Cizgi; "ADIM 1 - Kural dosyasi: bes kural (kendi zararsiz desenlerimiz)"
Get-Content kurallar.txt | Where-Object { $_ -match '^kural' } | ForEach-Object { "    " + $_ }

Cizgi; "ADIM 2 - Bes dosyayi bes kuralla tara"
& $M kurallar.txt "$O\temiz.txt" "$O\kilavuz.txt" "$O\kapsul.bin" "$O\varyant.bin" "$O\notlar.txt"

Cizgi; "ADIM 3 - Yanlis pozitif: zararsiz kilavuz neden eslesti?"
& $M -a kurallar.txt "$O\kilavuz.txt"
"   ^ Kelime_Cifti kelimelere bakti, BAGLAMA bakmadi: YANLIS POZITIF."
"     Baglamli kural (Kelime_Baglam) ayni dosyada eslesmedi."

Cizgi; "ADIM 4 - Degistirilmis varyant: joker (??) ne kazandirdi?"
& $M -a kurallar.txt "$O\varyant.bin"
"   ^ Kapsul_Bicimi kacirdi (COZUCU: yok); hex desendeki joker"
"     'MAVI_KEDI' ayracini tolere edip yakaladi."

Cizgi; "ADIM 5 - Kural dosyasi da girdidir: bozuk dosya reddedilir"
& $M bozuk_kural.txt "$O\temiz.txt" 2>&1 | ForEach-Object { "$_" }
"   (cikis kodu $LASTEXITCODE)"

Cizgi; "Sonuc: dar kural kacirir, genis kural yanlis alarm verir."
