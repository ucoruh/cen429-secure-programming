set(CEN429_KLASOR "Hafta 03/05 HKDF oturum anahtarlari")
cen429_ornek(hkdf KAYNAK hkdf.c MOD guvenli
             KUTUPHANE $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)
