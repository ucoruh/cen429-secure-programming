set(CEN429_KLASOR "Hafta 02/08 Butunluk izleme")
# SHA-256 ve HMAC: Linux'ta OpenSSL (crypto), Windows'ta BCrypt (bcrypt).
cen429_ornek(butunluk_izle KAYNAK butunluk.c MOD guvenli
             KUTUPHANE $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)
