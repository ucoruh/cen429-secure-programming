# CEN429 - Hafta 5 - Demo 4: Bytecode ve decompile (Windows).
# INDIRME GEREKTIRMEZ; yalnizca JDK'nin javac ve javap araclari kullanilir.
Set-Location $PSScriptRoot
if (-not (Get-Command javac -ErrorAction SilentlyContinue)) {
    "JDK bulunamadi (javac yok)."
    "Kurulum: Eclipse Temurin JDK 21 (https://adoptium.net)."
    exit 1
}
function Cizgi { "==============================================================" }
New-Item -ItemType Directory -Force bin | Out-Null
& javac --release 17 -d bin LisansDenetimi.java
if ($LASTEXITCODE -ne 0) { "Derleme hatasi"; exit 1 }

Cizgi; "ADIM 1 - Program normal calisiyor (yanlis PIN ile)"; Cizgi
& java -cp bin LisansDenetimi 1234

Cizgi; "ADIM 2 - 'javap -p': private alan ve metot ADLARI gorunur"; Cizgi
& javap -p -cp bin LisansDenetimi

Cizgi; "ADIM 3 - 'javap -c -p': sabit DIZELER ve mantik gorunur"; Cizgi
"(Kaynak kod OLMADAN, sadece .class dosyasindan)"
& javap -c -p -cp bin LisansDenetimi |
    Select-String -Pattern "String","pinDogru","lisansGecerli","boolean"

Cizgi
"Sonuc: 'javac' geri cevrilebilir. PIN='4729' ve lisans anahtari"
"bytecode'da ACIK duruyor; metot adlari mantigi ele veriyor."
"Demo 5: dize gizleme + yansima ile bunu zorlastiracagiz."
