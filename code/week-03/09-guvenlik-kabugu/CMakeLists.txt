set(CEN429_KLASOR "Hafta 03/09 Guvenlik kabuklari")
cen429_ornek(kabuk KAYNAK kabuk.c MOD guvenli
             KUTUPHANE $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)
