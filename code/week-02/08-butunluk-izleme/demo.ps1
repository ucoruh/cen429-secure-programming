# CEN429 - Hafta 2 - Demo 08: Butunluk izleme (Windows)
# Once derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
# Yalniz bu klasordeki cikti\ altinda sentetik dosyalar uretir ve onlara bakar.
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\butunluk_izle.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
$T = ".\$B\butunluk_izle.exe"
$K = "cikti\izlenen"
$M = "cikti\manifest.txt"
$A = "cikti\muhur.anahtar"
function Cizgi { "--------------------------------------------------------------" }
# Iki platformda ayni baytlar: ASCII, LF satir sonu, BOM yok
function Yaz($ad, $metin) {
    [IO.File]::WriteAllBytes((Join-Path $PSScriptRoot $ad), [Text.Encoding]::ASCII.GetBytes($metin))
}
function Ekle($ad, $metin) {
    [IO.File]::AppendAllText((Join-Path $PSScriptRoot $ad), $metin, [Text.Encoding]::ASCII)
}

if (Test-Path cikti) { Remove-Item -Recurse -Force cikti }
New-Item -ItemType Directory -Force $K | Out-Null
Yaz "$K\ayar.conf"     "sunucu=127.0.0.1`nport=8443`nkayit=acik`n"
Yaz "$K\kutuphane.bin" "CEN429 ornek kutuphane surum 1.0`nislev_a islev_b`n"
Yaz "$K\baslat.txt"    "calistir: uygulama --guvenli`n"
Yaz "$K\veri.txt"      "kayit 1`nkayit 2`nkayit 3`n"

Cizgi; "ADIM 1 - Bilinen iyi durumda taban cizgisi (SHA-256 manifesti)"
& $T olustur $K $M

Cizgi; "ADIM 2 - Savunmaci manifesti HMAC ile muhurler (anahtar ayri yerde)"
& $T anahtar $A
& $T muhurle $M $A

Cizgi; "ADIM 3 - Hicbir sey degismeden dogrulama"
& $T dogrula $K $M

Cizgi; "ADIM 4 - Benzetim: bir 'saldirgan' dosyalara dokunur"
"  kutuphane.bin'e satir eklendi, veri.txt kaldirildi, gizli.bin birakildi"
Ekle "$K\kutuphane.bin" "islev_arka_kapi`n"
Remove-Item -Force "$K\veri.txt"
Yaz "$K\gizli.bin" "birakilan dosya`n"
& $T dogrula $K $M

Cizgi; "ADIM 5 - Saldirgan izini ortmek icin manifesti de yeniden yazar"
& $T olustur $K $M | Out-Null
& $T dogrula $K $M
"   ^ Manifest korunmazsa izleyici KANDIRILIR: hepsi TAMAM gorunuyor."

Cizgi; "ADIM 6 - Ama muhur (HMAC) anahtarsiz yeniden uretilemez"
& $T muhur-dogrula $M $A

Cizgi; "Sonuc: ozet degisikligi yakalar; beklenen degerler de korunmali."
