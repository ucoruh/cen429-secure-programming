#!/bin/sh
# CEN429 - Hafta 2 - Demo 11: Kurcalamaya dayanikli gunluk (Linux / WSL)
# Once derleyin: ../../build.sh     Sonra: sh demo.sh
# Yalniz bu klasordeki calisma/ altina yazar.
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/gunluk_zinciri" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
A="$B/gunluk_zinciri"
C=calisma
rm -rf "$C"; mkdir -p "$C/evrim" "$C/statik"
cizgi() { echo "--------------------------------------------------------------"; }
LOGE="$C/evrim/erisim.zdenetim";   KE="$C/evrim/dogrulayici.anahtar"
ELE_E="$C/evrim/ele-gecirilen.anahtar"
LOGS="$C/statik/erisim.zdenetim";  KS="$C/statik/dogrulayici.anahtar"
ELE_S="$C/statik/ele-gecirilen.anahtar"

echo "ADIM 1 - Iki gunluk uret: anahtar EVRIMLI ve STATIK"
"$A" uret "$C/evrim"  evrim
"$A" uret "$C/statik" statik
cizgi; echo "ADIM 2 - Saglam gunlugu dogrula (evrim):"
"$A" dogrula "$LOGE" "$KE"
cizgi; echo "ADIM 3 - Ham kurcalama: seq=4 mesajini degistir (MAC eski)"
"$A" degistir "$LOGE" 4 "odeme onaylandi tutar=9999"
"$A" dogrula  "$LOGE" "$KE"
echo "  (yeniden uretip devam ediyoruz)"; "$A" uret "$C/evrim" evrim >/dev/null
cizgi; echo "ADIM 4 - Kayit SILME: seq=5 silinir"
"$A" sil     "$LOGE" 5
"$A" dogrula "$LOGE" "$KE"
"$A" uret "$C/evrim" evrim >/dev/null
cizgi; echo "ADIM 5 - YENIDEN SIRALAMA: seq=2 ile seq=3 yer degistirir"
"$A" yerdeg  "$LOGE" 2 3
"$A" dogrula "$LOGE" "$KE"
"$A" uret "$C/evrim" evrim >/dev/null
cizgi
echo "ADIM 6 - ELE GECIRME: saldirgan gecmisi yeniden yazmaya calisir"
echo "  6a) EVRIM modu: saldirgan yalniz GUNCEL anahtari (K_N) biliyor"
"$A" sahtele "$LOGE" 2 "kart yuklendi kart=SAHTE" "$ELE_E"
"$A" dogrula "$LOGE" "$KE"
echo "  6b) STATIK modu: tek anahtar hic degismedi (K_N == K_0)"
"$A" sahtele "$LOGS" 2 "kart yuklendi kart=SAHTE" "$ELE_S"
"$A" dogrula "$LOGS" "$KS"
cizgi
echo "Ders: Ozet zinciri degistirme/silme/siralamayi yakalar. Anahtar"
echo "evrimi ise ele gecirmeden ONCEKI kayitlari korur: saldirgan eski"
echo "anahtari geri hesaplayamadigindan gecmisi yeniden yazamaz (6a)."
echo "Statik anahtarda ise gecmis yeniden yazilabilir ve YAKALANMAZ (6b)."
