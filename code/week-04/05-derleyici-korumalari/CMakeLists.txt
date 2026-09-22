set(CEN429_KLASOR "Hafta 04/05 Derleyici ve OS korumalari")

# ZAYIF surum: korumalar kapali (karsilastirma icin).
cen429_ornek(giris_zayif KAYNAK tasma.c MOD korumasiz)
if(MSVC)
  target_compile_options(giris_zayif PRIVATE /GS-)
  target_link_options(giris_zayif PRIVATE /DYNAMICBASE:NO /HIGHENTROPYVA:NO /NXCOMPAT:NO)
elseif(CEN429_ELF_SERT)
  # PIE ve RELRO'yu kapat (eski/karsilastirma davranisi) — yalniz ELF (Linux)
  target_compile_options(giris_zayif PRIVATE -fno-stack-protector -U_FORTIFY_SOURCE)
  target_link_options(giris_zayif PRIVATE -no-pie -Wl,-z,norelro)
endif()
# (Windows MinGW/clang: ELF bayraklari yok; hedef sade derlenir — demo yine calisir.)

# SERT surum: tum derleyici/OS sertlestirmesi acik.
cen429_ornek(giris_sert KAYNAK tasma.c MOD guvenli)
if(MSVC)
  target_compile_options(giris_sert PRIVATE /GS /guard:cf)
  target_link_options(giris_sert PRIVATE /DYNAMICBASE /HIGHENTROPYVA /NXCOMPAT /guard:cf)
elseif(CEN429_ELF_SERT)
  target_compile_options(giris_sert PRIVATE -fstack-protector-strong -D_FORTIFY_SOURCE=2 -fPIE)
  target_link_options(giris_sert PRIVATE -pie -Wl,-z,relro,-z,now)
endif()
