set(CEN429_KLASOR "Hafta 02/09 Salgin simulasyonu")
# log2/log icin Linux'ta matematik kutuphanesi (m) ayri baglanir.
cen429_ornek(salgin KAYNAK salgin.c MOD optimize
             KUTUPHANE $<$<NOT:$<PLATFORM_ID:Windows>>:m>)
