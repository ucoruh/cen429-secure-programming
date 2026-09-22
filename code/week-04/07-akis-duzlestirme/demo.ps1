# CEN429 - Hafta 4 - Demo 7: Kontrol akisi duzlestirme (Windows)
# Once derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\pin_duz_degil.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
function Cizgi { "--------------------------------------------------------------" }

Cizgi; "ADIM 1 - Iki surum de AYNI sonucu verir (dogru PIN: 4291)"
foreach ($p in @("4291","1234","42910")) {
    $a = & ".\$B\pin_duz_degil.exe" $p
    $d = & ".\$B\pin_duz.exe" $p
    "  PIN $p -> duz: [$a] | duzlestirilmis: [$d]"
}
Cizgi; "ADIM 2 - CFG farki: makine kodu (dumpbin /disasm)"
. "$PSScriptRoot\..\cen429_arac.ps1"
$d1 = Invoke-Dumpbin /disasm:nobytes "$B\pin_duz_degil.exe"
$d2 = Invoke-Dumpbin /disasm:nobytes "$B\pin_duz.exe"
function Atlama($satirlar) { ($satirlar | Select-String -Pattern '\bjmp\b|\bje\b|\bjne\b').Count }
"  DUZ surum      : toplam $((($d1) | Measure-Object).Count) satir, $(Atlama $d1) atlama"
"  DUZLESTIRILMIS : toplam $((($d2) | Measure-Object).Count) satir, $(Atlama $d2) atlama"
"  ^ Duzlestirilmis surumde switch-dagitici dongusu daha cok atlama uretir;"
"    fonksiyon bazinda ayrinti icin WSL'de 'objdump -d' ya da Ghidra kullanin."
Cizgi; "ADIM 3 - Maliyet: ayni isin suresi"
& ".\$B\pin_duz_degil.exe" sure
& ".\$B\pin_duz.exe" sure
"  ^ Duzlestirme okumayi zorlastirir ama sure/kod boyutu maliyeti getirir."
"    Bu yuzden yalniz KRITIK fonksiyonlara uygulanir (lisans/PIN/anahtar)."
