set(CEN429_KLASOR "Hafta 03/04 Paroladan anahtar (PBKDF2)")
cen429_ornek(pbkdf2demo KAYNAK pbkdf2demo.c MOD guvenli
             KUTUPHANE $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)
