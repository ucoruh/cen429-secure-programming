# CEN429 - Hafta 2 - Demo 1: imza, polimorfizm, sezgisel analiz, emulasyon (Windows)
# Once derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
# Program yalniz okur; hicbir dosyayi degistirmez, silmez, calistirmaz.
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\tarayici.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
$I = "imzalar.txt"
$O = "cikti"
$T = ".\$B\tarayici.exe"
function Cizgi { "--------------------------------------------------------------" }

New-Item -ItemType Directory -Force $O | Out-Null
& ".\$B\ornek_uret.exe" $O | Out-Null

Cizgi; "ADIM 1 - Laboratuvar yakalanan ornegi inceler: ozet ve entropi"
& $T ozet $I "$O\ornek_a.bin"
"  Imza veritabanindaki kayitlar:"
Get-Content $I | Where-Object { $_ -notmatch '^#' } | ForEach-Object { "    " + $_.Substring(0, [Math]::Min(64, $_.Length)) }

Cizgi; "ADIM 2 - Hash (ozet) imzasi: birebir ayni dosyayi yakalar"
& $T hash $I "$O\temiz.txt" "$O\ornek_a.bin" "$O\ornek_a_1bayt.bin"
"   ^ Tek bir bayt degisince ozet bambaska: hash imzasi atlatildi."

Cizgi; "ADIM 3 - Desen (bayt dizisi) imzasi: kucuk degisikliklere dayanikli"
& $T desen $I "$O\ornek_a.bin" "$O\ornek_a_1bayt.bin" "$O\poli_1.bin" "$O\poli_2.bin" "$O\poli_3.bin"
"   ^ poli_1/poli_2 cozucu deseniyle yakalandi; cozucusu"
"     degisen poli_3 hic yakalanamadi (polimorfizm)."

Cizgi; "ADIM 4 - Ayni govde, farkli anahtar: sifreli kopyalar hic benzemiyor"
& $T govde16 $I "$O\poli_1.bin" "$O\poli_2.bin" "$O\poli_3.bin"

Cizgi; "ADIM 5 - Sezgisel analiz: imza yok, supheli ozelliklere puan ver"
& $T sezgisel $I "$O\temiz.txt" "$O\ornek_a.bin" "$O\poli_1.bin" "$O\poli_3.bin" "$O\arsiv.bin"
"   ^ arsiv.bin zararsiz yuksek-entropili dosya: YANLIS POZITIF."
"     ornek_a.bin ise sezgisel olarak gozden kacti (yanlis negatif)."

Cizgi; "ADIM 6 - Emulasyon: cozucuyu guvenli ortamda calistir, sonra tara"
& $T emulasyon $I "$O\temiz.txt" "$O\ornek_a.bin" "$O\poli_1.bin" "$O\poli_2.bin" "$O\poli_3.bin" "$O\arsiv.bin"

Cizgi; "Sonuc: tek yontem yetmez; tarayicilar katmanli calisir."
