# CEN429 - Hafta 2 - Demo 11: Kurcalamaya dayanikli gunluk (Windows)
# Once derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
# Yalniz bu klasordeki calisma\ altina yazar.
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\gunluk_zinciri.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
$A = ".\$B\gunluk_zinciri.exe"
$C = "calisma"
if (Test-Path $C) { Remove-Item $C -Recurse -Force }
New-Item -ItemType Directory -Force "$C\evrim","$C\statik" | Out-Null
function Cizgi { "--------------------------------------------------------------" }
$LOGE = "$C\evrim\erisim.zdenetim";   $KE = "$C\evrim\dogrulayici.anahtar"
$ELE_E = "$C\evrim\ele-gecirilen.anahtar"
$LOGS = "$C\statik\erisim.zdenetim";  $KS = "$C\statik\dogrulayici.anahtar"
$ELE_S = "$C\statik\ele-gecirilen.anahtar"

"ADIM 1 - Iki gunluk uret: anahtar EVRIMLI ve STATIK"
& $A uret "$C\evrim"  evrim  | Out-Host
& $A uret "$C\statik" statik | Out-Host
Cizgi; "ADIM 2 - Saglam gunlugu dogrula (evrim):"
& $A dogrula $LOGE $KE | Out-Host
Cizgi; "ADIM 3 - Ham kurcalama: seq=4 mesajini degistir (MAC eski)"
& $A degistir $LOGE 4 "odeme onaylandi tutar=9999" | Out-Host
& $A dogrula  $LOGE $KE | Out-Host
"  (yeniden uretip devam ediyoruz)"; & $A uret "$C\evrim" evrim | Out-Null
Cizgi; "ADIM 4 - Kayit SILME: seq=5 silinir"
& $A sil     $LOGE 5 | Out-Host
& $A dogrula $LOGE $KE | Out-Host
& $A uret "$C\evrim" evrim | Out-Null
Cizgi; "ADIM 5 - YENIDEN SIRALAMA: seq=2 ile seq=3 yer degistirir"
& $A yerdeg  $LOGE 2 3 | Out-Host
& $A dogrula $LOGE $KE | Out-Host
& $A uret "$C\evrim" evrim | Out-Null
Cizgi
"ADIM 6 - ELE GECIRME: saldirgan gecmisi yeniden yazmaya calisir"
"  6a) EVRIM modu: saldirgan yalniz GUNCEL anahtari (K_N) biliyor"
& $A sahtele $LOGE 2 "kart yuklendi kart=SAHTE" $ELE_E | Out-Host
& $A dogrula $LOGE $KE | Out-Host
"  6b) STATIK modu: tek anahtar hic degismedi (K_N == K_0)"
& $A sahtele $LOGS 2 "kart yuklendi kart=SAHTE" $ELE_S | Out-Host
& $A dogrula $LOGS $KS | Out-Host
Cizgi
"Ders: Ozet zinciri degistirme/silme/siralamayi yakalar. Anahtar"
"evrimi ise ele gecirmeden ONCEKI kayitlari korur: saldirgan eski"
"anahtari geri hesaplayamadigindan gecmisi yeniden yazamaz (6a)."
"Statik anahtarda ise gecmis yeniden yazilabilir ve YAKALANMAZ (6b)."
