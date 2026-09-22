set(CEN429_KLASOR "Hafta 01/02 Bellekte kalan parola")
# Optimizasyonlu derleme önemli: memset'in "ölü yazma" olarak kaldırılması optimizasyonla olur.
if(WIN32)
  set(_ek KUTUPHANE Dbghelp)
endif()
cen429_ornek(parola_silmez   KAYNAK parola.c MOD optimize TANIM SILME=0 ${_ek})
cen429_ornek(parola_memset   KAYNAK parola.c MOD optimize TANIM SILME=1 ${_ek})
cen429_ornek(parola_explicit KAYNAK parola.c MOD optimize TANIM SILME=2 ${_ek})
