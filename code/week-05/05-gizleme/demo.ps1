# CEN429 - Hafta 5 - Demo 5: Kod gizleme (Windows).
# Ana bolum (dize gizleme + yansima) INDIRME GEREKTIRMEZ.
# Istege bagli ProGuard bolumu icin: .\hazirla.ps1
Set-Location $PSScriptRoot
if (-not (Get-Command javac -ErrorAction SilentlyContinue)) {
    "JDK bulunamadi (javac yok)."
    "Kurulum: Eclipse Temurin JDK 21 (https://adoptium.net)."
    exit 1
}
function Cizgi { "==============================================================" }
if (Test-Path cikti) { Remove-Item -Recurse -Force cikti }
New-Item -ItemType Directory -Force bin, cikti | Out-Null
& javac --release 17 -d bin AcikSabit.java GizliSabit.java `
    DogrudanCagri.java YansimaCagri.java
if ($LASTEXITCODE -ne 0) { "Derleme hatasi"; exit 1 }

Cizgi; "BOLUM A - Statik dize gizleme (acik vs XOR ile gizli)"; Cizgi
"Calisma ciktilari (ikisi de ayni dizeyi uretir):"
& java -cp bin AcikSabit
& java -cp bin GizliSabit
""
"javap: ACIK sabit bytecode'da duz metin gorunur ->"
(& javap -c -p -cp bin AcikSabit | Select-String "sunucu-anahtari") |
    ForEach-Object { "   $_" }
"javap: GIZLI sabitte ayni dize ARANIYOR (bulunmamali) ->"
if (& javap -c -p -cp bin GizliSabit | Select-String "sunucu-anahtari") {
    "   (beklenmedik: dize gorundu)"
} else {
    "   BULUNAMADI: dize yalniz byte dizisi olarak gomulu (iyi)."
}

Cizgi; "BOLUM B - Yansima ile dinamik yontem gizleme"; Cizgi
& java -cp bin DogrudanCagri
& java -cp bin YansimaCagri
""
"javap: DOGRUDAN cagride 'invokestatic gizliIslem' gorunur ->"
(& javap -c -p -cp bin DogrudanCagri | Select-String "Method gizliIslem") |
    ForEach-Object { "   $_" }
"javap: YANSIMAda dogrudan cagri YOK; yalniz getDeclaredMethod/invoke ->"
if (& javap -c -p -cp bin YansimaCagri | Select-String "invokestatic.*gizliIslem") {
    "   (beklenmedik: dogrudan cagri gorundu)"
} else {
    "   Dogrudan 'invokestatic gizliIslem' cagrisi YOK."
    (& javap -c -p -cp bin YansimaCagri |
        Select-String "getDeclaredMethod|invoke:") |
        ForEach-Object { "   $_" }
}
"   NOT (durustce): metot HALA sinifta tanimli (javap -p onu listeler);"
"   yansima 'cagri baglantisini' gizler, tek basina koruma degildir."

Cizgi; "BOLUM C - ProGuard ile kucultme + gizleme (istege bagli)"; Cizgi
if (-not (Test-Path lib\proguard.jar)) {
    "ProGuard yok. Etkinlestirmek icin: .\hazirla.ps1"
    "Kural tablosu ve -keep ornekleri: README.md ve ders sayfasi."
    exit 0
}
Push-Location bin
& jar --create --file ..\cikti\ornek.jar .
Pop-Location
"ProGuard calistiriliyor (proguard.pro)..."
& java -jar lib\proguard.jar '@proguard.pro' 2>&1 | Select-Object -Last 3
"ONCE (uyeler):"
(& javap -p -cp cikti\ornek.jar DogrudanCagri) | ForEach-Object { "   $_" }
New-Item -ItemType Directory -Force cikti\acik | Out-Null
Push-Location cikti\acik
& jar -xf ..\ornek-gizli.jar
Pop-Location
"SONRA (kullanilmayan private uye kucultme ile kalkti):"
(& javap -p -cp cikti\acik DogrudanCagri) | ForEach-Object { "   $_" }
"-keep kurali 'main'i korudu; 'gizliIslem' kucultuldu/satir ici alindi."
