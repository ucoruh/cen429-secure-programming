# CEN429 - Hafta 2 - Demo 2: Entropi olcer (Windows)
# Once derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
# Program yalniz okur; ornekler yalniz bu klasorde uretilir.
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\entropi.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
$E = ".\$B\entropi.exe"
$O = "cikti"
function Cizgi { "--------------------------------------------------------------" }

New-Item -ItemType Directory -Force $O | Out-Null
& ".\$B\uret.exe" $O | Out-Null

Cizgi; "ADIM 1 - Farkli turde dosyalarin entropisi (0 = tekduze, 8 = rastgele)"
"  dosya            bayt     H |0 bit ------------ 8 bit| yorum"
& $E "$O\tekduze.txt" "$O\belge.txt" "$O\kod.bin" "$O\sifreli.bin" "$O\rastgele.bin"
"   ^ Metin dusuk, makine kodu benzeri orta, sifreli/rastgele yuksek."

Cizgi; "ADIM 2 - Ayni icerik uc halde: duz -> makine-kodu-benzeri -> sifreli"
& $E "$O\belge.txt" "$O\kod.bin" "$O\sifreli.bin"
"   ^ Sifreli ve rastgele veri entropiye bakarak AYIRT EDILEMEZ."

Cizgi; "ADIM 3 - Karma dosya: metnin ortasina sifreli bir bolum gizlenmis"
& $E -p 512 "$O\karma.bin"
"   ^ Paketlenmis programlarda da boyle bir 'sicak bolge' gorulur:"
"     kucuk acici kod + yuksek entropili sifreli govde."

Cizgi; "ADIM 4 - Fidye yazilimi belirtisi: dosya yerinde sifrelenince"
"  once : " + (& $E "$O\belge.txt").Trim()
"  sonra: " + (& $E "$O\sifreli.bin").Trim()
"   ^ Bir surec kisa surede cok sayida dosyada bu sicramayi"
"     yapiyorsa davranis tabanli koruma alarm verir."
