set(CEN429_KLASOR "Hafta 04/06 Sembol ve dize sizintisi")

# ACIK surum: LOG acik, acik metin dize, semboller yerinde (strip yok).
cen429_ornek(gizli_acik KAYNAK gizli.c MOD korumasiz TANIM CEN429_LOG)

# KAPALI surum: LOG yok, dize gizli, semboller strip'li, gizli gorunurluk.
cen429_ornek(gizli_kapali KAYNAK gizli.c MOD guvenli TANIM CEN429_GIZLE)
target_compile_options(gizli_kapali PRIVATE
  $<$<C_COMPILER_ID:GNU,Clang>:-fvisibility=hidden>)
if(NOT MSVC)
  target_link_options(gizli_kapali PRIVATE -s)          # strip: sembolleri kaldir
else()
  target_link_options(gizli_kapali PRIVATE /DEBUG:NONE) # PDB uretme
endif()
