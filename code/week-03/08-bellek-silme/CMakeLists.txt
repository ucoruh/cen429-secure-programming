set(CEN429_KLASOR "Hafta 03/08 Bellekte guvenli silme")
cen429_ornek(bellek KAYNAK bellek.c MOD optimize
             KUTUPHANE $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)
