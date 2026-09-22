set(CEN429_KLASOR "Hafta 06/04 Preload kanca algilama")
# Yalniz Linux/WSL: LD_PRELOAD, dlsym(RTLD_DEFAULT), dladdr. Windows'ta ogrenci
# WSL'de calistirir (bkz. demo.ps1). Windows'ta kanca'nin karsiligi IAT/satir-ici
# kanca tespitidir; farkli API gerekir, bu demoda islenmez.
if(NOT WIN32)
  cen429_ornek(kanca_ana KAYNAK kanca_ana.c MOD guvenli KUTUPHANE ${CMAKE_DL_LIBS})

  # Saldirganin onyukledigi sahte kanca kutuphanesi (demo icin).
  add_library(sahtekanca SHARED sahtekanca.c)
  set_target_properties(sahtekanca PROPERTIES
    LIBRARY_OUTPUT_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/bin/${CEN429_PLATFORM}$<0:>"
    FOLDER "${CEN429_KLASOR}")
endif()
