set(CEN429_KLASOR "Hafta 02/01 Imza tarayici")
# SHA-256: Linux'ta OpenSSL (crypto), Windows'ta BCrypt (bcrypt). Entropi icin
# matematik kutuphanesi yalniz Linux'ta ayri baglanir.
cen429_ornek(tarayici   KAYNAK tarayici.c   MOD optimize
             KUTUPHANE $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>
                       $<$<NOT:$<PLATFORM_ID:Windows>>:m>)
cen429_ornek(ornek_uret KAYNAK ornek_uret.c MOD optimize)
