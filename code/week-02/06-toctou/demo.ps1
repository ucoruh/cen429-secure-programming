# CEN429 - Hafta 2 - Demo 6: TOCTOU yaris durumu (yalniz Linux / WSL)
# Bu demo Unix'e ozgudur: sembolik bag, O_NOFOLLOW ve POSIX dosya API'si kullanir.
# Windows'ta derlenmez; asagidaki adimlarla WSL icinde calistirin.
Set-Location $PSScriptRoot
"Bu demo yalniz Linux / WSL icinde calisir (TOCTOU sembolik bag yarisi)."
""
"WSL kuruluysa, bu klasorden soyle calistirin:"
"  wsl sh -c 'cd `"$($PWD.Path -replace '\\','/' -replace '^C:','/mnt/c')`" && sh ../../build.sh && sh demo.sh'"
""
"Ya da bir WSL / Ubuntu terminalinde:"
"  cd <bu klasor>"
"  sh ../../build.sh    # bir kez derle"
"  sh demo.sh"
""
"Windows'ta guvenli benzetim yapilamaz cunku sembolik bag olusturmak yonetici"
"yetkisi ister; bu derste hicbir demo yonetici yetkisi istemez."
