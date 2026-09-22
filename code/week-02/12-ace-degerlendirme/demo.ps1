# CEN429 - Hafta 2 - Demo 12: Windows ACE degerlendirme simulatoru (Windows)
# Once derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
# Simulator saf hesaplamadir; gercek adimda yalniz cikti\ altinda bir dosya
# olusturulur ve ACL'i OKUNUR (icacls, whoami). Yonetici yetkisi gerekmez.
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\ace.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
$E = ".\$B\ace.exe"
function Cizgi { "--------------------------------------------------------------" }

Cizgi; "ADIM 1 - ACE SIRASI: ilk eslesen RET istegi keser (kitaptaki ornek)"
& $E senaryo-1-sira.txt

Cizgi; "ADIM 2 - NULL DACL (herkese her hak) ile BOS DACL (kimseye hak yok)"
& $E senaryo-2-null-bos.txt

Cizgi; "ADIM 3 - KALITIM: acik ACE'ler miras ACE'lerden once gelir"
& $E senaryo-3-kalitim.txt

Cizgi; "ADIM 4 - UAC suzgeci (yalniz-ret grup) ve butunluk seviyeleri (MIC)"
& $E senaryo-4-uac-mic.txt

Cizgi; "ADIM 5 - SAHIP_HAKLARI ve SAHIPLIK_AL ayricaligi"
& $E senaryo-5-sahip-ayricalik.txt

Cizgi; "ADIM 6 - Gercek sistem: bu demonun KENDI dosyasinin DACL'i (salt okuma)"
New-Item -ItemType Directory -Force cikti | Out-Null
Set-Content -Path cikti\ornek.txt -Value "ornek veri" -Encoding ascii
"> icacls cikti\ornek.txt"
icacls cikti\ornek.txt
"   ^ (I) = ust klasorden miras ACE, (F) tam, (M) degistir, (RX) oku+calistir"
""
"> whoami /groups   (yalniz butunluk etiketi satiri: S-1-16-...)"
whoami /groups /fo csv | Select-String "S-1-16-"
"   ^ S-1-16-8192 = Orta: normal (yukseltilmemis) surec"
""
"> whoami /priv     (bu surecin belirtecindeki ayricaliklar)"
whoami /priv

Cizgi; "Sonuc: Windows ACE'leri SIRAYLA gezer, RET yalniz henuz verilmemis"
"hakki keser; NULL DACL herkese acar, BOS DACL herkese kapatir; MIC"
"DACL'dan once gelir; sahip IZIN_YAZ ile DACL'i her zaman degistirebilir."
