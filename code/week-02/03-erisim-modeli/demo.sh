#!/bin/sh
# CEN429 — Hafta 2 — Demo 3: Erisim matrisi ve model simulatoru (Linux / WSL)
# Önce derleyin: ../../build.sh     Sonra: sh demo.sh
# Simulator; hicbir gercek dosyaya ya da sistem ayarina dokunmaz.
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/erisim" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
E="$B/erisim"
cizgi() { echo "--------------------------------------------------------------"; }

cizgi; echo "ADIM 0 — Salt DAC (erisim denetim matrisi): karar sahibin izninde"
echo "  Senaryo: mobil odeme uygulamasi + guvenlik kutuphanesi"
"$E" politika-matris.txt
echo "   ^ uygulama OKU odeme_anahtari: matriste yok -> RED (en az ayricalik)"

cizgi; echo "ADIM 1 — Bell-LaPadula (GIZLILIK): yukari okuma yok, asagi yazma yok"
"$E" politika-gizlilik.txt
echo "   ^ memur OKU operasyon: yukari okuma -> RED (gizli bilgiyi goremez)"
echo "     general YAZ ilan: asagi yazma -> RED (sizinti onlenir)"

cizgi; echo "ADIM 2 — Biba (BUTUNLUK): asagi okuma yok, yukari yazma yok"
"$E" politika-butunluk.txt
echo "   ^ aglayici YAZ kayit: yukari yazma -> RED (kirli veri temizi bozmasin)"
echo "     islemci OKU gelen: asagi okuma -> RED (guvenilmez girdiye guvenme)"

cizgi; echo "ADIM 3 — BLP kategorileri: seviye yetmez, bolme de gerekir"
"$E" politika-kategori.txt
echo "   ^ general OKU asya_notu: seviye yuksek ama ASYA yok -> RED"
echo "     analist YAZ ortak_arsiv: nesne ozneye baskin -> IZIN"

cizgi; echo "ADIM 4 — Biba dusuk su isareti: okumak seviyeyi dusurur"
"$E" politika-lwm.txt
echo "   ^ ayni istek (islemci YAZ kayit) once IZIN, gelen okununca RED"

cizgi; echo "ADIM 5 — Cin Seddi: catisan sirketler arasinda duvar"
"$E" politika-cin.txt
echo "   ^ karar gecmise bagli: BankaA okunduktan sonra BankaB kapali"

cizgi; echo "Sonuc: BLP gizliligi, Biba butunlugu korur; yonleri terstir."
echo "DAC sahibin verdigi izindir; MAC (BLP/Biba) bunu sistemce sinirlar."
