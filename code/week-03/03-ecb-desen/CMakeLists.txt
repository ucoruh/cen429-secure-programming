set(CEN429_KLASOR "Hafta 03/03 ECB desen sizintisi")
cen429_ornek(ecb KAYNAK ecb.c MOD guvenli
             KUTUPHANE $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)
