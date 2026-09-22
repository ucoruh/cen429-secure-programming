set(CEN429_KLASOR "Hafta 02/13 Unix izin ve umask")
# "sim" kipi saf benzetimdir ve iki platformda derlenir; "gercek" kipi
# POSIX dosya API'si kullanir ve yalniz Linux/WSL'de gercek dener
# (Windows'ta aciklama basar). Gercek setuid ikili OLUSTURULMAZ.
cen429_ornek(izin KAYNAK izin.c MOD guvenli)
