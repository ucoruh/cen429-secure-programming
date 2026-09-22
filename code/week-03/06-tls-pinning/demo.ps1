# CEN429 - Hafta 3 - Demo 6: TLS dogrulama ve pinning (Windows)
# Bu demo yalniz Linux/WSL'de calisir: yerel TLS sunucusu icin OpenSSL
# (openssl s_server) ve libssl gerekir. Windows'ta WSL uzerinden calistirin.
Set-Location $PSScriptRoot
"=============================================================="
"Demo 6 (TLS dogrulama + hostname + SPKI pinning) WSL/Linux demosudur."
"Windows'ta OpenSSL istemci/sunucu kurulu olmayabilir; bu yuzden bu demo"
"yalniz WSL'de derlenir ve calisir."
""
"Calistirmak icin (WSL Ubuntu penceresinde):"
"   cd ~/<ders-deposu>/code"
"   ./build.sh"
"   cd week-03/06-tls-pinning"
"   sh demo.sh"
""
"Demo sunlari gosterir: dogrulamasiz TLS istemcisi sahte sertifikayi"
"kabul eder (MITM); zincir + hostname dogrulamasi ve SPKI sabitleme (pinning)"
"ayni saldiriyi REDDEDER. Tumu yalniz 127.0.0.1 uzerinde, kendi uretilen"
"sertifikalarla calisir."
"=============================================================="
