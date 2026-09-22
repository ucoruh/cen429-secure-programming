set(CEN429_KLASOR "Hafta 04/03 Tanimsiz davranis (UBSan)")
cen429_ornek(ub         KAYNAK ub.c         MOD korumasiz)
cen429_ornek(ub_guvenli KAYNAK ub_guvenli.c MOD guvenli)

# UBSan yalniz Linux/macOS GCC/Clang'de guvenilir (MinGW'de libubsan yok, MSVC'de UBSan yok).
# Windows'ta bu hedef ATLANIR; demo.ps1 alternatifleri anlatir (/analyze, /RTC, CERT).
if(NOT WIN32)
  cen429_ornek(ub_ubsan KAYNAK ub.c MOD korumasiz
               SECENEK -fsanitize=undefined -fno-omit-frame-pointer)
  target_link_options(ub_ubsan PRIVATE -fsanitize=undefined)
endif()
