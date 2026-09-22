set(CEN429_KLASOR "Hafta 02/02 Entropi")
# entropi: log2 icin Linux'ta matematik kutuphanesi. uret: AES-GCM sifreleme
# icin Linux'ta OpenSSL (crypto), Windows'ta BCrypt (bcrypt).
cen429_ornek(entropi KAYNAK entropi.c MOD optimize
             KUTUPHANE $<$<NOT:$<PLATFORM_ID:Windows>>:m>)
cen429_ornek(uret    KAYNAK uret.c    MOD optimize
             KUTUPHANE $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)
