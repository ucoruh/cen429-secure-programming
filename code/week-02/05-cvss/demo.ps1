# CEN429 - Hafta 2 - Demo 5: CVSS v3.1 taban puan hesaplayici (Windows)
# Derleme gerekmez; Python 3.8+ yeterlidir.  Calistirma: .\demo.ps1
Set-Location $PSScriptRoot
$py = $null
foreach ($aday in @("py", "python", "python3")) {
    if (Get-Command $aday -ErrorAction SilentlyContinue) { $py = $aday; break }
}
if (-not $py) { "Python 3 bulunamadi. https://www.python.org adresinden kurun."; exit 1 }
# 'py' baslaticisi icin surum bayragi ekle (py -3), digerleri icin bos.
$arg = @(); if ($py -eq "py") { $arg = @("-3") }
function Cizgi { "--------------------------------------------------------------" }

Cizgi; "ADIM 1 - Hazir zafiyet vektorlerini puanla"
& $py @arg cvss.py --ornekler
Cizgi; "ADIM 2 - Tek bir vektoru elle puanla"
"> python cvss.py CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
& $py @arg cvss.py "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
Cizgi; "ADIM 3 - Dogrulama: FIRST v3.1 belgesindeki puanlarla karsilastir"
& $py @arg test_cvss.py
Cizgi; "Sonuc: Ayni acik, kimlik/etkilesim/kapsam degisince farkli puan alir."
"Puan onceligi verir; ama baglami (varliginiz) siz eklersiniz."
