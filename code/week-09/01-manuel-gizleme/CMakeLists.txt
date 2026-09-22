set(CEN429_KLASOR "Hafta 09/01 Manuel gizleme ve maliyet")

# Ayni davranis, iki surum. Ayni optimizasyonla derlenir ki karsilastirma adil olsun.
cen429_ornek(erisim_temiz KAYNAK calis.c temiz.c MOD optimize)
cen429_ornek(erisim_gizli KAYNAK calis.c gizli.c MOD optimize)
