set(CEN429_KLASOR "Hafta 03/02 Nonce tekrari")
cen429_ornek(nonce KAYNAK nonce.c MOD guvenli
             KUTUPHANE $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)
