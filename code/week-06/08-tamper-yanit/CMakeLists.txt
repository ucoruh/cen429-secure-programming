set(CEN429_KLASOR "Hafta 06/08 Tamper yaniti (RASP motoru)")
cen429_ornek(rasp KAYNAK rasp.c MOD guvenli
             KUTUPHANE $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)
