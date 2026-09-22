set(CEN429_KLASOR "Hafta 06/01 Butunluk HMAC")
# Kripto (HMAC-SHA-256): Linux/WSL OpenSSL (crypto), Windows BCrypt (CNG).
cen429_ornek(butunluk KAYNAK butunluk.c MOD guvenli
             KUTUPHANE $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)
