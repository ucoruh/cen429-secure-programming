# CEN429 - Hafta 2 - Demo 3: Erisim matrisi ve model simulatoru (Windows)
# Once derleyin: ..\..\build.ps1   Sonra: .\demo.ps1
# Simulator; hicbir gercek dosyaya ya da sistem ayarina dokunmaz.
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\erisim.exe")) { "Once derleyin: ..\..\build.ps1"; exit 1 }
$E = ".\$B\erisim.exe"
function Cizgi { "--------------------------------------------------------------" }

Cizgi; "ADIM 0 - Salt DAC (erisim denetim matrisi): karar sahibin izninde"
"  Senaryo: mobil odeme uygulamasi + guvenlik kutuphanesi"
& $E politika-matris.txt
"   ^ uygulama OKU odeme_anahtari: matriste yok -> RED (en az ayricalik)"

Cizgi; "ADIM 1 - Bell-LaPadula (GIZLILIK): yukari okuma yok, asagi yazma yok"
& $E politika-gizlilik.txt
"   ^ memur OKU operasyon: yukari okuma -> RED (gizli bilgiyi goremez)"
"     general YAZ ilan: asagi yazma -> RED (sizinti onlenir)"

Cizgi; "ADIM 2 - Biba (BUTUNLUK): asagi okuma yok, yukari yazma yok"
& $E politika-butunluk.txt
"   ^ aglayici YAZ kayit: yukari yazma -> RED (kirli veri temizi bozmasin)"
"     islemci OKU gelen: asagi okuma -> RED (guvenilmez girdiye guvenme)"

Cizgi; "ADIM 3 - BLP kategorileri: seviye yetmez, bolme de gerekir"
& $E politika-kategori.txt
"   ^ general OKU asya_notu: seviye yuksek ama ASYA yok -> RED"
"     analist YAZ ortak_arsiv: nesne ozneye baskin -> IZIN"

Cizgi; "ADIM 4 - Biba dusuk su isareti: okumak seviyeyi dusurur"
& $E politika-lwm.txt
"   ^ ayni istek (islemci YAZ kayit) once IZIN, gelen okununca RED"

Cizgi; "ADIM 5 - Cin Seddi: catisan sirketler arasinda duvar"
& $E politika-cin.txt
"   ^ karar gecmise bagli: BankaA okunduktan sonra BankaB kapali"

Cizgi; "Sonuc: BLP gizliligi, Biba butunlugu korur; yonleri terstir."
"DAC sahibin verdigi izindir; MAC (BLP/Biba) bunu sistemce sinirlar."
