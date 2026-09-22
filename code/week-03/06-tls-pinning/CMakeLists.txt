set(CEN429_KLASOR "Hafta 03/06 TLS dogrulama ve pinning")
# TLS demosu yalniz Linux/WSL: OpenSSL libssl gerekir. Windows'ta ogrenci
# WSL'de calistirir (bkz. demo.ps1).
if(NOT WIN32)
  cen429_ornek(tls_istemci KAYNAK tls_istemci.c MOD guvenli
               KUTUPHANE ssl crypto)
endif()
