set(CEN429_KLASOR "Hafta 02/11 Kurcalamaya dayanikli gunluk")
# HMAC/SHA-256 icin platforma gore isletim sisteminin kripto kutuphanesi:
# Linux/WSL OpenSSL (crypto), Windows CNG (bcrypt).
cen429_ornek(gunluk_zinciri KAYNAK gunluk_zinciri.c MOD guvenli
             KUTUPHANE $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)
