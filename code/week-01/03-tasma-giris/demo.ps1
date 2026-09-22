# CEN429 — Hafta 1 — Demo 3: Arabellek taşmasıyla yetki yükseltme (Windows)
# Önce derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\giris.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
$kisa = "AAAAAAAAAAAAAAAAB"                          # 16 karakter + 'B' (0x42)
$uzun = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"   # 40 karakter: yapının dışına taşar
function Cizgi { "--------------------------------------------------------------" }

Cizgi; "ADIM 1 — Normal giris"; "> .\$B\giris.exe ayse"; & ".\$B\giris.exe" ayse
Cizgi; "ADIM 2 — Saldiri: 16 bayttan 1 bayt fazla ad (17 karakter)"
"> .\$B\giris.exe $kisa"; & ".\$B\giris.exe" $kisa
Cizgi; "ADIM 3 — Ayni saldiri, AddressSanitizer (/fsanitize=address) ile"
"> .\$B\giris_asan.exe $kisa"; & ".\$B\giris_asan.exe" $kisa
"   ^ ASan sessiz kaldi: tasma yapinin ICINDE kaldi."
"     (ad -> yonetici; araclarin da siniri var)"
Cizgi; "ADIM 4 — Yapinin disina tasan uzun ad, ASan surumu"
"> .\$B\giris_asan.exe <40 karakter>"
& ".\$B\giris_asan.exe" $uzun 2>&1 | ForEach-Object { "$_" } | Select-String -Pattern 'ERROR|WRITE of size|SUMMARY'
Cizgi; "ADIM 5 — Ayni kisa saldiri, strcpy_s (C11 Ek K) kullanan 'denetimli' surumde"
"> .\$B\giris_denetimli.exe $kisa"
& ".\$B\giris_denetimli.exe" $kisa 2>&1 | ForEach-Object { "$_" }
"   (cikis kodu: $LASTEXITCODE)"
Cizgi; "ADIM 6 — Duzeltilmis surum"
"> .\$B\giris_guvenli.exe $kisa"; & ".\$B\giris_guvenli.exe" $kisa 2>&1 | ForEach-Object { "$_" }
"> .\$B\giris_guvenli.exe ayse"; & ".\$B\giris_guvenli.exe" ayse
