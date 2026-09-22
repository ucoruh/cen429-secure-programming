set(CEN429_KLASOR "Hafta 03/01 AES-GCM dosya")
# Kripto: Linux'ta OpenSSL (crypto), Windows'ta isletim sisteminin BCrypt CNG kitapligi.
cen429_ornek(aesgcm KAYNAK aesgcm.c MOD guvenli
             KUTUPHANE $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)
