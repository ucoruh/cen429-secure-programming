# CEN429 — Hafta 1 — Demo 4: İşaretli uzunluk hatası (Windows)
# Önce derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\kopya.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
function Cizgi { "--------------------------------------------------------------" }

. "$PSScriptRoot\..\..\common\cen429_msvc.ps1"
Cizgi; "ADIM 0 — Derleyici bu hatayi goruyor mu?"
"> cl /Zs /W4 kopya.c                 (C olarak derle)"
Invoke-Cl /nologo /Zs /W4 /I..\..\common kopya.c | Select-String -Pattern 'warning|error'
"   -> Uyari yok: MSVC'nin C derleyicisi bu donusumu /Wall ile bile bildirmez."
"> cl /Zs /W4 /w44365 /TP kopya.c     (ayni kod, C++ olarak)"
Invoke-Cl /nologo /Zs /W4 /w44365 /TP /I..\..\common kopya.c | Select-String -Pattern 'C4365'
"   -> C4365: int -> size_t isaret uyusmazligi. (Linux'ta GCC: -Wsign-conversion)"
Cizgi; "ADIM 1 — Normal kullanim";                    "> .\$B\kopya.exe 8";   & ".\$B\kopya.exe" 8
Cizgi; "ADIM 2 — Cok buyuk uzunluk: denetim yakalar"; "> .\$B\kopya.exe 100"; & ".\$B\kopya.exe" 100
Cizgi; "ADIM 3 — Saldiri: negatif uzunluk denetimi atlatir"
"> .\$B\kopya.exe -1"
& ".\$B\kopya.exe" -1
$kod = "0x{0:X8}" -f ($LASTEXITCODE -band 0xFFFFFFFF)
$anlam = switch ($kod) {
    "0xC0000005" { "bellek erisim ihlali" }
    "0xC0000409" { "yigin tasmasi algilandi, Windows sureci aninda sonlandirdi" }
    default      { "beklenmeyen cikis" }
}
"   (cikis kodu: $kod = $anlam)"
Cizgi; "ADIM 4 — Ayni saldiri, AddressSanitizer (/fsanitize=address) ile"
"> .\$B\kopya_asan.exe -1"
& ".\$B\kopya_asan.exe" -1 2>&1 | ForEach-Object { "$_" } | Select-String -Pattern 'ERROR|negative|SUMMARY'
Cizgi; "ADIM 5 — Duzeltilmis surum"
"> .\$B\kopya_guvenli.exe -1 ; 12abc ; 8"
& ".\$B\kopya_guvenli.exe" -1
& ".\$B\kopya_guvenli.exe" 12abc
& ".\$B\kopya_guvenli.exe" 8
